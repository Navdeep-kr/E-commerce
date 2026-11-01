/**
 * Storefront Ops Core: Order State Machine & Allowed Transitions
 * Spec 3.3 & Part 4: Order status changes follow allowed transitions only.
 */

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'on_hold'
  | 'ready_to_pack'
  | 'packing'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'partially_fulfilled';

export interface TransitionContext {
  orderId: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  actorId: string;
  actorRole: string;
  reason?: string;
}

export class OrderStateMachine {
  /**
   * Explicit allowed transitions map
   */
  private static readonly ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
    pending_payment: ['paid', 'cancelled'],
    paid: ['ready_to_pack', 'on_hold', 'cancelled'],
    on_hold: ['ready_to_pack', 'cancelled'],
    ready_to_pack: ['packing', 'on_hold', 'cancelled'],
    packing: ['packed', 'ready_to_pack', 'on_hold'],
    packed: ['shipped', 'ready_to_pack'],
    shipped: ['delivered', 'returned', 'partially_fulfilled'],
    delivered: ['returned'],
    partially_fulfilled: ['ready_to_pack', 'shipped', 'cancelled', 'returned'],
    returned: [], // Final terminal state
    cancelled: [], // Final terminal state
  };

  /**
   * Check if a status transition is legally permitted
   */
  static isAllowedTransition(from: OrderStatus, to: OrderStatus): boolean {
    const allowed = this.ALLOWED_TRANSITIONS[from];
    return allowed ? allowed.includes(to) : false;
  }

  /**
   * Validate transition and throw structured error if forbidden
   */
  static validateTransition(context: TransitionContext): void {
    if (context.fromStatus === context.toStatus) {
      throw new Error(`Order ${context.orderId} is already in status '${context.fromStatus}'`);
    }

    if (!this.isAllowedTransition(context.fromStatus, context.toStatus)) {
      throw new Error(
        `Illegal order status transition for order ${context.orderId}: cannot move from '${context.fromStatus}' to '${context.toStatus}'. Allowed destinations: [${(this.ALLOWED_TRANSITIONS[context.fromStatus] || []).join(', ')}]`
      );
    }
  }

  /**
   * Get list of permitted next statuses for an order
   */
  static getPermittedNextStatuses(currentStatus: OrderStatus): readonly OrderStatus[] {
    return this.ALLOWED_TRANSITIONS[currentStatus] || [];
  }
}
