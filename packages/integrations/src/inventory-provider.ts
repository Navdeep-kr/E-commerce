export interface StockSyncUpdate {
  sku: string;
  externalVariantId?: string;
  availableStock: number;
}

export interface InventoryProvider {
  readonly providerName: string;

  /**
   * Sync calculated available stock levels back to the external channel
   */
  pushStockLevels(updates: StockSyncUpdate[]): Promise<{ updatedCount: number; errors: string[] }>;

  /**
   * Fetch current remote stock levels for conflict detection
   */
  fetchRemoteStock(skus: string[]): Promise<Record<string, number>>;
}
