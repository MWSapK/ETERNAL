import React, { useState } from 'react';
import {
  Network,
  Zap,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  Shield,
  FileCode,
  Calendar,
  Send,
  GitBranch,
  Globe,
  Sliders,
  Play,
} from 'lucide-react';
import { AppConnector, QueuedAction } from '../types';
import { ConnectorService } from '../services/connectorService';

interface ConnectorHubProps {
  connectors: AppConnector[];
  onUpdateConnector: (id: string, updates: Partial<AppConnector>) => void;
  queue: QueuedAction[];
  onFlushQueue: () => void;
  onClearQueue: () => void;
  isFlushing: boolean;
  isOnline: boolean;
}

export const ConnectorHubView: React.FC<ConnectorHubProps> = ({
  connectors,
  onUpdateConnector,
  queue,
  onFlushQueue,
  onClearQueue,
  isFlushing,
  isOnline,
}) => {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { online: boolean; latencyMs: number; error?: string }>>({});
  const [editingConnector, setEditingConnector] = useState<AppConnector | null>(null);
  const [heroImageError, setHeroImageError] = useState(false);

  const handleTest = async (connector: AppConnector) => {
    setTestingId(connector.id);
    try {
      const res = await ConnectorService.testConnector(connector);
      setTestResult((prev) => ({ ...prev, [connector.id]: res }));
      if (res.online) {
        onUpdateConnector(connector.id, { status: 'connected', latencyMs: res.latencyMs });
      } else {
        onUpdateConnector(connector.id, { status: 'error' });
      }
    } catch (e: any) {
      setTestResult((prev) => ({
        ...prev,
        [connector.id]: { online: false, latencyMs: -1, error: e.message },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const getConnectorIcon = (type: string) => {
    switch (type) {
      case 'ai':
        return Zap;
      case 'file':
        return FileCode;
      case 'calendar':
        return Calendar;
      case 'webhook':
        return Send;
      case 'git':
        return GitBranch;
      default:
        return Globe;
    }
  };

  const activeCount = connectors.filter((c) => c.enabled).length;

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-950/40">
      {/* Hero Header with Generated Visual Asset */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl">
        <div className="relative h-48 md:h-56 w-full overflow-hidden bg-slate-950">
          {!heroImageError ? (
            <img
              src="/src/assets/images/connector_hub_hero_1794609450705.jpg"
              alt="Connector Hub Architecture"
              referrerPolicy="no-referrer"
              onError={() => setHeroImageError(true)}
              className="w-full h-full object-cover opacity-70"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          
          <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
                <Network className="w-4 h-4" />
                <span>Extensible Architecture</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                Connector Hub & App Integrations
              </h1>
              <p className="mt-1 text-xs text-slate-300 max-w-xl leading-relaxed">
                Empower MrMWSK&apos;s Ai to communicate with third-party tools, dispatch webhooks, read local documents, or scale reasoning with Google Gemini when connected.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-200">
                <span className="text-amber-400 font-bold tabular-nums">{activeCount}</span> / {connectors.length} Enabled
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Connectors */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Available Application Bridges
          </h2>
          <span className="text-xs text-slate-400">
            {isOnline ? 'Network: Active' : 'Network: Air-Gapped / Offline'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connectors.map((connector) => {
            const Icon = getConnectorIcon(connector.type);
            const isTesting = testingId === connector.id;
            const result = testResult[connector.id];

            return (
              <div
                key={connector.id}
                className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                  connector.enabled
                    ? 'bg-slate-900/90 border-slate-800 hover:border-amber-500/40 shadow-sm'
                    : 'bg-slate-900/40 border-slate-900 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/60 text-amber-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white tracking-tight">
                          {connector.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          {connector.requiresNet ? (
                            <span className="text-blue-400 font-medium">Requires Net</span>
                          ) : (
                            <span className="text-emerald-400 font-medium">100% Offline</span>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">{connector.type}</span>
                        </div>
                      </div>
                    </div>

                    {/* Enable/Disable Toggle */}
                    <button
                      onClick={() => onUpdateConnector(connector.id, { enabled: !connector.enabled })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        connector.enabled ? 'bg-amber-500' : 'bg-slate-800'
                      }`}
                      title={connector.enabled ? 'Disable connector' : 'Enable connector'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          connector.enabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {connector.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="text-[11px] font-mono">
                    {result ? (
                      result.online ? (
                        <span className="text-emerald-400 tabular-nums">
                          Online ({result.latencyMs}ms)
                        </span>
                      ) : (
                        <span className="text-rose-400 truncate max-w-[120px] inline-block">
                          {result.error || 'Failed'}
                        </span>
                      )
                    ) : connector.lastSyncedAt ? (
                      <span className="text-slate-400">
                        Configured
                      </span>
                    ) : (
                      <span className="text-slate-400">Not Tested</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingConnector(connector)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Configure connector parameters"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleTest(connector)}
                      disabled={isTesting || (!isOnline && connector.requiresNet)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition flex items-center gap-1"
                    >
                      <Play className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'Pinging...' : 'Test'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Outbox Sync Queue Section */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-amber-400" />
              <span>Offline Outbox & Action Sync Queue</span>
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Actions and webhook payloads executed while in offline or airplane mode queue safely on your device.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {queue.length > 0 && (
              <button
                onClick={onClearQueue}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Clear Queue
              </button>
            )}

            <button
              onClick={onFlushQueue}
              disabled={queue.length === 0 || !isOnline || isFlushing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 transition shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFlushing ? 'animate-spin' : ''}`} />
              <span>{isFlushing ? 'Syncing...' : 'Sync Outbox Now'}</span>
            </button>
          </div>
        </div>

        {queue.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400">
            Outbox is clean. No pending actions waiting for synchronization.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Connector</th>
                  <th className="px-4 py-3">Action Type</th>
                  <th className="px-4 py-3">Queued Time</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Retries</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 font-mono">
                {queue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/50">
                    <td className="px-4 py-2.5 font-sans font-medium text-white">
                      {item.connectorName}
                    </td>
                    <td className="px-4 py-2.5 text-slate-300">{item.actionType}</td>
                    <td className="px-4 py-2.5 text-slate-400 tabular-nums">
                      {new Date(item.queuedAt).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-amber-400 uppercase text-[10px] font-bold">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-slate-400">
                      {item.retryCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Configuration Modal */}
      {editingConnector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                Configure {editingConnector.name}
              </h3>
              <button
                onClick={() => setEditingConnector(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {editingConnector.id === 'webhook-dispatch' && (
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Webhook Destination URL (Zapier / Make / n8n / Discord)
                  </label>
                  <input
                    type="url"
                    value={editingConnector.config.endpointUrl || ''}
                    onChange={(e) =>
                      setEditingConnector({
                        ...editingConnector,
                        config: { ...editingConnector.config, endpointUrl: e.target.value },
                      })
                    }
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {editingConnector.id === 'github-reader' && (
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Default Repository (owner/repo)
                  </label>
                  <input
                    type="text"
                    value={editingConnector.config.defaultRepo || ''}
                    onChange={(e) =>
                      setEditingConnector({
                        ...editingConnector,
                        config: { ...editingConnector.config, defaultRepo: e.target.value },
                      })
                    }
                    placeholder="e.g. facebook/react or torvalds/linux"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {editingConnector.id === 'custom-api' && (
                <>
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">
                      Endpoint URL
                    </label>
                    <input
                      type="url"
                      value={editingConnector.config.url || ''}
                      onChange={(e) =>
                        setEditingConnector({
                          ...editingConnector,
                          config: { ...editingConnector.config, url: e.target.value },
                        })
                      }
                      placeholder="https://api.mycompany.com/v1/trigger"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">
                      HTTP Method
                    </label>
                    <select
                      value={editingConnector.config.method || 'POST'}
                      onChange={(e) =>
                        setEditingConnector({
                          ...editingConnector,
                          config: { ...editingConnector.config, method: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="POST">POST</option>
                      <option value="GET">GET</option>
                      <option value="PUT">PUT</option>
                    </select>
                  </div>
                </>
              )}

              {editingConnector.id === 'gemini-cloud' && (
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Gemini Model Alias
                  </label>
                  <input
                    type="text"
                    disabled
                    value="gemini-4-hydrogen (Server-side managed via Secrets)"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Managed automatically through server proxy. Zero client-side API keys exposed.
                  </p>
                </div>
              )}

              {editingConnector.id === 'calendar-sync' && (
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Default Meeting Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={editingConnector.config.defaultDurationMinutes || 30}
                    onChange={(e) =>
                      setEditingConnector({
                        ...editingConnector,
                        config: {
                          ...editingConnector.config,
                          defaultDurationMinutes: parseInt(e.target.value) || 30,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingConnector(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onUpdateConnector(editingConnector.id, { config: editingConnector.config });
                  setEditingConnector(null);
                }}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
