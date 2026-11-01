# Storefront Ops: Warehouse & Fulfillment Operator Guide

This guide details daily fulfillment operations, physical barcode scanning, wave and batch picking, packing station verification, and thermal shipping label generation.

---

## 1. Batch & Wave Picking

When customer orders are confirmed and payment is captured, orders enter the `AWAITING_FULFILLMENT` queue.

1. Navigate to `Fulfillment -> Batch Picking`.
2. Click **Generate Pick Wave**:
   * Filter orders by shipping SLA (e.g. Next-Day Express vs. Standard Ground) or warehouse zone.
   * System aggregates order line items into an optimized bin travel path (e.g., Bin `A-01-01` $\to$ `A-02-14` $\to$ `B-01-05`).
3. Print or open digital pick list on handheld tablet scanner.
4. Scan each SKU barcode to verify correct variant retrieval. The system confirms picks with an audible success chime.

---

## 2. Pack Station Workflow

At the physical packing table, open `Fulfillment -> Pack Station`:

1. **Scan Order or Tote Barcode**: Scan the tote barcode or printed packing slip number.
2. **Scan Item Verification**:
   * Scan each physical item barcode as you place it into the shipping box.
   * If an incorrect SKU is scanned, an error banner appears and prevents shipment until swapped.
   * System tracks required quantities: items turn green once target count is satisfied.
3. **Select Package & Dimensions**:
   * Choose standard box preset (Small Box, Medium Box, Poly Mailer) or input custom weight and dimensions.

---

## 3. Shipping Label & Tracking Generation

1. Click **Buy Shipping Label**:
   * Storefront Ops compares real-time rates across configured carriers (USPS, UPS, FedEx, DHL, EasyPost).
   * Generates 4x6 thermal PDF / ZPL label.
2. Auto-Print: If connected to a network thermal printer (Zebra / Rollo), label prints automatically.
3. **Order State Update**:
   * Order status immediately updates to `SHIPPED`.
   * Public tracking number and carrier URL are logged to the order timeline.
   * Customer receives automated shipment notification via email or SMS.

---

## 4. Handling Damaged Items & Inventory Exceptions

If an item in a bin is found damaged or missing during picking:
1. Tap **Flag Bin Exception** on the handheld scanner.
2. Select reason: `DAMAGED_GOODS` or `BIN_COUNT_MISMATCH`.
3. The system automatically creates a cycle count task for inventory planners and reroutes the pick wave to an alternate bin location if stock is available.
