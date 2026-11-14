import React from 'react';
import { Plus, Wifi, WifiOff, ShieldCheck, Cloud, Cpu, RefreshCw } from 'lucide-react';
import { NetworkMode } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface TopHeaderProps {
  currentTab: string;
  networkMode: NetworkMode;
  onNetworkModeChange: (mode: NetworkMode) => void;
  isOnline: boolean;
  simulatedOffline: boolean;
  onToggleSimulatedOffline: () => void;
  onNewSession: () => void;
  queuedCount: number;
  onFlushQueue: () => void;
  isFlushing: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentTab,
  networkMode,
  onNetworkModeChange,
  isOnline,
  simulatedOffline,
  onToggleSimulatedOffline,
  onNewSession,
  queuedCount,
  onFlushQueue,
  isFlushing,
}) => {
  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'chat':
        return 'Intelligence Console';
      case 'connectors':
        return 'Connector Hub';
      case 'knowledge':
        return 'Local Knowledge & Memory';
      case 'toolbox':
        return 'Offline Toolbox';
      case 'tasks':
        return 'Task Queue & Outbox';
      case 'training':
        return 'Models & Training Studio';
      case 'settings':
        return 'System Preferences';
      default:
        return 'Intelligence Console';
    }
  };

  return (
    <header className="h-16 px-6 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md flex items-center justify-between gap-8 shrink-0 select-none z-20">
      {/* Zone 1: Contextual Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400 whitespace-nowrap shrink-0">
        <span className="text-white font-bold tracking-tight text-sm">MrMWSK&apos;s Ai</span>
        <span className="text-slate-600">/</span>
        <span className="text-amber-400/90 font-medium">{getTabLabel(currentTab)}</span>
      </div>

      {/* Zone 2: Network Operating Mode Segmented Control */}
      <div className="hidden lg:flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium">
        <button
          onClick={() => onNetworkModeChange('offline')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
            networkMode === 'offline'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Strict 100% offline mode. Zero external network requests."
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Pure Offline</span>
        </button>

        <button
          onClick={() => onNetworkModeChange('hybrid')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
            networkMode === 'hybrid'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Local-first processing. Uses Gemini Cloud if online and deeper reasoning is needed."
        >
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span>Hybrid First</span>
        </button>

        <button
          onClick={() => onNetworkModeChange('cloud')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
            networkMode === 'cloud'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Prefers live Gemini 4 Cloud reasoning when network is active."
        >
          <Cloud className="w-3.5 h-3.5 text-blue-400" />
          <span>Cloud Enhanced</span>
        </button>
      </div>

      {/* Zone 3: Actions & Status */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Offline Simulation toggle */}
        <button
          onClick={onToggleSimulatedOffline}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition whitespace-nowrap ${
            simulatedOffline
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
              : isOnline
              ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
          title={
            simulatedOffline
              ? 'Simulating Airplane/Offline Mode (Click to disable simulation)'
              : 'Click to simulate airplane mode'
          }
        >
          {simulatedOffline ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Offline (Simulated)</span>
            </>
          ) : isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Offline</span>
            </>
          )}
        </button>

        {/* Sync Queue Outbox Button if items exist */}
        {queuedCount > 0 && (
          <button
            onClick={onFlushQueue}
            disabled={!isOnline || isFlushing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-50 transition whitespace-nowrap"
            title={`${queuedCount} actions queued in Outbox. Click to sync.`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isFlushing ? 'animate-spin' : ''}`} />
            <span className="font-mono tabular-nums">{queuedCount} queued</span>
          </button>
        )}

        {/* PWA Install Button */}
        <PWAInstallButton />

        {/* Primary CTA: New Conversation */}
        <button
          onClick={onNewSession}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-sm transition whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>New Session</span>
        </button>
      </div>
    </header>
  );
};
