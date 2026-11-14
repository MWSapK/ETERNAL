import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'node:process';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

// HMR is disabled in AI Studio environment to prevent WebSocket errors
process.env.DISABLE_HMR = 'true';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client safely on server side
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

// Health & Connector Status
app.get('/api/status', (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({
    status: 'online',
    appName: "MrMWSK's Ai",
    cloudAiAvailable: hasKey,
    timestamp: new Date().toISOString(),
  });
});

// Gemini Cloud Intelligence Route (Optional Cloud Connector)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, contextNotes, modelId = 'gemini-4-hydrogen', trainingContext } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'NO_CLOUD_KEY',
        message: 'Cloud Gemini connector is not configured with an API key. Please use local offline mode or configure key in Settings > Secrets.',
      });
    }

    // Model selection validation
    const allowedModels = ['gemini-4-hydrogen', 'gemini-4-argon', 'gemini-3.1-flash-lite'];
    const chosenModel = allowedModels.includes(modelId) ? modelId : 'gemini-4-hydrogen';

    let systemInstruction = `You are MrMWSK's Ai, an autonomous, highly capable executive AI assistant designed for MrMWSK.
You excel in deep logical analysis, technical problem-solving, code architecture, workflow optimization, and high-precision answers.
Tone: Confident, crisp, authoritative, impeccably structured, devoid of robotic preamble or filler.
Whenever the user asks for code, provide clean, idiomatic, ready-to-run solutions.
Adopt all user training rules, domain standards, and custom personas provided below.`;

    if (trainingContext && typeof trainingContext === 'string' && trainingContext.trim()) {
      systemInstruction += `\n\nUSER'S TRAINED MEMORY & BEHAVIORAL PROTOCOLS:\n${trainingContext.trim()}`;
    }

    if (contextNotes && typeof contextNotes === 'string' && contextNotes.trim()) {
      systemInstruction += `\n\nUSER'S LOCAL REPOSITORY CONTEXT:\n${contextNotes.trim()}`;
    }

    // Format chat contents if history is provided
    let contents: string | Array<{ role: string; parts: Array<{ text: string }> }> = message;
    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-8).map((h: { role: string; content: string }) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      }));
      recentHistory.push({
        role: 'user',
        parts: [{ text: message }],
      });
      contents = recentHistory;
    }

    const response = await ai.models.generateContent({
      model: chosenModel,
      contents,
      config: {
        systemInstruction,
      },
    });

    const replyText = response.text || 'No response generated.';

    return res.json({
      reply: replyText,
      source: 'cloud-gemini',
      model: chosenModel,
      timestamp: Date.now(),
    });
  } catch (error: unknown) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({
      error: 'GEMINI_ERROR',
      message: getErrorMessage(error) || 'Error communicating with Gemini Cloud AI',
    });
  }
});

// Webhook / App Connector Dispatcher
app.post('/api/connectors/dispatch', async (req, res) => {
  try {
    const { targetUrl, method = 'POST', headers = {}, payload } = req.body;

    if (!targetUrl || typeof targetUrl !== 'string') {
      return res.status(400).json({ error: 'targetUrl is required' });
    }

    // SSRF protection: reject localhost and private network lookups
    const parsed = new URL(targetUrl);
    if (
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '0.0.0.0' ||
      parsed.hostname.startsWith('192.168.') ||
      parsed.hostname.startsWith('10.') ||
      parsed.hostname.endsWith('.internal')
    ) {
      return res.status(403).json({ error: 'Access to private network hosts is restricted.' });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const startTime = Date.now();
    const response = await fetch(targetUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': "MrMWSK-Ai-Connector/1.0",
        ...headers,
      },
      body: method !== 'GET' && method !== 'HEAD' ? JSON.stringify(payload || {}) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const latencyMs = Date.now() - startTime;
    const responseContentType = response.headers.get('content-type') || '';
    let responseData: unknown;

    if (responseContentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    return res.json({
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      latencyMs,
      data: responseData,
    });
  } catch (err: unknown) {
    return res.status(502).json({
      ok: false,
      error: 'CONNECTOR_DISPATCH_FAILED',
      message: getErrorMessage(err) || 'Failed to reach external connector target',
    });
  }
});

// Connector Ping & Diagnostic Endpoint
app.post('/api/connectors/ping', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });

    const startTime = Date.now();
    const parsed = new URL(url);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return res.status(403).json({ error: 'Restricted host' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeout);

    res.json({
      online: true,
      statusCode: resp.status,
      latencyMs: Date.now() - startTime,
    });
  } catch (err: unknown) {
    res.json({
      online: false,
      error: getErrorMessage(err) || 'Host unreachable',
      latencyMs: -1,
    });
  }
});

// Vite Middleware for Dev or Static Serving for Production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const httpServer = http.createServer(app);
  httpServer.listen(PORT, () => {
    console.log(`[MrMWSK's Ai] Server running on port ${PORT} (isProduction: ${isProduction})`);
  });
}

startServer().catch((err: unknown) => {
  console.error('Fatal server boot error:', err);
  process.exit(1);
});
