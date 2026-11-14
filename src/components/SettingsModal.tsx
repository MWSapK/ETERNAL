import React, { useState } from 'react';
import {
  Settings,
  Download,
  Upload,
  Trash2,
  Volume2,
  ShieldCheck,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { AssistantSettings } from '../types';
import { StorageService } from '../services/storageService';
import { useSpeech } from '../hooks/useSpeech';

interface SettingsModalProps {
  settings: AssistantSettings;
  onUpdateSettings: (newSettings: AssistantSettings) => void;
  onReloadAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onReloadAllData,
}) => {
  const [localSettings, setLocalSettings] = useState<AssistantSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const { voices, speakText } = useSpeech();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(localSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleExportBackup = () => {
    const jsonStr = StorageService.exportFullBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mrmwsk_ai_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = StorageService.importFullBackup(content);
      if (success) {
        alert('Backup successfully restored! Refreshing assistant data.');
        onReloadAllData();
      } else {
        alert('Invalid backup file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleWipeData = () => {
    localStorage.clear();
    alert('All local assistant data has been reset to defaults.');
    window.location.reload();
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-950/40">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
          <Settings className="w-4 h-4" />
          <span>System Sovereignty & Preferences</span>
        </div>
        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">
          MrMWSK&apos;s Ai Settings
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Configure local runtime behavior, voice parameters, data backup, and air-gapped privacy.
        </p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Settings Form */}
        <form onSubmit={handleSave} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <h2 className="text-sm font-bold text-white">General & Voice Configuration</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-300 mb-1">User Identifier</label>
              <input
                type="text"
                value={localSettings.userName}
                onChange={(e) => setLocalSettings({ ...localSettings, userName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Default Operating Mode</label>
              <select
                value={localSettings.networkMode}
                onChange={(e) => setLocalSettings({ ...localSettings, networkMode: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="offline">Pure Offline (Strict Air-Gap)</option>
                <option value="hybrid">Hybrid (Local Brain + Cloud Fallback)</option>
                <option value="cloud">Cloud Enhanced (Gemini 4 First)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Hardware Scaling Tier</label>
              <select
                value={localSettings.resourceTier}
                onChange={(e) => setLocalSettings({ ...localSettings, resourceTier: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="lite">Eco Lite (&lt; 2MB RAM · 1 Core)</option>
                <option value="balanced">Balanced Engine (~32MB Cache · Multi-core)</option>
                <option value="beast">Device Beast Mode (Max Cores · WebGL Acceleration)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Cloud / Hardware Model</label>
              <select
                value={localSettings.selectedOnlineModel}
                onChange={(e) => setLocalSettings({ ...localSettings, selectedOnlineModel: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="gemini-4-hydrogen">Google Gemini 4 Hydrogen (Default)</option>
                <option value="gemini-4-argon">Google Gemini 4 Argon (Heavy STEM)</option>
                <option value="gemini-3.1-flash-lite">Google Gemini 3.1 Flash Lite (Fast)</option>
                <option value="local-ollama">Local Hardware Endpoint (Ollama / LM Studio)</option>
              </select>
            </div>
          </div>

          {localSettings.selectedOnlineModel === 'local-ollama' && (
            <div className="pt-2 text-xs">
              <label className="block font-medium text-slate-300 mb-1">
                Local Device Model Endpoint (Ollama / LM Studio)
              </label>
              <input
                type="url"
                value={localSettings.customLocalEndpoint || 'http://localhost:11434/v1/chat/completions'}
                onChange={(e) => setLocalSettings({ ...localSettings, customLocalEndpoint: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500"
                placeholder="http://localhost:11434/v1/chat/completions"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Directs inference to your machine&apos;s discrete GPU via localhost HTTP API.
              </p>
            </div>
          )}

          {/* Voice Settings */}
          <div className="pt-4 border-t border-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-white">Text-to-Speech (TTS) Voice Engine</span>
                <p className="text-[11px] text-slate-400">Read responses aloud automatically or via the speaker button</p>
              </div>
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, ttsEnabled: !localSettings.ttsEnabled })}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  localSettings.ttsEnabled ? 'bg-amber-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    localSettings.ttsEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {voices.length > 0 && (
              <div>
                <label className="block font-medium text-slate-300 mb-1">Voice Selection</label>
                <select
                  value={localSettings.selectedVoice}
                  onChange={(e) => setLocalSettings({ ...localSettings, selectedVoice: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Default System Voice</option>
                  {voices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Speech Rate: <span className="font-mono text-amber-400">{localSettings.speechRate}x</span>
                </label>
                <input
                  type="range"
                  min="0.7"
                  max="1.5"
                  step="0.1"
                  value={localSettings.speechRate}
                  onChange={(e) => setLocalSettings({ ...localSettings, speechRate: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Speech Pitch: <span className="font-mono text-amber-400">{localSettings.speechPitch}</span>
                </label>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.1"
                  value={localSettings.speechPitch}
                  onChange={(e) => setLocalSettings({ ...localSettings, speechPitch: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => speakText("MrMWSK's Ai voice engine operational and tuned.")}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Test Voice Audio</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            {saveSuccess ? (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" /> Preferences saved
              </span>
            ) : <span />}

            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition"
            >
              Save System Preferences
            </button>
          </div>
        </form>

        {/* Backup & Restore Panel */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white">Full Data Backup & Restore</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Download your complete repository including all chat conversations, custom knowledge documents, and connector settings into a portable, air-gapped JSON archive.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={handleExportBackup}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 transition"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Export Full Backup (.json)</span>
            </button>

            <label className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 cursor-pointer transition">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Restore from Backup</span>
              <input
                type="file"
                onChange={handleImportBackup}
                accept=".json"
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Privacy & Air-Gap Certification */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-emerald-500/30 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Air-Gap Privacy Guarantee</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            In Pure Offline mode, 0 bytes leave your machine. All calculations, code generation templates, and document queries execute inside the local browser JavaScript engine. Connectors only transmit data to external services when you explicitly enable them.
          </p>
        </div>

        {/* Factory Reset Danger Zone */}
        <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-900/60 text-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-rose-400">
            <AlertTriangle className="w-4 h-4" />
            <span>Danger Zone</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Wiping local data will erase all stored sessions, tasks, and uploaded knowledge notes from this browser.
          </p>

          {confirmClear ? (
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleWipeData}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition"
              >
                Yes, Permanently Delete All Data
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-950 border border-rose-800 text-rose-300 hover:bg-rose-900 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Assistant to Factory Defaults</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
