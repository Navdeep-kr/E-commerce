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
          <span className="flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[10px] font-bold text-red-600 border border-red-300 uppercase font-mono shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
            Urgent
          </span>
        );
      case 'high':
        return (
          <span className="rounded bg-white px-2 py-0.5 text-[10px] font-bold text-orange-600 border border-orange-300 uppercase font-mono shadow-sm">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="rounded bg-white px-2 py-0.5 text-[10px] font-bold text-black border border-zinc-300 uppercase font-mono shadow-sm">
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="rounded bg-white px-2 py-0.5 text-[10px] font-bold text-zinc-500 border border-zinc-200 uppercase font-mono shadow-sm">
            Low
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 bg-white min-h-screen text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-white border-2 border-green-500 px-4 py-3 text-sm text-green-700 shadow-xl">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
          <span className="font-semibold text-black">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">Operations Workflow</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-black border border-zinc-200">
              Cross-Entity Linked Board
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-black">Workflow Task Board</h1>
          <p className="mt-0.5 text-sm text-zinc-600">
            Kanban operations queue linked directly to orders, products, suppliers, customers, and returns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-zinc-200 bg-white p-0.5 text-xs shadow-sm">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-bold transition-colors ${
                viewMode === 'kanban' ? 'bg-black text-white' : 'text-zinc-600 hover:text-black'
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-bold transition-colors ${
                viewMode === 'list' ? 'bg-black text-white' : 'text-zinc-600 hover:text-black'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>List View</span>
            </button>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow-sm"
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
          <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
              <span className="text-xs font-bold uppercase tracking-wider text-black">To Do</span>
              <span className="rounded-full bg-white border border-zinc-200 px-2 py-0.5 text-xs font-mono font-bold text-black shadow-xs">
                {grouped.todo.length}
              </span>
            </div>

            <div className="space-y-3">
              {grouped.todo.map((task) => (
                <div key={task.id} className="rounded-xl border border-zinc-200 bg-white p-4 space-y-2.5 shadow-sm hover:border-black transition-colors">
                  <div className="flex items-center justify-between">
                    {getPriorityBadge(task.priority)}
                    <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold">{task.assignedRole}</span>
                  </div>

                  <h4 className="text-sm font-bold text-black">{task.title}</h4>
                  <p className="text-xs text-zinc-600 leading-relaxed">{task.description}</p>

                  {/* Cross-Entity Links */}
                  {task.linkedEntities.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-1.5">
                      {task.linkedEntities.map((ent, i) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded bg-white text-black border border-zinc-300 px-2 py-0.5 text-[10px] font-mono font-semibold">
                          <Tag className="h-2.5 w-2.5 text-zinc-500" />
                          {ent.label}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500 font-medium">{task.assignedUser}</span>
                    <button
                      onClick={() => handleMoveStatus(task.id, 'in_progress')}
                      className="text-xs font-bold text-black hover:underline"
                    >
                      Start &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* IN PROGRESS COLUMN */}
          <div className="rounded-xl border border-orange-200 bg-white p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-orange-200">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600">In Progress</span>
              <span className="rounded-full bg-white border border-orange-200 px-2 py-0.5 text-xs font-mono font-bold text-orange-600 shadow-xs">
                {grouped.in_progress.length}
              </span>
            </div>

            <div className="space-y-3">
              {grouped.in_progress.map((task) => (
                <div key={task.id} className="rounded-xl border border-orange-300 bg-white p-4 space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    {getPriorityBadge(task.priority)}
                    <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold">{task.assignedRole}</span>
                  </div>

                  <h4 className="text-sm font-bold text-black">{task.title}</h4>
                  <p className="text-xs text-zinc-600 leading-relaxed">{task.description}</p>

                  {task.linkedEntities.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-1.5">
                      {task.linkedEntities.map((ent, i) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded bg-white text-black border border-zinc-300 px-2 py-0.5 text-[10px] font-mono font-semibold">
                          <Tag className="h-2.5 w-2.5 text-zinc-500" />
                          {ent.label}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                    <button
                      onClick={() => handleMoveStatus(task.id, 'blocked')}
                      className="text-xs font-bold text-orange-600 hover:underline"
                    >
                      Block
                    </button>
                    <button
                      onClick={() => handleMoveStatus(task.id, 'done')}
                      className="text-xs font-bold text-green-600 hover:underline flex items-center gap-1"
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
          <div className="rounded-xl border border-red-200 bg-white p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-red-200">
              <span className="text-xs font-bold uppercase tracking-wider text-red-600">Blocked</span>
              <span className="rounded-full bg-white border border-red-200 px-2 py-0.5 text-xs font-mono font-bold text-red-600 shadow-xs">
                {grouped.blocked.length}
              </span>
            </div>

            <div className="space-y-3">
              {grouped.blocked.map((task) => (
                <div key={task.id} className="rounded-xl border border-red-300 bg-white p-4 space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    {getPriorityBadge(task.priority)}
                    <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold">{task.assignedRole}</span>
                  </div>

                  <h4 className="text-sm font-bold text-black">{task.title}</h4>
                  <p className="text-xs text-zinc-600 leading-relaxed">{task.description}</p>

                  {task.linkedEntities.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-1.5">
                      {task.linkedEntities.map((ent, i) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded bg-white text-black border border-zinc-300 px-2 py-0.5 text-[10px] font-mono font-semibold">
                          <Tag className="h-2.5 w-2.5 text-zinc-500" />
                          {ent.label}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                    <button
                      onClick={() => handleMoveStatus(task.id, 'in_progress')}
                      className="text-xs font-bold text-black hover:underline"
                    >
                      Unblock &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DONE COLUMN */}
          <div className="rounded-xl border border-green-200 bg-white p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-green-200">
              <span className="text-xs font-bold uppercase tracking-wider text-green-600">Completed</span>
              <span className="rounded-full bg-white border border-green-200 px-2 py-0.5 text-xs font-mono font-bold text-green-600 shadow-xs">
                {grouped.done.length}
              </span>
            </div>

            <div className="space-y-3">
              {grouped.done.map((task) => (
                <div key={task.id} className="rounded-xl border border-zinc-200 bg-white p-4 space-y-2.5 shadow-sm opacity-80">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-white px-2 py-0.5 text-[10px] font-bold text-green-600 border border-green-300 uppercase font-mono shadow-xs">
                      Done
                    </span>
                    <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold">{task.assignedRole}</span>
                  </div>

                  <h4 className="text-sm font-bold text-zinc-500 line-through">{task.title}</h4>
                  <p className="text-xs text-zinc-500">{task.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-white text-xs font-bold text-black uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Task</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Cross-Entity Links</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 font-medium">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-black">{task.title}</p>
                    <p className="text-xs text-zinc-600">{task.description}</p>
                  </td>
                  <td className="py-3.5 px-4 capitalize text-xs font-semibold text-black">{task.status.replace('_', ' ')}</td>
                  <td className="py-3.5 px-4">{getPriorityBadge(task.priority)}</td>
                  <td className="py-3.5 px-4 font-mono text-xs uppercase text-zinc-600 font-semibold">{task.assignedRole}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {task.linkedEntities.map((ent, i) => (
                        <span key={i} className="rounded bg-white border border-zinc-300 text-black text-[10px] font-mono font-semibold px-1.5 py-0.5">
                          {ent.label}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {task.status !== 'done' && (
                      <button
                        onClick={() => handleMoveStatus(task.id, 'done')}
                        className="rounded bg-black hover:bg-zinc-800 text-white px-2.5 py-1 text-xs font-bold shadow-xs transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-5 text-black">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="text-lg font-bold text-black">Create Workflow Task</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-black transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-black mb-1">Task Title:</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Inspect Batch #489 for stitching defect"
                  className="w-full rounded-lg bg-white border border-zinc-300 p-2.5 text-black placeholder:text-zinc-400 focus:outline-none focus:border-black shadow-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-black mb-1">Description:</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Operational details and context..."
                  className="w-full rounded-lg bg-white border border-zinc-300 p-2.5 text-black placeholder:text-zinc-400 focus:outline-none focus:border-black shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-black mb-1">Priority:</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full rounded-lg bg-white border border-zinc-300 p-2.5 text-black focus:outline-none focus:border-black shadow-xs"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-black mb-1">Assigned Department:</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full rounded-lg bg-white border border-zinc-300 p-2.5 text-black focus:outline-none focus:border-black shadow-xs"
                  >
                    <option value="inventory">Inventory</option>
                    <option value="fulfillment">Fulfillment</option>
                    <option value="support">Support</option>
                    <option value="finance">Finance</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-zinc-600 hover:text-black font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-black px-5 py-2 font-bold text-white hover:bg-zinc-800 shadow-sm transition-colors"
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
