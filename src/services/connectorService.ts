import { AppConnector, ChatMessage, QueuedAction } from '../types';
import { StorageService } from './storageService';

export const ConnectorService = {
  // Query Gemini Cloud via server proxy
  async queryGeminiCloud(
    message: string,
    history: ChatMessage[] = [],
    modelId = 'gemini-4-hydrogen'
  ): Promise<{ text: string; model: string; latencyMs: number }> {
    const startTime = performance.now();
    
    // Attach recent context notes from local knowledge if relevant
    const localNotes = StorageService.getKnowledgeNotes();
    const contextNotes = localNotes.map((n) => `[${n.title}]: ${n.content.slice(0, 300)}`).join('\n\n');

    // Attach user-trained patterns so cloud model adheres to user rules
    const trainingPairs = StorageService.getTrainingPairs().filter((p) => p.enabled);
    const trainingContext = trainingPairs
      .map((p) => `Pattern: "${p.promptPattern}" -> Protocol: "${p.trainedResponse}"`)
      .join('\n');

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history: history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        contextNotes,
        trainingContext,
        modelId,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Server returned error status ${response.status}`);
    }

    const data = await response.json();
    const latencyMs = Math.round(performance.now() - startTime);

    return {
      text: data.reply || 'No response returned from cloud.',
      model: data.model || modelId,
      latencyMs,
    };
  },

  // Query Local Device Model Server (Ollama / LM Studio) directly on device hardware
  async queryLocalLlm(
    message: string,
    history: ChatMessage[] = [],
    endpointUrl = 'http://localhost:11434/v1/chat/completions',
    modelName = 'llama3:8b'
  ): Promise<{ text: string; model: string; latencyMs: number }> {
    const startTime = performance.now();
    const trainingPairs = StorageService.getTrainingPairs().filter((p) => p.enabled);
    const trainingContext = trainingPairs
      .map((p) => `[Rule ${p.category}]: When asked "${p.promptPattern}", reply: "${p.trainedResponse}"`)
      .join('\n');

    const messages = [
      {
        role: 'system',
        content: `You are MrMWSK's Ai running on local device hardware. Adhere to user guidelines:\n${trainingContext}`,
      },
      ...history.slice(-4).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
      { role: 'user', content: message },
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const resp = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        messages,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      throw new Error(`Local model server returned status ${resp.status}`);
    }

    const data = await resp.json();
    const latencyMs = Math.round(performance.now() - startTime);
    const reply = data.choices?.[0]?.message?.content || 'No output from local model';

    return {
      text: reply,
      model: `Local GPU: ${modelName}`,
      latencyMs,
    };
  },

  // Ping a connector URL to check reachability
  async testConnector(connector: AppConnector): Promise<{ online: boolean; latencyMs: number; error?: string }> {
    if (!connector.requiresNet) {
      return { online: true, latencyMs: 1 };
    }

    if (connector.id === 'gemini-cloud') {
      try {
        const resp = await fetch('/api/status');
        const data = await resp.json();
        return { online: data.status === 'online', latencyMs: 15 };
      } catch (e: any) {
        return { online: false, latencyMs: -1, error: e.message };
      }
    }

    const targetUrl = connector.config.endpointUrl || connector.config.url || connector.config.apiEndpoint;
    if (!targetUrl) {
      return { online: false, latencyMs: -1, error: 'Target URL is not configured' };
    }

    try {
      const resp = await fetch('/api/connectors/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await resp.json();
      return {
        online: data.online,
        latencyMs: data.latencyMs,
        error: data.error,
      };
    } catch (e: any) {
      return { online: false, latencyMs: -1, error: e.message };
    }
  },

  // Dispatch a webhook or queue if offline
  async dispatchWebhook(
    payload: any,
    isOnline: boolean
  ): Promise<{ success: boolean; queued: boolean; message: string }> {
    const connectors = StorageService.getConnectors();
    const webhookConnector = connectors.find((c) => c.id === 'webhook-dispatch' && c.enabled);

    if (!webhookConnector || !webhookConnector.config.endpointUrl) {
      return {
        success: false,
        queued: false,
        message: 'Webhook connector is disabled or endpoint URL is unconfigured.',
      };
    }

    const endpointUrl = webhookConnector.config.endpointUrl;

    if (!isOnline) {
      // Queue offline in Outbox
      StorageService.addToQueue({
        connectorId: 'webhook-dispatch',
        connectorName: 'Webhook & Automation Dispatcher',
        actionType: 'DISPATCH_PAYLOAD',
        payload: { targetUrl: endpointUrl, payload },
      });
      return {
        success: true,
        queued: true,
        message: 'Network offline. Payload safely queued in the Outbox for auto-sync.',
      };
    }

    try {
      const resp = await fetch('/api/connectors/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: endpointUrl,
          payload,
        }),
      });
      const data = await resp.json();
      if (data.ok) {
        return { success: true, queued: false, message: `Dispatched successfully (status: ${data.status})` };
      } else {
        throw new Error(data.message || 'Dispatch failed');
      }
    } catch (err: any) {
      // Fallback to queue if dispatch errors out
      StorageService.addToQueue({
        connectorId: 'webhook-dispatch',
        connectorName: 'Webhook & Automation Dispatcher',
        actionType: 'DISPATCH_PAYLOAD',
        payload: { targetUrl: endpointUrl, payload },
      });
      return {
        success: false,
        queued: true,
        message: `Network error: ${err.message}. Queued for retry in Outbox.`,
      };
    }
  },

  // Flush queued actions
  async flushQueue(): Promise<{ synced: number; failed: number }> {
    const queue = StorageService.getQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;
    const remaining: QueuedAction[] = [];

    for (const item of queue) {
      if (item.actionType === 'DISPATCH_PAYLOAD') {
        try {
          const resp = await fetch('/api/connectors/dispatch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload),
          });
          const res = await resp.json();
          if (res.ok) {
            synced++;
          } else {
            failed++;
            remaining.push({ ...item, retryCount: item.retryCount + 1, lastError: res.message });
          }
        } catch (e: any) {
          failed++;
          remaining.push({ ...item, retryCount: item.retryCount + 1, lastError: e.message });
        }
      } else {
        synced++;
      }
    }

    StorageService.saveQueue(remaining);
    return { synced, failed };
  },

  // Generate standard RFC 5545 iCalendar (.ics) string for offline calendar integration
  generateICalEvent(title: string, description: string, startDate?: string): string {
    const now = new Date();
    const eventDate = startDate ? new Date(startDate) : new Date(now.getTime() + 86400000);
    const endDate = new Date(eventDate.getTime() + 30 * 60000); // 30 min duration

    const formatDate = (d: Date) =>
      d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MrMWSK//MrMWSK Ai Assistant//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:mrmwsk-${Date.now()}@mrmwsk.ai`,
      `DTSTAMP:${formatDate(now)}`,
      `DTSTART:${formatDate(eventDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${title.replace(/[\n,]/g, ' ')}`,
      `DESCRIPTION:${description.replace(/[\n,]/g, ' ')}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    return icsContent;
  },

  // Helper to trigger browser download of .ics file
  downloadICalFile(title: string, description: string, startDate?: string): void {
    const ics = this.generateICalEvent(title, description, startDate);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
