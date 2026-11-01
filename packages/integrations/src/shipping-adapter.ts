/**
 * Storefront Ops Integrations: Mock Shipping Provider Adapter
 * Playbook Step 9: Rate shopping, carrier label purchases, and tracking simulation
 */

import type {
  ShippingProvider,
  ShippingAddressInput,
  ParcelDimensions,
  ShippingRate,
  ShippingLabel,
} from './shipping-provider.ts';

export class MockShippingAdapter implements ShippingProvider {
  readonly providerName = 'MockShippingAggregator';

  /**
   * Rate shop across available carriers based on parcel weight and destination
   */
  async getRates(
    from: ShippingAddressInput,
    to: ShippingAddressInput,
    parcel: ParcelDimensions
  ): Promise<ShippingRate[]> {
    const isInternational = from.country.toUpperCase() !== to.country.toUpperCase();
    const weightOz = parcel.weightOunces || 16;

    if (isInternational) {
      return [
        {
          rateId: 'rate_dhl_intl_express',
          carrier: 'DHL Express',
          serviceName: 'Worldwide Express',
          amountMinor: 4850, // $48.50
          currency: 'USD',
          estimatedDeliveryDays: 3,
        },
        {
          rateId: 'rate_ups_intl_saver',
          carrier: 'UPS',
          serviceName: 'UPS Worldwide Saver',
          amountMinor: 5200, // $52.00
          currency: 'USD',
          estimatedDeliveryDays: 4,
        },
      ];
    }

    // Domestic Rates
    const baseCostMinor = Math.round(550 + (weightOz / 16) * 150);

    return [
      {
        rateId: 'rate_usps_priority',
        carrier: 'USPS',
        serviceName: 'Priority Mail',
        amountMinor: baseCostMinor,
        currency: 'USD',
        estimatedDeliveryDays: 2,
      },
      {
        rateId: 'rate_ups_ground',
        carrier: 'UPS',
        serviceName: 'UPS Ground',
        amountMinor: baseCostMinor + 120,
        currency: 'USD',
        estimatedDeliveryDays: 3,
      },
      {
        rateId: 'rate_fedex_2day',
        carrier: 'FedEx',
        serviceName: 'FedEx 2Day Air',
        amountMinor: baseCostMinor + 650,
        currency: 'USD',
        estimatedDeliveryDays: 2,
      },
    ];
  }

  /**
   * Buy shipping label and generate live tracking credentials
   */
  async buyLabel(rateId: string): Promise<ShippingLabel> {
    const carrier = rateId.includes('ups')
      ? 'UPS'
      : rateId.includes('fedex')
      ? 'FedEx'
      : rateId.includes('dhl')
      ? 'DHL Express'
      : 'USPS';

    const trackingNumber =
      carrier === 'USPS'
        ? `940011189956${Math.floor(1000000000 + Math.random() * 9000000000)}`
        : carrier === 'UPS'
        ? `1Z99999999${Math.floor(1000000000 + Math.random() * 9000000000)}`
        : `7890${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    return {
      shipmentId: `shp_${Date.now()}`,
      labelUrl: `https://labels.storefrontops.com/${trackingNumber}.pdf`,
      trackingNumber,
      carrier,
      service: rateId.replace('rate_', '').replace(/_/g, ' ').toUpperCase(),
      costMinor: 850,
    };
  }

  /**
   * Void unused shipping label
   */
  async voidLabel(shipmentId: string): Promise<{ success: boolean }> {
    return { success: true };
  }

  /**
   * Return simulated tracking updates
   */
  async trackShipment(
    trackingNumber: string,
    carrier: string
  ): Promise<{ status: string; estimatedDelivery?: string }> {
    return {
      status: 'in_transit',
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }
}
