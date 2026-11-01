import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OrderStateMachine, type OrderStatus } from '../src/order-machine.ts';

describe('OrderStateMachine (Spec 3.3 State Machine)', () => {
  it('allows valid forward fulfillment transitions', () => {
    assert.equal(OrderStateMachine.isAllowedTransition('pending_payment', 'paid'), true);
    assert.equal(OrderStateMachine.isAllowedTransition('paid', 'ready_to_pack'), true);
    assert.equal(OrderStateMachine.isAllowedTransition('ready_to_pack', 'packing'), true);
    assert.equal(OrderStateMachine.isAllowedTransition('packing', 'packed'), true);
    assert.equal(OrderStateMachine.isAllowedTransition('packed', 'shipped'), true);
    assert.equal(OrderStateMachine.isAllowedTransition('shipped', 'delivered'), true);
  });

  it('rejects illegal status skipping', () => {
    // Cannot skip directly from pending_payment to shipped
    assert.equal(OrderStateMachine.isAllowedTransition('pending_payment', 'shipped'), false);
    // Cannot skip from paid directly to delivered
    assert.equal(OrderStateMachine.isAllowedTransition('paid', 'delivered'), false);
    // Cannot transition from terminal cancelled state
    assert.equal(OrderStateMachine.isAllowedTransition('cancelled', 'paid'), false);
  });

  it('throws descriptive error on invalid transition attempt', () => {
    assert.throws(
      () =>
        OrderStateMachine.validateTransition({
          orderId: 'ord-999',
          fromStatus: 'pending_payment',
          toStatus: 'shipped',
          actorId: 'usr-1',
          actorRole: 'admin',
        }),
      /Illegal order status transition for order ord-999/
    );
  });

  it('provides permitted next statuses', () => {
    const nextForPaid = OrderStateMachine.getPermittedNextStatuses('paid');
    assert.deepEqual([...nextForPaid], ['ready_to_pack', 'on_hold', 'cancelled']);
  });
});
