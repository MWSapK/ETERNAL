import React, { useState } from 'react';
import {
  MessageSquare,
  Network,
  Database,
  Wrench,
  CheckSquare,
  Settings,
  Trash2,
  HardDrive,
  Cpu,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { ChatSession } from '../types';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  connectedAppsCount: number;
  taskCount: number;
  knowledgeCount: number;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  connectedAppsCount,
  taskCount,
  knowledgeCount,
  isMobileOpen,
  onCloseMobile,
}) => {
  const [avatarError, setAvatarError] = useState(false);

  const navItems = [
    {
      id: 'chat',
      label: 'Intelligence Console',
      icon: MessageSquare,
      badge: null,
    },
    {
      id: 'connectors',
      label: 'Connector Hub',
      icon: Network,
      badge: connectedAppsCount > 0 ? `${connectedAppsCount} active` : null,
      badgeColor: 'text-amber-400',
    },
    {
      id: 'knowledge',
      label: 'Local Knowledge',
      icon: Database,
      badge: knowledgeCount > 0 ? `${knowledgeCount}` : null,
      badgeColor: 'text-emerald-400',
    },
    {
      id: 'toolbox',
      label: 'Offline Toolbox',
      icon: Wrench,
      badge: '5 tools',
      badgeColor: 'text-slate-400',
    },
    {
      id: 'training',
      label: 'Models & Training',
      icon: Cpu,
      badge: 'Adaptive',
      badgeColor: 'text-amber-400',
    },
    {
      id: 'tasks',
      label: 'Tasks & Outbox',
      icon: CheckSquare,
      badge: taskCount > 0 ? `${taskCount}` : null,
      badgeColor: 'text-indigo-400',
    },
    {
      id: 'settings',
      label: 'Settings & Backup',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 flex flex-col bg-slate-950 border-r border-slate-800/80 transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Lockup */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-amber-500/30 bg-slate-900 shrink-0 shadow-md shadow-amber-500/5">
              {!avatarError ? (
                <img
                  src="/src/assets/images/mrmwsk_ai_avatar_1794609450162.jpg"
                  alt="MrMWSK's Ai Emblem"
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 font-extrabold text-sm">
                  Ai
                </div>
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-base font-extrabold tracking-tight text-white truncate">
                MrMWSK&apos;s Ai
              </span>
              <span className="text-[11px] font-medium text-amber-400/80 tracking-wide">
                Offline Executive Brain
              </span>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Navigation */}
        <div className="p-3">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-mono tabular-nums ${item.badgeColor || 'text-slate-400'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Recent Conversations List */}
        <div className="flex-1 flex flex-col min-h-0 px-3 py-2 border-t border-slate-900">
          <div className="px-2 py-1.5 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Conversations</span>
            <span className="font-mono tabular-nums">{sessions.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId && currentTab === 'chat';
              return (
                <div
                  key={session.id}
                  className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white border border-slate-800'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                  onClick={() => {
                    onSelectSession(session.id);
                    onTabChange('chat');
                    onCloseMobile();
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{session.title}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Storage & Air-Gap Telemetry */}
        <div className="p-3 border-t border-slate-900 bg-slate-950/90 text-xs">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
            <div className="flex items-center gap-2 min-w-0">
              <HardDrive className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-semibold text-slate-300">Device Storage</span>
                <span className="text-[10px] text-slate-400">100% Private & Local</span>
              </div>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 tabular-nums">Zero-Leak</span>
          </div>
        </div>
      </aside>
    </>
  );
};
