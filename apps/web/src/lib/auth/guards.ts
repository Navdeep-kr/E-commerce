import type { UserRole } from '@storefront-ops/db';
import type { UserSession } from './session.ts';

export type OpsModule =
  | 'today'
  | 'orders'
  | 'fulfillment'
  | 'returns'
  | 'catalog'
  | 'inventory'
  | 'purchasing'
  | 'customers'
  | 'marketing'
  | 'support'
  | 'finance'
  | 'tasks'
  | 'reports'
  | 'automations'
  | 'integrations'
  | 'settings';

export type ActionType = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export';

export class AuthorizationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 403) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = statusCode;
  }
}

/**
 * Server guard: Ensure user has an active authenticated session
 */
export function requireUser(session: UserSession | null | undefined): UserSession {
  if (!session || !session.userId) {
    throw new AuthorizationError('Authentication required. Please log in.', 401);
  }
  return session;
}

/**
 * Server guard: Ensure user is a valid member of the target organization
 */
export function requireOrg(session: UserSession | null | undefined, targetOrgSlug: string): UserSession {
  const user = requireUser(session);
  if (user.organizationSlug !== targetOrgSlug) {
    throw new AuthorizationError(
      `Access denied: You are not a member of organization '${targetOrgSlug}'.`,
      403
    );
  }
  return user;
}

/**
 * Evaluate if a role has permission for module and action
 * Implements Part 2: Roles and Permissions Matrix
 */
export function checkPermission(role: UserRole, module: OpsModule, action: ActionType): boolean {
  // Owner/Admin has unrestricted access
  if (role === 'owner_admin') {
    return true;
  }

  // Viewer has strictly read-only access (view action only) across non-sensitive screens
  if (role === 'viewer') {
    if (['finance', 'integrations', 'settings'].includes(module)) return false;
    return action === 'view';
  }

  // Manager has operational and approval access across all operational screens (no billing or integration secrets)
  if (role === 'manager') {
    if (module === 'integrations' && (action === 'create' || action === 'delete')) return false;
    return true;
  }

  // Module-specific role permissions
  switch (module) {
    case 'finance':
      // Finance: Payments, refunds approval, payouts, expenses, P&L, reports; read-only elsewhere
      return role === 'finance';

    case 'orders':
      // Fulfillment and Support can view and edit orders within scope
      if (role === 'fulfillment') return ['view', 'edit'].includes(action);
      if (role === 'support') return ['view', 'edit'].includes(action);
      if (role === 'finance') return action === 'view';
      return false;

    case 'fulfillment':
      return role === 'fulfillment';

    case 'inventory':
      // Fulfillment (counts), Purchasing (full access)
      if (role === 'purchasing') return true;
      if (role === 'fulfillment') return ['view', 'edit'].includes(action);
      return action === 'view';

    case 'purchasing':
      return role === 'purchasing';

    case 'marketing':
      return role === 'marketing';

    case 'support':
      return role === 'support';

    case 'returns':
      return role === 'fulfillment' || role === 'support';

    case 'customers':
      if (role === 'support') return true;
      if (role === 'marketing') return action === 'view'; // segments only
      return action === 'view';

    case 'integrations':
    case 'settings':
      return false; // Only Owner/Admin has integration and setting secrets

    default:
      return false;
  }
}

/**
 * Server guard: Enforce role-based permission check. Throws 403 if disallowed.
 */
export function requirePermission(
  session: UserSession | null | undefined,
  module: OpsModule,
  action: ActionType
): UserSession {
  const user = requireUser(session);
  const allowed = checkPermission(user.role, module, action);

  if (!allowed) {
    throw new AuthorizationError(
      `Permission denied: Role '${user.role}' is not authorized to '${action}' on '${module}'.`,
      403
    );
  }

  return user;
}
