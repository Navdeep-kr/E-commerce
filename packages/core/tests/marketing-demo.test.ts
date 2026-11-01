import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PublicDemoService } from '../src/public-demo-service.ts';

describe('Step 26: Marketing Site & Launch Assets Suite', () => {
  const demoService = new PublicDemoService();

  describe('1. Interactive Sandbox Demo Simulation', () => {
    it('should simulate full end-to-end order flow in < 100ms with zero authentication', () => {
      const startTime = Date.now();
      const demo = demoService.simulateSandboxOrder('flash_sale');
      const elapsed = Date.now() - startTime;

      assert.ok(elapsed < 100, `Sandbox simulation must execute in < 100ms. Took ${elapsed}ms`);
      assert.ok(demo.orderId.startsWith('ord_demo_'));
      assert.equal(demo.sku, 'SKU-HOODIE-BLK-L');
      assert.equal(demo.totalCents, 8500);
      assert.equal(demo.currency, 'USD');
      assert.ok(demo.trackingNumber.startsWith('9400'));
    });

    it('should adhere to the available = on_hand - committed invariant during demo', () => {
      const demo = demoService.simulateSandboxOrder('standard');
      const { onHand, committed, available } = demo.inventoryState;

      assert.equal(
        available,
        onHand - committed,
        `Inventory invariant must hold: available (${available}) === onHand (${onHand}) - committed (${committed})`
      );
    });

    it('should return all 6 operational phase events with status SUCCESS', () => {
      const demo = demoService.simulateSandboxOrder('standard');
      assert.equal(demo.events.length, 6);

      const phases = demo.events.map(e => e.phase);
      assert.deepEqual(phases, ['Ingress', 'Inventory', 'Fulfillment', 'Packing', 'Shipping', 'Finance']);

      for (const event of demo.events) {
        assert.equal(event.status, 'SUCCESS');
        assert.ok(event.detail.length > 0);
      }
    });
  });

  describe('2. Dynamic Pricing & ROI Calculator', () => {
    it('should recommend Starter tier ($49/mo) for 350 monthly orders', () => {
      const pricing = demoService.calculatePricingAndRoi(350, 1);
      assert.equal(pricing.planTier, 'Starter');
      assert.equal(pricing.monthlyPriceDollars, 49);
      assert.equal(pricing.monthlyOrdersLimit, 500);
      assert.ok(pricing.roiMetrics.hoursSavedPerMonth > 0);
      assert.ok(pricing.roiMetrics.estimatedNetSavingsDollars > 0);
    });

    it('should recommend Growth tier ($149/mo) for 2,500 monthly orders', () => {
      const pricing = demoService.calculatePricingAndRoi(2500, 3);
      assert.equal(pricing.planTier, 'Growth');
      assert.equal(pricing.monthlyPriceDollars, 149);
      assert.equal(pricing.monthlyOrdersLimit, 5000);
      assert.equal(pricing.warehousesIncluded, 5);
      assert.equal(pricing.teamSeatsIncluded, 10);
    });

    it('should recommend Scale tier ($399/mo) for 12,000 monthly orders', () => {
      const pricing = demoService.calculatePricingAndRoi(12000, 6);
      assert.equal(pricing.planTier, 'Scale');
      assert.equal(pricing.monthlyPriceDollars, 399);
      assert.equal(pricing.monthlyOrdersLimit, 'Unlimited');
      assert.equal(pricing.warehousesIncluded, 'Unlimited');
      assert.ok(pricing.roiMetrics.estimatedNetSavingsDollars > 5000);
      assert.ok(pricing.roiMetrics.roiMultiple.endsWith('x'));
    });
  });

  describe('3. Production SEO & Social Metadata', () => {
    it('should return valid marketing SEO metadata with OpenGraph and Twitter cards', () => {
      const seo = demoService.getMarketingSeoMetadata();

      assert.ok(seo.title.includes('Storefront Ops'));
      assert.ok(seo.description.length > 50);
      assert.equal(seo.canonicalUrl, 'https://storefrontops.com');
      assert.equal(seo.openGraph.type, 'website');
      assert.equal(seo.twitter.card, 'summary_large_image');
    });

    it('should generate valid Schema.org SoftwareApplication JSON-LD', () => {
      const seo = demoService.getMarketingSeoMetadata();
      const jsonLd = seo.jsonLd as any;

      assert.equal(jsonLd['@context'], 'https://schema.org');
      assert.equal(jsonLd['@type'], 'SoftwareApplication');
      assert.equal(jsonLd.name, 'Storefront Ops');
      assert.equal(jsonLd.applicationCategory, 'BusinessApplication');
      assert.equal(jsonLd.offers.price, '49.00');
      assert.equal(jsonLd.offers.priceCurrency, 'USD');
    });
  });

});
