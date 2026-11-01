import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  TaskService,
  AutomationEngine,
  type OpsTask,
  type AutomationRule,
  type TriggerEvent,
} from '../src/index.ts';

describe('Step 13: Workflow Board & Automation Engine', () => {
  beforeEach(() => {
    AutomationEngine.clearIdempotencyCache();
  });

  describe('TaskService & Workflow Kanban', () => {
    test('groups tasks correctly by status column and supports cross-entity links', () => {
      const tasks: OpsTask[] = [
        {
          id: 't-1',
          title: 'Review Fraud Hold',
          description: 'High risk order',
          status: 'todo',
          priority: 'urgent',
          assignedRole: 'fulfillment',
          linkedEntities: [{ type: 'order', id: 'ord-10892', label: 'ORD-10892' }],
          createdAtIso: '2026-11-01T10:00:00Z',
        },
        {
          id: 't-2',
          title: 'Receive PO Stock',
          description: 'Pacific Mills shipment arrived',
          status: 'in_progress',
          priority: 'high',
          assignedRole: 'inventory',
          linkedEntities: [{ type: 'supplier', id: 'sup-1', label: 'PAC-MILLS' }],
          createdAtIso: '2026-11-01T10:30:00Z',
        },
        {
          id: 't-3',
          title: 'Return Inspection',
          description: 'Damaged item',
          status: 'done',
          priority: 'medium',
          assignedRole: 'fulfillment',
          linkedEntities: [{ type: 'return', id: 'ret-1001', label: 'RMA-90812' }],
          createdAtIso: '2026-11-01T09:00:00Z',
        },
      ];

      const grouped = TaskService.groupTasksByStatus(tasks);
      assert.equal(grouped.todo.length, 1);
      assert.equal(grouped.in_progress.length, 1);
      assert.equal(grouped.blocked.length, 0);
      assert.equal(grouped.done.length, 1);

      // Verify cross-entity link
      assert.equal(grouped.todo[0].linkedEntities[0].type, 'order');
      assert.equal(grouped.todo[0].linkedEntities[0].id, 'ord-10892');
    });

    test('transitions task status to done and records completion timestamp', () => {
      const task: OpsTask = {
        id: 't-1',
        title: 'Cycle Count Aisle B',
        description: 'Monthly count',
        status: 'in_progress',
        priority: 'medium',
        assignedRole: 'inventory',
        linkedEntities: [],
        createdAtIso: '2026-11-01T10:00:00Z',
      };

      const updated = TaskService.updateTaskStatus(task, 'done');
      assert.equal(updated.status, 'done');
      assert.ok(updated.completedAtIso);
    });
  });

  describe('AutomationEngine, Recipes & Loop Prevention', () => {
    test('loads 15 prebuilt operational recipes with valid triggers and actions', () => {
      const recipes = AutomationEngine.getPrebuiltRecipes();
      assert.equal(recipes.length, 15);

      for (const recipe of recipes) {
        assert.ok(recipe.id);
        assert.ok(recipe.name);
        assert.ok(recipe.trigger);
        assert.ok(recipe.actions.length > 0);
      }
    });

    test('evaluates AND/OR conditional logic accurately', () => {
      const payload = {
        availableStock: 2,
        sku: 'HOODIE-BLK-XL',
        leadTimeDays: 14,
      };

      // AND match
      const andMatch = AutomationEngine.evaluateConditions(
        [
          { field: 'availableStock', operator: 'less_than', value: 5 },
          { field: 'leadTimeDays', operator: 'greater_than', value: 10 },
        ],
        'AND',
        payload
      );
      assert.equal(andMatch, true);

      // AND failure
      const andFail = AutomationEngine.evaluateConditions(
        [
          { field: 'availableStock', operator: 'less_than', value: 5 },
          { field: 'leadTimeDays', operator: 'less_than', value: 5 },
        ],
        'AND',
        payload
      );
      assert.equal(andFail, false);
    });

    test('Exit Check: Low-stock event creates exactly one reorder task even when events are replayed', () => {
      const lowStockRule: AutomationRule = {
        id: 'rule-low-stock-auto',
        name: 'Auto Create Reorder Task on Low Stock',
        description: 'Creates reorder task when stock falls below 10',
        trigger: 'inventory.low_stock',
        conditionLogic: 'AND',
        conditions: [{ field: 'availableStock', operator: 'less_than', value: 10 }],
        actions: [
          {
            type: 'create_task',
            payload: {
              title: 'Reorder Low Stock SKU: HOODIE-BLK-XL',
              priority: 'urgent',
              assignedRole: 'inventory',
            },
          },
        ],
        enabled: true,
      };

      const lowStockEvent: TriggerEvent = {
        id: 'evt-stock-9901',
        type: 'inventory.low_stock',
        entityId: 'SKU-HOODIE-BLK-XL',
        occurredAtIso: '2026-11-01T12:00:00Z',
        payload: {
          sku: 'HOODIE-BLK-XL',
          availableStock: 3,
        },
      };

      // Execution 1: First time processing event
      const log1 = AutomationEngine.executeRule(lowStockRule, lowStockEvent);
      assert.equal(log1.status, 'success');
      assert.equal(log1.executedActionsCount, 1);
      assert.ok(log1.createdTask);
      assert.equal(log1.createdTask?.title, 'Reorder Low Stock SKU: HOODIE-BLK-XL');

      // Executions 2 through 5: Repeated replays of the identical event
      for (let i = 2; i <= 5; i++) {
        const replayLog = AutomationEngine.executeRule(lowStockRule, lowStockEvent);
        assert.equal(
          replayLog.status,
          'skipped_duplicate',
          `Replay attempt #${i} must be skipped as duplicate!`
        );
        assert.equal(replayLog.executedActionsCount, 0);
        assert.equal(replayLog.createdTask, undefined);
      }
    });

    test('loop prevention halts cascading executions exceeding maximum recursion depth', () => {
      const recursiveRule: AutomationRule = {
        id: 'rule-recursive',
        name: 'Infinite Trigger Rule',
        description: 'Test rule',
        trigger: 'order.created',
        conditionLogic: 'AND',
        conditions: [],
        actions: [{ type: 'send_notification', payload: {} }],
        enabled: true,
      };

      const event: TriggerEvent = {
        id: 'evt-cascade-1',
        type: 'order.created',
        entityId: 'ord-recursive-loop',
        occurredAtIso: '2026-11-01T12:00:00Z',
        payload: {},
      };

      // Depth = 4 (Exceeds max depth of 3)
      const log = AutomationEngine.executeRule(recursiveRule, event, 4);
      assert.equal(log.status, 'error_loop_prevented');
      assert.match(log.message, /Loop Prevention Alert/);
    });
  });
});
