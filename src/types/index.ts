export type NetworkMode = 'offline' | 'hybrid' | 'cloud';
export type ResourceTier = 'lite' | 'balanced' | 'beast';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  source?: 'local-offline' | 'cloud-gemini' | 'connector' | 'local-llm';
  metadata?: {
    model?: string;
    resourceTier?: ResourceTier;
    latencyMs?: number;
    connectorName?: string;
    toolUsed?: string;
    calculation?: string;
    codeSnippet?: string;
    tokenCount?: number;
    actionType?: string;
    suggestedTask?: any;
    hardwareTelemetry?: {
      threadsUsed: number;
      memoryEstimateMB: number;
    };
  };
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  pinned?: boolean;
}

export type ConnectorType = 'ai' | 'webhook' | 'file' | 'git' | 'calendar' | 'custom' | 'ollama';

export interface AppConnector {
  id: string;
  name: string;
  type: ConnectorType;
  description: string;
  status: 'connected' | 'disconnected' | 'disabled' | 'error';
  requiresNet: boolean;
  enabled: boolean;
  config: Record<string, any>;
  lastSyncedAt: number | null;
  latencyMs?: number;
}

export interface OfflineTask {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  dueDate?: string;
  category: string;
  createdAt: number;
}

export interface KnowledgeNote {
  id: string;
  title: string;
  content: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface TrainingPair {
  id: string;
  promptPattern: string;
  trainedResponse: string;
  category: string;
  enabled: boolean;
  matchCount: number;
  createdAt: number;
}

export interface QueuedAction {
  id: string;
  connectorId: string;
  connectorName: string;
  actionType: string;
  payload: any;
  queuedAt: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  retryCount: number;
  lastError?: string;
}

export interface DeviceHardwareSpecs {
  cpuCores: number;
  deviceMemoryGB: number | null;
  storageUsedMB: number;
  storageQuotaMB: number;
  gpuRenderer: string;
  batteryLevel: number | null;
  isCharging: boolean | null;
  platform: string;
}

export interface OfflineModelOption {
  id: string;
  name: string;
  tierRequired: ResourceTier;
  description: string;
  overhead: string;
  features: string[];
}

export interface OnlineModelOption {
  id: string;
  name: string;
  provider: 'google-gemini' | 'local-endpoint';
  description: string;
  tier: 'fast' | 'balanced' | 'deep';
}

export interface AssistantSettings {
  userName: string;
  networkMode: NetworkMode;
  resourceTier: ResourceTier;
  selectedOfflineModel: string;
  selectedOnlineModel: string;
  customLocalEndpoint: string;
  hardwareAcceleration: boolean;
  allocatedThreads: number;
  ttsEnabled: boolean;
  speechRate: number;
  speechPitch: number;
  selectedVoice: string;
  soundEffects: boolean;
  simulatedOffline: boolean;
  theme: 'dark';
}
