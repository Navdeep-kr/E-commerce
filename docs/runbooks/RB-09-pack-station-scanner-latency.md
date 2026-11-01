# Runbook RB-09: Pack Station Scanner Latency & Offline Queueing

**Severity**: P2 - HIGH  
**Alert Trigger**: `pack_station_scan_latency_ms > 200` for 3 consecutive minutes or scanner disconnect rate $> 5\%$.

---

## 1. Symptoms & Impact
* Warehouse fulfillment operators experience physical barcode scanner delays exceeding 200ms.
* Packing lines stall, impacting daily shipping SLA quotas and order dispatch deadlines.

## 2. Immediate Triage & Diagnostics
1. Inspect WebSocket connection status for live warehouse packing stations:
   * Look for socket disconnect/reconnect loops or high TCP retransmits on the local warehouse VLAN.
2. Check database query performance on `inventory_levels` and `order_items` barcode lookup queries:
   * Ensure `idx_inventory_sku` and `idx_orders_fulfillment` indexes are healthy.
3. Check memory usage on edge warehouse terminal devices.

## 3. Mitigation & Recovery Steps
1. **Switch Warehouse Clients to Optimistic Local Scan Mode**:
   * Enable offline-first local barcode reconciliation cache in the pack station UI.
2. **Restart Pack Station WebSocket Gateway**:
   * Rolling restart of warehouse edge relay services to clear hung socket descriptors.
3. **Warm SKU Barcode Cache**:
   * Pre-load active batch pick-list barcodes into memory cache for the active shift.
4. **Verify Recovery**:
   * Barcode scan-to-screen round-trip latency returns to $< 50\text{ms}$. Packing stations resume normal throughput.
