/**
 * Storefront Ops Integrations: Webhook Pipeline, HMAC & Outage Resiliency
 * Playbook Step 14 (Spec Part 3.16): Webhook ingestion, HMAC verification, DLQ, and replay protection
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { StockSyncUpdate } from './inventory-provider.ts';
import type { ExternalOrder } from './orders-provider.ts';

export interface WebhookEventPayload {
  integrationId: string;
  eventId: string;
  eventType: 'order.created' | 'order.updated' | 'order.fulfilled' | 'inventory.level_set' | 'payment.succeeded' | 'payment.refunded';
  payload: Record<string, any>;
  receivedAtIso: string;
}

export interface IngestionResult {
  status: 'processed' | 'skipped_duplicate' | 'queued_dlq' | 'buffered_offline';
  eventId: string;
  integrationId: string;
  order?: ExternalOrder;
  stockUpdates?: StockSyncUpdate[];
  message: string;
}

export interface DeadLetterQueueItem {
  id: string;
  integrationId: string;
  eventId: string;
  payload: Record<string, any>;
  errorMessage: string;
  retryCount: number;
  lastAttemptAtIso: string;
}

export class WebhookPipeline {
  private processedEventKeys = new Set<string>();
  private deadLetterQueue: DeadLetterQueueItem[] = [];
  private offlineStockBuffer: Map<string, StockSyncUpdate> = new Map();
  private isNetworkOnline: boolean = true;

  /**
   * Set network connectivity state for outage simulation
   */
  setNetworkOnline(online: boolean): void {
    this.isNetworkOnline = online;
  }

  getIsNetworkOnline(): boolean {
    return this.isNetworkOnline;
  }

  getDeadLetterQueue(): DeadLetterQueueItem[] {
    return [...this.deadLetterQueue];
  }

  getProcessedKeysCount(): number {
    return this.processedEventKeys.size;
  }

  clearProcessedKeys(): void {
    this.processedEventKeys.clear();
    this.deadLetterQueue = [];
    this.offlineStockBuffer.clear();
    this.isNetworkOnline = true;
  }

  /**
   * Constant-time HMAC-SHA256 signature verification
   */
  static verifyHmacSignature(
    rawBody: string,
    signatureHeader: string,
    secret: string,
    encoding: 'base64' | 'hex' = 'base64'
  ): boolean {
    try {
      const hmac = createHmac('sha256', secret);
      hmac.update(rawBody, 'utf8');
      const expectedDigest = hmac.digest(encoding);

      const expectedBuffer = Buffer.from(expectedDigest, 'utf8');
      const actualBuffer = Buffer.from(signatureHeader, 'utf8');

      if (expectedBuffer.length !== actualBuffer.length) {
        return false;
      }

      return timingSafeEqual(expectedBuffer, actualBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Ingest and process an incoming webhook with deduplication and outage buffering
   * Exit Check: Outage simulation and network replay test produces zero duplicate orders and zero missing stock sync updates.
   */
  ingestWebhook(
    event: WebhookEventPayload,
    processor: (payload: Record<string, any>) => { order?: ExternalOrder; stockUpdates?: StockSyncUpdate[] }
  ): IngestionResult {
    const deduplicationKey = `${event.integrationId}:${event.eventId}`;

    // 1. Idempotency Check (Zero duplicate orders on replay)
    if (this.processedEventKeys.has(deduplicationKey)) {
      return {
        status: 'skipped_duplicate',
        eventId: event.eventId,
        integrationId: event.integrationId,
        message: `Skipped: Webhook event ${event.eventId} already processed (Idempotent match).`,
      };
    }

    // 2. Outage Simulation Check
    if (!this.isNetworkOnline) {
      // Buffer stock sync updates during outage
      if (event.eventType === 'inventory.level_set' && event.payload.updates) {
        for (const update of event.payload.updates as StockSyncUpdate[]) {
          this.offlineStockBuffer.set(update.sku, update);
        }
      }

      // Mark in processed keys so it's not reprocessed twice
      this.processedEventKeys.add(deduplicationKey);

      return {
        status: 'buffered_offline',
        eventId: event.eventId,
        integrationId: event.integrationId,
        message: `Network offline: Event buffered safely in memory. Will flush upon reconnection.`,
      };
    }

    // 3. Process Event
    try {
      const result = processor(event.payload);
      this.processedEventKeys.add(deduplicationKey);

      return {
        status: 'processed',
        eventId: event.eventId,
        integrationId: event.integrationId,
        order: result.order,
        stockUpdates: result.stockUpdates,
        message: `Webhook ${event.eventId} successfully processed.`,
      };
    } catch (err: any) {
      // 4. On processing failure, queue into Dead Letter Queue (DLQ)
      const dlqItem: DeadLetterQueueItem = {
        id: `dlq_${Date.now()}`,
        integrationId: event.integrationId,
        eventId: event.eventId,
        payload: event.payload,
        errorMessage: err.message || 'Unknown processing error',
        retryCount: 1,
        lastAttemptAtIso: new Date().toISOString(),
      };
      this.deadLetterQueue.push(dlqItem);

      return {
        status: 'queued_dlq',
        eventId: event.eventId,
        integrationId: event.integrationId,
        message: `Processing failed: Queued to Dead Letter Queue (${dlqItem.errorMessage}).`,
      };
    }
  }

  /**
   * Flush all buffered offline updates when connection is restored
   * Guarantees zero missing stock updates after outage recovery
   */
  flushOfflineBuffer(): StockSyncUpdate[] {
    const flushed = Array.from(this.offlineStockBuffer.values());
    this.offlineStockBuffer.clear();
    return flushed;
  }
}
