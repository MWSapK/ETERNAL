import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Calendar,
  Trash2,
  Check,
  Download,
  AlertCircle,
} from 'lucide-react';
import { OfflineTask } from '../types';
import { ConnectorService } from '../services/connectorService';

interface TaskQueueProps {
  tasks: OfflineTask[];
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: (task: Omit<OfflineTask, 'id' | 'createdAt'>) => void;
}

export const TaskQueueView: React.FC<TaskQueueProps> = ({
  tasks,
  onToggleTask,
  onDeleteTask,
  onAddTask,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newCategory, setNewCategory] = useState('Executive');
  const [newDueDate, setNewDueDate] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddTask({
      title: newTitle.trim(),
      priority: newPriority,
      category: newCategory.trim() || 'General',
      dueDate: newDueDate || undefined,
      completed: false,
    });

    setNewTitle('');
    setNewDueDate('');
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const handleExportAllToICal = () => {
    const uncompleted = tasks.filter((t) => !t.completed);
    if (uncompleted.length === 0) return;

    const summary = `MrMWSK AI Tasks (${uncompleted.length} items)`;
    const description = uncompleted
      .map((t, idx) => `${idx + 1}. [${t.priority.toUpperCase()}] ${t.title}`)
      .join('\n');

    ConnectorService.downloadICalFile(summary, description);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-950/40">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
            <CheckSquare className="w-4 h-4" />
            <span>Autonomous Task Tracking</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">
            Task Queue & Calendar Schedules
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Tasks extracted by MrMWSK&apos;s Ai during conversations or added directly. Sync to your calendar offline via standard iCalendar (.ics).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportAllToICal}
            disabled={tasks.filter((t) => !t.completed).length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:text-white disabled:opacity-40 transition"
            title="Download standard .ics file for Google Calendar, Apple Calendar, or Outlook"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export to Calendar (.ics)</span>
          </button>
        </div>
      </div>

      {/* Quick Add Bar */}
      <form onSubmit={handleCreate} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          required
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add an actionable directive or task..."
          className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
        />

        <div className="flex items-center gap-2">
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as any)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>

          <input
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          />

          <button
            type="submit"
            className="flex items-center gap-1 px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </form>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-md transition ${
              filter === 'all' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-md transition ${
              filter === 'active' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Active ({tasks.filter((t) => !t.completed).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-md transition ${
              filter === 'completed' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Completed ({tasks.filter((t) => t.completed).length})
          </button>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/60 shadow-sm">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="w-12 px-4 py-3 text-center">Done</th>
              <th className="px-4 py-3">Task Description</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Due Date</th>
              <th className="w-24 px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredTasks.map((task) => (
              <tr
                key={task.id}
                className={`hover:bg-slate-800/40 transition ${
                  task.completed ? 'opacity-50 line-through' : ''
                }`}
              >
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className={`w-5 h-5 rounded flex items-center justify-center transition border ${
                      task.completed
                        ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                        : 'border-slate-700 bg-slate-950 hover:border-amber-500'
                    }`}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                </td>
                <td className="px-4 py-3 font-medium text-white">
                  <div>{task.title}</div>
                  {task.description && (
                    <div className="text-[11px] text-slate-400 no-underline line-clamp-1">
                      {task.description}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-[10px] font-bold uppercase ${
                      task.priority === 'high'
                        ? 'text-rose-400'
                        : task.priority === 'medium'
                        ? 'text-amber-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {task.priority}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-slate-400 tabular-nums">
                  {task.dueDate || 'No Date'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() =>
                        ConnectorService.downloadICalFile(task.title, task.description || '', task.dueDate)
                      }
                      className="p-1 text-slate-400 hover:text-amber-400 transition"
                      title="Export single event to .ics"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTasks.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-500">
            No tasks in this category. Tell the assistant &quot;todo: [task name]&quot; in chat to queue tasks automatically!
          </div>
        )}
      </div>
    </div>
  );
};
