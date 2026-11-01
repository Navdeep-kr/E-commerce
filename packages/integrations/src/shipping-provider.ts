export interface ShippingAddressInput {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

export interface ParcelDimensions {
  lengthInches: number;
  widthInches: number;
  heightInches: number;
  weightOunces: number;
}

export interface ShippingRate {
  rateId: string;
  carrier: string;
  serviceName: string;
  amountMinor: number;
  currency: string;
  estimatedDeliveryDays?: number;
}

export interface ShippingLabel {
  shipmentId: string;
  labelUrl: string;
  trackingNumber: string;
  carrier: string;
  service: string;
  costMinor: number;
}

export interface ShippingProvider {
  readonly providerName: string;

  /**
   * Rate shopping across carriers for parcel
   */
  getRates(from: ShippingAddressInput, to: ShippingAddressInput, parcel: ParcelDimensions): Promise<ShippingRate[]>;

  /**
   * Purchase shipping label by rate ID
   */
  buyLabel(rateId: string): Promise<ShippingLabel>;

  /**
   * Void/refund unused shipping label
   */
  voidLabel(shipmentId: string): Promise<{ success: boolean }>;

  /**
   * Retrieve live tracking updates
   */
  trackShipment(trackingNumber: string, carrier: string): Promise<{ status: string; estimatedDelivery?: string }>;
}
