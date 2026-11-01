# Storefront Ops: Public REST API Reference (v1)

The Storefront Ops Public REST API allows developers to ingest orders, query real-time available inventory, update fulfillment tracking, and listen to store webhooks.

---

## 1. Authentication & Base URL

All requests must be served over HTTPS and include your secret API key in the `Authorization` header:

```http
Authorization: Bearer sk_live_your_api_key_here
```

* **Base URL**: `https://api.storefrontops.com/v1`
* **Content-Type**: `application/json`

---

## 2. Invariant Rules: Integer Minor Units (Cents)

> **CRITICAL**: Storefront Ops never uses floating-point numbers for money. All monetary amounts must be transmitted as 64-bit integer minor units (e.g., cents, pence) accompanied by a 3-letter ISO 4217 currency code.
>
> * Example: `$129.50 USD` $\to$ `total_amount_cents: 12950, currency: "USD"`

---

## 3. Endpoints

### 3.1 Create Order (`POST /v1/orders`)

Ingests a new customer order into the fulfillment queue.

#### Request Payload
```json
{
  "external_id": "SHOP-10928",
  "customer_email": "jane.doe@example.com",
  "customer_name": "Jane Doe",
  "shipping_address": {
    "line1": "742 Evergreen Terrace",
    "city": "Springfield",
    "state": "OR",
    "postal_code": "97477",
    "country": "US"
  },
  "items": [
    {
      "sku": "SKU-TSHIRT-BLK-M",
      "quantity": 2,
      "unit_price_cents": 2500
    }
  ],
  "subtotal_cents": 5000,
  "shipping_cents": 500,
  "tax_cents": 400,
  "total_cents": 5900,
  "currency": "USD"
}
```

#### Response (`201 Created`)
```json
{
  "order_id": "ord_88192a71",
  "status": "AWAITING_FULFILLMENT",
  "created_at": "2026-11-01T14:00:00.000Z"
}
```

---

### 3.2 Query Real-Time Inventory Balance (`GET /v1/inventory?sku={sku}`)

Returns on-hand, committed, and freely available inventory.

#### Response (`200 OK`)
```json
{
  "sku": "SKU-TSHIRT-BLK-M",
  "warehouse_id": "wh_main",
  "on_hand": 100,
  "committed": 14,
  "available": 86,
  "reorder_point": 25
}
```

---

### 3.3 Dispatch Shipment & Add Tracking (`POST /v1/orders/{order_id}/fulfillments`)

Creates a shipment record, updates tracking, and moves order to `SHIPPED`.

#### Request Payload
```json
{
  "carrier": "USPS",
  "tracking_number": "9400100000000000000000",
  "tracking_url": "https://tools.usps.com/go/TrackConfirmAction?tLabels=9400100000000000000000"
}
```

#### Response (`200 OK`)
```json
{
  "fulfillment_id": "ful_99812",
  "order_id": "ord_88192a71",
  "status": "SHIPPED",
  "shipped_at": "2026-11-01T14:35:00.000Z"
}
```

---

## 4. Rate Limiting & Error Codes

* **Rate Limit**: 100 requests per second per tenant API key. Responses include `X-RateLimit-Limit` and `X-RateLimit-Remaining` headers.
* **401 Unauthorized**: Missing or invalid bearer token.
* **403 Forbidden**: Token lacks permissions for the requested resource.
* **422 Unprocessable Entity**: Validation failure (e.g., negative money amount, invalid SKU).
* **429 Too Many Requests**: Rate limit ceiling exceeded; back off exponentially.
