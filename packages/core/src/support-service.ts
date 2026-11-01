/**
 * Storefront Ops Core: Support & Omnichannel Inbox Service
 * Playbook Step 10 (Spec Part 3.11): Ticket SLA tracking, priority queues, and canned macro responses
 */

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'pending_customer' | 'resolved' | 'closed';
export type TicketChannel = 'email' | 'chat' | 'sms';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  subject: string;
  priority: TicketPriority;
  status: TicketStatus;
  channel: TicketChannel;
  createdAt: string;
  firstResponseDueIso: string;
  orderNumber?: string;
}

export class SupportService {
  /**
   * Calculate first-response SLA deadline based on ticket priority
   */
  static calculateFirstResponseDeadline(
    createdAtIso: string,
    priority: TicketPriority
  ): string {
    const created = new Date(createdAtIso);
    let targetMinutes = 1440; // 24 hours default for low

    switch (priority) {
      case 'urgent':
        targetMinutes = 60; // 1 hour
        break;
      case 'high':
        targetMinutes = 240; // 4 hours
        break;
      case 'medium':
        targetMinutes = 720; // 12 hours
        break;
      case 'low':
        targetMinutes = 1440; // 24 hours
        break;
    }

    const deadline = new Date(created.getTime() + targetMinutes * 60 * 1000);
    return deadline.toISOString();
  }

  /**
   * Determine ticket SLA status relative to current time
   */
  static getSlaUrgency(
    deadlineIso: string,
    now: Date = new Date()
  ): {
    status: 'ok' | 'warning' | 'breached';
    minutesRemaining: number;
  } {
    const deadlineTime = new Date(deadlineIso).getTime();
    const diffMs = deadlineTime - now.getTime();
    const minutesRemaining = Math.round(diffMs / 60000);

    if (minutesRemaining <= 0) {
      return { status: 'breached', minutesRemaining: 0 };
    } else if (minutesRemaining <= 60) {
      return { status: 'warning', minutesRemaining };
    }

    return { status: 'ok', minutesRemaining };
  }

  /**
   * Interpolate canned macros / quick reply templates
   */
  static interpolateMacro(
    template: string,
    variables: Record<string, string | number>
  ): string {
    let result = template;
    for (const [key, val] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(val));
    }
    return result;
  }
}
