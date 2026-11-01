/**
 * Storefront Ops Integrations: Stripe Payment Adapter
 * Playbook Step 14: Stripe PaymentIntents, Refunds, Disputes & Webhook signature validation
 */

import { WebhookPipeline } from './webhook-pipeline.ts';
import type {
  PaymentsProvider,
  PaymentIntentRequest,
  RefundRequest,
} from './payments-provider.ts';

export interface StripeAdapterConfig {
  secretKey: string;
  webhookSecret: string;
}

export class StripeAdapter implements PaymentsProvider {
  readonly providerName = 'Stripe';
  private readonly config: StripeAdapterConfig;

  constructor(
    config: StripeAdapterConfig = {
      secretKey: 'sk_test_mock_stripe_key',
      webhookSecret: 'whsec_mock_stripe_secret_123',
    }
  ) {
    this.config = config;
  }

  /**
   * Verify Stripe webhook signature header (t=...,v1=...)
   */
  verifyWebhookSignature(payload: string, header: string): boolean {
    if (!header) return false;

    // Extract t and v1
    const parts = header.split(',');
    let timestamp = '';
    let v1Signature = '';

    for (const part of parts) {
      const [key, value] = part.trim().split('=');
      if (key === 't') timestamp = value;
      if (key === 'v1') v1Signature = value;
    }

    if (!timestamp || !v1Signature) return false;

    // Signed payload is timestamp + "." + payload
    const signedPayload = `${timestamp}.${payload}`;
    return WebhookPipeline.verifyHmacSignature(
      signedPayload,
      v1Signature,
      this.config.webhookSecret,
      'hex'
    );
  }

  async capturePayment(
    request: PaymentIntentRequest
  ): Promise<{ paymentId: string; status: 'succeeded' | 'failed' }> {
    return {
      paymentId: `pi_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      status: 'succeeded',
    };
  }

  async issueRefund(
    request: RefundRequest
  ): Promise<{ refundId: string; status: 'succeeded' | 'pending' | 'failed' }> {
    return {
      refundId: `re_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      status: 'succeeded',
    };
  }

  async fetchDisputes(
    limit: number = 10
  ): Promise<Array<{ disputeId: string; amountMinor: number; reason: string; dueBy: string }>> {
    return [];
  }
}
