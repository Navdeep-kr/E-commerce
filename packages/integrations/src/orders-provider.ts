import type { OrderStatus } from '@storefront-ops/core';

export interface ExternalOrderLine {
  externalLineId: string;
  sku: string;
  variantTitle?: string;
  quantity: number;
  unitPriceMinor: number;
  totalPriceMinor: number;
}

export interface ExternalOrder {
  externalId: string;
  storeId: string;
  orderNumber: string;
  placedAt: string;
  customerEmail: string;
  customerName: string;
  currency: string;
  totalAmountMinor: number;
  status: OrderStatus;
  lines: ExternalOrderLine[];
  shippingAddress: {
    address1: string;
    city: string;
    province?: string;
    postalCode: string;
    country: string;
  };
}

export interface OrdersProvider {
  readonly providerName: string;

  /**
   * Fetch recent orders for backfill or polling sync
   */
  fetchOrders(since?: Date): Promise<ExternalOrder[]>;

  /**
   * Get single order by external ID
   */
  getOrder(externalId: string): Promise<ExternalOrder | null>;

  /**
   * Push fulfillment and tracking number upstream to store
   */
  fulfillOrder(externalId: string, trackingNumber: string, carrier: string): Promise<{ success: boolean }>;

  /**
   * Push cancellation upstream
   */
  cancelOrder(externalId: string, reason: string): Promise<{ success: boolean }>;
}
