import { KnowledgeNote, OfflineTask } from '../types';
import { StorageService } from './storageService';

export interface LocalAiResponse {
  content: string;
  source: 'local-offline';
  metadata: {
    model: string;
    toolUsed?: string;
    calculation?: string;
    codeSnippet?: string;
    actionType?: string;
    suggestedTask?: Partial<OfflineTask>;
    latencyMs: number;
  };
}

// Built-in offline knowledge database
const BUILTIN_KNOWLEDGE: Record<string, string> = {
  'transformer': `### Transformer Architecture (Deep Learning)
Transformers rely fundamentally on the **Self-Attention Mechanism** introduced in "Attention Is All You Need" (Vaswani et al., 2017).
- **Core Components**:
  1. Multi-Head Self-Attention: Allows the model to jointly attend to information from different representation subspaces.
  2. Feed-Forward Neural Network (FFN): Applied identically to each position.
  3. Positional Encodings: Adds absolute or rotary (RoPE) position representations since self-attention is permutation-invariant.
  4. Layer Normalization & Residual Connections: Stabilizes gradient flow across deep stacks.
- **Complexity**: $O(N^2)$ quadratic scaling with sequence length $N$ (mitigated by FlashAttention and sliding window techniques).`,

  'rag': `### Retrieval-Augmented Generation (RAG)
RAG combines non-parametric memory (external document databases) with parametric memory (pretrained LLMs):
- **Pipeline**:
  1. Document Ingestion: Chunking, tokenization, metadata tagging.
  2. Vector Embedding: Converting chunks into high-dimensional dense representations (e.g., text-embedding models).
  3. Vector Indexing: Storing in specialized structures (HNSW, IVFFlat, FAISS, Milvus).
  4. Similarity Search: Cosine distance or dot product query matching.
  5. Context Synthesis: Injecting top-k retrieved passages into the LLM system prompt.
- **Benefits**: Eliminates hallucinations for private domain data, zero training cost, real-time updates.`,

  'pwa': `### Progressive Web Apps (PWA) Standards
PWAs turn web applications into native-grade desktop and mobile experiences:
- **Core Pillars**:
  1. **Web App Manifest**: Provides application metadata (\`name\`, \`short_name\`, \`icons\`, \`display: standalone\`, \`theme_color\`).
  2. **Service Worker**: Independent background thread intercepting network requests for precaching, runtime offline caching, and background sync.
  3. **HTTPS / Secure Context**: Strict requirement for service worker registration.
  4. **Installability**: Listens to \`beforeinstallprompt\` on Chromium and provides home screen pin guidance on iOS Safari.`,

  'solid': `### SOLID Principles of Object-Oriented & Software Design
1. **Single Responsibility (SRP)**: A module or class should have one, and only one, reason to change.
2. **Open/Closed (OCP)**: Software entities should be open for extension, but closed for modification.
3. **Liskov Substitution (LSP)**: Subtypes must be substitutable for their base types without altering correctness.
4. **Interface Segregation (ISP)**: Clients should not be forced to depend on methods they do not use.
5. **Dependency Inversion (DIP)**: Depend on abstractions, not concretions. High-level modules should not depend on low-level modules.`,

  'git': `### Essential Git Command Mastery
- **Branch Management**:
  - Create and switch: \`git checkout -b <name>\` or \`git switch -c <name>\`
  - Rebase onto main: \`git rebase origin/main\`
- **Inspecting & Staging**:
  - Interactive stage: \`git add -p\`
  - Detailed graph: \`git log --oneline --graph --decorate -n 10\`
- **Recovery & Undoing**:
  - Undo commit keep staged: \`git reset --soft HEAD~1\`
  - Undo commit and unstage: \`git reset --mixed HEAD~1\`
  - View ref history: \`git reflog\``,

  'docker': `### Docker & Containerization Essentials
Containers package an application with all libraries and runtimes inside isolated kernel cgroups/namespaces:
- **Dockerfile best practices**:
  - Multi-stage builds to minimize image footprint.
  - Order commands by least-frequent change to leverage layer cache (\`COPY package*.json .\` before source files).
  - Run as non-root user (\`USER node\` or \`USER appuser\`).
- **Core commands**:
  - Build: \`docker build -t app-name:v1 .\`
  - Run with port mapping: \`docker run -d -p 3000:3000 --name myapp app-name:v1\`
  - Inspect logs: \`docker logs -f myapp\``,

  'rest': `### REST vs. GraphQL Architectural Comparison
- **REST (Representational State Transfer)**:
  - Uses standard HTTP verbs (\`GET\`, \`POST\`, \`PUT\`, \`PATCH\`, \`DELETE\`).
  - Cacheable at HTTP proxy/CDN level via headers (\`Cache-Control\`, \`ETag\`).
  - Potential for over-fetching or under-fetching across multiple roundtrips.
- **GraphQL**:
  - Single endpoint (\`POST /graphql\`).
  - Client queries exact field specifications.
  - Strong schema definition and type safety.
  - Harder to cache natively with CDNs; complex resolver security risks.`,

  'first-principles': `### First Principles Thinking (Elon Musk / Aristotle Method)
1. **Identify and define current assumptions**: State the status quo convention.
2. **Break down the problem into fundamental truths**: Strip away analogies, historical precedence, and opinions until only irrefutable physical/logical facts remain.
3. **Reconstruct a novel solution from the ground up**: Design the system purely based on the foundational constraints.`,
};

// Safe offline math evaluator
function evaluateMathExpression(expr: string): { result: number; formula: string } | null {
  try {
    // Clean string to allow only numbers, math operators, parens
    const sanitized = expr.replace(/[^\d+\-*/().%^eE ]/g, '').trim();
    if (!sanitized || !/[\d]/.test(sanitized)) return null;

    // Handle percentage like "450 * 15%" -> "450 * 0.15"
    let processed = sanitized.replace(/(\d+(?:\.\d+)?)%/g, '($1 * 0.01)');
    // Handle power like 2^8 -> Math.pow(2, 8)
    processed = processed.replace(/(\d+(?:\.\d+)?)\s*\^\s*(\d+(?:\.\d+)?)/g, 'Math.pow($1, $2)');

    // Use Function constructor with restricted scope
    // eslint-disable-next-line no-new-func
    const calculate = new Function(`return (${processed});`);
    const val = calculate();
    if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
      return { result: Math.round(val * 100000) / 100000, formula: sanitized };
    }
    return null;
  } catch {
    return null;
  }
}

// Unit conversion engine
function handleUnitConversion(input: string): string | null {
  const lower = input.toLowerCase();
  
  // Miles <-> KM
  const milesMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:miles|mile|mi)\b.*?(?:to|in)\s*(?:km|kilometers|kilometer)/);
  if (milesMatch) {
    const val = parseFloat(milesMatch[1]);
    const km = Math.round(val * 1.60934 * 100) / 100;
    return `**Unit Conversion**:
- **Source**: ${val} miles
- **Target**: **${km} km** (formula: $\\text{miles} \\times 1.60934$)`;
  }

  const kmMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:km|kilometers|kilometer)\b.*?(?:to|in)\s*(?:miles|mile|mi)/);
  if (kmMatch) {
    const val = parseFloat(kmMatch[1]);
    const miles = Math.round(val / 1.60934 * 100) / 100;
    return `**Unit Conversion**:
- **Source**: ${val} km
- **Target**: **${miles} miles** (formula: $\\text{km} \\div 1.60934$)`;
  }

  // Pounds <-> KG
  const lbsMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:lbs|pounds|pound|lb)\b.*?(?:to|in)\s*(?:kg|kilograms|kilos)/);
  if (lbsMatch) {
    const val = parseFloat(lbsMatch[1]);
    const kg = Math.round(val * 0.453592 * 100) / 100;
    return `**Unit Conversion**:
- **Source**: ${val} lbs
- **Target**: **${kg} kg** (formula: $\\text{lbs} \\times 0.453592$)`;
  }

  const kgMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilograms|kilos)\b.*?(?:to|in)\s*(?:lbs|pounds|pound|lb)/);
  if (kgMatch) {
    const val = parseFloat(kgMatch[1]);
    const lbs = Math.round(val / 0.453592 * 100) / 100;
    return `**Unit Conversion**:
- **Source**: ${val} kg
- **Target**: **${lbs} lbs** (formula: $\\text{kg} \\div 0.453592$)`;
  }

  // Celsius <-> Fahrenheit
  const cMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:c|celsius|°c)\b.*?(?:to|in)\s*(?:f|fahrenheit|°f)/);
  if (cMatch) {
    const val = parseFloat(cMatch[1]);
    const f = Math.round(((val * 9) / 5 + 32) * 10) / 10;
    return `**Temperature Conversion**:
- **Source**: ${val}°C
- **Target**: **${f}°F** (formula: $(°C \\times 9/5) + 32$)`;
  }

  const fMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:f|fahrenheit|°f)\b.*?(?:to|in)\s*(?:c|celsius|°c)/);
  if (fMatch) {
    const val = parseFloat(fMatch[1]);
    const c = Math.round(((val - 32) * 5) / 9 * 10) / 10;
    return `**Temperature Conversion**:
- **Source**: ${val}°F
- **Target**: **${c}°C** (formula: $(°F - 32) \\times 5/9$)`;
  }

  // Digital storage (GB to MB, etc.)
  const gbMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:gb|gigabytes|gigabyte)\b.*?(?:to|in)\s*(?:mb|megabytes)/);
  if (gbMatch) {
    const val = parseFloat(gbMatch[1]);
    return `**Storage Conversion**:
- **Source**: ${val} GB
- **Target**: **${val * 1024} MB** (Binary) / **${val * 1000} MB** (Decimal standard)`;
  }

  return null;
}

// Extractive summarizer
function generateSummary(text: string): string {
  const clean = text.replace(/^(?:summarize|summary|tldr)[:\s]+/i, '').trim();
  const sentences = clean.split(/(?<=[.?!])\s+/).filter((s) => s.length > 15);
  const words = clean.split(/\s+/).filter(Boolean);
  const readingTimeMin = Math.ceil(words.length / 200);

  if (sentences.length <= 2) {
    return `### Executive Summary
- **Core takeaway**: ${clean}
- **Metrics**: ${words.length} words · ~${readingTimeMin} min read`;
  }

  // Score sentences by word frequency
  const wordFreq: Record<string, number> = {};
  for (const w of words) {
    const word = w.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (word.length > 3) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  }

  const scored = sentences.map((sentence) => {
    let score = 0;
    const sWords = sentence.toLowerCase().split(/\s+/);
    for (const sw of sWords) {
      score += wordFreq[sw.replace(/[^a-z0-9]/g, '')] || 0;
    }
    return { sentence, score: score / (sWords.length + 5) };
  });

  scored.sort((a, b) => b.score - a.score);
  const topSentences = scored.slice(0, Math.min(4, Math.ceil(sentences.length * 0.4)));

  return `### Executive Extractive Summary

${topSentences.map((s, idx) => `**${idx + 1}.** ${s.sentence.trim()}`).join('\n\n')}

---
**Document Telemetry**:
- **Word count**: ${words.length} words
- **Sentence count**: ${sentences.length}
- **Estimated reading duration**: ~${readingTimeMin} min`;
}

// Code generation templates
function getCodeTemplate(query: string): string | null {
  const lower = query.toLowerCase();

  if (lower.includes('react') && (lower.includes('component') || lower.includes('hook'))) {
    return `### Idiomatic React Component Template (TypeScript + Tailwind)

\`\`\`tsx
import React, { useState, useEffect } from 'react';
import { Sparkles, Check } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  changePercent?: number;
  onRefresh?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  changePercent = 0,
  onRefresh,
}) => {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 shadow-sm transition-all hover:border-slate-700">
      <div className="flex items-center justify-between text-xs font-medium text-slate-400">
        <span>{title}</span>
        {changePercent !== 0 && (
          <span className={changePercent > 0 ? 'text-emerald-400' : 'text-rose-400'}>
            {changePercent > 0 ? '+' : ''}{changePercent}%
          </span>
        )}
      </div>

      <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-white">
        {value}
      </div>

      <button
        onClick={() => {
          setIsActive(!isActive);
          onRefresh?.();
        }}
        className="mt-4 w-full py-1.5 px-3 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
      >
        {isActive ? 'Active State' : 'Update Metric'}
      </button>
    </div>
  );
};
\`\`\``;
  }

  if (lower.includes('express') || (lower.includes('node') && lower.includes('api'))) {
    return `### Clean Express API Router Template (TypeScript)

\`\`\`typescript
import { Router, Request, Response } from 'express';

export const apiRouter = Router();

// Middleware for authentication / token validation
apiRouter.use((req: Request, res: Response, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }
  next();
});

// GET Endpoint with query validation
apiRouter.get('/records', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const data = [
      { id: '1', name: 'Primary Cluster', status: 'active' },
      { id: '2', name: 'Secondary Replica', status: 'idle' },
    ];
    return res.json({ data, limit, count: data.length });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});
\`\`\``;
  }

  if (lower.includes('python') && lower.includes('script')) {
    return `### Python Automation & CLI Template

\`\`\`python
#!/usr/bin/env python3
"""
MrMWSK Automation Script
"""
import argparse
import sys
import json
from pathlib import Path

def process_file(filepath: Path) -> dict:
    if not filepath.exists():
        raise FileNotFoundError(f"Target file not found: {filepath}")
    
    content = filepath.read_text(encoding="utf-8")
    lines = content.splitlines()
    
    return {
        "file": str(filepath),
        "total_lines": len(lines),
        "total_chars": len(content),
        "preview": lines[:3] if lines else []
    }

def main():
    parser = argparse.ArgumentParser(description="Process and analyze text files.")
    parser.add_argument("path", type=Path, help="Path to input file")
    parser.add_argument("--json", action="store_true", help="Output results in JSON")
    
    args = parser.parse_args()
    try:
        report = process_file(args.path)
        if args.json:
            print(json.dumps(report, indent=2))
        else:
            print(f"[SUCCESS] Processed {report['file']}: {report['total_lines']} lines")
    except Exception as e:
        sys.stderr.write(f"Error: {e}\\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
\`\`\``;
  }

  return null;
}

// Regex Tester
function handleRegexTest(query: string): string | null {
  const regexPattern = query.match(/(?:regex|pattern)[:\s]+(?:\/)?([^\/]+)(?:\/([gimuy]*))?\s+(?:in|on|against)[:\s]+(.+)/is);
  if (regexPattern) {
    const [, pattern, flags = 'g', testString] = regexPattern;
    try {
      const reg = new RegExp(pattern, flags);
      const matches = Array.from(testString.matchAll(reg));
      return `### Regex Laboratory Evaluation
- **Pattern**: \`/${pattern}/${flags}\`
- **Target Sample**: "${testString}"
- **Total Matches Found**: **${matches.length}**

${matches.length > 0 ? matches.map((m, idx) => `**Match #${idx + 1}**: \`${m[0]}\` at index ${m.index}`).join('\n') : '*No matches found.*'}`;
    } catch (e: any) {
      return `**Regex Compilation Error**: ${e.message}`;
    }
  }
  return null;
}

// JSON Formatter
function handleJsonFormat(query: string): string | null {
  if (query.toLowerCase().startsWith('format json') || query.toLowerCase().startsWith('json:')) {
    const raw = query.replace(/^(?:format json|json)[:\s]+/i, '').trim();
    try {
      const parsed = JSON.parse(raw);
      const formatted = JSON.stringify(parsed, null, 2);
      return `### Valid JSON Syntax (Formatted)

\`\`\`json
${formatted}
\`\`\`
- Status: **Valid JSON**
- Root Type: \`${Array.isArray(parsed) ? 'Array' : typeof parsed}\`
- Keys / Elements: ${Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length}`;
    } catch (e: any) {
      return `### JSON Parse Error
\`\`\`
${e.message}
\`\`\`
Please ensure quotes are double quotes (\`"key": "value"\`) and trailing commas are omitted.`;
    }
  }
  return null;
}

// Search user's uploaded local knowledge notes
function queryLocalKnowledge(query: string, notes: KnowledgeNote[]): string | null {
  const qTokens = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  if (qTokens.length === 0 || notes.length === 0) return null;

  let bestNote: KnowledgeNote | null = null;
  let maxScore = 0;

  for (const note of notes) {
    const text = (note.title + ' ' + note.content + ' ' + note.tags.join(' ')).toLowerCase();
    let score = 0;
    for (const t of qTokens) {
      if (text.includes(t)) score += 1;
      if (note.title.toLowerCase().includes(t)) score += 2;
    }
    if (score > maxScore) {
      maxScore = score;
      bestNote = note;
    }
  }

  if (bestNote && maxScore >= 2) {
    return `### Found in Local Knowledge: "${bestNote.title}"

${bestNote.content}

---
*Referenced from your offline memory repository · Last updated ${new Date(bestNote.updatedAt).toLocaleDateString()}*`;
  }

  return null;
}

// Main Local Offline AI Engine Execution
export const LocalAiEngine = {
  async processQuery(
    prompt: string,
    options?: { resourceTier?: 'lite' | 'balanced' | 'beast'; modelId?: string; hardwareThreads?: number }
  ): Promise<LocalAiResponse> {
    const startTime = performance.now();
    const trimmed = prompt.trim();
    const lower = trimmed.toLowerCase();
    const tier = options?.resourceTier || 'balanced';
    const threads = options?.hardwareThreads || (tier === 'beast' ? 8 : tier === 'balanced' ? 4 : 1);
    const memoryMB = tier === 'beast' ? 128 : tier === 'balanced' ? 32 : 4;

    // 0. PRIORITY CHECK: User's Custom Trained Memory & Persona Directives
    const trainingPairs = StorageService.getTrainingPairs().filter((p) => p.enabled);
    for (const pair of trainingPairs) {
      const patternLower = pair.promptPattern.toLowerCase().trim();
      // Check for exact substring match or high keyword overlap
      const patternTokens = patternLower.split(/\s+/).filter((w) => w.length > 2);
      const isExactMatch = lower.includes(patternLower);
      const matchOverlap = patternTokens.filter((token) => lower.includes(token)).length;
      const isTokenMatch = patternTokens.length > 0 && matchOverlap / patternTokens.length >= 0.7;

      if (isExactMatch || isTokenMatch) {
        StorageService.incrementTrainingMatch(pair.id);
        const latencyMs = Math.round(performance.now() - startTime);

        return {
          content: `### Adopted User Training: "${pair.promptPattern}"
*Category: ${pair.category} · Matches Served: ${pair.matchCount + 1}*

${pair.trainedResponse}

---
*Retrieved directly from your device-trained local weights and behavioral guidelines.*`,
          source: 'local-offline',
          metadata: {
            model: `MrMWSK Trained Persona (${pair.category})`,
            toolUsed: 'user_training_memory',
            latencyMs,
            resourceTier: tier,
            hardwareTelemetry: {
              threadsUsed: threads,
              memoryEstimateMB: memoryMB,
            },
          },
        };
      }
    }

    // 1. Check for Task / Todo Creation intent
    const todoMatch = trimmed.match(/^(?:todo|task|remind me to|create task)[:\s]+(.+)/i);
    if (todoMatch) {
      const taskText = todoMatch[1].trim();
      const priority = lower.includes('urgent') || lower.includes('high') ? 'high' : 'medium';
      const created = StorageService.addTask({
        title: taskText,
        priority,
        completed: false,
        category: 'Assistant Action',
      });

      const latencyMs = Math.round(performance.now() - startTime);
      return {
        content: `### Task Created Offline & Stored in Outbox
- **Title**: "${created.title}"
- **Priority**: ${priority.toUpperCase()}
- **Category**: ${created.category}
- **ID**: \`${created.id}\`

You can review, modify, or export this task to your iCal Calendar in the **Task Queue** tab.`,
        source: 'local-offline',
        metadata: {
          model: 'MrMWSK Local Intent Parser',
          toolUsed: 'task_manager',
          actionType: 'TASK_CREATED',
          suggestedTask: created,
          latencyMs,
          resourceTier: tier,
          hardwareTelemetry: {
            threadsUsed: threads,
            memoryEstimateMB: memoryMB,
          },
        },
      };
    }

    // 2. Check for Math / Calculation
    const mathMatch = trimmed.match(/^(?:calculate|compute|solve|math|what is|how much is)[:\s]+(.+)/i);
    const candidateExpr = mathMatch ? mathMatch[1] : trimmed;
    if (mathMatch || /^[\d\s+\-*/().%^]+$/.test(trimmed)) {
      const mathResult = evaluateMathExpression(candidateExpr);
      if (mathResult) {
        const latencyMs = Math.round(performance.now() - startTime);
        return {
          content: `### Deterministic Calculation Result
- **Formula**: \`${mathResult.formula}\`
- **Output**: **\`${mathResult.result.toLocaleString()}\`**

Calculated instantly on-device using local IEEE 754 precision math.`,
          source: 'local-offline',
          metadata: {
            model: 'MrMWSK Arithmetic Unit',
            toolUsed: 'calculator',
            calculation: `${mathResult.formula} = ${mathResult.result}`,
            latencyMs,
          },
        };
      }
    }

    // 3. Check for Unit Conversion
    const unitResult = handleUnitConversion(trimmed);
    if (unitResult) {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        content: unitResult,
        source: 'local-offline',
        metadata: {
          model: 'MrMWSK Conversion Unit',
          toolUsed: 'unit_converter',
          latencyMs,
        },
      };
    }

    // 4. Check for Summarization
    if (lower.startsWith('summarize') || lower.startsWith('summary') || lower.startsWith('tldr:')) {
      const summary = generateSummary(trimmed);
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        content: summary,
        source: 'local-offline',
        metadata: {
          model: 'MrMWSK Extractive Summarizer',
          toolUsed: 'summarizer',
          latencyMs,
        },
      };
    }

    // 5. Check for JSON formatting
    const jsonFormatted = handleJsonFormat(trimmed);
    if (jsonFormatted) {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        content: jsonFormatted,
        source: 'local-offline',
        metadata: {
          model: 'MrMWSK JSON Tool',
          toolUsed: 'json_formatter',
          latencyMs,
        },
      };
    }

    // 6. Check for Regex evaluation
    const regexReport = handleRegexTest(trimmed);
    if (regexReport) {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        content: regexReport,
        source: 'local-offline',
        metadata: {
          model: 'MrMWSK Regex Engine',
          toolUsed: 'regex_evaluator',
          latencyMs,
        },
      };
    }

    // 7. Check for Code Templates
    const codeSnippet = getCodeTemplate(trimmed);
    if (codeSnippet) {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        content: codeSnippet,
        source: 'local-offline',
        metadata: {
          model: 'MrMWSK Code Generator',
          toolUsed: 'code_generator',
          codeSnippet,
          latencyMs,
        },
      };
    }

    // 8. Search User's Local Knowledge Repository
    const localNotes = StorageService.getKnowledgeNotes();
    const noteMatch = queryLocalKnowledge(trimmed, localNotes);
    if (noteMatch) {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        content: noteMatch,
        source: 'local-offline',
        metadata: {
          model: 'MrMWSK Local Memory BM25',
          toolUsed: 'knowledge_search',
          latencyMs,
        },
      };
    }

    // 9. Check Built-in Knowledge Base
    for (const [key, text] of Object.entries(BUILTIN_KNOWLEDGE)) {
      if (lower.includes(key)) {
        const latencyMs = Math.round(performance.now() - startTime);
        return {
          content: text,
          source: 'local-offline',
          metadata: {
            model: 'MrMWSK Local Knowledge Base',
            toolUsed: 'knowledge_base',
            latencyMs,
          },
        };
      }
    }

    // 10. Fallback: Intelligent Assistant Response
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      content: `### MrMWSK's Ai — Local Offline Intelligence
I have analyzed your request: **"${trimmed.slice(0, 80)}${trimmed.length > 80 ? '...' : ''}"**.

Operating in **Local Offline Mode**, here is my structured guidance:

1. **System Directives**:
   - For calculations, prompt: \`calculate 140 * 12 + 15%\`
   - For conversions, prompt: \`convert 85 miles to km\` or \`convert 20 C to F\`
   - For task scheduling, prompt: \`todo: Deliver executive report by Friday\`
   - For text summarization, prompt: \`summarize: [paste text]\`
   - For code templates, prompt: \`template react component\` or \`template express api\`
   - For regex testing, prompt: \`regex: \\d+ in Order 1234 on line 5\`

2. **Connectors Available**:
   - If you want broad real-time internet search or deep multi-turn reasoning, toggle to **Hybrid** or **Cloud** mode in the top bar to connect to Google Gemini 4.
   - You can also link webhooks, GitHub, or export calendar schedules in the **Connector Hub**.

Is there a specific task, calculation, or code architecture you would like to explore right now?`,
      source: 'local-offline',
      metadata: {
        model: 'MrMWSK Local Core v1.0',
        latencyMs,
      },
    };
  },
};
