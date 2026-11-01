# Storefront Ops — STRIDE Threat Model & Security Architecture

**Document Version**: 1.0.0  
**Target Architecture**: Multi-Tenant E-Commerce Operations SaaS (Next.js 15, PostgreSQL via Supabase RLS, Inngest, Stripe, Shopify/Woo Adapters).

---

## 1. Executive Summary & Security Principles

Storefront Ops enforces strict zero-trust multi-tenancy:
1. **Never Trust the Client**: Tenant identity (`organization_id`) is strictly bound to cryptographically verified server-side session JWTs or SHA-256 hashed API keys. Client-supplied query params or body fields claiming an `organization_id` different from the session are rejected.
2. **Database Row-Level Security (RLS)**: Server-enforced PostgreSQL RLS on every single table ensures that even in the event of an application logic bug, cross-tenant data access is impossible at the database engine level.
3. **Integer Minor-Unit Math**: Float arithmetic is forbidden. Money is integer cents; inventory math is integer addition/subtraction.
4. **Append-Only Ledgers**: `inventory_movements` and `audit_logs` are strictly append-only (no SQL `UPDATE` or `DELETE` permitted).

---

## 2. Detailed STRIDE Analysis Matrix

| Threat Category | Potential Attack Vector | Impact Level | Architectural Mitigation & Defense Mechanism |
| :--- | :--- | :--- | :--- |
| **Spoofing** | • Session Hijacking / Cookie theft<br>• Forged Third-Party Webhooks (Shopify/Stripe)<br>• Fake Public API Bearer Keys | **CRITICAL** | • `HttpOnly`, `Secure`, `SameSite=Lax` cookies with remote session revocation.<br>• HMAC-SHA256 signature verification (`X-Shopify-Hmac-Sha256`, `stripe-signature`) with timestamp drift checks ($\le 300\text{s}$).<br>• Prefixed API keys (`sf_live_`, `sf_test_`) stored exclusively as SHA-256 hashes. |
| **Tampering** | • Client modifying price in cart/checkout<br>• Manual mutation of inventory balances<br>• Skipping order state machine transitions | **CRITICAL** | • Prices calculated server-side from catalog pricing in integer cents.<br>• `inventory_levels` updated solely via append-only `inventory_movements` ledger.<br>• Server-side State Machine enforces strict transitions (`pending` $\to$ `paid` $\to$ `fulfilled`). |
| **Repudiation** | • Staff claiming they didn't approve a refund<br>• User denying placing an order or deleting data | **HIGH** | • Immutable `audit_logs` table capturing `actor_id`, `actor_role`, `action`, `entity_type`, `before_state`, and `after_state` JSON deltas.<br>• Order timeline records every outbound communication and state change with timestamps. |
| **Information Disclosure** | • Cross-tenant data leakage via IDOR<br>• SQL error stack trace leaks<br>• Public API over-fetching | **CRITICAL** | • Every SQL query parameterized with `organization_id = $1` as the first clause.<br>• PostgreSQL RLS policies active on 100% of tables.<br>• Sanitized generic API error responses in production (`{ "error": "Internal error" }`). |
| **Denial of Service** | • High-velocity API scraping / brute force<br>• Cache stampedes on hot SKU lookups<br>• Flash sale checkout concurrency crashes | **HIGH** | • Sliding window token bucket rate limiter (120 req/min for API, 5 failed logins lockout).<br>• Single-flight cache loader suppressing cache stampedes.<br>• Concurrency-safe row-level locks (`SELECT ... FOR UPDATE`) ordered by variant ID to eliminate deadlocks. |
| **Elevation of Privilege**| • Viewer/Support user attempting Finance mutation<br>• Modifying role in JWT or request body<br>• Bypassing organization boundary | **CRITICAL** | • Server-side RBAC guard matrix (`requireRole(['owner', 'finance'])`).<br>• Role verified on every request against authenticated session membership.<br>• `TenantFuzzerService` running automated penetration suites verifying 0 boundary leaks. |

---

## 3. Defense-in-Depth Security Controls

### 3.1 Content Security Policy (CSP) & HTTP Headers
```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; object-src 'none'; frame-ancestors 'none';
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### 3.2 Secrets Management
* No production secrets, private keys, or passwords committed to the repository.
* Environment variables validated at application boot using Zod schema.
* Third-party webhook secrets rotated with zero downtime via dual-secret support.
