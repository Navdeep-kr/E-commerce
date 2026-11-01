export interface PaymentIntentRequest {
  orderId: string;
  amountMinor: number;
  currency: string;
  customerEmail: string;
  idempotencyKey: string;
}

export interface RefundRequest {
  paymentIntentId: string;
  amountMinor: number;
  currency: string;
  reason: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'return';
  idempotencyKey: string;
}

export interface PaymentsProvider {
  readonly providerName: string;

  /**
   * Create or capture payment intent
   */
  capturePayment(request: PaymentIntentRequest): Promise<{ paymentId: string; status: 'succeeded' | 'failed' }>;

  /**
   * Issue partial or full refund
   */
  issueRefund(request: RefundRequest): Promise<{ refundId: string; status: 'succeeded' | 'pending' | 'failed' }>;

  /**
   * Fetch dispute/chargeback details
   */
  fetchDisputes(limit?: number): Promise<Array<{ disputeId: string; amountMinor: number; reason: string; dueBy: string }>>;
}
