import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Zap,
  Gauge,
  Sliders,
  CheckCircle2,
  HardDrive,
  Battery,
  BatteryCharging,
  Layers,
  Sparkles,
  Plus,
  Trash2,
  Download,
  Upload,
  Brain,
  Globe,
  Monitor,
  Flame,
} from 'lucide-react';
import {
  DeviceHardwareSpecs,
  ResourceTier,
  TrainingPair,
  AssistantSettings,
} from '../types';
import { HardwareService } from '../services/hardwareService';
import { AVAILABLE_OFFLINE_MODELS, AVAILABLE_ONLINE_MODELS } from '../services/storageService';

interface TrainingStudioProps {
  settings: AssistantSettings;
  onUpdateSettings: (newSettings: AssistantSettings) => void;
  trainingPairs: TrainingPair[];
  onAddTrainingPair: (pair: Omit<TrainingPair, 'id' | 'createdAt' | 'matchCount'>) => void;
  onToggleTrainingPair: (id: string) => void;
  onDeleteTrainingPair: (id: string) => void;
  onQueryInChat: (prompt: string) => void;
}

export const TrainingStudioView: React.FC<TrainingStudioProps> = ({
  settings,
  onUpdateSettings,
  trainingPairs,
  onAddTrainingPair,
  onToggleTrainingPair,
  onDeleteTrainingPair,
  onQueryInChat,
}) => {
  const [specs, setSpecs] = useState<DeviceHardwareSpecs | null>(null);
  const [isAddingPair, setIsAddingPair] = useState(false);
  const [patternInput, setPatternInput] = useState('');
  const [responseInput, setResponseInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('Personal Training');
  const [testQuery, setTestQuery] = useState('');
  const [testMatch, setTestMatch] = useState<string | null>(null);

  useEffect(() => {
    HardwareService.inspectDevice().then(setSpecs);
  }, []);

  const handleTierChange = (tier: ResourceTier) => {
    if (!specs) return;
    const threads = HardwareService.getThreadsForTier(tier, specs.cpuCores);
    onUpdateSettings({
      ...settings,
      resourceTier: tier,
      allocatedThreads: threads,
    });
  };

  const handleAddPair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patternInput.trim() || !responseInput.trim()) return;

    onAddTrainingPair({
      promptPattern: patternInput.trim(),
      trainedResponse: responseInput.trim(),
      category: categoryInput.trim() || 'General',
      enabled: true,
    });

    setPatternInput('');
    setResponseInput('');
    setIsAddingPair(false);
  };

  const handleTestPrompt = () => {
    if (!testQuery.trim()) return;
    const qLower = testQuery.toLowerCase().trim();
    const matched = trainingPairs.find((p) => {
      if (!p.enabled) return false;
      const pattern = p.promptPattern.toLowerCase().trim();
      return qLower.includes(pattern);
    });

    if (matched) {
      setTestMatch(`Matched Trained Protocol [${matched.category}]:\n${matched.trainedResponse}`);
    } else {
      setTestMatch('No specific trained pattern matched. Standard offline intelligence will process this prompt.');
    }
  };

  const recommendedTier = specs ? HardwareService.getRecommendedTier(specs) : 'balanced';

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-950/40">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
            <Cpu className="w-4 h-4" />
            <span>Hardware Scaling & Adaptive Intelligence</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">
            Model Selection & Training Studio
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl leading-relaxed">
            Scale MrMWSK&apos;s Ai from lightweight zero-battery execution to full device beast mode. Train custom behaviors, align personas, and select offline or online models.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Current Tier: </span>
            <span
              className={`font-bold uppercase ${
                settings.resourceTier === 'beast'
                  ? 'text-rose-400'
                  : settings.resourceTier === 'balanced'
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }`}
            >
              {settings.resourceTier === 'beast' ? '🔥 Beast Mode' : settings.resourceTier}
            </span>
          </div>
        </div>
      </div>

      {/* 1. Device Hardware Discovery Strip */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Gauge className="w-4 h-4 text-amber-400" />
            <span>Device Capabilities & Hardware Telemetry</span>
          </h2>
          <span className="text-[11px] text-slate-400">
            Recommended Tier: <strong className="text-amber-400 uppercase">{recommendedTier}</strong>
          </span>
        </div>

        {specs ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>CPU Cores</span>
              </div>
              <div className="text-sm font-bold text-white font-mono tabular-nums">
                {specs.cpuCores} Cores
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                {settings.allocatedThreads} active threads
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Device RAM</span>
              </div>
              <div className="text-sm font-bold text-white font-mono tabular-nums">
                {specs.deviceMemoryGB ? `${specs.deviceMemoryGB} GB` : 'System Managed'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                High-capacity cache
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                <span>Storage Quota</span>
              </div>
              <div className="text-sm font-bold text-white font-mono tabular-nums">
                {specs.storageQuotaMB > 0 ? `${Math.round(specs.storageQuotaMB / 1024)} GB` : 'IndexedDB'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                {specs.storageUsedMB} MB cached
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                {specs.isCharging ? (
                  <BatteryCharging className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Battery className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>Power State</span>
              </div>
              <div className="text-sm font-bold text-white font-mono tabular-nums">
                {specs.batteryLevel !== null ? `${specs.batteryLevel}%` : 'AC Power'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {specs.isCharging ? 'Plugged In' : 'On Battery'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 col-span-2 sm:col-span-1">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Monitor className="w-3.5 h-3.5 text-rose-400" />
                <span>GPU Acceleration</span>
              </div>
              <div className="text-xs font-bold text-white font-mono truncate" title={specs.gpuRenderer}>
                {specs.gpuRenderer.split('Direct3D')[0].split('ANGLE')[0].slice(0, 18) || 'Active WebGL'}
              </div>
              <div className="text-[10px] text-emerald-400 mt-0.5">
                Hardware shaders active
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500">Inspecting device hardware capabilities...</div>
        )}
      </div>

      {/* 2. Dynamic Hardware Resource Governor (Lite <-> Beast) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Resource Allocation Governor</span>
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Dynamically calibrate how much hardware and compute power MrMWSK&apos;s Ai consumes.
            </p>
          </div>

          <button
            onClick={() => handleTierChange(recommendedTier)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition self-start sm:self-auto"
          >
            Auto-Tune to Hardware ({recommendedTier.toUpperCase()})
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Tier 1: Lite */}
          <div
            onClick={() => handleTierChange('lite')}
            className={`p-5 rounded-xl border cursor-pointer transition-all ${
              settings.resourceTier === 'lite'
                ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/5'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Eco Lite Mode</span>
              </div>
              {settings.resourceTier === 'lite' && (
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Near-zero battery drain. Pure deterministic math, regex tools, JSON formatting, and exact trained patterns.
            </p>
            <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
              1 Thread · &lt; 2MB Memory
            </div>
          </div>

          {/* Tier 2: Balanced */}
          <div
            onClick={() => handleTierChange('balanced')}
            className={`p-5 rounded-xl border cursor-pointer transition-all ${
              settings.resourceTier === 'balanced'
                ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md shadow-emerald-500/5'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <Gauge className="w-4 h-4 text-emerald-400" />
                <span>Balanced Engine</span>
              </div>
              {settings.resourceTier === 'balanced' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Multi-threaded vector space indexing. Fast semantic document search, few-shot training interpolation, and extractive summarization.
            </p>
            <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-emerald-400">
              {Math.max(1, Math.floor((specs?.cpuCores || 4) / 2))} Threads · ~32MB Cache
            </div>
          </div>

          {/* Tier 3: Beast Mode */}
          <div
            onClick={() => handleTierChange('beast')}
            className={`p-5 rounded-xl border cursor-pointer transition-all ${
              settings.resourceTier === 'beast'
                ? 'bg-rose-500/10 border-rose-500/50 shadow-md shadow-rose-500/5'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <Flame className="w-4 h-4 text-rose-400" />
                <span>Device Beast Mode</span>
              </div>
              {settings.resourceTier === 'beast' && (
                <CheckCircle2 className="w-4 h-4 text-rose-400" />
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Unleashes maximum device potential. Saturates all CPU cores via parallel Web Workers and WebGL memory buffers for deep multi-pass reasoning.
            </p>
            <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-rose-400">
              {specs?.cpuCores || 8} Threads (100% Saturation) · Max Context
            </div>
          </div>
        </div>
      </div>

      {/* 3. Model Selection Studio */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Model Selection Freedom
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Offline Models */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-amber-400" />
                <span>Offline Engine Models (Air-Gapped)</span>
              </h3>
              <span className="text-[11px] text-emerald-400 font-mono">100% On-Device</span>
            </div>

            <div className="space-y-3">
              {AVAILABLE_OFFLINE_MODELS.map((model) => {
                const isSelected = settings.selectedOfflineModel === model.id;
                return (
                  <div
                    key={model.id}
                    onClick={() => onUpdateSettings({ ...settings, selectedOfflineModel: model.id })}
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/40'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{model.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">{model.overhead}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">{model.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-amber-400/90 font-medium">
                      {model.features.map((f, i) => (
                        <span key={i}>· {f}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Online Models */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                <span>Cloud & Local Endpoint Models</span>
              </h3>
              <span className="text-[11px] text-blue-400 font-mono">Connected</span>
            </div>

            <div className="space-y-3">
              {AVAILABLE_ONLINE_MODELS.map((model) => {
                const isSelected = settings.selectedOnlineModel === model.id;
                return (
                  <div
                    key={model.id}
                    onClick={() => onUpdateSettings({ ...settings, selectedOnlineModel: model.id })}
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-blue-500/10 border-blue-500/40'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{model.name}</span>
                      <span className="text-[10px] font-mono text-blue-400 capitalize">{model.provider}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">{model.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. User Training & Personal Persona Alignment ("Adopt all that user trained") */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>User Training & Persona Memory Bank</span>
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Train MrMWSK&apos;s Ai with custom protocols, answers, and guidelines. The assistant adopts all trained patterns both offline and online.
            </p>
          </div>

          <button
            onClick={() => setIsAddingPair(!isAddingPair)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Training Pattern</span>
          </button>
        </div>

        {/* Add Training Pair Form */}
        {isAddingPair && (
          <form onSubmit={handleAddPair} className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-3 animate-fadeIn">
            <h3 className="text-xs font-bold text-white">Teach Assistant a New Pattern</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Trigger / Prompt Pattern</label>
                <input
                  type="text"
                  required
                  value={patternInput}
                  onChange={(e) => setPatternInput(e.target.value)}
                  placeholder="e.g. production release checklist"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Category</label>
                <input
                  type="text"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  placeholder="e.g. Architecture, DevOps, Persona"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium text-xs mb-1">Trained Response / Directive</label>
              <textarea
                required
                rows={4}
                value={responseInput}
                onChange={(e) => setResponseInput(e.target.value)}
                placeholder="The exact protocol, answer, or code structure the AI should return..."
                className="w-full p-3 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingPair(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition"
              >
                Save Training Weight
              </button>
            </div>
          </form>
        )}

        {/* Training Patterns Table */}
        <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/60">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Pattern Trigger</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Trained Response</th>
                <th className="px-4 py-3">Matches</th>
                <th className="w-20 px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {trainingPairs.map((pair) => (
                <tr key={pair.id} className="hover:bg-slate-900/60">
                  <td className="px-4 py-3 font-sans font-medium text-white truncate max-w-[180px]">
                    &quot;{pair.promptPattern}&quot;
                  </td>
                  <td className="px-4 py-3 text-slate-400">{pair.category}</td>
                  <td className="px-4 py-3 text-slate-300 truncate max-w-xs font-sans">
                    {pair.trainedResponse}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-amber-400">
                    {pair.matchCount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onDeleteTrainingPair(pair.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition"
                      title="Delete training rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Live Training Test Sandbox */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
          <h3 className="text-xs font-bold text-white">Test Learned Directives</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              placeholder="Type a trigger or question to test learned response..."
              className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={handleTestPrompt}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition"
            >
              Verify
            </button>
          </div>

          {testMatch && (
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed">
              {testMatch}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
