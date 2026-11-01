# Storefront Ops: Inventory Planner Guide

This guide covers inventory stock management, append-only ledger movements, catalog configuration, predictive stockout forecasting, cycle counting, and purchase order receipts.

---

## 1. Stock Levels & The Available Invariant

In Storefront Ops, available stock is strictly computed using the core immutable invariant:
$$\text{available} = \text{on\_hand} - \text{committed}$$

* **On Hand**: Physical units located in warehouse bins.
* **Committed**: Units allocated to confirmed open orders awaiting packing.
* **Available**: Quantity free for sale on e-commerce channels. Stockouts trigger when $\text{available} \le 0$.

All inventory mutations are recorded in the append-only `inventory_movements` ledger. Direct database row overrides are prohibited.

---

## 2. Ingesting Opening Stock & CSV Uploads

1. Navigate to `Inventory -> Catalog & Levels`.
2. Click **Import CSV**:
   * Format: `sku,title,bin_location,on_hand,unit_cost_cents,currency`
   * Example: `SKU-TSHIRT-BLK-M,Classic Cotton Tee Black M,A-02-14,250,1250,USD`
3. Click **Validate & Ingest**:
   * The streaming CSV parser validates barcode uniqueness, verifies warehouse bins, and posts ledger entries.

---

## 3. Purchase Orders & Landed Cost Allocation

When stock reaches the reorder point:
1. Navigate to `Purchasing -> Purchase Orders`.
2. Click **Create PO**:
   * Select supplier, target warehouse, items, quantities, and negotiated unit costs.
   * Send PDF purchase order to supplier.
3. **Receiving & Landed Cost Entry**:
   * When shipment arrives at warehouse dock, click **Receive Items**.
   * Enter actual freight invoice, customs duty fees, and handling costs in integer minor units (cents).
   * Storefront Ops applies the largest-remainder algorithm to allocate landed costs proportionally across received items without penny drift.
   * Unit asset valuation is atomically updated in the finance general ledger.

---

## 4. AI Demand Forecasting & Velocity Alerts

1. Open `Operations -> Demand Forecasting`.
2. Review the blended 7-day and 30-day sales velocity per SKU.
3. System calculates:
   * **Days of Inventory Remaining (DIR)**: $\text{DIR} = \text{available} / \text{daily\_velocity}$.
   * **Projected Stockout Date**: Forecasted date when available inventory reaches zero.
   * **Recommended Reorder Quantity**: Based on supplier lead time and minimum order quantity (MOQ).
