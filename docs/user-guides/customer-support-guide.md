# Storefront Ops: Customer Support Representative Guide

This guide covers customer relationship management, omnichannel support ticket triage, return merchandise authorization (RMA) workflows, customer profile deduplication, and AI Copilot assistance.

---

## 1. Omnichannel Support Inbox & SLA Deadlines

1. Navigate to `Support -> Inbox`:
   * Inbound customer messages from email, live chat, and SMS are centralized into unified ticket threads.
2. **SLA Deadlines**:
   * Tickets are prioritized by urgency:
     * **Urgent**: 2-hour first response SLA.
     * **Normal**: 24-hour first response SLA.
     * **Low**: 48-hour SLA.
   * Breach timers turn red when 15 minutes remain before SLA violation.

---

## 2. Customer Profile & Order Context Drawer

When reviewing a ticket:
* The right sidebar reveals the customer's full profile: lifetime spend (in integer cents), order count, average order value (AOV), and RFM loyalty tier (`Champion`, `Loyal`, `At Risk`).
* Direct order links allow instant inspection of fulfillment status, carrier tracking events, and delivery confirmations.

---

## 3. Returns & RMA Policy Engine

When a customer requests a refund or exchange:
1. Open the customer's order and click **Authorize Return (RMA)**.
2. The Policy Engine evaluates eligibility:
   * **Window Check**: Verifies order delivery date is within the allowed 30-day return window.
   * **Final Sale Check**: Items flagged as `FINAL_SALE` are strictly non-returnable; policy override requires manager approval.
3. **Generate Return Shipping Label**:
   * Generates prepaid return label. Optional return shipping fee (e.g. $5.99) can be deducted from the refund total.
4. **Warehouse Restocking & Refund**:
   * Once received at warehouse, items are inspected.
   * Restocking automatically increments available inventory in the ledger and issues customer refund via Stripe.

---

## 4. AI Support Copilot & Response Synthesizer

1. Click **AI Assist Draft** within any ticket:
   * AI Copilot parses the customer's inquiry, retrieves order status, and generates a contextually accurate draft reply.
   * Macro placeholders (`{{customer_name}}`, `{{tracking_url}}`) are automatically interpolated.
2. Representative reviews and adjusts draft before sending.
