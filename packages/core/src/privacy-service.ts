/**
 * Privacy & GDPR/CCPA Compliance Service
 * Automated Data Subject Access Request (DSAR) data export, clean PII erasure across all tables, and immutable compliance audit logging.
 */

export interface CustomerDataExportPackage {
  exportId: string;
  organizationId: string;
  customerId: string;
  generatedAt: string;
  customerProfile: Record<string, unknown>;
  orders: Array<Record<string, unknown>>;
  returns: Array<Record<string, unknown>>;
  tickets: Array<Record<string, unknown>>;
  communications: Array<Record<string, unknown>>;
  checksum: string;
}

export interface ErasureAuditRecord {
  id: string;
  organizationId: string;
  action: 'gdpr_erasure_completed';
  customerId: string;
  scrubbedOrdersCount: number;
  scrubbedTicketsCount: number;
  scrubbedCommunicationsCount: number;
  reason: string;
  executedAt: string;
}

export interface MutablePrivacyDatasets {
  customers: Array<{
    id: string;
    organizationId: string;
    name: string;
    email: string;
    phone?: string | null;
    addresses?: any[];
    tags?: string[];
  }>;
  orders: Array<{
    id: string;
    organizationId: string;
    customerId: string;
    customerName: string;
    customerEmail?: string | null;
    shippingAddress: string;
    totalCents: number;
    financialStatus?: string;
  }>;
  tickets: Array<{
    id: string;
    organizationId: string;
    customerId: string;
    requesterName: string;
    messages: Array<{ sender: string; body: string }>;
  }>;
  communications: Array<{
    messageId: string;
    customerId?: string;
    recipient: string;
    body: string;
  }>;
}

export class PrivacyComplianceService {
  private readonly auditRecords: ErasureAuditRecord[];

  constructor() {
    this.auditRecords = [];
  }

  /**
   * Generates a portable machine-readable Data Subject Access Request (DSAR) export
   */
  public generateCustomerDataExport(
    organizationId: string,
    customerId: string,
    data: MutablePrivacyDatasets,
    now: Date = new Date()
  ): CustomerDataExportPackage | null {
    const customer = data.customers.find(
      (c) => c.organizationId === organizationId && c.id === customerId
    );
    if (!customer) return null;

    const customerOrders = data.orders.filter(
      (o) => o.organizationId === organizationId && o.customerId === customerId
    );
    const customerTickets = data.tickets.filter(
      (t) => t.organizationId === organizationId && t.customerId === customerId
    );
    const customerComms = data.communications.filter((c) => c.customerId === customerId);

    const exportId = `dsar-${customerId}-${now.getTime()}`;
    const payloadStr = JSON.stringify({ customer, customerOrders, customerTickets, customerComms });

    // Compute checksum
    let hash = 0;
    for (let i = 0; i < payloadStr.length; i++) {
      hash = (hash << 5) - hash + payloadStr.charCodeAt(i);
      hash |= 0;
    }
    const checksum = Math.abs(hash).toString(16);

    return {
      exportId,
      organizationId,
      customerId,
      generatedAt: now.toISOString(),
      customerProfile: customer,
      orders: customerOrders,
      returns: [],
      tickets: customerTickets,
      communications: customerComms,
      checksum,
    };
  }

  /**
   * Executes a GDPR Article 17 "Right to be Forgotten" erasure request across all tables.
   * Pseudonymizes customer personal details while maintaining integer minor-unit financial ledger totals.
   */
  public executeErasureRequest(
    organizationId: string,
    customerId: string,
    reason: string,
    data: MutablePrivacyDatasets,
    now: Date = new Date()
  ): {
    success: boolean;
    auditLog: ErasureAuditRecord;
    erasureSummary: {
      customerAnonymized: boolean;
      ordersScrubbed: number;
      ticketsScrubbed: number;
      communicationsScrubbed: number;
    };
  } {
    let customerAnonymized = false;
    let ordersScrubbed = 0;
    let ticketsScrubbed = 0;
    let communicationsScrubbed = 0;

    // 1. Scrub customer profile
    const customer = data.customers.find(
      (c) => c.organizationId === organizationId && c.id === customerId
    );

    if (customer) {
      customer.name = 'Anonymized Customer';
      customer.email = `anonymized_${customerId}@deleted.storefrontops.com`;
      customer.phone = null;
      customer.addresses = [];
      customer.tags = ['gdpr_erased'];
      customerAnonymized = true;
    }

    // 2. Scrub orders: redact shipping addresses and names while keeping minor-unit financial totals
    for (const order of data.orders) {
      if (order.organizationId === organizationId && order.customerId === customerId) {
        order.customerName = 'Anonymized Customer';
        order.customerEmail = null;
        order.shippingAddress = '[REDACTED PURSUANT TO GDPR ERASURE]';
        // Note: order.totalCents MUST NOT be modified or set to null, retaining statutory tax audit integrity!
        ordersScrubbed++;
      }
    }

    // 3. Scrub support tickets
    for (const ticket of data.tickets) {
      if (ticket.organizationId === organizationId && ticket.customerId === customerId) {
        ticket.requesterName = 'Anonymized Customer';
        for (const msg of ticket.messages) {
          msg.body = '[MESSAGE REDACTED PURSUANT TO GDPR ERASURE]';
        }
        ticketsScrubbed++;
      }
    }

    // 4. Scrub communication logs
    for (const comm of data.communications) {
      if (comm.customerId === customerId) {
        comm.recipient = 'redacted@privacy.local';
        comm.body = '[COMMUNICATION LOG PURGED PURSUANT TO GDPR ERASURE]';
        communicationsScrubbed++;
      }
    }

    // 5. Append immutable compliance audit log
    const auditRecord: ErasureAuditRecord = {
      id: `audit-gdpr-${customerId}-${now.getTime()}`,
      organizationId,
      action: 'gdpr_erasure_completed',
      customerId,
      scrubbedOrdersCount: ordersScrubbed,
      scrubbedTicketsCount: ticketsScrubbed,
      scrubbedCommunicationsCount: communicationsScrubbed,
      reason,
      executedAt: now.toISOString(),
    };

    this.auditRecords.push(auditRecord);

    return {
      success: customerAnonymized,
      auditLog: auditRecord,
      erasureSummary: {
        customerAnonymized,
        ordersScrubbed,
        ticketsScrubbed,
        communicationsScrubbed,
      },
    };
  }

  /**
   * Get all privacy audit records for an organization
   */
  public getAuditRecords(organizationId: string): ErasureAuditRecord[] {
    return this.auditRecords.filter((a) => a.organizationId === organizationId);
  }
}
