/**
 * Storefront Ops Background Jobs & Event Bus Definitions
 * Part 5: Typed event bus for asynchronous workflow triggers
 */

export type DomainEventType =
  | 'order.placed'
  | 'order.cancelled'
  | 'order.shipped'
  | 'stock.low'
  | 'payment.failed'
  | 'return.received'
  | 'ticket.created'
  | 'task.overdue';

export interface DomainEvent<T = Record<string, unknown>> {
  id: string;
  name: DomainEventType;
  organizationId: string;
  timestamp: string;
  data: T;
}

export interface JobDefinition<T = unknown> {
  id: string;
  name: string;
  handle: (event: DomainEvent<T>) => Promise<{ success: boolean; result?: unknown }>;
}
