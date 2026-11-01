/**
 * Storefront Ops Core: Operations Task Board Service
 * Playbook Step 13 (Spec Part 3.13): Cross-entity linked task board (Kanban & List)
 */

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface LinkedEntity {
  type: 'order' | 'product' | 'customer' | 'supplier' | 'return';
  id: string;
  label: string;
  href?: string;
}

export interface OpsTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedRole: 'fulfillment' | 'inventory' | 'support' | 'finance' | 'admin';
  assignedUser?: string;
  dueDateIso?: string;
  linkedEntities: LinkedEntity[];
  createdAtIso: string;
  completedAtIso?: string;
}

export class TaskService {
  /**
   * Filter and group tasks by Kanban column
   */
  static groupTasksByStatus(tasks: OpsTask[]): Record<TaskStatus, OpsTask[]> {
    const grouped: Record<TaskStatus, OpsTask[]> = {
      todo: [],
      in_progress: [],
      blocked: [],
      done: [],
    };

    for (const task of tasks) {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      } else {
        grouped.todo.push(task);
      }
    }

    return grouped;
  }

  /**
   * Transition task status and timestamp completion
   */
  static updateTaskStatus(
    task: OpsTask,
    nextStatus: TaskStatus
  ): OpsTask {
    return {
      ...task,
      status: nextStatus,
      completedAtIso: nextStatus === 'done' ? new Date().toISOString() : undefined,
    };
  }
}
