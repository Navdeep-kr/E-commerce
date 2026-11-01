/**
 * Storefront Ops Integrations: WooCommerce Adapter
 * Playbook Step 14: WooCommerce REST API v3 normalizer & webhook listener
 */

import { WebhookPipeline } from './webhook-pipeline.ts';
import type { OrdersProvider, ExternalOrder, ExternalOrderLine } from './orders-provider.ts';
import type { InventoryProvider, StockSyncUpdate } from './inventory-provider.ts';

export interface WooCommerceAdapterConfig {
  siteUrl: string;
  consumerKey: string;
  consumerSecret: string;
  webhookSecret: string;
}

export class WooCommerceAdapter implements OrdersProvider, InventoryProvider {
  readonly providerName = 'WooCommerce';
  private readonly config: WooCommerceAdapterConfig;

  constructor(
    config: WooCommerceAdapterConfig = {
      siteUrl: 'https://store.example.com',
      consumerKey: 'ck_mock_consumer_key',
      consumerSecret: 'cs_mock_consumer_secret',
      webhookSecret: 'mock_woo_webhook_secret_abc',
    }
  ) {
    this.config = config;
  }

  /**
   * Verify WooCommerce HMAC-SHA256 signature (X-WC-Webhook-Signature)
   */
  verifySignature(rawBody: string, signatureHeader: string): boolean {
    return WebhookPipeline.verifyHmacSignature(rawBody, signatureHeader, this.config.webhookSecret, 'base64');
  }

  /**
   * Normalize WooCommerce Order payload into canonical Storefront Ops ExternalOrder
   */
  normalizeOrder(raw: any): ExternalOrder {
    const totalMinor = Math.round(parseFloat(raw.total || '0') * 100);

    const lines: ExternalOrderLine[] = (raw.line_items || []).map((l: any) => {
      const unitPriceMinor = Math.round(parseFloat(l.price || '0') * 100);
      return {
        externalLineId: String(l.id),
        sku: l.sku || `WOO-${l.product_id}`,
        variantTitle: l.name,
        quantity: l.quantity || 1,
        unitPriceMinor,
        totalPriceMinor: unitPriceMinor * (l.quantity || 1),
      };
    });

    const shipping = raw.shipping || raw.billing || {};

    return {
      externalId: String(raw.id),
      storeId: this.config.siteUrl,
      orderNumber: `WC-${raw.number || raw.id}`,
      placedAt: raw.date_created || new Date().toISOString(),
      customerEmail: raw.billing?.email || 'customer@example.com',
      customerName: `${shipping.first_name || ''} ${shipping.last_name || ''}`.trim() || 'Guest Customer',
      currency: raw.currency || 'USD',
      totalAmountMinor: totalMinor,
      status: 'paid',
      lines,
      shippingAddress: {
        address1: shipping.address_1 || '100 Market St',
        city: shipping.city || 'Seattle',
        province: shipping.state || 'WA',
        postalCode: shipping.postcode || '98101',
        country: shipping.country || 'US',
      },
    };
  }

  // OrdersProvider implementation
  async fetchOrders(since?: Date): Promise<ExternalOrder[]> {
    return [];
  }

  async getOrder(externalId: string): Promise<ExternalOrder | null> {
    return null;
  }

  async fulfillOrder(externalId: string, trackingNumber: string, carrier: string): Promise<{ success: boolean }> {
    return { success: true };
  }

  async cancelOrder(externalId: string, reason: string): Promise<{ success: boolean }> {
    return { success: true };
  }

  // InventoryProvider implementation
  async pushStockLevels(updates: StockSyncUpdate[]): Promise<{ updatedCount: number; errors: string[] }> {
    return {
      updatedCount: updates.length,
      errors: [],
    };
  }

  async fetchRemoteStock(skus: string[]): Promise<Record<string, number>> {
    const stock: Record<string, number> = {};
    for (const sku of skus) {
      stock[sku] = 100;
    }
    return stock;
  }
}
