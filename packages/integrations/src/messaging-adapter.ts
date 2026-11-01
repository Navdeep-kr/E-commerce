/**
 * Messaging Adapters (Email & SMS)
 * Decoupled providers for transactional messaging (Resend, Twilio) with mock delivery status handling.
 */

export interface EmailMessagePayload {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
  tags?: Record<string, string>;
}

export interface SmsMessagePayload {
  to: string;
  from?: string;
  body: string;
}

export interface MessagingSendResult {
  providerMessageId: string;
  status: 'sent' | 'queued' | 'failed';
  provider: 'resend' | 'twilio';
  deliveredAt: string;
}

export class EmailMessagingAdapter {
  private readonly apiKey: string;
  private readonly defaultSender: string;

  constructor(apiKey: string = 'mock_resend_key', defaultSender: string = 'orders@storefrontops.com') {
    this.apiKey = apiKey;
    this.defaultSender = defaultSender;
  }

  public async sendEmail(payload: EmailMessagePayload): Promise<MessagingSendResult> {
    if (!payload.to || !payload.subject) {
      throw new Error('Email recipient and subject are required.');
    }

    const providerMessageId = `resend_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return {
      providerMessageId,
      status: 'sent',
      provider: 'resend',
      deliveredAt: new Date().toISOString(),
    };
  }
}

export class SmsMessagingAdapter {
  private readonly accountSid: string;
  private readonly fromNumber: string;

  constructor(accountSid: string = 'mock_twilio_sid', fromNumber: string = '+15550199283') {
    this.accountSid = accountSid;
    this.fromNumber = fromNumber;
  }

  public async sendSms(payload: SmsMessagePayload): Promise<MessagingSendResult> {
    if (!payload.to || !payload.body) {
      throw new Error('SMS recipient and body are required.');
    }

    const providerMessageId = `twilio_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return {
      providerMessageId,
      status: 'sent',
      provider: 'twilio',
      deliveredAt: new Date().toISOString(),
    };
  }
}
