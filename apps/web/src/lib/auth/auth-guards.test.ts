import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { requireUser, requireOrg, requirePermission, checkPermission, AuthorizationError } from './guards.ts';
import { DEMO_USERS } from './session.ts';
import { RateLimiter } from './rate-limiter.ts';

describe('Auth Guards & Server RBAC Matrix (Step 4)', () => {
  it('throws 401 Unauthorized when session is missing', () => {
    assert.throws(
      () => requireUser(null),
      (err: unknown) => {
        const error = err as AuthorizationError;
        return error.statusCode === 401 && error.message.includes('Authentication required');
      }
    );
  });

  it('validates user membership against target organization slug', () => {
    const admin = DEMO_USERS.admin;
    // Matches org
    const user = requireOrg(admin, 'acme-commerce');
    assert.equal(user.email, admin.email);

    // Mismatched org throws 403
    assert.throws(
      () => requireOrg(admin, 'other-store'),
      (err: unknown) => {
        const error = err as AuthorizationError;
        return error.statusCode === 403 && error.message.includes('not a member');
      }
    );
  });

  it('proves Exit Check: Support role CANNOT open or mutate Finance', () => {
    const supportUser = DEMO_USERS.support;
    assert.equal(checkPermission(supportUser.role, 'finance', 'view'), false);
    assert.equal(checkPermission(supportUser.role, 'finance', 'edit'), false);

    assert.throws(
      () => requirePermission(supportUser, 'finance', 'view'),
      /Permission denied: Role 'support' is not authorized to 'view' on 'finance'/
    );
  });

  it('proves Exit Check: Fulfillment role CANNOT access Finance or Marketing', () => {
    const warehouseUser = DEMO_USERS.fulfillment;
    assert.equal(checkPermission(warehouseUser.role, 'finance', 'view'), false);
    assert.equal(checkPermission(warehouseUser.role, 'marketing', 'view'), false);

    // Can access orders and fulfillment
    assert.equal(checkPermission(warehouseUser.role, 'orders', 'view'), true);
    assert.equal(checkPermission(warehouseUser.role, 'fulfillment', 'view'), true);
  });

  it('proves Finance role has full access to finance module', () => {
    const financeUser = DEMO_USERS.finance;
    assert.equal(checkPermission(financeUser.role, 'finance', 'view'), true);
    assert.equal(checkPermission(financeUser.role, 'finance', 'approve'), true);
    // Read-only on orders
    assert.equal(checkPermission(financeUser.role, 'orders', 'view'), true);
    assert.equal(checkPermission(financeUser.role, 'orders', 'edit'), false);
  });

  it('enforces that Viewer is strictly read-only', () => {
    const viewer = DEMO_USERS.viewer;
    assert.equal(checkPermission(viewer.role, 'orders', 'view'), true);
    assert.equal(checkPermission(viewer.role, 'orders', 'create'), false);
    assert.equal(checkPermission(viewer.role, 'inventory', 'edit'), false);
    assert.equal(checkPermission(viewer.role, 'finance', 'view'), false);
  });

  it('enforces Owner/Admin has unrestricted access', () => {
    const admin = DEMO_USERS.admin;
    assert.equal(checkPermission(admin.role, 'finance', 'edit'), true);
    assert.equal(checkPermission(admin.role, 'settings', 'create'), true);
    assert.equal(checkPermission(admin.role, 'integrations', 'delete'), true);
  });

  it('locks out account after 5 consecutive failed login attempts', () => {
    const testKey = 'test-lockout@example.com';
    RateLimiter.reset(testKey);

    // 4 failed attempts
    for (let i = 1; i <= 4; i++) {
      const res = RateLimiter.recordFailure(testKey);
      assert.equal(res.locked, false);
      assert.equal(res.remainingAttempts, 5 - i);
    }

    // 5th failed attempt triggers lockout
    const fifth = RateLimiter.recordFailure(testKey);
    assert.equal(fifth.locked, true);
    assert.equal(fifth.remainingAttempts, 0);

    // Next check verifies locked state
    const status = RateLimiter.isLocked(testKey);
    assert.equal(status.locked, true);
    assert.ok(status.remainingMinutes > 0);

    // Reset unlocks
    RateLimiter.reset(testKey);
    assert.equal(RateLimiter.isLocked(testKey).locked, false);
  });
});
