'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Kanban,
  List,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  ArrowRight,
  ExternalLink,
  Layers,
  Filter,
  Search,
  Tag,
  Check,
  X,
  AlertOctagon,
} from 'lucide-react';
import { KPICard as KpiCard } from '@/components/ui/kpi-card';
import { StatusPill } from '@/components/ui/status-pill';
import { TaskService, type OpsTask, type TaskStatus, type TaskPriority } from '@storefront-ops/core';

export default function TasksPage() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || 'acme-commerce';

  const [tasks, setTasks] = useState<OpsTask[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Task Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('high');
  const [newRole, setNewRole] = useState<'fulfillment' | 'inventory' | 'support' | 'finance'>('inventory');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/tasks');
        const data = await res.json();
        if (data.tasks) {
          setTasks(data.tasks);
        }
      } catch {
        // Fallback
      }
    };
    fetchTasks();
  }, []);

  const handleMoveStatus = (taskId: string, nextStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? TaskService.updateTaskStatus(t, nextStatus) : t))
    );
    showToast(`Task moved to ${nextStatus.replace('_', ' ').toUpperCase()}`);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: OpsTask = {
      id: `task_${Date.now()}`,
      title: newTitle,
      description: newDesc,
      status: 'todo',
      priority: newPriority,
      assignedRole: newRole,
      assignedUser: 'Operations Staff',
      linkedEntities: [],
      createdAtIso: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);
    setCreateModalOpen(false);
    showToast(`Task "${newTitle}" created.`);
    setNewTitle('');
    setNewDesc('');
  };

  const grouped = TaskService.groupTasksByStatus(tasks);

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/20 uppercase font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            Urgent
          </span>
        );
      case 'high':
        return (
          <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20 uppercase font-mono">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/20 uppercase font-mono">
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-400 border border-zinc-700 uppercase font-mono">
            Low
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-zinc-900 border border-emerald-500/50 px-4 py-3 text-sm text-emerald-400 shadow-xl shadow-black/40">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Operations Workflow</span>
            <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-400 border border-indigo-500/20">
              Cross-Entity Linked Board
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-100">Workflow Task Board</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            Kanban operations queue linked directly to orders, products, suppliers, customers, and returns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-0.5 text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors ${
                viewMode === 'kanban' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors ${
                viewMode === 'list' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>List View</span>
            </button>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          {/* TO DO COLUMN */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">To Do</span>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-400">
                {grouped.todo.length}
              </span>
            </div>

            <div className="space-y-3">
              {grouped.todo.map((task) => (
                <div key={task.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-2.5 shadow-sm hover:border-zinc-700 transition-colors">
                  <div className="flex items-center justify-between">
                    {getPriorityBadge(task.priority)}
                    <span className="text-[10px] font-mono uppercase text-zinc-500">{task.assignedRole}</span>
                  </div>

                  <h4 className="text-sm font-bold text-zinc-100">{task.title}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">{task.description}</p>

                  {/* Cross-Entity Links */}
                  {task.linkedEntities.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-1.5">
                      {task.linkedEntities.map((ent, i) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-mono font-semibold">
                          <Tag className="h-2.5 w-2.5" />
                          {ent.label}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500">{task.assignedUser}</span>
                    <button
                      onClick={() => handleMoveStatus(task.id, 'in_progress')}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                    >
                      Start &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* IN PROGRESS COLUMN */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">In Progress</span>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-400">
                {grouped.in_progress.length}
              </span>
            </div>

            <div className="space-y-3">
              {grouped.in_progress.map((task) => (
                <div key={task.id} className="rounded-xl border border-indigo-500/30 bg-zinc-900 p-4 space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    {getPriorityBadge(task.priority)}
                    <span className="text-[10px] font-mono uppercase text-zinc-500">{task.assignedRole}</span>
                  </div>

                  <h4 className="text-sm font-bold text-zinc-100">{task.title}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">{task.description}</p>

                  {task.linkedEntities.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-1.5">
                      {task.linkedEntities.map((ent, i) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-mono font-semibold">
                          <Tag className="h-2.5 w-2.5" />
                          {ent.label}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                    <button
                      onClick={() => handleMoveStatus(task.id, 'blocked')}
                      className="text-xs font-semibold text-amber-400 hover:text-amber-300"
                    >
                      Block
                    </button>
                    <button
                      onClick={() => handleMoveStatus(task.id, 'done')}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" />
                      Complete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BLOCKED COLUMN */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Blocked</span>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-400">
                {grouped.blocked.length}
              </span>
            </div>

            <div className="space-y-3">
              {grouped.blocked.map((task) => (
                <div key={task.id} className="rounded-xl border border-rose-500/30 bg-zinc-900 p-4 space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    {getPriorityBadge(task.priority)}
                    <span className="text-[10px] font-mono uppercase text-zinc-500">{task.assignedRole}</span>
                  </div>

                  <h4 className="text-sm font-bold text-zinc-100">{task.title}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">{task.description}</p>

                  {task.linkedEntities.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-1.5">
                      {task.linkedEntities.map((ent, i) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-mono font-semibold">
                          <Tag className="h-2.5 w-2.5" />
                          {ent.label}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                    <button
                      onClick={() => handleMoveStatus(task.id, 'in_progress')}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                    >
                      Unblock &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DONE COLUMN */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Completed</span>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-400">
                {grouped.done.length}
              </span>
            </div>

            <div className="space-y-3">
              {grouped.done.map((task) => (
                <div key={task.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-2.5 opacity-75">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20 uppercase font-mono">
                      Done
                    </span>
                    <span className="text-[10px] font-mono uppercase text-zinc-500">{task.assignedRole}</span>
                  </div>

                  <h4 className="text-sm font-bold text-zinc-300 line-through">{task.title}</h4>
                  <p className="text-xs text-zinc-500">{task.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Task</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Cross-Entity Links</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 font-medium">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-zinc-800/30">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-zinc-100">{task.title}</p>
                    <p className="text-xs text-zinc-400">{task.description}</p>
                  </td>
                  <td className="py-3.5 px-4 capitalize text-xs text-zinc-300">{task.status.replace('_', ' ')}</td>
                  <td className="py-3.5 px-4">{getPriorityBadge(task.priority)}</td>
                  <td className="py-3.5 px-4 font-mono text-xs uppercase text-zinc-400">{task.assignedRole}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {task.linkedEntities.map((ent, i) => (
                        <span key={i} className="rounded bg-indigo-500/10 text-indigo-300 text-[10px] font-mono px-1.5 py-0.5">
                          {ent.label}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {task.status !== 'done' && (
                      <button
                        onClick={() => handleMoveStatus(task.id, 'done')}
                        className="rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2 py-1 text-xs"
                      >
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Task Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-zinc-100">Create Workflow Task</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Task Title:</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Inspect Batch #489 for stitching defect"
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Description:</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Operational details and context..."
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Priority:</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-2.5 text-zinc-200"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Assigned Department:</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-2.5 text-zinc-200"
                  >
                    <option value="inventory">Inventory</option>
                    <option value="fulfillment">Fulfillment</option>
                    <option value="support">Support</option>
                    <option value="finance">Finance</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-zinc-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-5 py-2 font-bold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-950/40"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
