# Storefront Ops — Global Privacy Policy

**Effective Date**: November 1, 2026  
**Compliance Standards**: EU General Data Protection Regulation (GDPR), California Consumer Privacy Act / CPRA, UK Data Protection Act 2018.

---

## 1. Introduction & Scope

Storefront Ops Inc. ("we", "us", "our") respects the privacy of our multi-tenant SaaS customers and their end consumers. This Privacy Policy describes how we collect, process, store, and protect Personal Data processed through the Storefront Ops platform.

---

## 2. Categories of Data Processed

### 2.1 Workspace Account Data
* **User Information**: Name, business email, hashed credentials, role assignment, login audit timestamps.
* **Billing Information**: Payment card details (tokenized directly via Stripe; raw PAN is never stored on our servers), billing address, tax identification numbers.

### 2.2 E-Commerce Consumer Data (Processed on Behalf of Merchants)
* **Order & Shipping Data**: Consumer name, delivery address, phone number, email address, tracking numbers, line items purchased.
* **Support Ticket Data**: Customer service communications, ticket history, customer satisfaction feedback.

---

## 3. Sub-Processors Registry

We engage third-party sub-processors to assist in delivering the Services. Each sub-processor is bound by data protection obligations compliant with GDPR Article 28:

| Sub-Processor | Location | Purpose | Safeguards |
| :--- | :--- | :--- | :--- |
| **Supabase (PostgreSQL / AWS)** | United States / EU | Multi-Tenant Database Hosting & Storage | Data Encryption at Rest (AES-256), RLS |
| **Stripe Inc.** | United States | Subscription Billing & Payment Processing | PCI-DSS Level 1 Service Provider |
| **Inngest Inc.** | United States | Background Job Queue & Asynchronous Workflows | TLS 1.3 in Transit, Zero Retention Queue |
| **Resend Inc.** | United States | Transactional Customer Email Dispatch | SOC 2 Type II, DPA with SCCs |
| **Twilio Inc.** | United States | Transactional Customer SMS Tracking Alerts | ISO 27001, Binding Corporate Rules (BCR) |

---

## 4. Data Subject Rights (GDPR & CCPA)

Under applicable privacy regulations, data subjects have the right to:
1. **Right to Access (DSAR)**: Request an export of all Personal Data held concerning them in a machine-readable JSON format.
2. **Right to Rectification**: Correct inaccurate personal details.
3. **Right to Erasure ("Right to be Forgotten")**: Request permanent deletion of personal data. Storefront Ops provides automated erasure tools that redact personal PII across customers, orders, and tickets while retaining immutable integer financial totals strictly for tax and statutory accounting obligations (GDPR Art. 17(3)(b)).
4. **Right to Opt-Out**: Unsubscribe from marketing communications across all synchronized channels.

To exercise these rights, merchants and consumers may navigate to `Settings > Privacy & Compliance` or submit an automated request through our API.
