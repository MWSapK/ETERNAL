/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Menu } from 'lucide-react';
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
} from './types';
import { StorageService } from './services/storageService';
import { LocalAiEngine } from './services/localAiEngine';
import { ConnectorService } from './services/connectorService';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { ChatView } from './components/ChatView';
import { ConnectorHubView } from './components/ConnectorHubView';
import { KnowledgeView } from './components/KnowledgeView';
import { ToolboxView } from './components/ToolboxView';
import { TaskQueueView } from './components/TaskQueueView';
import { TrainingStudioView } from './components/TrainingStudioView';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('chat');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [connectors, setConnectors] = useState<AppConnector[]>([]);
  const [tasks, setTasks] = useState<OfflineTask[]>([]);
  const [knowledgeNotes, setKnowledgeNotes] = useState<KnowledgeNote[]>([]);
  const [trainingPairs, setTrainingPairs] = useState<TrainingPair[]>([]);
  const [queue, setQueue] = useState<QueuedAction[]>([]);
  const [settings, setSettings] = useState<AssistantSettings>(StorageService.getSettings());
  const [networkMode, setNetworkMode] = useState<NetworkMode>(settings.networkMode);

  const [isLoading, setIsLoading] = useState(false);
  const [isFlushing, setIsFlushing] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const { isOnline, simulatedOffline, setSimulatedOffline } = useOnlineStatus();

  // Load initial persistent state
  const loadData = useCallback(() => {
    const loadedSessions = StorageService.getSessions();
    const activeId = StorageService.getActiveSessionId();
    const loadedConnectors = StorageService.getConnectors();
    const loadedTasks = StorageService.getTasks();
    const loadedKnowledge = StorageService.getKnowledgeNotes();
    const loadedTraining = StorageService.getTrainingPairs();
    const loadedQueue = StorageService.getQueue();
    const loadedSettings = StorageService.getSettings();

    setSessions(loadedSessions);
    setActiveSessionId(activeId);
    setConnectors(loadedConnectors);
    setTasks(loadedTasks);
    setKnowledgeNotes(loadedKnowledge);
    setTrainingPairs(loadedTraining);
    setQueue(loadedQueue);
    setSettings(loadedSettings);
    setNetworkMode(loadedSettings.networkMode);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Switch or create sessions
  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    StorageService.setActiveSessionId(id);
  };

  const handleNewSession = () => {
    const newSession = StorageService.createSession(`Session ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    setSessions(StorageService.getSessions());
    setActiveSessionId(newSession.id);
    setCurrentTab('chat');
  };

  const handleDeleteSession = (id: string) => {
    StorageService.deleteSession(id);
    const updated = StorageService.getSessions();
    setSessions(updated);
    setActiveSessionId(StorageService.getActiveSessionId());
  };

  // Network mode change
  const handleNetworkModeChange = (mode: NetworkMode) => {
    setNetworkMode(mode);
    const updatedSettings = { ...settings, networkMode: mode };
    setSettings(updatedSettings);
    StorageService.saveSettings(updatedSettings);
  };

  // Toggle simulated offline
  const handleToggleSimulatedOffline = () => {
    setSimulatedOffline(!simulatedOffline);
  };

  // Flush Outbox Queue
  const handleFlushQueue = async () => {
    if (!isOnline || isFlushing) return;
    setIsFlushing(true);
    try {
      await ConnectorService.flushQueue();
      setQueue(StorageService.getQueue());
    } finally {
      setIsFlushing(false);
    }
  };

  const handleClearQueue = () => {
    StorageService.clearQueue();
    setQueue([]);
  };

  // Connectors
  const handleUpdateConnector = (id: string, updates: Partial<AppConnector>) => {
    StorageService.updateConnector(id, updates);
    setConnectors(StorageService.getConnectors());
  };

  // Tasks
  const handleToggleTask = (id: string) => {
    StorageService.toggleTask(id);
    setTasks(StorageService.getTasks());
  };

  const handleDeleteTask = (id: string) => {
    StorageService.deleteTask(id);
    setTasks(StorageService.getTasks());
  };

  const handleAddTask = (newTask: Omit<OfflineTask, 'id' | 'createdAt'>) => {
    StorageService.addTask(newTask);
    setTasks(StorageService.getTasks());
  };

  // Knowledge
  const handleAddNote = (newNote: Omit<KnowledgeNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    StorageService.addKnowledgeNote(newNote);
    setKnowledgeNotes(StorageService.getKnowledgeNotes());
  };

  const handleDeleteNote = (id: string) => {
    StorageService.deleteKnowledgeNote(id);
    setKnowledgeNotes(StorageService.getKnowledgeNotes());
  };

  const handleQueryNoteInChat = (prompt: string) => {
    setCurrentTab('chat');
    handleSendMessage(prompt);
  };

  // Settings
  const handleUpdateSettings = (newSettings: AssistantSettings) => {
    StorageService.saveSettings(newSettings);
    setSettings(newSettings);
    setNetworkMode(newSettings.networkMode);
  };

  // Training Pairs
  const handleAddTrainingPair = (pair: Omit<TrainingPair, 'id' | 'createdAt' | 'matchCount'>) => {
    StorageService.addTrainingPair(pair);
    setTrainingPairs(StorageService.getTrainingPairs());
  };

  const handleToggleTrainingPair = (id: string) => {
    StorageService.toggleTrainingPair(id);
    setTrainingPairs(StorageService.getTrainingPairs());
  };

  const handleDeleteTrainingPair = (id: string) => {
    StorageService.deleteTrainingPair(id);
    setTrainingPairs(StorageService.getTrainingPairs());
  };

  // Primary Message Dispatcher
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    // Optimistically append user message
    StorageService.addMessageToActiveSession(userMessage);
    setSessions(StorageService.getSessions());
    setIsLoading(true);

    try {
      let assistantReplyText = '';
      let replySource: 'local-offline' | 'cloud-gemini' | 'connector' | 'local-llm' = 'local-offline';
      let metadata: any = {};

      const shouldAttemptCloud =
        isOnline &&
        (networkMode === 'cloud' || networkMode === 'hybrid') &&
        connectors.find((c) => c.id === 'gemini-cloud')?.enabled;

      // Check if query is best handled locally (math, direct conversions, regex, tasks)
      const isLocalCommand = /^(?:calculate|compute|solve|math|convert|todo|task|regex|format json|json:)/i.test(
        text.trim()
      );

      const localExecutionOptions = {
        resourceTier: settings.resourceTier,
        modelId: settings.selectedOfflineModel,
        hardwareThreads: settings.allocatedThreads,
      };

      if (shouldAttemptCloud && !isLocalCommand) {
        try {
          if (settings.selectedOnlineModel === 'local-ollama') {
            const localLlmResult = await ConnectorService.queryLocalLlm(
              text,
              activeSession?.messages || [],
              settings.customLocalEndpoint
            );
            assistantReplyText = localLlmResult.text;
            replySource = 'local-llm';
            metadata = {
              model: localLlmResult.model,
              latencyMs: localLlmResult.latencyMs,
              resourceTier: settings.resourceTier,
            };
          } else {
            const cloudResult = await ConnectorService.queryGeminiCloud(
              text,
              activeSession?.messages || [],
              settings.selectedOnlineModel
            );
            assistantReplyText = cloudResult.text;
            replySource = 'cloud-gemini';
            metadata = {
              model: cloudResult.model,
              latencyMs: cloudResult.latencyMs,
              resourceTier: settings.resourceTier,
            };
          }
        } catch (cloudErr: any) {
          console.warn('Online model connector unavailable, falling back to Local Offline Brain:', cloudErr);
          // Seamless fallback to Local Engine
          const localResult = await LocalAiEngine.processQuery(text, localExecutionOptions);
          assistantReplyText = `*(Switched to Local Offline Brain — Online model unreachable)*\n\n${localResult.content}`;
          replySource = 'local-offline';
          metadata = localResult.metadata;
        }
      } else {
        // Pure Offline or Hybrid Local intent
        const localResult = await LocalAiEngine.processQuery(text, localExecutionOptions);
        assistantReplyText = localResult.content;
        replySource = 'local-offline';
        metadata = localResult.metadata;
      }

      const assistantMessage: ChatMessage = {
        id: 'msg-' + Date.now(),
        role: 'assistant',
        content: assistantReplyText,
        timestamp: Date.now(),
        source: replySource,
        metadata,
      };

      StorageService.addMessageToActiveSession(assistantMessage);
      setSessions(StorageService.getSessions());

      // If a task was created by the engine, refresh task state
      if (metadata?.suggestedTask) {
        setTasks(StorageService.getTasks());
      }
    } catch (err: any) {
      console.error('Message processing error:', err);
      const errorMessage: ChatMessage = {
        id: 'msg-' + Date.now(),
        role: 'assistant',
        content: `**Internal Diagnostic Note**: An issue occurred while processing your request: ${err.message}. Operating safely in offline fallback mode.`,
        timestamp: Date.now(),
        source: 'local-offline',
      };
      StorageService.addMessageToActiveSession(errorMessage);
      setSessions(StorageService.getSessions());
    } finally {
      setIsLoading(false);
    }
  };

  const connectedAppsCount = connectors.filter((c) => c.enabled).length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-amber-500/20 selection:text-amber-200">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        connectedAppsCount={connectedAppsCount}
        taskCount={tasks.filter((t) => !t.completed).length}
        knowledgeCount={knowledgeNotes.length}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="md:hidden p-3 text-slate-400 hover:text-white border-b border-slate-800 bg-slate-950"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <TopHeader
              currentTab={currentTab}
              networkMode={networkMode}
              onNetworkModeChange={handleNetworkModeChange}
              isOnline={isOnline}
              simulatedOffline={simulatedOffline}
              onToggleSimulatedOffline={handleToggleSimulatedOffline}
              onNewSession={handleNewSession}
              queuedCount={queue.length}
              onFlushQueue={handleFlushQueue}
              isFlushing={isFlushing}
            />
          </div>
        </div>

        {/* Tab Viewports */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {currentTab === 'chat' && (
            <ChatView
              messages={activeSession?.messages || []}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              networkMode={networkMode}
              isOnline={isOnline}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'connectors' && (
            <ConnectorHubView
              connectors={connectors}
              onUpdateConnector={handleUpdateConnector}
              queue={queue}
              onFlushQueue={handleFlushQueue}
              onClearQueue={handleClearQueue}
              isFlushing={isFlushing}
              isOnline={isOnline}
            />
          )}

          {currentTab === 'knowledge' && (
            <KnowledgeView
              notes={knowledgeNotes}
              onAddNote={handleAddNote}
              onDeleteNote={handleDeleteNote}
              onQueryNoteInChat={handleQueryNoteInChat}
            />
          )}

          {currentTab === 'toolbox' && <ToolboxView />}

          {currentTab === 'tasks' && (
            <TaskQueueView
              tasks={tasks}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onAddTask={handleAddTask}
            />
          )}

          {currentTab === 'training' && (
            <TrainingStudioView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              trainingPairs={trainingPairs}
              onAddTrainingPair={handleAddTrainingPair}
              onToggleTrainingPair={handleToggleTrainingPair}
              onDeleteTrainingPair={handleDeleteTrainingPair}
              onQueryInChat={(prompt) => {
                setCurrentTab('chat');
                handleSendMessage(prompt);
              }}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsModal
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onReloadAllData={loadData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
