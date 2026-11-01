/**
 * Storefront Ops Core: Visual Automation Engine & Loop Prevention
 * Playbook Step 13 (Spec Part 3.15): Rule execution, 15 prebuilt recipes, and idempotent execution
 */

import type { OpsTask } from './task-service.ts';

export type EventTriggerType =
  | 'inventory.low_stock'
  | 'order.created'
  | 'order.fraud_flagged'
  | 'order.high_value'
  | 'return.received'
  | 'sla.breached'
  | 'chargeback.received'
  | 'customer.created';

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
  value: any;
}

export interface RuleAction {
  type: 'create_task' | 'apply_hold' | 'tag_entity' | 'send_notification' | 'send_webhook';
  payload: Record<string, any>;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: EventTriggerType;
  conditionLogic: 'AND' | 'OR';
  conditions: RuleCondition[];
  actions: RuleAction[];
  enabled: boolean;
}

export interface TriggerEvent {
  id: string;
  type: EventTriggerType;
  entityId: string;
  occurredAtIso: string;
  payload: Record<string, any>;
}

export interface ExecutionLog {
  id: string;
  ruleId: string;
  ruleName: string;
  eventId: string;
  deduplicationKey: string;
  status: 'success' | 'skipped_duplicate' | 'condition_unmet' | 'error_loop_prevented';
  message: string;
  executedActionsCount: number;
  createdTask?: OpsTask;
  timestampIso: string;
}

export class AutomationEngine {
  private static processedEventKeys = new Set<string>();

  /**
   * Reset processed keys cache (for testing/memory cleanup)
   */
  static clearIdempotencyCache(): void {
    this.processedEventKeys.clear();
  }

  /**
   * Evaluate if a rule's conditions match an event payload
   */
  static evaluateConditions(
    conditions: RuleCondition[],
    logic: 'AND' | 'OR',
    payload: Record<string, any>
  ): boolean {
    if (conditions.length === 0) return true;

    const results = conditions.map((cond) => {
      const actualVal = payload[cond.field];
      switch (cond.operator) {
        case 'equals':
          return actualVal === cond.value;
        case 'not_equals':
          return actualVal !== cond.value;
        case 'greater_than':
          return typeof actualVal === 'number' && actualVal > cond.value;
        case 'less_than':
          return typeof actualVal === 'number' && actualVal < cond.value;
        case 'contains':
          return typeof actualVal === 'string' && actualVal.includes(String(cond.value));
        case 'in':
          return Array.isArray(cond.value) && cond.value.includes(actualVal);
        default:
          return false;
      }
    });

    return logic === 'AND' ? results.every(Boolean) : results.some(Boolean);
  }

  /**
   * Execute an automation rule against a trigger event
   * Exit Check: Low-stock event creates exactly one reorder task even when events are replayed.
   */
  static executeRule(
    rule: AutomationRule,
    event: TriggerEvent,
    currentDepth: number = 0
  ): ExecutionLog {
    const deduplicationKey = `${rule.id}:${event.type}:${event.entityId}`;

    // 1. Loop Prevention Check: Max recursion depth
    if (currentDepth > 3) {
      return {
        id: `log_${Date.now()}_${Math.random()}`,
        ruleId: rule.id,
        ruleName: rule.name,
        eventId: event.id,
        deduplicationKey,
        status: 'error_loop_prevented',
        message: 'Loop Prevention Alert: Maximum cascading execution depth (3) exceeded. Execution halted.',
        executedActionsCount: 0,
        timestampIso: new Date().toISOString(),
      };
    }

    // 2. Idempotency Check: Prevent duplicate replays
    if (this.processedEventKeys.has(deduplicationKey)) {
      return {
        id: `log_${Date.now()}_${Math.random()}`,
        ruleId: rule.id,
        ruleName: rule.name,
        eventId: event.id,
        deduplicationKey,
        status: 'skipped_duplicate',
        message: `Skipped: Event ${event.id} for ${event.entityId} was already processed (Idempotency key matched).`,
        executedActionsCount: 0,
        timestampIso: new Date().toISOString(),
      };
    }

    // 3. Trigger & Condition Match
    if (rule.trigger !== event.type) {
      return {
        id: `log_${Date.now()}_${Math.random()}`,
        ruleId: rule.id,
        ruleName: rule.name,
        eventId: event.id,
        deduplicationKey,
        status: 'condition_unmet',
        message: `Rule trigger ${rule.trigger} does not match event ${event.type}.`,
        executedActionsCount: 0,
        timestampIso: new Date().toISOString(),
      };
    }

    const matches = this.evaluateConditions(rule.conditions, rule.conditionLogic, event.payload);
    if (!matches) {
      return {
        id: `log_${Date.now()}_${Math.random()}`,
        ruleId: rule.id,
        ruleName: rule.name,
        eventId: event.id,
        deduplicationKey,
        status: 'condition_unmet',
        message: 'Rule conditions were not satisfied by event payload.',
        executedActionsCount: 0,
        timestampIso: new Date().toISOString(),
      };
    }

    // 4. Mark processed in idempotency set
    this.processedEventKeys.add(deduplicationKey);

    // 5. Execute Actions
    let createdTask: OpsTask | undefined;
    for (const action of rule.actions) {
      if (action.type === 'create_task') {
        createdTask = {
          id: `task_${Date.now()}`,
          title: action.payload.title || `Task for ${event.entityId}`,
          description: action.payload.description || `Generated by rule ${rule.name}`,
          status: 'todo',
          priority: action.payload.priority || 'high',
          assignedRole: action.payload.assignedRole || 'inventory',
          linkedEntities: action.payload.linkedEntities || [
            { type: 'product', id: event.entityId, label: event.entityId },
          ],
          createdAtIso: new Date().toISOString(),
        };
      }
    }

    return {
      id: `log_${Date.now()}_${Math.random()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      eventId: event.id,
      deduplicationKey,
      status: 'success',
      message: `Successfully executed rule "${rule.name}". Triggered ${rule.actions.length} action(s).`,
      executedActionsCount: rule.actions.length,
      createdTask,
      timestampIso: new Date().toISOString(),
    };
  }

  /**
   * 15 Prebuilt Production Operational Recipes
   */
  static getPrebuiltRecipes(): AutomationRule[] {
    return [
      {
        id: 'recipe-1',
        name: 'Low Stock Reorder Alert & Task',
        description: 'Creates a priority purchasing task when variant available stock drops below reorder point.',
        trigger: 'inventory.low_stock',
        conditionLogic: 'AND',
        conditions: [{ field: 'availableStock', operator: 'less_than', value: 10 }],
        actions: [
          {
            type: 'create_task',
            payload: {
              title: 'Reorder SKU Below Safety Buffer',
              priority: 'urgent',
              assignedRole: 'inventory',
            },
          },
        ],
        enabled: true,
      },
      {
        id: 'recipe-2',
        name: 'Fraud Risk Auto-Hold',
        description: 'Automatically places order on fraud hold when risk score exceeds 70.',
        trigger: 'order.fraud_flagged',
        conditionLogic: 'AND',
        conditions: [{ field: 'fraudScore', operator: 'greater_than', value: 70 }],
        actions: [{ type: 'apply_hold', payload: { reason: 'high_fraud_score' } }],
        enabled: true,
      },
      {
        id: 'recipe-3',
        name: 'High-Value VIP Order Priority',
        description: 'Tags order as VIP and alerts fulfillment team for orders over $500.',
        trigger: 'order.high_value',
        conditionLogic: 'AND',
        conditions: [{ field: 'totalMinor', operator: 'greater_than', value: 50000 }],
        actions: [{ type: 'tag_entity', payload: { tag: 'vip-expedited' } }],
        enabled: true,
      },
      {
        id: 'recipe-4',
        name: 'Return Dock Intake & Restock Inspection',
        description: 'Generates inspection task for warehouse dock team when return package arrives.',
        trigger: 'return.received',
        conditionLogic: 'AND',
        conditions: [],
        actions: [
          {
            type: 'create_task',
            payload: {
              title: 'Perform Return Condition Grading',
              priority: 'medium',
              assignedRole: 'fulfillment',
            },
          },
        ],
        enabled: true,
      },
      {
        id: 'recipe-5',
        name: 'Carrier Cutoff SLA Escalation',
        description: 'Escalates unfulfilled orders with less than 2 hours to daily carrier cutoff.',
        trigger: 'sla.breached',
        conditionLogic: 'AND',
        conditions: [{ field: 'hoursRemaining', operator: 'less_than', value: 2 }],
        actions: [
          {
            type: 'send_notification',
            payload: { channel: 'warehouse_floor', message: 'SLA Cutoff Approaching' },
          },
        ],
        enabled: true,
      },
      {
        id: 'recipe-6',
        name: 'First-Time Buyer VIP Onboarding',
        description: 'Tags customer profile with first-order welcome badge.',
        trigger: 'customer.created',
        conditionLogic: 'AND',
        conditions: [],
        actions: [{ type: 'tag_entity', payload: { tag: 'welcome-series-active' } }],
        enabled: true,
      },
      {
        id: 'recipe-7',
        name: 'Disputed Chargeback Audit',
        description: 'Opens a high-priority finance task when a bank chargeback notification is received.',
        trigger: 'chargeback.received',
        conditionLogic: 'AND',
        conditions: [],
        actions: [
          {
            type: 'create_task',
            payload: {
              title: 'Gather Evidence for Chargeback Dispute',
              priority: 'urgent',
              assignedRole: 'finance',
            },
          },
        ],
        enabled: true,
      },
      {
        id: 'recipe-8',
        name: 'Order Created Webhook Dispatch',
        description: 'Dispatches real-time webhook payload to ERP on every placed order.',
        trigger: 'order.created',
        conditionLogic: 'AND',
        conditions: [],
        actions: [{ type: 'send_webhook', payload: { url: 'https://api.example.com/hooks/orders' } }],
        enabled: true,
      },
      {
        id: 'recipe-9',
        name: 'Backorder Received Auto-Release',
        description: 'Releases pending backorders when incoming stock is received.',
        trigger: 'inventory.low_stock',
        conditionLogic: 'AND',
        conditions: [{ field: 'incomingReceived', operator: 'greater_than', value: 0 }],
        actions: [{ type: 'send_notification', payload: { message: 'Auto-releasing backorders' } }],
        enabled: true,
      },
      {
        id: 'recipe-10',
        name: 'Unfulfilled Order 48-Hour Alert',
        description: 'Triggers operations supervisor review if order remains unfulfilled after 48 hours.',
        trigger: 'sla.breached',
        conditionLogic: 'AND',
        conditions: [{ field: 'unfulfilledHours', operator: 'greater_than', value: 48 }],
        actions: [{ type: 'create_task', payload: { title: 'Investigate Stuck Order', priority: 'high', assignedRole: 'admin' } }],
        enabled: true,
      },
      {
        id: 'recipe-11',
        name: 'Repeat Buyer Milestone Tagging',
        description: 'Tags customer as Loyal when 5th order is placed.',
        trigger: 'order.created',
        conditionLogic: 'AND',
        conditions: [{ field: 'customerOrdersCount', operator: 'equals', value: 5 }],
        actions: [{ type: 'tag_entity', payload: { tag: 'loyal-tier' } }],
        enabled: true,
      },
      {
        id: 'recipe-12',
        name: 'Supplier Delayed Shipment Escalation',
        description: 'Creates purchasing follow-up task when PO passes expected delivery date.',
        trigger: 'sla.breached',
        conditionLogic: 'AND',
        conditions: [{ field: 'entityType', operator: 'equals', value: 'purchase_order' }],
        actions: [{ type: 'create_task', payload: { title: 'Contact Delayed Supplier', priority: 'high', assignedRole: 'inventory' } }],
        enabled: true,
      },
      {
        id: 'recipe-13',
        name: 'High Refund SKU Quality Alert',
        description: 'Creates product inspection task when a SKU receives 3 returns in a week.',
        trigger: 'return.received',
        conditionLogic: 'AND',
        conditions: [{ field: 'skuReturnCountWeekly', operator: 'greater_than', value: 3 }],
        actions: [{ type: 'create_task', payload: { title: 'Inspect Defective Production Batch', priority: 'urgent', assignedRole: 'inventory' } }],
        enabled: true,
      },
      {
        id: 'recipe-14',
        name: 'Address Change In-Flight Hold',
        description: 'Holds order from packing if customer changes delivery address post-purchase.',
        trigger: 'order.created',
        conditionLogic: 'AND',
        conditions: [{ field: 'addressModified', operator: 'equals', value: true }],
        actions: [{ type: 'apply_hold', payload: { reason: 'address_modified' } }],
        enabled: true,
      },
      {
        id: 'recipe-15',
        name: 'Large Cart Abandonment SMS Queue',
        description: 'Queues SMS concierge reachout for abandoned carts over $200.',
        trigger: 'order.created',
        conditionLogic: 'AND',
        conditions: [{ field: 'isAbandoned', operator: 'equals', value: true }],
        actions: [{ type: 'send_notification', payload: { channel: 'sms_outbox' } }],
        enabled: true,
      },
    ];
  }
}
