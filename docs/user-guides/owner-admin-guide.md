# Storefront Ops: Owner & Administrator Guide

Welcome to **Storefront Ops**. As a store owner or platform administrator, you have full oversight across organizational settings, team permissions, security configurations, SaaS subscription billing, and third-party integrations.

---

## 1. Initial Organization Setup

1. **Workspace Profile**: Navigate to `Settings -> General` to define your store name, legal entity name, primary operational timezone, and default base currency (e.g. `USD`, `EUR`, `GBP`).
2. **Multi-Store Channels**: Connect your primary sales storefronts under `Settings -> Integrations`:
   * **Shopify**: Input your store URL (`example.myshopify.com`) and admin access token. Webhook subscriptions for orders, stock, and fulfillments are established automatically.
   * **WooCommerce**: Enter your Consumer Key, Consumer Secret, and site REST API endpoint.
   * **Custom Storefront**: Generate a public REST API key for custom headless frontends.

---

## 2. Role-Based Access Control (RBAC) & Team Management

Storefront Ops enforces strict multi-tenant Row-Level Security (RLS) with 6 specialized role tiers. Go to `Settings -> Team & Roles`:

| Role | Permissions & Access Scope |
| :--- | :--- |
| **Owner** | Full unrestricted access to billing, platform settings, team invites, and all operational modules. |
| **Admin** | Full operational access across all modules; cannot delete organization or transfer primary ownership. |
| **Fulfillment / Warehouse** | Access to Orders, Batch Pick Lists, Packing Stations, and Shipping Carrier label generation. Denied access to Finance and Marketing. |
| **Inventory Planner** | Access to Product Catalog, Inventory Adjustments, Stock Movements Ledger, and Purchase Orders. Denied access to Finance. |
| **Customer Support** | Access to Support Inbox, Customer Profiles, and RMA Returns Processing. Strictly read-only on Financial Ledgers. |
| **Finance Controller** | Access to Double-Entry General Ledger, Stripe Payout Reconciliations, Tax Audit Exports, and P&L statements. |

To invite a new team member:
1. Click **Invite Team Member**.
2. Enter email address and select the appropriate role.
3. The invited user receives a secure magic link invitation valid for 48 hours.

---

## 3. Subscription Billing & Usage Limits

Manage your plan and payment method under `Settings -> Billing`:
* **Starter Plan ($49/mo)**: Up to 500 orders/month, 2 warehouse locations, 3 team seats.
* **Growth Plan ($149/mo)**: Up to 5,000 orders/month, 5 warehouse locations, 10 team seats, AI Copilot included.
* **Scale Plan ($399/mo)**: Unlimited orders, unlimited locations, custom webhooks, dedicated Slack channel, 99.9% uptime SLA.

*Note: If a payment fails, your workspace enters a 7-day grace period (`past_due`). If unresolved, workspace shifts to read-only mode until payment details are updated.*

---

## 4. Security, API Keys & Compliance

* **API Keys**: Manage granular API tokens under `Settings -> Developer API`. Revoke compromised tokens instantly.
* **Audit Logs**: Review immutable operational activity under `Settings -> Security Audit`.
* **GDPR / CCPA Requests**: Execute customer Data Subject Access Requests (DSAR) and Right to be Forgotten deletions under `Settings -> Privacy & Compliance`.
