# Storefront Ops — Data Processing Addendum (DPA)

**Effective Date**: November 1, 2026  
**Governing Regulation**: Article 28 of Regulation (EU) 2016/679 (GDPR), UK GDPR, and Swiss FADP.

This Data Processing Addendum ("DPA") supplements the Storefront Ops Master Terms of Service between Customer ("Controller") and Storefront Ops Inc. ("Processor").

---

## 1. Scope and Processing of Personal Data

### 1.1 Roles of the Parties
Customer acts as a Data Controller concerning consumer personal data processed through the platform. Storefront Ops acts as a Data Processor processing Personal Data exclusively on documented instructions from Customer.

### 1.2 Details of the Processing
* **Subject Matter**: Providing e-commerce order management, fulfillment tracking, inventory forecasting, and customer support.
* **Duration**: The term of the applicable subscription plus retention required by statutory law.
* **Categories of Data Subjects**: End consumers purchasing products through Customer's online stores, and Customer's authorized team members.

---

## 2. Technical and Organizational Measures (TOMs)

Processor implements technical and organizational measures as set forth below:
1. **Access Control**: Role-Based Access Control (RBAC) enforced server-side. Multi-factor authentication (TOTP 2FA) supported.
2. **Multi-Tenant Separation**: PostgreSQL Row-Level Security (RLS) policies enforcing strict `organization_id` tenancy isolation on every database query.
3. **Encryption**: AES-256 encryption at rest; TLS 1.3 encryption in transit for all external and internal API traffic.
4. **Append-Only Auditing**: Immutable audit trails recording before/after JSON state deltas on all operational mutations.
5. **Data Erasure & Anonymization**: Automated GDPR Article 17 erasure pipelines supporting clean scrubbing of PII across tables.

---

## 3. Sub-Processors

Customer grants general written authorization to Processor to engage the sub-processors listed in the Privacy Policy. Processor shall notify Customer of any intended changes concerning the addition or replacement of sub-processors at least thirty (30) days in advance.

---

## 4. International Data Transfers

Where the transfer of Personal Data from the EEA, UK, or Switzerland to a third country requires adequate safeguards, the parties agree to incorporate the European Commission's Standard Contractual Clauses (Module 2: Controller-to-Processor).
