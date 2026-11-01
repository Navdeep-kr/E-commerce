import { NextResponse } from 'next/server';
import { MarketingService } from '@storefront-ops/core';

export async function GET() {
  const campaignsRaw = [
    {
      id: 'cmp-1',
      name: 'Fall Outerwear Launch 2026',
      channel: 'Meta Ads (Instagram & Facebook)',
      status: 'active',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      adSpendMinor: 1450000, // $14,500.00
      attributedRevenueMinor: 6800000, // $68,000.00
      newCustomersCount: 320,
    },
    {
      id: 'cmp-2',
      name: 'Google Shopping Brand Search',
      channel: 'Google Ads',
      status: 'active',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      adSpendMinor: 850000, // $8,500.00
      attributedRevenueMinor: 4650000, // $46,500.00
      newCustomersCount: 195,
    },
    {
      id: 'cmp-3',
      name: 'TikTok Creator Apparel Collab',
      channel: 'TikTok Ads',
      status: 'completed',
      startDate: '2026-10-10',
      endDate: '2026-10-24',
      adSpendMinor: 550000, // $5,500.00
      attributedRevenueMinor: 1950000, // $19,500.00
      newCustomersCount: 140,
    },
  ];

  const totalStoreGrossSalesMinor = 17350000; // $173,500.00
  const totalAdSpendMinor = campaignsRaw.reduce((acc, c) => acc + c.adSpendMinor, 0); // $28,500.00
  const blendedMer = Math.round((totalStoreGrossSalesMinor / totalAdSpendMinor) * 100) / 100;

  const enrichedCampaigns = campaignsRaw.map((c) => {
    const metrics = MarketingService.calculateCampaignMetrics({
      adSpendMinor: c.adSpendMinor,
      attributedRevenueMinor: c.attributedRevenueMinor,
      totalGrossSalesMinor: totalStoreGrossSalesMinor,
      newCustomersCount: c.newCustomersCount,
    });

    return {
      ...c,
      roas: metrics.roas,
      cacMinor: metrics.cacMinor,
    };
  });

  return NextResponse.json({
    campaigns: enrichedCampaigns,
    blendedMer,
    totalAdSpendMinor,
    totalAttributedRevenueMinor: campaignsRaw.reduce((acc, c) => acc + c.attributedRevenueMinor, 0),
  });
}
