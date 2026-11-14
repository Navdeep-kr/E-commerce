import nodeCrypto from 'crypto';
import type { UserRole } from '@storefront-ops/db';

export interface UserSession {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
}

export const DEMO_USERS: Record<string, UserSession> = {
  admin: {
    userId: '30000000-0000-0000-0000-000000000001',
    email: 'admin@acmecommerce.com',
    fullName: 'Alex Mercer',
    role: 'owner_admin',
    organizationId: '00000000-0000-0000-0000-000000000001',
    organizationSlug: 'acme-commerce',
    organizationName: 'Acme Commerce Labs',
  },
  manager: {
    userId: '30000000-0000-0000-0000-000000000002',
    email: 'manager@acmecommerce.com',
    fullName: 'Morgan Blake',
    role: 'manager',
    organizationId: '00000000-0000-0000-0000-000000000001',
    organizationSlug: 'acme-commerce',
    organizationName: 'Acme Commerce Labs',
  },
  fulfillment: {
    userId: '30000000-0000-0000-0000-000000000003',
    email: 'warehouse@acmecommerce.com',
    fullName: 'Sam Rivera',
    role: 'fulfillment',
    organizationId: '00000000-0000-0000-0000-000000000001',
    organizationSlug: 'acme-commerce',
    organizationName: 'Acme Commerce Labs',
  },
  purchasing: {
    userId: '30000000-0000-0000-0000-000000000004',
    email: 'purchasing@acmecommerce.com',
    fullName: 'Dana Vance',
    role: 'purchasing',
    organizationId: '00000000-0000-0000-0000-000000000001',
    organizationSlug: 'acme-commerce',
    organizationName: 'Acme Commerce Labs',
  },
  marketing: {
    userId: '30000000-0000-0000-0000-000000000005',
    email: 'marketing@acmecommerce.com',
    fullName: 'Riley Hayes',
    role: 'marketing',
    organizationId: '00000000-0000-0000-0000-000000000001',
    organizationSlug: 'acme-commerce',
    organizationName: 'Acme Commerce Labs',
  },
  support: {
    userId: '30000000-0000-0000-0000-000000000006',
    email: 'support@acmecommerce.com',
    fullName: 'Taylor Chen',
    role: 'support',
    organizationId: '00000000-0000-0000-0000-000000000001',
    organizationSlug: 'acme-commerce',
    organizationName: 'Acme Commerce Labs',
  },
  finance: {
    userId: '30000000-0000-0000-0000-000000000007',
    email: 'finance@acmecommerce.com',
    fullName: 'Jordan Bell',
    role: 'finance',
    organizationId: '00000000-0000-0000-0000-000000000001',
    organizationSlug: 'acme-commerce',
    organizationName: 'Acme Commerce Labs',
  },
  viewer: {
    userId: '30000000-0000-0000-0000-000000000008',
    email: 'viewer@acmecommerce.com',
    fullName: 'Chris Evans',
    role: 'viewer',
    organizationId: '00000000-0000-0000-0000-000000000001',
    organizationSlug: 'acme-commerce',
    organizationName: 'Acme Commerce Labs',
  },
};

export const SESSION_COOKIE_NAME = 'storefront_session';

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.SESSION_SECRET || 'storefront-ops-secure-salt-key-928173618471';

/**
 * Sign payload using Web Crypto API (supported natively in Next.js Edge Runtime, Node.js, and modern runtimes)
 */
async function computeWebCryptoHmac(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Buffer.from(signature).toString('base64url');
}

/**
 * Universal async verification compatible with Next.js Edge Runtime (middleware)
 */
export async function verifySessionToken(token: string | undefined): Promise<UserSession | null> {
  if (!token) return null;
  try {
    if (process.env.NODE_ENV !== 'production' && DEMO_USERS[token]) {
      return DEMO_USERS[token];
    }

    const parts = token.split('.');
    if (parts.length === 2) {
      const [payloadBase64, signature] = parts;
      const expectedSignature = await computeWebCryptoHmac(payloadBase64, AUTH_SECRET);

      if (signature !== expectedSignature) {
        return null;
      }

      const decoded = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
      return decoded as UserSession;
    }

    if (process.env.NODE_ENV !== 'production') {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
      return decoded as UserSession;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Encode session token with cryptographic HMAC-SHA256 signature
 */
export function encodeSessionToken(session: UserSession): string {
  const payloadBase64 = Buffer.from(JSON.stringify(session), 'utf8').toString('base64url');
  let signature = '';
  if (nodeCrypto && typeof nodeCrypto.createHmac === 'function') {
    signature = nodeCrypto.createHmac('sha256', AUTH_SECRET).update(payloadBase64).digest('base64url');
  }
  return `${payloadBase64}.${signature}`;
}

/**
 * Decode session token and verify cryptographic HMAC-SHA256 signature (synchronous for Node.js runtime)
 */
export function parseSessionToken(token: string | undefined): UserSession | null {
  if (!token) return null;
  try {
    // Demo shortcut key allowed ONLY in non-production environments
    if (process.env.NODE_ENV !== 'production' && DEMO_USERS[token]) {
      return DEMO_USERS[token];
    }

    // Signed format: payloadBase64.signature
    const parts = token.split('.');
    if (parts.length === 2) {
      const [payloadBase64, signature] = parts;
      let expectedSignature = '';
      if (nodeCrypto && typeof nodeCrypto.createHmac === 'function') {
        expectedSignature = nodeCrypto.createHmac('sha256', AUTH_SECRET).update(payloadBase64).digest('base64url');
      }

      if (!expectedSignature || signature !== expectedSignature) {
        return null;
      }

      const decoded = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
      return decoded as UserSession;
    }

    // Graceful fallback for unsigned legacy tokens in non-production development
    if (process.env.NODE_ENV !== 'production') {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
      return decoded as UserSession;
    }

    return null;
  } catch {
    return null;
  }
}
