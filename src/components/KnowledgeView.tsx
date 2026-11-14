import React, { useState } from 'react';
import {
  Database,
  Plus,
  Search,
  FileText,
  Trash2,
  UploadCloud,
  Tag,
  Copy,
  Check,
  HardDrive,
  Calendar,
} from 'lucide-react';
import { KnowledgeNote } from '../types';

interface KnowledgeViewProps {
  notes: KnowledgeNote[];
  onAddNote: (note: Omit<KnowledgeNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteNote: (id: string) => void;
  onQueryNoteInChat: (prompt: string) => void;
}

export const KnowledgeView: React.FC<KnowledgeViewProps> = ({
  notes,
  onAddNote,
  onDeleteNote,
  onQueryNoteInChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<KnowledgeNote | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const tags = newTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onAddNote({
      title: newTitle.trim(),
      content: newContent.trim(),
      tags: tags.length > 0 ? tags : ['General'],
    });

    setNewTitle('');
    setNewContent('');
    setNewTags('');
    setIsAdding(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      onAddNote({
        title: file.name,
        content: content.slice(0, 100000),
        fileName: file.name,
        fileType: file.type || 'text/plain',
        fileSize: file.size,
        tags: ['Document', file.name.split('.').pop()?.toUpperCase() || 'FILE'],
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredNotes = notes.filter((n) => {
    const query = searchQuery.toLowerCase();
    return (
      n.title.toLowerCase().includes(query) ||
      n.content.toLowerCase().includes(query) ||
      n.tags.some((t) => t.toLowerCase().includes(query))
    );
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-950/40">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
            <Database className="w-4 h-4" />
            <span>Air-Gapped Document Repository</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">
            Local Knowledge & Memory Base
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Store documents, notes, technical reference sheets, and codebase snippets. MrMWSK&apos;s Ai queries this repository instantly while offline.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:border-slate-700 cursor-pointer transition">
            <UploadCloud className="w-4 h-4 text-emerald-400" />
            <span>Import Document</span>
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".txt,.md,.json,.csv,.js,.ts,.py,.html"
              className="hidden"
            />
          </label>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* New Note Form */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="p-5 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-xl space-y-4 animate-fadeIn"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Add Knowledge Entry to Local Brain</h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Production Cluster Credentials or Project Goals"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Content / Document Text</label>
              <textarea
                required
                rows={5}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Paste reference text, guidelines, or code snippet..."
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 text-xs focus:outline-none focus:border-amber-500 font-mono leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tags (Comma-separated)</label>
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="e.g. Architecture, DevOps, Security"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition"
            >
              Save to Local Memory
            </button>
          </div>
        </form>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search local memory notes by keyword, tag, or title..."
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition"
        />
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.map((note) => {
          const isCopied = copiedId === note.id;

          return (
            <div
              key={note.id}
              className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between shadow-sm group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                    <h3 className="text-sm font-bold text-white truncate">{note.title}</h3>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => handleCopy(note.content, note.id)}
                      className="p-1 text-slate-400 hover:text-slate-200 transition"
                      title="Copy note text"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => onDeleteNote(note.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-4 leading-relaxed font-mono whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                {/* Zero-Pill tags */}
                <div className="flex items-center gap-1.5 truncate">
                  <Tag className="w-3 h-3 text-slate-600 shrink-0" />
                  <span className="truncate">{note.tags.join(' · ')}</span>
                </div>

                <button
                  onClick={() => onQueryNoteInChat(`Please analyze and summarize my note "${note.title}":\n\n${note.content}`)}
                  className="text-amber-400 hover:text-amber-300 font-semibold whitespace-nowrap ml-2"
                >
                  Query with Ai →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredNotes.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400">
          No memory notes match your query. Click &quot;New Note&quot; or &quot;Import Document&quot; to expand MrMWSK&apos;s Ai knowledge.
        </div>
      )}
    </div>
  );
};
