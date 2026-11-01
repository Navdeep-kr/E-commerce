/**
 * Communication & Notification Service
 * Transactional email/SMS templates, omnichannel message dispatching, order timeline logging, and cross-channel opt-out sync.
 */

export type NotificationChannel = 'email' | 'sms' | 'in_app';

export type NotificationCategory = 'transactional' | 'marketing' | 'internal_alert';

export type CommunicationTemplate =
  | 'order_confirmed'
  | 'order_shipped'
  | 'out_for_delivery'
  | 'order_delivered'
  | 'return_approved'
  | 'low_stock_internal_alert';

export interface CustomerPreferences {
  customerId: string;
  email: string;
  phone?: string;
  emailMarketingOptOut: boolean;
  smsMarketingOptOut: boolean;
  transactionalEmailAllowed: boolean;
  transactionalSmsAllowed: boolean;
  updatedAt: string;
}

export interface CommunicationLogEntry {
  messageId: string;
  orderId?: string;
  customerId?: string;
  channel: NotificationChannel;
  category: NotificationCategory;
  template: CommunicationTemplate;
  recipient: string;
  subject?: string;
  body: string;
  trackingUrl?: string;
  status: 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed' | 'suppressed_opt_out';
  dispatchedAt: string;
}

export interface OrderTimelineItem {
  id: string;
  orderId: string;
  type: 'communication' | 'status_change' | 'payment' | 'fulfillment';
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export class CommunicationService {
  private readonly preferenceStore: Map<string, CustomerPreferences>;
  private readonly communicationLogs: CommunicationLogEntry[];
  private readonly orderTimelineStore: Map<string, OrderTimelineItem[]>;

  constructor() {
    this.preferenceStore = new Map();
    this.communicationLogs = [];
    this.orderTimelineStore = new Map();
  }

  /**
   * Get or initialize customer communication preferences
   */
  public getPreferences(customerId: string, email: string, phone?: string): CustomerPreferences {
    let prefs = this.preferenceStore.get(customerId);
    if (!prefs) {
      prefs = {
        customerId,
        email,
        phone,
        emailMarketingOptOut: false,
        smsMarketingOptOut: false,
        transactionalEmailAllowed: true,
        transactionalSmsAllowed: true,
        updatedAt: new Date().toISOString(),
      };
      this.preferenceStore.set(customerId, prefs);
    }
    return prefs;
  }

  /**
   * Synchronize opt-outs across channels
   * e.g. Customer unsubscribing from marketing syncs across email and SMS
   */
  public syncMarketingOptOut(
    customerId: string,
    optOut: boolean,
    now: Date = new Date()
  ): CustomerPreferences {
    const prefs = this.getPreferences(customerId, '');
    prefs.emailMarketingOptOut = optOut;
    prefs.smsMarketingOptOut = optOut; // Omnichannel sync across all channels
    prefs.updatedAt = now.toISOString();
    this.preferenceStore.set(customerId, prefs);
    return prefs;
  }

  /**
   * Render notification templates
   */
  public renderTemplate(
    template: CommunicationTemplate,
    data: Record<string, any>
  ): { subject?: string; body: string; trackingUrl?: string } {
    switch (template) {
      case 'order_confirmed':
        return {
          subject: `Order Confirmed: ${data.orderNumber}`,
          body: `Hi ${data.customerName},\n\nThank you for your order! We have received order ${data.orderNumber} for a total of $${(data.totalCents / 100).toFixed(2)}. We will notify you as soon as your items ship.\n\nShipping to: ${data.shippingAddress}`,
        };

      case 'order_shipped': {
        const trackingUrl = `https://track.storefrontops.com/${data.carrier}/${data.trackingNumber}`;
        return {
          subject: `Your order ${data.orderNumber} has shipped!`,
          body: `Good news ${data.customerName}! Order ${data.orderNumber} is on the way via ${data.carrier}. Tracking number: ${data.trackingNumber}.\n\nTrack your shipment: ${trackingUrl}`,
          trackingUrl,
        };
      }

      case 'out_for_delivery': {
        const trackingUrl = `https://track.storefrontops.com/${data.carrier}/${data.trackingNumber}`;
        return {
          subject: `Out for Delivery: Order ${data.orderNumber}`,
          body: `Your package ${data.orderNumber} is out for delivery today with ${data.carrier}! Track live: ${trackingUrl}`,
          trackingUrl,
        };
      }

      case 'order_delivered':
        return {
          subject: `Delivered: Order ${data.orderNumber}`,
          body: `Your order ${data.orderNumber} was delivered at ${data.deliveredAt || 'your door'}. We hope you love your items! If you have any questions, please reach out to our team.`,
        };

      case 'return_approved': {
        const returnLabelUrl = `https://returns.storefrontops.com/labels/${data.returnId}.pdf`;
        return {
          subject: `Return Request Approved for Order ${data.orderNumber}`,
          body: `Hi ${data.customerName},\n\nYour return for order ${data.orderNumber} has been authorized. Please print your prepaid return shipping label here: ${returnLabelUrl}`,
          trackingUrl: returnLabelUrl,
        };
      }

      case 'low_stock_internal_alert':
        return {
          subject: `[INVENTORY ALERT] Low Stock for SKU ${data.sku}`,
          body: `Attention Warehouse Team: SKU ${data.sku} (${data.productName}) has reached ${data.availableStock} units remaining (below reorder threshold of ${data.reorderThreshold}). Recommended PO: ${data.recommendedReorderQuantity} units.`,
        };
    }
  }

  /**
   * Dispatch a notification and append to order timeline
   */
  public dispatchNotification(params: {
    orderId?: string;
    customerId?: string;
    channel: NotificationChannel;
    category: NotificationCategory;
    template: CommunicationTemplate;
    recipient: string;
    data: Record<string, any>;
    now?: Date;
  }): CommunicationLogEntry {
    const now = params.now || new Date();
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // 1. Opt-out preference check
    let isSuppressed = false;
    if (params.customerId) {
      const prefs = this.getPreferences(params.customerId, params.recipient);
      if (params.category === 'marketing') {
        if (params.channel === 'email' && prefs.emailMarketingOptOut) {
          isSuppressed = true;
        }
        if (params.channel === 'sms' && prefs.smsMarketingOptOut) {
          isSuppressed = true;
        }
      }
    }

    const { subject, body, trackingUrl } = this.renderTemplate(params.template, params.data);

    const logEntry: CommunicationLogEntry = {
      messageId,
      orderId: params.orderId,
      customerId: params.customerId,
      channel: params.channel,
      category: params.category,
      template: params.template,
      recipient: params.recipient,
      subject,
      body,
      trackingUrl,
      status: isSuppressed ? 'suppressed_opt_out' : 'sent',
      dispatchedAt: now.toISOString(),
    };

    this.communicationLogs.push(logEntry);

    // 2. Step 18 Exit Check: Append to order timeline
    if (params.orderId) {
      const timelineList = this.orderTimelineStore.get(params.orderId) || [];
      timelineList.push({
        id: `tl-${messageId}`,
        orderId: params.orderId,
        type: 'communication',
        title: isSuppressed
          ? `Notification Suppressed: ${params.template} (${params.channel.toUpperCase()})`
          : `Sent ${params.template.replace(/_/g, ' ')} via ${params.channel.toUpperCase()}`,
        description: isSuppressed
          ? `Suppressed because customer opted out of marketing updates.`
          : subject || body.substring(0, 80),
        metadata: {
          messageId,
          channel: params.channel,
          recipient: params.recipient,
          trackingUrl,
          status: logEntry.status,
        },
        createdAt: now.toISOString(),
      });
      this.orderTimelineStore.set(params.orderId, timelineList);
    }

    return logEntry;
  }

  /**
   * Get communication history for an order
   */
  public getOrderCommunications(orderId: string): CommunicationLogEntry[] {
    return this.communicationLogs.filter((l) => l.orderId === orderId);
  }

  /**
   * Get complete timeline for an order
   */
  public getOrderTimeline(orderId: string): OrderTimelineItem[] {
    return this.orderTimelineStore.get(orderId) || [];
  }

  /**
   * Handle delivery webhook callback (e.g. Resend / Twilio delivery receipt)
   */
  public handleDeliveryReceipt(
    messageId: string,
    status: 'delivered' | 'bounced' | 'failed'
  ): CommunicationLogEntry | null {
    const entry = this.communicationLogs.find((l) => l.messageId === messageId);
    if (entry) {
      entry.status = status;

      // Update in order timeline as well
      if (entry.orderId) {
        const timeline = this.orderTimelineStore.get(entry.orderId);
        if (timeline) {
          const item = timeline.find((t) => t.metadata.messageId === messageId);
          if (item) {
            item.metadata.status = status;
            item.description = `${item.description} [Status: ${status.toUpperCase()}]`;
          }
        }
      }
      return entry;
    }
    return null;
  }
}
