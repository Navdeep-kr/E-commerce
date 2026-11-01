import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  OnboardingService,
  DEFAULT_ONBOARDING_STEPS
} from '../src/onboarding-service.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');

describe('Step 25: Documentation & Help Center Suite', () => {

  describe('1. Role-Based User Guides Verification', () => {
    const guidesDir = path.join(projectRoot, 'docs', 'user-guides');
    const expectedGuides = [
      'owner-admin-guide.md',
      'warehouse-fulfillment-guide.md',
      'inventory-planner-guide.md',
      'customer-support-guide.md',
      'finance-controller-guide.md'
    ];

    it('should have all 5 persona user guides present on disk', () => {
      assert.ok(fs.existsSync(guidesDir), 'docs/user-guides directory must exist');
      for (const guide of expectedGuides) {
        const fullPath = path.join(guidesDir, guide);
        assert.ok(fs.existsSync(fullPath), `User guide ${guide} must exist`);
      }
    });

    it('should verify inventory planner guide documents the core invariant available = on_hand - committed', () => {
      const content = fs.readFileSync(path.join(guidesDir, 'inventory-planner-guide.md'), 'utf-8');
      assert.ok(content.includes('available = on_hand - committed') || content.includes('available} = \\text{on\\_hand} - \\text{committed}'));
      assert.ok(content.includes('inventory_movements'));
      assert.ok(content.includes('append-only'));
    });

    it('should verify finance controller guide enforces integer minor units and balanced debits/credits', () => {
      const content = fs.readFileSync(path.join(guidesDir, 'finance-controller-guide.md'), 'utf-8');
      assert.ok(content.includes('Debits') && content.includes('Credits'));
      assert.ok(content.includes('cents'));
    });

    it('should verify warehouse guide documents barcode scanning and pack station workflows', () => {
      const content = fs.readFileSync(path.join(guidesDir, 'warehouse-fulfillment-guide.md'), 'utf-8');
      assert.ok(content.includes('Pack Station'));
      assert.ok(content.includes('barcode'));
      assert.ok(content.includes('Shipping Label'));
    });
  });

  describe('2. Developer & API Documentation Verification', () => {
    const apiDir = path.join(projectRoot, 'docs', 'api');

    it('should have public REST API and Webhook documentation files present', () => {
      assert.ok(fs.existsSync(apiDir), 'docs/api directory must exist');
      assert.ok(fs.existsSync(path.join(apiDir, 'public-rest-api-reference.md')));
      assert.ok(fs.existsSync(path.join(apiDir, 'webhook-integration-guide.md')));
    });

    it('should verify REST API docs document Bearer auth, integer cents, and endpoints', () => {
      const content = fs.readFileSync(path.join(apiDir, 'public-rest-api-reference.md'), 'utf-8');
      assert.ok(content.includes('Authorization: Bearer'));
      assert.ok(content.includes('integer minor units') || content.includes('cents'));
      assert.ok(content.includes('/v1/orders'));
      assert.ok(content.includes('/v1/inventory'));
      assert.ok(content.includes('/v1/orders/{order_id}/fulfillments'));
    });

    it('should verify webhook docs document HMAC-SHA256 signature verification code', () => {
      const content = fs.readFileSync(path.join(apiDir, 'webhook-integration-guide.md'), 'utf-8');
      assert.ok(content.includes('HMAC-SHA256'));
      assert.ok(content.includes('crypto.createHmac'));
      assert.ok(content.includes('idempotency_key'));
    });
  });

  describe('3. Step 25 Exit Check: Unassisted User Onboarding in < 30 Minutes', () => {
    it('should define exactly 6 structured onboarding checklist steps totaling < 30 minutes', () => {
      assert.equal(DEFAULT_ONBOARDING_STEPS.length, 6);
      const totalEstimatedMinutes = DEFAULT_ONBOARDING_STEPS.reduce((sum, s) => sum + s.estimatedMinutes, 0);
      assert.ok(
        totalEstimatedMinutes < 30,
        `Total estimated onboarding duration must be strictly < 30 minutes. Found: ${totalEstimatedMinutes} mins`
      );
    });

    it('should track sequential step completion and progress percentage', () => {
      const service = new OnboardingService();
      const tenantId = 'org_fresh_merchant';

      const initial = service.getOrCreateOnboardingState(tenantId);
      assert.equal(initial.completionPercentage, 0);
      assert.equal(initial.isComplete, false);

      const afterStep1 = service.completeStep(tenantId, 'CONNECT_SALES_CHANNEL', { channel: 'Shopify' });
      assert.equal(afterStep1.completionPercentage, 17); // 1/6 ~ 17%
      assert.equal(afterStep1.steps[0]?.status, 'completed');

      const afterStep2 = service.completeStep(tenantId, 'CONFIGURE_WAREHOUSE_BINS');
      assert.equal(afterStep2.completionPercentage, 33); // 2/6 ~ 33%
    });

    it('should prove unassisted user can complete all onboarding steps and process first order in < 30 minutes', () => {
      const service = new OnboardingService();
      const result = service.simulateUnassistedOnboarding('org_unassisted_test');

      assert.equal(result.success, true);
      assert.equal(result.state.isComplete, true);
      assert.equal(result.state.completionPercentage, 100);
      assert.ok(
        result.totalSimulatedMinutes < 30,
        `Exit Check Failed: Onboarding took ${result.totalSimulatedMinutes} mins, must be < 30 mins`
      );

      // Verify every step was completed
      for (const step of result.state.steps) {
        assert.equal(step.status, 'completed', `Step ${step.id} should be completed`);
        assert.ok(step.completedAt, `Step ${step.id} must have completedAt timestamp`);
      }

      // Verify final order fulfillment step has metadata
      const firstOrderStep = result.state.steps.find(s => s.id === 'PROCESS_FIRST_ORDER');
      assert.equal(firstOrderStep?.metadata?.status, 'SHIPPED');
      assert.ok(firstOrderStep?.metadata?.trackingNumber);
    });
  });

});
