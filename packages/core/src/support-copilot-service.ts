/**
 * Support Copilot Service
 * Context-aware customer service reply synthesizer with automated macro interpolation and policy compliance bounds.
 */

export interface CustomerContext {
  id: string;
  name: string;
  email: string;
  rfmSegment: 'champions' | 'loyal' | 'potential_loyalist' | 'at_risk' | 'hibernating';
  lifetimeSpendCents: number;
}

export interface OrderContext {
  id: string;
  orderNumber: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  slaBreached?: boolean;
  totalCents: number;
  items: Array<{ sku: string; name: string; quantity: number; isFinalSale?: boolean }>;
}

export interface TicketContext {
  ticketId: string;
  subject: string;
  message: string;
  inquiryType: 'order_status' | 'refund_request' | 'damaged_item' | 'address_change' | 'general';
}

export interface SupportDraftResult {
  ticketId: string;
  draftReply: string;
  suggestedAction: 'reply_only' | 'issue_refund' | 'reship_replacement' | 'update_address' | 'escalate_manager';
  isPolicyCompliant: boolean;
  confidenceScore: number; // 0.0 to 1.0
  interpolatedMacros: Record<string, string>;
}

export class SupportCopilotService {
  /**
   * Synthesize a context-aware customer draft reply
   */
  public generateDraft(
    ticket: TicketContext,
    customer: CustomerContext,
    order?: OrderContext
  ): SupportDraftResult {
    const isVip = customer.rfmSegment === 'champions' || customer.lifetimeSpendCents >= 50000;
    const firstName = customer.name.split(' ')[0] || 'Valued Customer';

    let draftReply = '';
    let suggestedAction: SupportDraftResult['suggestedAction'] = 'reply_only';
    let isPolicyCompliant = true;
    let confidenceScore = 0.95;

    const macros: Record<string, string> = {
      customer_name: customer.name,
      first_name: firstName,
      order_number: order?.orderNumber || 'your order',
      carrier: order?.carrier || 'our shipping carrier',
      tracking_number: order?.trackingNumber || 'Pending assignment',
    };

    switch (ticket.inquiryType) {
      case 'order_status': {
        if (!order) {
          draftReply = `Hi ${firstName},\n\nThank you for reaching out to us. We would be happy to check your order status, but we could not locate an active order associated with this request. Could you please reply with your order confirmation number?\n\nBest regards,\nCustomer Care Team`;
          confidenceScore = 0.85;
          break;
        }

        if (order.status === 'shipped') {
          draftReply = `Hi ${firstName},\n\nGood news! Your order ${order.orderNumber} has shipped via ${order.carrier || 'standard carrier'} under tracking number ${order.trackingNumber || 'assigned shortly'}.${
            order.estimatedDelivery ? ` The estimated arrival date is ${order.estimatedDelivery}.` : ''
          }\n\nYou can track its live transit progress directly through your shipment link. Please let us know if you need anything else!\n\nBest regards,\nCustomer Care Team`;
        } else if (order.status === 'delivered') {
          draftReply = `Hi ${firstName},\n\nOur records show that order ${order.orderNumber} was marked as delivered by ${order.carrier || 'the carrier'}${
            order.estimatedDelivery ? ` on ${order.estimatedDelivery}` : ''
          }. If you have not received it yet, please check your porch, mailroom, or neighbors. If it has still not turned up, let us know and we will assist immediately.\n\nBest regards,\nCustomer Care Team`;
        } else {
          // Pending or processing
          const apology = order.slaBreached
            ? ` We sincerely apologize for the delay, as order volume has caused a brief delay in our warehouse.`
            : '';
          draftReply = `Hi ${firstName},\n\nThank you for checking in on order ${order.orderNumber}. Our warehouse team is currently preparing your package for dispatch.${apology} You will receive a notification with tracking as soon as it leaves our facility.\n\nBest regards,\nCustomer Care Team`;
        }
        break;
      }

      case 'refund_request': {
        const hasFinalSale = order?.items.some((i) => i.isFinalSale);

        if (hasFinalSale) {
          isPolicyCompliant = false;
          suggestedAction = 'escalate_manager';
          draftReply = `Hi ${firstName},\n\nThank you for contacting us. We reviewed order ${order?.orderNumber || ''}. Because your order includes final-sale clearance items, our standard policy does not permit direct cash refunds for these units. However, because you are a valued customer${
            isVip ? ' (VIP)' : ''
          }, I would love to explore store credit or an exchange option for you. A customer experience supervisor will review this request within 2 hours.\n\nWarmly,\nCustomer Support Team`;
        } else {
          suggestedAction = 'issue_refund';
          draftReply = `Hi ${firstName},\n\nWe are sorry to hear that your items did not work out. We have initiated your return authorization for order ${order?.orderNumber || ''}. Once the return scan is received by our carrier, your refund of $${((order?.totalCents || 0) / 100).toFixed(2)} will be processed back to your original payment method within 3-5 business days.\n\nThank you for your patience,\nCustomer Care Team`;
        }
        break;
      }

      case 'damaged_item': {
        suggestedAction = 'reship_replacement';
        draftReply = `Hi ${firstName},\n\nWe are so sorry to hear that your order arrived damaged. That is definitely not the standard we strive for. We have queued an expedited replacement order for you right away at zero cost to you. You do not need to worry about returning the broken item. You will receive an updated tracking confirmation as soon as it ships.\n\nSincerely,\nCustomer Care Team`;
        break;
      }

      case 'address_change': {
        if (order && order.status === 'shipped') {
          suggestedAction = 'escalate_manager';
          draftReply = `Hi ${firstName},\n\nThank you for reaching out. Order ${order.orderNumber} has already been dispatched with ${order.carrier || 'the carrier'}, so we are unable to change the delivery address directly in our system. We recommend contacting ${order.carrier || 'the carrier'} with tracking number ${order.trackingNumber || ''} to request a package reroute.\n\nBest regards,\nCustomer Support`;
        } else {
          suggestedAction = 'update_address';
          draftReply = `Hi ${firstName},\n\nWe received your address update request for order ${order?.orderNumber || ''}. As your package has not shipped yet, we have updated your shipping destination to the new address provided.\n\nBest regards,\nCustomer Care Team`;
        }
        break;
      }

      default: {
        draftReply = `Hi ${firstName},\n\nThank you for reaching out to us. We have received your message regarding "${ticket.subject}" and our operations team is reviewing the details. We will update you as soon as possible.\n\nBest regards,\nCustomer Care Team`;
        break;
      }
    }

    // Add VIP touch if applicable
    if (isVip && !draftReply.includes('VIP')) {
      draftReply = draftReply.replace(
        'Customer Care Team',
        'Customer VIP Care Team'
      );
    }

    return {
      ticketId: ticket.ticketId,
      draftReply,
      suggestedAction,
      isPolicyCompliant,
      confidenceScore,
      interpolatedMacros: macros,
    };
  }
}
