/**
 * Storefront Ops Core: Customer & CRM Service
 * Playbook Step 10 (Spec Part 3.9): RFM segmentation scoring, 360 profile analytics, and profile merging
 */

export interface RfmScores {
  recencyScore: number; // 1-5
  frequencyScore: number; // 1-5
  monetaryScore: number; // 1-5
  totalScore: number; // 3-15
  segment: 'Champions' | 'Loyal Customers' | 'Promising' | 'At Risk' | 'Churned' | 'First-Time';
}

export interface CustomerProfile {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  lastOrderDateIso?: string;
  ordersCount: number;
  totalSpentMinor: number;
  tags: string[];
  addresses: {
    street1: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    isDefault?: boolean;
  }[];
  mergedIntoId?: string;
}

export class CustomerService {
  /**
   * Calculate RFM (Recency, Frequency, Monetary) scores and segment
   */
  static calculateRfm(
    lastOrderDateIso: string | undefined,
    ordersCount: number,
    totalSpentMinor: number,
    now: Date = new Date()
  ): RfmScores {
    // 1. Recency Score (1-5)
    let recencyScore = 1;
    if (lastOrderDateIso) {
      const daysSinceOrder = Math.max(
        0,
        Math.floor((now.getTime() - new Date(lastOrderDateIso).getTime()) / (1000 * 60 * 60 * 24))
      );
      if (daysSinceOrder <= 30) recencyScore = 5;
      else if (daysSinceOrder <= 60) recencyScore = 4;
      else if (daysSinceOrder <= 90) recencyScore = 3;
      else if (daysSinceOrder <= 180) recencyScore = 2;
      else recencyScore = 1;
    }

    // 2. Frequency Score (1-5)
    let frequencyScore = 1;
    if (ordersCount >= 10) frequencyScore = 5;
    else if (ordersCount >= 5) frequencyScore = 4;
    else if (ordersCount >= 3) frequencyScore = 3;
    else if (ordersCount >= 2) frequencyScore = 2;
    else frequencyScore = 1;

    // 3. Monetary Score (1-5)
    let monetaryScore = 1;
    if (totalSpentMinor >= 100000) monetaryScore = 5; // >= $1,000
    else if (totalSpentMinor >= 50000) monetaryScore = 4; // >= $500
    else if (totalSpentMinor >= 25000) monetaryScore = 3; // >= $250
    else if (totalSpentMinor >= 10000) monetaryScore = 2; // >= $100
    else monetaryScore = 1;

    // Segment assignment logic
    let segment: RfmScores['segment'] = 'Promising';

    if (ordersCount === 0) {
      segment = 'Promising';
    } else if (ordersCount === 1 && recencyScore >= 3) {
      segment = 'First-Time';
    } else if (recencyScore >= 4 && frequencyScore >= 4 && monetaryScore >= 4) {
      segment = 'Champions';
    } else if (recencyScore <= 2 && frequencyScore >= 2) {
      segment = 'At Risk';
    } else if (frequencyScore >= 3 && monetaryScore >= 3) {
      segment = 'Loyal Customers';
    } else if (recencyScore <= 1 && frequencyScore <= 2) {
      segment = 'Churned';
    }

    return {
      recencyScore,
      frequencyScore,
      monetaryScore,
      totalScore: recencyScore + frequencyScore + monetaryScore,
      segment,
    };
  }

  /**
   * Customer Merge Engine
   * Merges secondary profile into primary profile without data loss
   */
  static mergeProfiles(
    primary: CustomerProfile,
    secondary: CustomerProfile
  ): {
    updatedPrimary: CustomerProfile;
    archivedSecondary: CustomerProfile;
  } {
    // Combine spend and orders
    const combinedOrdersCount = primary.ordersCount + secondary.ordersCount;
    const combinedTotalSpentMinor = primary.totalSpentMinor + secondary.totalSpentMinor;

    // Most recent order date
    let latestOrderIso = primary.lastOrderDateIso;
    if (secondary.lastOrderDateIso) {
      if (!latestOrderIso || new Date(secondary.lastOrderDateIso) > new Date(latestOrderIso)) {
        latestOrderIso = secondary.lastOrderDateIso;
      }
    }

    // Deduplicate tags
    const combinedTags = Array.from(new Set([...primary.tags, ...secondary.tags, 'merged']));

    // Deduplicate addresses by zip and street
    const addressKeys = new Set(primary.addresses.map((a) => `${a.street1.toLowerCase()}-${a.zip}`));
    const newAddresses = [...primary.addresses];

    for (const addr of secondary.addresses) {
      const key = `${addr.street1.toLowerCase()}-${addr.zip}`;
      if (!addressKeys.has(key)) {
        newAddresses.push({ ...addr, isDefault: false });
        addressKeys.add(key);
      }
    }

    const updatedPrimary: CustomerProfile = {
      ...primary,
      ordersCount: combinedOrdersCount,
      totalSpentMinor: combinedTotalSpentMinor,
      lastOrderDateIso: latestOrderIso,
      tags: combinedTags,
      addresses: newAddresses,
    };

    const archivedSecondary: CustomerProfile = {
      ...secondary,
      mergedIntoId: primary.id,
      tags: Array.from(new Set([...secondary.tags, 'archived-merged'])),
    };

    return {
      updatedPrimary,
      archivedSecondary,
    };
  }
}
