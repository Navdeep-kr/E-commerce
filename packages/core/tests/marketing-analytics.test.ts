import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  MarketingService,
  AnalyticsService,
  METRIC_DICTIONARY,
  type DiscountRule,
  type CartDiscountInput,
  type ReportQueryDefinition,
} from '../src/index.ts';

describe('Step 12: Marketing & Analytics Modules', () => {
  describe('MarketingService, Discounts & Attribution', () => {
    test('enforces discount stacking rules and rejects exclusive conflicts', () => {
      const exclusivePromo: DiscountRule = {
        id: 'd-1',
        code: 'BLACKFRIDAY50',
        type: 'percentage',
        value: 50,
        stackingRule: 'exclusive',
      };

      const regularPromo: DiscountRule = {
        id: 'd-2',
        code: 'WELCOME10',
        type: 'percentage',
        value: 10,
        stackingRule: 'stackable_with_shipping',
      };

      const freeShipping: DiscountRule = {
        id: 'd-3',
        code: 'FREESHIP',
        type: 'free_shipping',
        value: 0,
        stackingRule: 'stackable_with_shipping',
      };

      // Conflict: Exclusive code cannot stack with another code
      const conflictCheck = MarketingService.validateStacking([exclusivePromo, freeShipping]);
      assert.equal(conflictCheck.canStack, false);
      assert.match(conflictCheck.error || '', /is exclusive/);

      // Allowed: Regular promo with free shipping
      const allowedCheck = MarketingService.validateStacking([regularPromo, freeShipping]);
      assert.equal(allowedCheck.canStack, true);
    });

    test('correctly calculates tiered discounts and applies to cart', () => {
      const cart: CartDiscountInput = {
        items: [
          { sku: 'HOODIE-BLK-M', quantity: 2, unitPriceMinor: 6500 }, // $130.00
          { sku: 'TEE-WHT-L', quantity: 1, unitPriceMinor: 3000 }, // $30.00
        ],
        subtotalMinor: 16000, // $160.00
        shippingFeeMinor: 1000, // $10.00
      };

      // Spend $100 get $15 off, spend $200 get $40 off
      const tieredDiscount: DiscountRule = {
        id: 'd-tiered',
        code: 'TIERED15',
        type: 'tiered',
        value: 0,
        tierThresholds: [
          { spendMinor: 10000, discountMinor: 1500 }, // Spend $100 -> $15 off
          { spendMinor: 20000, discountMinor: 4000 }, // Spend $200 -> $40 off
        ],
        stackingRule: 'unrestricted',
      };

      const result = MarketingService.applyDiscounts(cart, [tieredDiscount]);
      assert.equal(result.valid, true);
      assert.equal(result.totalDiscountMinor, 1500); // Matched $100 tier for $15.00 off
      assert.equal(result.finalTotalMinor, 16000 - 1500 + 1000); // $155.00
    });

    test('calculates marketing performance KPIs: ROAS, MER, and CAC', () => {
      const metrics = MarketingService.calculateCampaignMetrics({
        adSpendMinor: 2500000, // $25,000.00 ad spend
        attributedRevenueMinor: 10000000, // $100,000.00 direct channel revenue
        totalGrossSalesMinor: 15000000, // $150,000.00 store gross sales
        newCustomersCount: 500, // 500 new customers
      });

      // ROAS = 100,000 / 25,000 = 4.0x
      assert.equal(metrics.roas, 4.0);

      // MER = 150,000 / 25,000 = 6.0x
      assert.equal(metrics.mer, 6.0);

      // CAC = $25,000 / 500 = $50.00 (5,000 cents)
      assert.equal(metrics.cacMinor, 5000);
    });

    test('generates clean UTM tracking URLs', () => {
      const link = MarketingService.buildUtmLink('https://storefront.example.com/products/hoodie', {
        source: 'instagram',
        medium: 'paid_social',
        campaign: 'fall_collection_2026',
        content: 'video_carousel_a',
      });

      assert.match(link, /utm_source=instagram/);
      assert.match(link, /utm_medium=paid_social/);
      assert.match(link, /utm_campaign=fall_collection_2026/);
      assert.match(link, /utm_content=video_carousel_a/);
    });
  });

  describe('AnalyticsService, Metric Dictionary & Safe Parameterized SQL Compiler', () => {
    test('Exit Check: Metric definitions are globally consistent and cover all key operational KPIs', () => {
      const requiredMetrics = [
        'net_sales',
        'gross_sales',
        'cogs',
        'gross_margin_bps',
        'aov',
        'roas',
        'mer',
        'cac',
        'orders_count',
        'units_sold',
      ];

      for (const metricKey of requiredMetrics) {
        const def = AnalyticsService.getMetricDefinition(metricKey);
        assert.ok(def, `Metric definition "${metricKey}" must be defined in central dictionary!`);
        assert.equal(def?.id, metricKey);
        assert.ok(def?.sqlFormula.length > 0);
        assert.ok(def?.description.length > 0);
      }
    });

    test('Exit Check: Custom report builder queries compile to safe parameterized SQL with mandatory tenant isolation', () => {
      const queryDef: ReportQueryDefinition = {
        organizationId: 'org_acme_corp',
        dimensions: ['channel', 'order_status'],
        metrics: ['net_sales', 'orders_count', 'aov'],
        startDateIso: '2026-10-01T00:00:00Z',
        endDateIso: '2026-10-31T23:59:59Z',
        filters: [{ field: 'status', operator: '=', value: 'shipped' }],
        orderBy: { field: 'net_sales', direction: 'DESC' },
        limit: 50,
      };

      const compiled = AnalyticsService.compileSafeQuery(queryDef);

      // 1. Mandatory Tenant Scoping ($1)
      assert.equal(compiled.params[0], 'org_acme_corp');
      assert.match(compiled.sql, /organization_id = \$1/);

      // 2. Dates parameterization ($2, $3)
      assert.equal(compiled.params[1], '2026-10-01T00:00:00Z');
      assert.equal(compiled.params[2], '2026-10-31T23:59:59Z');
      assert.match(compiled.sql, /created_at >= \$2/);
      assert.match(compiled.sql, /created_at <= \$3/);

      // 3. Filter parameterization ($4)
      assert.equal(compiled.params[3], 'shipped');
      assert.match(compiled.sql, /status = \$4/);

      // 4. Limit parameterization ($5)
      assert.equal(compiled.params[4], 50);
      assert.match(compiled.sql, /LIMIT \$5/);

      // 5. Enforces GROUP BY on all non-aggregate dimensions
      assert.match(compiled.sql, /GROUP BY sales_channel, status/);

      // 6. Enforces ORDER BY
      assert.match(compiled.sql, /ORDER BY net_sales DESC/);
    });

    test('strictly rejects unauthorized or unsafe query injections', () => {
      const maliciousDef: any = {
        organizationId: 'org_test',
        dimensions: ['channel'],
        metrics: ['net_sales'],
        startDateIso: '2026-10-01T00:00:00Z',
        endDateIso: '2026-10-31T00:00:00Z',
        filters: [{ field: 'status; DROP TABLE users; --', operator: '=', value: 'bad' }],
      };

      assert.throws(() => {
        AnalyticsService.compileSafeQuery(maliciousDef);
      }, /Illegal characters in filter field/);

      // Unselected sort field rejection
      const badSortDef: any = {
        organizationId: 'org_test',
        dimensions: ['channel'],
        metrics: ['net_sales'],
        startDateIso: '2026-10-01T00:00:00Z',
        endDateIso: '2026-10-31T00:00:00Z',
        orderBy: { field: 'non_existent_column', direction: 'ASC' },
      };

      assert.throws(() => {
        AnalyticsService.compileSafeQuery(badSortDef);
      }, /Cannot sort by unselected field/);
    });
  });
});
