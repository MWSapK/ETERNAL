import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Paperclip,
  Cpu,
  Cloud,
  FileText,
  Calendar,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import { ChatMessage, NetworkMode } from '../types';
import { useSpeech } from '../hooks/useSpeech';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  networkMode: NetworkMode;
  isOnline: boolean;
  onNavigateTab: (tab: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  isLoading,
  networkMode,
  isOnline,
  onNavigateTab,
}) => {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isListening,
    isSpeaking,
    speechSupported,
    recognitionSupported,
    startListening,
    stopListening,
    speakText,
    stopSpeaking,
  } = useSpeech();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !attachedFile) || isLoading) return;

    let fullPrompt = input.trim();
    if (attachedFile) {
      fullPrompt = `[Attached Document: ${attachedFile.name}]\n${attachedFile.content}\n\nUser Question:\n${fullPrompt || 'Analyze this document and summarize the key findings.'}`;
    }

    setInput('');
    setAttachedFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await onSendMessage(fullPrompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setAttachedFile({
        name: file.name,
        content: text.slice(0, 50000), // safety limit
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((transcript) => {
        setInput(transcript);
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
        }
      });
    }
  };

  const starterChips = [
    { label: 'calculate (450 * 18) - 12%', query: 'calculate (450 * 18) - 12%' },
    { label: 'convert 85 miles to km', query: 'convert 85 miles to km' },
    { label: 'todo: Audit system security by Friday', query: 'todo: Audit system security by Friday' },
    { label: 'template react component', query: 'template react component' },
    { label: 'format json: {"id": 1, "valid": true}', query: 'format json: {"id": 1, "valid": true}' },
    { label: 'explain transformer attention', query: 'explain transformer attention mechanism' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-950/40 relative">
      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto mt-8 text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden border border-amber-500/30 bg-slate-900 shadow-xl shadow-amber-500/5">
              <img
                src="/src/assets/images/mrmwsk_ai_avatar_1794609450162.jpg"
                alt="MrMWSK's Ai"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                MrMWSK&apos;s Ai
              </h2>
              <p className="mt-1.5 text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Autonomous offline-first intelligence. Performs calculations, code generation, document parsing, and task management locally, with optional connectors for external apps and Google Gemini.
              </p>
            </div>

            {/* Quick Starter Chips */}
            <div className="pt-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                Suggested Directives
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {starterChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(chip.query);
                      textareaRef.current?.focus();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-amber-500/40 hover:bg-slate-800/90 transition shadow-xs text-left"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Offline vs Online Capability Matrix */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-left text-xs max-w-xl mx-auto">
              <div className="font-semibold text-white mb-2 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                <span>Offline Sovereignty Mode</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                When disconnected from the internet or switched to <strong>Pure Offline</strong>, MrMWSK&apos;s Ai runs completely in your browser memory. Your chats, uploaded notes, and tasks never leave your computer.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isCopied = copiedId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-4 max-w-3xl ${
                  isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'
                }`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-amber-500/30 bg-slate-900 shrink-0 mt-0.5 shadow-xs">
                    <img
                      src="/src/assets/images/mrmwsk_ai_avatar_1794609450162.jpg"
                      alt="Ai"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div
                  className={`flex flex-col min-w-0 max-w-2xl ${
                    isUser ? 'items-end' : 'items-start'
                  }`}
                >
                  {/* Assistant Attribution Header */}
                  {!isUser && (
                    <div className="flex flex-wrap items-center gap-2 mb-1.5 text-[11px] text-slate-400">
                      {msg.source === 'cloud-gemini' ? (
                        <span className="flex items-center gap-1 text-blue-400 font-medium">
                          <Cloud className="w-3 h-3" />
                          <span>Gemini Cloud Connector</span>
                        </span>
                      ) : msg.source === 'local-llm' ? (
                        <span className="flex items-center gap-1 text-purple-400 font-medium">
                          <Cpu className="w-3 h-3" />
                          <span>Local GPU Model (Ollama)</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-400 font-medium">
                          <Cpu className="w-3 h-3" />
                          <span>Local Offline Brain</span>
                        </span>
                      )}

                      {msg.metadata?.model && (
                        <>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="font-mono text-slate-300">{msg.metadata.model}</span>
                        </>
                      )}

                      {msg.metadata?.resourceTier && (
                        <>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span
                            className={`font-mono uppercase text-[10px] font-bold ${
                              msg.metadata.resourceTier === 'beast'
                                ? 'text-rose-400'
                                : msg.metadata.resourceTier === 'balanced'
                                ? 'text-emerald-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {msg.metadata.resourceTier}
                          </span>
                        </>
                      )}

                      {msg.metadata?.hardwareTelemetry && (
                        <>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="font-mono tabular-nums text-slate-500">
                            {msg.metadata.hardwareTelemetry.threadsUsed} threads
                          </span>
                        </>
                      )}

                      {msg.metadata?.latencyMs !== undefined && (
                        <>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="font-mono tabular-nums text-slate-400">{msg.metadata.latencyMs}ms</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl p-4 text-xs md:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-xs shadow-md'
                        : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-xs shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {msg.content}
                    </div>

                    {/* Suggested task banner if parsed */}
                    {msg.metadata?.suggestedTask && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs text-slate-300">
                        <div className="flex items-center gap-2 text-emerald-400 font-medium">
                          <CheckSquare className="w-4 h-4 shrink-0" />
                          <span>Task queued to offline repository</span>
                        </div>
                        <button
                          onClick={() => onNavigateTab('tasks')}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-white transition"
                        >
                          View Tasks
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions Row */}
                  {!isUser && (
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="flex items-center gap-1 hover:text-slate-200 transition py-0.5"
                        title="Copy text"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      {speechSupported && (
                        <button
                          onClick={() => (isSpeaking ? stopSpeaking() : speakText(msg.content))}
                          className="flex items-center gap-1 hover:text-slate-200 transition py-0.5 ml-2"
                          title="Read aloud"
                        >
                          {isSpeaking ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                              <span className="text-amber-400">Stop Voice</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Speak</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-4 max-w-2xl mr-auto animate-fadeIn">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-amber-500/30 bg-slate-900 shrink-0">
              <img
                src="/src/assets/images/mrmwsk_ai_avatar_1794609450162.jpg"
                alt="Ai"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2 shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>
                {networkMode === 'cloud' && isOnline
                  ? 'Consulting Gemini Cloud Connector...'
                  : 'Synthesizing local offline intelligence...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Dock */}
      <div className="p-4 md:p-6 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          {/* File Attachment Pill if selected */}
          {attachedFile && (
            <div className="mb-2.5 flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-amber-500/30 text-xs text-slate-200">
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-medium truncate">{attachedFile.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({Math.round(attachedFile.content.length / 1024)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="text-slate-400 hover:text-white px-2 py-0.5 rounded transition"
              >
                Remove
              </button>
            </div>
          )}

          <div className="relative flex items-end gap-2 p-2 rounded-2xl bg-slate-900 border border-slate-800 focus-within:border-amber-500/50 shadow-lg transition-all">
            {/* Attachment Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".txt,.md,.json,.csv,.js,.ts,.py,.html,.css"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition shrink-0"
              title="Attach text, code, or document for offline query"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder={
                networkMode === 'offline' || !isOnline
                  ? "Ask MrMWSK's Ai (Local Engine: math, code, tasks, notes)..."
                  : "Ask MrMWSK's Ai (Hybrid: local brain + Gemini Cloud)..."
              }
              rows={1}
              className="flex-1 max-h-44 p-2 bg-transparent text-slate-100 placeholder:text-slate-500 text-xs md:text-sm focus:outline-none resize-none leading-relaxed"
            />

            {/* Voice Dictation (Web Speech API) */}
            {recognitionSupported && (
              <button
                type="button"
                onClick={handleVoiceToggle}
                className={`p-2 rounded-xl transition shrink-0 ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                }`}
                title={isListening ? 'Listening (Click to stop)' : 'Voice dictation'}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}

            {/* Send Button */}
            <button
              type="submit"
              disabled={(!input.trim() && !attachedFile) || isLoading}
              className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:hover:bg-amber-500 text-slate-950 font-bold transition shrink-0 shadow-sm"
              title="Send to assistant"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Privacy & Operating Mode Footer Note */}
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 px-2">
            <span>
              {networkMode === 'offline' || !isOnline ? (
                <span className="text-amber-400 font-medium">
                  Air-Gapped Local Engine Active · 100% On-Device
                </span>
              ) : (
                <span className="text-slate-400">
                  Dual Intelligence Mode (Local First + Cloud Connector)
                </span>
              )}
            </span>
            <span className="font-mono text-slate-400">Shift + Enter for line break</span>
          </div>
        </form>
      </div>
    </div>
  );
};
