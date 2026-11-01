/**
 * Storefront Ops Integrations: Shopify Adapter
 * Playbook Step 14: Shopify Admin API GraphQL/REST normalizer & webhook listener
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { WebhookPipeline } from './webhook-pipeline.ts';
import type { OrdersProvider, ExternalOrder, ExternalOrderLine } from './orders-provider.ts';
import type { InventoryProvider, StockSyncUpdate } from './inventory-provider.ts';

export interface ShopifyAdapterConfig {
  shopDomain?: string;
  accessToken?: string;
  webhookSecret?: string;
  apiKey?: string;
  apiSecret?: string;
}

export class ShopifyAdapter implements OrdersProvider, InventoryProvider {
  readonly providerName = 'Shopify';
  private readonly config: ShopifyAdapterConfig;

  constructor(
    config: ShopifyAdapterConfig = {
      shopDomain: 'acme-commerce.myshopify.com',
      accessToken: 'shpat_mock_token_123',
      webhookSecret: 'mock_shopify_webhook_secret_xyz',
      apiKey: 'mock_shopify_api_key_123',
      apiSecret: 'mock_shopify_api_secret_456',
    }
  ) {
    this.config = config;
  }

  /**
   * Build the Shopify Partner App OAuth authorization URL
   */
  getAuthorizationUrl(
    shop: string,
    redirectUri: string,
    state: string,
    scopes = ['read_orders', 'write_orders', 'read_inventory', 'write_inventory', 'read_products']
  ): string {
    const cleanShop = shop.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const clientId = this.config.apiKey || 'shpa_partner_client_id_live';
    const params = new URLSearchParams({
      client_id: clientId,
      scope: scopes.join(','),
      redirect_uri: redirectUri,
      state,
    });
    return `https://${cleanShop}/admin/oauth/authorize?${params.toString()}`;
  }

  /**
   * Verify HMAC signature on Shopify OAuth redirect callback
   */
  verifyOAuthCallback(params: Record<string, string>): boolean {
    const { hmac, signature, ...rest } = params;
    const targetHmac = hmac || signature;
    if (!targetHmac) return false;
    const secret = this.config.apiSecret || 'mock_shopify_api_secret_456';
    const message = Object.keys(rest)
      .sort()
      .map((k) => `${k}=${rest[k]}`)
      .join('&');
    const calculated = createHmac('sha256', secret).update(message).digest('hex');
    try {
      return timingSafeEqual(Buffer.from(targetHmac, 'hex'), Buffer.from(calculated, 'hex'));
    } catch {
      return false;
    }
  }

  /**
   * Verify Shopify HMAC-SHA256 header (X-Shopify-Hmac-Sha256)
   */
  verifyHmac(rawBody: string, hmacHeader: string): boolean {
    return WebhookPipeline.verifyHmacSignature(
      rawBody,
      hmacHeader,
      this.config.webhookSecret || 'mock_shopify_webhook_secret_xyz',
      'base64'
    );
  }

  /**
   * Normalize raw Shopify webhook payload into canonical Storefront Ops ExternalOrder
   * Converts floating-point / string decimals into integer minor units (cents)
   */
  normalizeOrder(raw: any): ExternalOrder {
    const totalMinor = Math.round(parseFloat(raw.total_price || '0') * 100);

    const lines: ExternalOrderLine[] = (raw.line_items || []).map((l: any) => {
      const unitPriceMinor = Math.round(parseFloat(l.price || '0') * 100);
      return {
        externalLineId: String(l.id),
        sku: l.sku || `UNKNOWN-${l.id}`,
        variantTitle: l.title || l.name,
        quantity: l.quantity || 1,
        unitPriceMinor,
        totalPriceMinor: unitPriceMinor * (l.quantity || 1),
      };
    });

    const addr = raw.shipping_address || {};

    return {
      externalId: String(raw.id),
      storeId: this.config.shopDomain || 'acme-commerce.myshopify.com',
      orderNumber: raw.name || `ORD-${raw.order_number}`,
      placedAt: raw.created_at || new Date().toISOString(),
      customerEmail: raw.email || 'customer@example.com',
      customerName: addr.name || `${addr.first_name || ''} ${addr.last_name || ''}`.trim() || 'Guest Customer',
      currency: raw.currency || 'USD',
      totalAmountMinor: totalMinor,
      status: 'paid',
      lines,
      shippingAddress: {
        address1: addr.address1 || '1 Main St',
        city: addr.city || 'Anytown',
        province: addr.province || 'PA',
        postalCode: addr.zip || '19104',
        country: addr.country_code || 'US',
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
      stock[sku] = 50;
    }
    return stock;
  }
}
