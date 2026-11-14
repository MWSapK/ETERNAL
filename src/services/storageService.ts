import {
  ChatSession,
  ChatMessage,
  AppConnector,
  OfflineTask,
  KnowledgeNote,
  TrainingPair,
  QueuedAction,
  AssistantSettings,
  NetworkMode,
  ResourceTier,
  OfflineModelOption,
  OnlineModelOption,
} from '../types';

const STORAGE_KEYS = {
  SESSIONS: 'mrmwsk_sessions_v1',
  ACTIVE_SESSION: 'mrmwsk_active_session_v1',
  CONNECTORS: 'mrmwsk_connectors_v1',
  TASKS: 'mrmwsk_tasks_v1',
  KNOWLEDGE: 'mrmwsk_knowledge_v1',
  TRAINING: 'mrmwsk_training_v1',
  QUEUE: 'mrmwsk_queue_v1',
  SETTINGS: 'mrmwsk_settings_v1',
};

const DEFAULT_CONNECTORS: AppConnector[] = [
  {
    id: 'gemini-cloud',
    name: 'Gemini 4 Cloud Intelligence',
    type: 'ai',
    description: 'Enables high-order reasoning, deep research, and web capabilities via Google Gemini API when online.',
    requiresNet: true,
    enabled: true,
    status: 'connected',
    config: {
      model: 'gemini-4-hydrogen',
      stream: false,
    },
    lastSyncedAt: Date.now(),
  },
  {
    id: 'local-file',
    name: 'Local File & Document Bridge',
    type: 'file',
    description: 'Direct browser-side file system analyzer. Reads code, TXT, CSV, JSON, and Markdown files 100% offline.',
    requiresNet: false,
    enabled: true,
    status: 'connected',
    config: {
      autoIndex: true,
      maxFileSizeBytes: 5242880, // 5MB
    },
    lastSyncedAt: Date.now(),
  },
  {
    id: 'calendar-sync',
    name: 'Calendar & Event Connector (iCal)',
    type: 'calendar',
    description: 'Generates standard .ics calendar schedules offline for Google Calendar, Apple Calendar, and Outlook.',
    requiresNet: false,
    enabled: true,
    status: 'connected',
    config: {
      defaultDurationMinutes: 30,
      reminderMinutes: 15,
    },
    lastSyncedAt: Date.now(),
  },
  {
    id: 'webhook-dispatch',
    name: 'Webhook & Automation Dispatcher',
    type: 'webhook',
    description: 'Dispatches triggers and payloads to external automation webhooks (Zapier, Make, n8n, Slack, Discord).',
    requiresNet: true,
    enabled: false,
    status: 'disconnected',
    config: {
      endpointUrl: '',
      authHeader: '',
      eventTrigger: 'task_created',
    },
    lastSyncedAt: null,
  },
  {
    id: 'github-reader',
    name: 'GitHub Repository Bridge',
    type: 'git',
    description: 'Inspects public repositories, commit histories, and issues when connected to the internet.',
    requiresNet: true,
    enabled: false,
    status: 'disconnected',
    config: {
      defaultRepo: '',
      apiEndpoint: 'https://api.github.com',
    },
    lastSyncedAt: null,
  },
  {
    id: 'custom-api',
    name: 'Custom REST API Connector',
    type: 'custom',
    description: 'Configurable HTTP connector to integrate your private or company microservices.',
    requiresNet: true,
    enabled: false,
    status: 'disconnected',
    config: {
      url: '',
      method: 'POST',
      headersJson: '{"Content-Type": "application/json"}',
    },
    lastSyncedAt: null,
  },
  {
    id: 'local-llm',
    name: 'Local High-VRAM LLM Bridge (Ollama / LM Studio)',
    type: 'ollama',
    description: 'Connects to your device hardware model server (Ollama, LM Studio, vLLM) on localhost for heavy local models.',
    requiresNet: false,
    enabled: false,
    status: 'disconnected',
    config: {
      endpointUrl: 'http://localhost:11434/v1/chat/completions',
      modelName: 'llama3:8b',
    },
    lastSyncedAt: null,
  },
];

export const AVAILABLE_OFFLINE_MODELS: OfflineModelOption[] = [
  {
    id: 'mrmwsk-lite',
    name: 'MrMWSK Lite Core (Deterministic)',
    tierRequired: 'lite',
    description: 'Ultra-low battery, zero RAM overhead. Instant 1ms execution of math, conversions, exact training matches, and rule-based NLP.',
    overhead: '< 2 MB RAM · 1 Core',
    features: ['Instant Math', 'Regex Lab', 'JSON Formatting', 'Exact Trained Knowledge'],
  },
  {
    id: 'mrmwsk-neural',
    name: 'MrMWSK Neural Vector Engine',
    tierRequired: 'balanced',
    description: 'In-browser TF-IDF vector space semantic matching across all notes, tasks, and trained few-shot prompts.',
    overhead: '~ 25 MB RAM · Multi-threaded',
    features: ['Semantic Vector Search', 'Dynamic Tone Synthesis', 'Document Extractive Summarizer'],
  },
  {
    id: 'mrmwsk-beast',
    name: 'MrMWSK Beast Mode Orchestrator',
    tierRequired: 'beast',
    description: 'Pushes hardware to the limit: utilizes all available CPU cores via parallel Web Workers and WebGL acceleration.',
    overhead: 'Full Hardware Saturation · Maximum Context',
    features: ['Multi-Worker Parallelism', 'Deep AST Code Synthesis', 'High-Dimensional Embeddings', 'Full Memory Cache'],
  },
];

export const AVAILABLE_ONLINE_MODELS: OnlineModelOption[] = [
  {
    id: 'gemini-4-hydrogen',
    name: 'Gemini 4 Hydrogen (Default High-Speed)',
    provider: 'google-gemini',
    description: 'Top-tier balance of lightning speed, reasoning depth, code generation, and STEM capabilities.',
    tier: 'balanced',
  },
  {
    id: 'gemini-4-argon',
    name: 'Gemini 4 Argon (Heavy STEM & Reasoning)',
    provider: 'google-gemini',
    description: 'Heavyweight reasoning model for intricate architectural proofs, math analysis, and multi-file codebases.',
    tier: 'deep',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite (Lowest Latency Cloud)',
    provider: 'google-gemini',
    description: 'Super-efficient, ultra-low latency model for high-frequency queries and quick cloud lookups.',
    tier: 'fast',
  },
  {
    id: 'local-ollama',
    name: 'Local Device Hardware Model (Ollama / LM Studio)',
    provider: 'local-endpoint',
    description: 'Runs heavy weights (Llama 3, DeepSeek, Qwen) directly on your device GPU via localhost:11434.',
    tier: 'deep',
  },
];

const DEFAULT_SETTINGS: AssistantSettings = {
  userName: 'MrMWSK',
  networkMode: 'hybrid',
  resourceTier: 'balanced',
  selectedOfflineModel: 'mrmwsk-neural',
  selectedOnlineModel: 'gemini-4-hydrogen',
  customLocalEndpoint: 'http://localhost:11434/v1/chat/completions',
  hardwareAcceleration: true,
  allocatedThreads: 4,
  ttsEnabled: true,
  speechRate: 1.0,
  speechPitch: 1.0,
  selectedVoice: '',
  soundEffects: false,
  simulatedOffline: false,
  theme: 'dark',
};

const INITIAL_TRAINING_PAIRS: TrainingPair[] = [
  {
    id: 'train-1',
    promptPattern: 'production release checklist',
    trainedResponse: `MrMWSK Verified Production Release Protocol:
1. Build Integrity: Run hermetic container compilation and sha256 checksum audit.
2. Database Migrations: Zero-downtime expand-and-contract schema verification.
3. Health Probes: Verify /api/status returns HTTP 200 with latency < 50ms.
4. Canary Routing: Direct 5% user traffic, monitor error budgets for 15 minutes.
5. Full Deployment: Complete traffic rollover with instant rollback trigger armed.`,
    category: 'DevOps & Architecture',
    enabled: true,
    matchCount: 0,
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'train-2',
    promptPattern: 'mrmwsk executive signature',
    trainedResponse: `MrMWSK Autonomous Systems — Precision, Air-Gapped Sovereignty, and Uncompromised Efficiency.`,
    category: 'Persona',
    enabled: true,
    matchCount: 0,
    createdAt: Date.now() - 43200000,
  },
  {
    id: 'train-3',
    promptPattern: 'code design rule',
    trainedResponse: `MrMWSK Code Standard:
- Strongly typed with zero any/as unknown casts where avoidable.
- Zero pill enclosures on informational metadata.
- Tabular numerals on all metrics and timestamps.
- Maximum 1 elevation level per card.`,
    category: 'Engineering Standards',
    enabled: true,
    matchCount: 0,
    createdAt: Date.now() - 21600000,
  },
];

const INITIAL_KNOWLEDGE_NOTES: KnowledgeNote[] = [
  {
    id: 'k-welcome',
    title: "MrMWSK's Ai System Architecture",
    content: `MrMWSK's Ai is an autonomous offline-first executive AI assistant.
Core architectural layers:
1. Local Intelligence Engine: Works completely air-gapped without internet access. Includes determinist math evaluation, full-text token matching, regex lab, code generation templates, and task parsing.
2. Connector Hub: Bridges external apps such as Gemini Cloud, Webhooks, GitHub, and Calendar iCal.
3. Offline Outbox Queue: When offline, actions destined for cloud apps queue locally and flush automatically or manually once reconnected.
4. Total Privacy: All chat sessions, knowledge files, and task queues remain strictly stored within the client device storage.`,
    tags: ['Architecture', 'Core', 'Offline-First'],
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 'k-shortcuts',
    title: 'Assistant Quick Command Patterns',
    content: `Useful prompt commands recognized locally:
- "calculate (150 * 4) + 12.5%": Instant math breakdown
- "convert 100 miles to km": Unit converter
- "todo: Review system architecture by Friday": Automatically creates a tracked offline task
- "summarize: [paste text]": Fast extractive bullet points & reading metrics
- "regex: [pattern] in [text]": Instant regular expression evaluation
- "template react component": Generates idiomatic code snippets
- "format json: [raw json]": Cleans and validates JSON trees`,
    tags: ['Cheat Sheet', 'Commands'],
    createdAt: Date.now() - 1800000,
    updatedAt: Date.now() - 1800000,
  },
];

const INITIAL_TASKS: OfflineTask[] = [
  {
    id: 't-1',
    title: 'Verify offline PWA installation on mobile/desktop',
    description: 'Confirm service worker precaching and test airplane mode operation',
    priority: 'high',
    completed: false,
    category: 'Engineering',
    createdAt: Date.now() - 7200000,
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  },
  {
    id: 't-2',
    title: 'Configure Webhook Connector for external alerts',
    description: 'Add your custom endpoint URL in the Connector Hub tab',
    priority: 'medium',
    completed: false,
    category: 'Integrations',
    createdAt: Date.now() - 3600000,
  },
];

// Helper to safely read and write JSON in localStorage
function readStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn(`Storage read error for ${key}:`, e);
    return fallback;
  }
}

function writeStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Storage write error for ${key}:`, e);
  }
}

export const StorageService = {
  // --- Sessions ---
  getSessions(): ChatSession[] {
    const sessions = readStorage<ChatSession[]>(STORAGE_KEYS.SESSIONS, []);
    if (sessions.length === 0) {
      const defaultSession: ChatSession = {
        id: 'session-' + Date.now(),
        title: 'System Initialized',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [
          {
            id: 'msg-welcome',
            role: 'assistant',
            content: `Greetings, MrMWSK. **MrMWSK's Ai** is online and operational.

I am built to run **100% offline** on your device, with optional high-speed connectors to link other apps and Google Gemini when you choose to connect.

What would you like to accomplish today?
- Ask questions, solve math, convert units, or write code.
- Import documents into Local Knowledge to query them offline.
- Configure external connectors in the Connector Hub.`,
            timestamp: Date.now(),
            source: 'local-offline',
            metadata: {
              model: 'MrMWSK Local Core v1.0',
            },
          },
        ],
      };
      writeStorage(STORAGE_KEYS.SESSIONS, [defaultSession]);
      writeStorage(STORAGE_KEYS.ACTIVE_SESSION, defaultSession.id);
      return [defaultSession];
    }
    return sessions;
  },

  saveSessions(sessions: ChatSession[]): void {
    writeStorage(STORAGE_KEYS.SESSIONS, sessions);
  },

  getActiveSessionId(): string {
    const active = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    if (active) return active;
    const sessions = this.getSessions();
    const id = sessions[0]?.id || 'session-default';
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, id);
    return id;
  },

  setActiveSessionId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, id);
  },

  createSession(title = 'New Investigation'): ChatSession {
    const sessions = this.getSessions();
    const newSession: ChatSession = {
      id: 'session-' + Date.now(),
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    sessions.unshift(newSession);
    this.saveSessions(sessions);
    this.setActiveSessionId(newSession.id);
    return newSession;
  },

  deleteSession(id: string): void {
    const sessions = this.getSessions().filter((s) => s.id !== id);
    if (sessions.length === 0) {
      this.createSession('General Console');
      return;
    }
    this.saveSessions(sessions);
    if (this.getActiveSessionId() === id) {
      this.setActiveSessionId(sessions[0].id);
    }
  },

  addMessageToActiveSession(msg: ChatMessage): void {
    const activeId = this.getActiveSessionId();
    const sessions = this.getSessions();
    const session = sessions.find((s) => s.id === activeId);
    if (session) {
      session.messages.push(msg);
      session.updatedAt = Date.now();
      // Auto-title on first user message if still default title
      if (session.messages.length <= 2 && msg.role === 'user') {
        session.title = msg.content.slice(0, 32).trim() || 'Conversation';
      }
      this.saveSessions(sessions);
    }
  },

  // --- Connectors ---
  getConnectors(): AppConnector[] {
    const connectors = readStorage<AppConnector[]>(STORAGE_KEYS.CONNECTORS, []);
    if (connectors.length === 0) {
      writeStorage(STORAGE_KEYS.CONNECTORS, DEFAULT_CONNECTORS);
      return DEFAULT_CONNECTORS;
    }
    return connectors;
  },

  saveConnectors(connectors: AppConnector[]): void {
    writeStorage(STORAGE_KEYS.CONNECTORS, connectors);
  },

  updateConnector(id: string, updates: Partial<AppConnector>): void {
    const list = this.getConnectors();
    const idx = list.findIndex((c) => c.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      this.saveConnectors(list);
    }
  },

  // --- Tasks ---
  getTasks(): OfflineTask[] {
    return readStorage<OfflineTask[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  },

  saveTasks(tasks: OfflineTask[]): void {
    writeStorage(STORAGE_KEYS.TASKS, tasks);
  },

  addTask(task: Omit<OfflineTask, 'id' | 'createdAt'>): OfflineTask {
    const tasks = this.getTasks();
    const newTask: OfflineTask = {
      ...task,
      id: 'task-' + Date.now(),
      createdAt: Date.now(),
    };
    tasks.unshift(newTask);
    this.saveTasks(tasks);
    return newTask;
  },

  toggleTask(id: string): void {
    const tasks = this.getTasks();
    const task = tasks.find((t) => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks(tasks);
    }
  },

  deleteTask(id: string): void {
    const tasks = this.getTasks().filter((t) => t.id !== id);
    this.saveTasks(tasks);
  },

  // --- Knowledge Notes ---
  getKnowledgeNotes(): KnowledgeNote[] {
    return readStorage<KnowledgeNote[]>(STORAGE_KEYS.KNOWLEDGE, INITIAL_KNOWLEDGE_NOTES);
  },

  saveKnowledgeNotes(notes: KnowledgeNote[]): void {
    writeStorage(STORAGE_KEYS.KNOWLEDGE, notes);
  },

  addKnowledgeNote(note: Omit<KnowledgeNote, 'id' | 'createdAt' | 'updatedAt'>): KnowledgeNote {
    const notes = this.getKnowledgeNotes();
    const newNote: KnowledgeNote = {
      ...note,
      id: 'k-' + Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    notes.unshift(newNote);
    this.saveKnowledgeNotes(notes);
    return newNote;
  },

  deleteKnowledgeNote(id: string): void {
    const notes = this.getKnowledgeNotes().filter((n) => n.id !== id);
    this.saveKnowledgeNotes(notes);
  },

  // --- Training Pairs (User-Trained Memory) ---
  getTrainingPairs(): TrainingPair[] {
    return readStorage<TrainingPair[]>(STORAGE_KEYS.TRAINING, INITIAL_TRAINING_PAIRS);
  },

  saveTrainingPairs(pairs: TrainingPair[]): void {
    writeStorage(STORAGE_KEYS.TRAINING, pairs);
  },

  addTrainingPair(pair: Omit<TrainingPair, 'id' | 'createdAt' | 'matchCount'>): TrainingPair {
    const pairs = this.getTrainingPairs();
    const newPair: TrainingPair = {
      ...pair,
      id: 'train-' + Date.now(),
      matchCount: 0,
      createdAt: Date.now(),
    };
    pairs.unshift(newPair);
    this.saveTrainingPairs(pairs);
    return newPair;
  },

  toggleTrainingPair(id: string): void {
    const pairs = this.getTrainingPairs();
    const found = pairs.find((p) => p.id === id);
    if (found) {
      found.enabled = !found.enabled;
      this.saveTrainingPairs(pairs);
    }
  },

  deleteTrainingPair(id: string): void {
    const pairs = this.getTrainingPairs().filter((p) => p.id !== id);
    this.saveTrainingPairs(pairs);
  },

  incrementTrainingMatch(id: string): void {
    const pairs = this.getTrainingPairs();
    const found = pairs.find((p) => p.id === id);
    if (found) {
      found.matchCount = (found.matchCount || 0) + 1;
      this.saveTrainingPairs(pairs);
    }
  },

  // --- Outbox Queue ---
  getQueue(): QueuedAction[] {
    return readStorage<QueuedAction[]>(STORAGE_KEYS.QUEUE, []);
  },

  saveQueue(queue: QueuedAction[]): void {
    writeStorage(STORAGE_KEYS.QUEUE, queue);
  },

  addToQueue(action: Omit<QueuedAction, 'id' | 'queuedAt' | 'status' | 'retryCount'>): QueuedAction {
    const queue = this.getQueue();
    const item: QueuedAction = {
      ...action,
      id: 'q-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      queuedAt: Date.now(),
      status: 'pending',
      retryCount: 0,
    };
    queue.push(item);
    this.saveQueue(queue);
    return item;
  },

  clearQueue(): void {
    this.saveQueue([]);
  },

  // --- Settings ---
  getSettings(): AssistantSettings {
    const settings = readStorage<AssistantSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS, ...settings };
  },

  saveSettings(settings: AssistantSettings): void {
    writeStorage(STORAGE_KEYS.SETTINGS, settings);
  },

  // --- Backup & Restore ---
  exportFullBackup(): string {
    const backup = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      branding: "MrMWSK's Ai",
      sessions: this.getSessions(),
      connectors: this.getConnectors(),
      tasks: this.getTasks(),
      knowledge: this.getKnowledgeNotes(),
      training: this.getTrainingPairs(),
      settings: this.getSettings(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importFullBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') return false;

      if (Array.isArray(data.sessions)) writeStorage(STORAGE_KEYS.SESSIONS, data.sessions);
      if (Array.isArray(data.connectors)) writeStorage(STORAGE_KEYS.CONNECTORS, data.connectors);
      if (Array.isArray(data.tasks)) writeStorage(STORAGE_KEYS.TASKS, data.tasks);
      if (Array.isArray(data.knowledge)) writeStorage(STORAGE_KEYS.KNOWLEDGE, data.knowledge);
      if (Array.isArray(data.training)) writeStorage(STORAGE_KEYS.TRAINING, data.training);
      if (data.settings && typeof data.settings === 'object') {
        writeStorage(STORAGE_KEYS.SETTINGS, { ...DEFAULT_SETTINGS, ...data.settings });
      }
      return true;
    } catch (e) {
      console.error('Import backup failure:', e);
      return false;
    }
  },
};
