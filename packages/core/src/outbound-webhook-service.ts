/**
 * Storefront Ops Core: Outbound Webhooks & HMAC Signing
 * Playbook Step 15 (Spec Part 4): Outbound webhook delivery and cryptographic signature generation
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

export interface OutboundWebhookSubscription {
  id: string;
  targetUrl: string;
  secret: string;
  subscribedEvents: string[];
  enabled: boolean;
  createdAtIso: string;
}

export class OutboundWebhookService {
  /**
   * Generate timestamped HMAC-SHA256 signature header for outbound webhook delivery
   * Header format: X-Storefront-Signature: t={timestamp},v1={hexDigest}
   */
  static signPayload(
    payloadString: string,
    secret: string,
    timestampSeconds: number = Math.floor(Date.now() / 1000)
  ): {
    headerValue: string;
    timestamp: number;
    signature: string;
  } {
    const signedPayload = `${timestampSeconds}.${payloadString}`;
    const signature = createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');
    const headerValue = `t=${timestampSeconds},v1=${signature}`;

    return {
      headerValue,
      timestamp: timestampSeconds,
      signature,
    };
  }

  /**
   * Verify an outbound or received webhook signature against expected secret
   */
  static verifySignature(
    payloadString: string,
    signatureHeader: string,
    secret: string,
    toleranceSeconds: number = 300, // 5 minutes max clock drift
    nowSeconds: number = Math.floor(Date.now() / 1000)
  ): boolean {
    if (!signatureHeader) return false;

    const parts = signatureHeader.split(',');
    let timestamp = 0;
    let v1Signature = '';

    for (const part of parts) {
      const [key, value] = part.trim().split('=');
      if (key === 't') timestamp = parseInt(value, 10);
      if (key === 'v1') v1Signature = value;
    }

    if (!timestamp || !v1Signature || isNaN(timestamp)) return false;

    // Check clock drift tolerance
    if (Math.abs(nowSeconds - timestamp) > toleranceSeconds) {
      return false; // Signature expired or timestamp invalid
    }

    const expected = this.signPayload(payloadString, secret, timestamp);

    try {
      const expectedBuf = Buffer.from(expected.signature, 'utf8');
      const actualBuf = Buffer.from(v1Signature, 'utf8');

      if (expectedBuf.length !== actualBuf.length) return false;
      return timingSafeEqual(expectedBuf, actualBuf);
    } catch {
      return false;
    }
  }
}
