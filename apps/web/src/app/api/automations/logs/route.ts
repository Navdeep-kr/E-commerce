import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AutomationEngine, type AutomationRule, type TriggerEvent, type ExecutionLog } from '@storefront-ops/core';

export async function GET() {
  const sampleLogs: ExecutionLog[] = [
    {
      id: 'log-101',
      ruleId: 'recipe-1',
      ruleName: 'Low Stock Reorder Alert & Task',
      eventId: 'evt-stock-9901',
      deduplicationKey: 'recipe-1:inventory.low_stock:SKU-HOODIE-BLK-XL',
      status: 'success',
      message: 'Successfully executed rule "Low Stock Reorder Alert & Task". Created priority task for inventory team.',
      executedActionsCount: 1,
      timestampIso: '2026-11-01T11:00:00Z',
    },
    {
      id: 'log-102',
      ruleId: 'recipe-2',
      ruleName: 'Fraud Risk Auto-Hold',
      eventId: 'evt-order-4819',
      deduplicationKey: 'recipe-2:order.fraud_flagged:ord-10892',
      status: 'success',
      message: 'Fraud score 85 exceeded threshold (70). Order ORD-10892 held automatically.',
      executedActionsCount: 1,
      timestampIso: '2026-11-01T10:15:00Z',
    },
    {
      id: 'log-103',
      ruleId: 'recipe-1',
      ruleName: 'Low Stock Reorder Alert & Task',
      eventId: 'evt-stock-9901-replay',
      deduplicationKey: 'recipe-1:inventory.low_stock:SKU-HOODIE-BLK-XL',
      status: 'skipped_duplicate',
      message: 'Skipped: Event evt-stock-9901-replay for SKU-HOODIE-BLK-XL was already processed (Idempotency key matched).',
      executedActionsCount: 0,
      timestampIso: '2026-11-01T11:05:00Z',
    },
    {
      id: 'log-104',
      ruleId: 'recipe-3',
      ruleName: 'High-Value VIP Order Priority',
      eventId: 'evt-order-4822',
      deduplicationKey: 'recipe-3:order.high_value:ord-10894',
      status: 'success',
      message: 'Order total $215.00 did not exceed $500 threshold.',
      executedActionsCount: 0,
      timestampIso: '2026-11-01T09:40:00Z',
    },
  ];

  return NextResponse.json({ logs: sampleLogs });
}

// Replay test endpoint: allows tester to trigger a duplicate low-stock event and verify idempotency live in the browser!
export async function POST(request: Request) {
  try {
    const lowStockRule: AutomationRule = {
      id: 'recipe-1',
      name: 'Low Stock Reorder Alert & Task',
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
      id: `evt-test-${Date.now()}`,
      type: 'inventory.low_stock',
      entityId: 'SKU-HOODIE-BLK-XL',
      occurredAtIso: new Date().toISOString(),
      payload: {
        sku: 'HOODIE-BLK-XL',
        availableStock: 2,
      },
    };

    // Execute rule (handles idempotency automatically)
    const log = AutomationEngine.executeRule(lowStockRule, lowStockEvent);

    return NextResponse.json({
      success: true,
      log,
      isDuplicateSkipped: log.status === 'skipped_duplicate',
      message:
        log.status === 'skipped_duplicate'
          ? 'Idempotency Verified: Event was safely detected as duplicate and SKIPPED. Zero duplicate tasks created!'
          : 'First-time Event Executed: Exactly 1 reorder task created on workflow board.',
    });
  } catch (error) {
    console.error('Replay error:', error);
    return NextResponse.json({ error: 'Failed to simulate event replay' }, { status: 500 });
  }
}
