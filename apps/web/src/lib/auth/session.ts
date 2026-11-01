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

/**
 * Decode session token / cookie payload
 */
export function parseSessionToken(token: string | undefined): UserSession | null {
  if (!token) return null;
  try {
    // If token matches a demo user key (e.g. 'admin', 'support')
    if (DEMO_USERS[token]) {
      return DEMO_USERS[token];
    }
    // Otherwise parse JSON / JWT string
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    return decoded as UserSession;
  } catch {
    return null;
  }
}

/**
 * Encode session token for cookie storage
 */
export function encodeSessionToken(session: UserSession): string {
  return Buffer.from(JSON.stringify(session)).toString('base64');
}
