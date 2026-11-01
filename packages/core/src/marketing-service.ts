/**
 * Storefront Ops Core: Marketing, Discounts & Attribution Engine
 * Playbook Step 12 (Spec Part 3.10): Promotional discounts with stacking rules, UTM attribution, and ROAS/CAC/MER calculations
 */

export type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping' | 'tiered' | 'bogo';
export type StackingRule = 'exclusive' | 'stackable_with_shipping' | 'unrestricted';

export interface DiscountRule {
  id: string;
  code: string;
  type: DiscountType;
  value: number; // Percentage (e.g. 20 for 20%) or minor units (e.g. 1500 for $15.00)
  minSpendMinor?: number; // Minimum order value required
  tierThresholds?: { spendMinor: number; discountMinor: number }[]; // For tiered discounts
  stackingRule: StackingRule;
  maxUsageTotal?: number;
  currentUsageCount?: number;
  maxUsagePerCustomer?: number;
  startsAtIso?: string;
  expiresAtIso?: string;
}

export interface CartDiscountItem {
  sku: string;
  quantity: number;
  unitPriceMinor: number;
}

export interface CartDiscountInput {
  items: CartDiscountItem[];
  subtotalMinor: number;
  shippingFeeMinor: number;
}

export interface DiscountApplicationResult {
  valid: boolean;
  appliedDiscountCodes: string[];
  totalDiscountMinor: number;
  discountedShippingMinor: number;
  finalTotalMinor: number;
  discountsBreakdown: {
    code: string;
    type: DiscountType;
    amountMinor: number;
  }[];
  errors?: string[];
}

export interface CampaignMetricsInput {
  adSpendMinor: number;
  attributedRevenueMinor: number;
  totalGrossSalesMinor: number;
  newCustomersCount: number;
}

export interface CampaignMetricsResult {
  roas: number; // e.g. 4.5x
  mer: number; // e.g. 5.2x
  cacMinor: number; // e.g. $45.00 = 4500 cents
}

export class MarketingService {
  /**
   * Validate discount stacking compatibility
   * Exclusive discounts cannot be combined with any other discount.
   */
  static validateStacking(discounts: DiscountRule[]): {
    canStack: boolean;
    error?: string;
  } {
    if (discounts.length <= 1) return { canStack: true };

    const exclusive = discounts.find((d) => d.stackingRule === 'exclusive');
    if (exclusive) {
      return {
        canStack: false,
        error: `Discount code "${exclusive.code}" is exclusive and cannot be combined with other discounts.`,
      };
    }

    const shippingOnly = discounts.filter((d) => d.stackingRule === 'stackable_with_shipping');
    if (shippingOnly.length > 0) {
      const nonShippingStackable = discounts.filter(
        (d) => d.type !== 'free_shipping' && d.stackingRule === 'stackable_with_shipping'
      );
      if (nonShippingStackable.length > 1) {
        return {
          canStack: false,
          error: `Multiple promotional discount codes cannot be combined.`,
        };
      }
    }

    return { canStack: true };
  }

  /**
   * Apply validated discount rules to cart
   */
  static applyDiscounts(
    cart: CartDiscountInput,
    discounts: DiscountRule[]
  ): DiscountApplicationResult {
    const stackingCheck = this.validateStacking(discounts);
    if (!stackingCheck.canStack) {
      return {
        valid: false,
        appliedDiscountCodes: [],
        totalDiscountMinor: 0,
        discountedShippingMinor: cart.shippingFeeMinor,
        finalTotalMinor: cart.subtotalMinor + cart.shippingFeeMinor,
        discountsBreakdown: [],
        errors: [stackingCheck.error!],
      };
    }

    let itemDiscountTotalMinor = 0;
    let shippingDiscountMinor = 0;
    const appliedCodes: string[] = [];
    const breakdown: DiscountApplicationResult['discountsBreakdown'] = [];

    for (const rule of discounts) {
      // Check minimum spend
      if (rule.minSpendMinor && cart.subtotalMinor < rule.minSpendMinor) {
        continue;
      }

      let discountAmountMinor = 0;

      switch (rule.type) {
        case 'percentage':
          discountAmountMinor = Math.round((cart.subtotalMinor * rule.value) / 100);
          itemDiscountTotalMinor += discountAmountMinor;
          break;

        case 'fixed_amount':
          discountAmountMinor = Math.min(cart.subtotalMinor, rule.value);
          itemDiscountTotalMinor += discountAmountMinor;
          break;

        case 'free_shipping':
          shippingDiscountMinor = cart.shippingFeeMinor;
          discountAmountMinor = cart.shippingFeeMinor;
          break;

        case 'tiered':
          if (rule.tierThresholds && rule.tierThresholds.length > 0) {
            // Find highest matching tier threshold
            const sortedTiers = [...rule.tierThresholds].sort(
              (a, b) => b.spendMinor - a.spendMinor
            );
            const matchedTier = sortedTiers.find((t) => cart.subtotalMinor >= t.spendMinor);
            if (matchedTier) {
              discountAmountMinor = matchedTier.discountMinor;
              itemDiscountTotalMinor += discountAmountMinor;
            }
          }
          break;

        case 'bogo':
          // Buy 1 get 1 item at specified percentage discount
          if (cart.items.length >= 2) {
            const sortedItems = [...cart.items].sort((a, b) => a.unitPriceMinor - b.unitPriceMinor);
            const cheapest = sortedItems[0];
            discountAmountMinor = Math.round((cheapest.unitPriceMinor * rule.value) / 100);
            itemDiscountTotalMinor += discountAmountMinor;
          }
          break;
      }

      if (discountAmountMinor > 0) {
        appliedCodes.push(rule.code);
        breakdown.push({
          code: rule.code,
          type: rule.type,
          amountMinor: discountAmountMinor,
        });
      }
    }

    // Clamp total item discount so it doesn't exceed cart subtotal
    itemDiscountTotalMinor = Math.min(cart.subtotalMinor, itemDiscountTotalMinor);
    const finalShippingMinor = Math.max(0, cart.shippingFeeMinor - shippingDiscountMinor);
    const finalTotalMinor = cart.subtotalMinor - itemDiscountTotalMinor + finalShippingMinor;

    return {
      valid: true,
      appliedDiscountCodes: appliedCodes,
      totalDiscountMinor: itemDiscountTotalMinor + shippingDiscountMinor,
      discountedShippingMinor: finalShippingMinor,
      finalTotalMinor,
      discountsBreakdown: breakdown,
    };
  }

  /**
   * Calculate Marketing Performance KPIs: ROAS, MER, and CAC
   */
  static calculateCampaignMetrics(input: CampaignMetricsInput): CampaignMetricsResult {
    const { adSpendMinor, attributedRevenueMinor, totalGrossSalesMinor, newCustomersCount } = input;

    // ROAS = Attributed Revenue / Channel Ad Spend
    const roas = adSpendMinor > 0 ? Math.round((attributedRevenueMinor / adSpendMinor) * 100) / 100 : 0;

    // MER (Marketing Efficiency Ratio) = Blended Gross Sales / Total Ad Spend
    const mer = adSpendMinor > 0 ? Math.round((totalGrossSalesMinor / adSpendMinor) * 100) / 100 : 0;

    // CAC = Total Ad Spend / New Customers Acquired
    const cacMinor = newCustomersCount > 0 ? Math.round(adSpendMinor / newCustomersCount) : 0;

    return {
      roas,
      mer,
      cacMinor,
    };
  }

  /**
   * Build clean UTM tracking link
   */
  static buildUtmLink(
    baseUrl: string,
    params: {
      source: string;
      medium: string;
      campaign: string;
      content?: string;
      term?: string;
    }
  ): string {
    const url = new URL(baseUrl);
    url.searchParams.set('utm_source', params.source);
    url.searchParams.set('utm_medium', params.medium);
    url.searchParams.set('utm_campaign', params.campaign);
    if (params.content) url.searchParams.set('utm_content', params.content);
    if (params.term) url.searchParams.set('utm_term', params.term);
    return url.toString();
  }
}
