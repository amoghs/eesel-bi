import { MRRBreakdown } from '@/lib/profitwell/types';
import { AtlassianMRRBreakdown } from '@/lib/atlassian/types';

// Combined breakdown that merges Profitwell and Atlassian data
export interface CombinedMRRBreakdown {
  date: string;
  profitwell: MRRBreakdown;
  atlassian: AtlassianMRRBreakdown;
  combined: {
    new_revenue: number;
    reactivations: number;
    upgrades: number;
    downgrades: number;
    voluntary_churn: number;
    delinquent_churn: number;
    existing: number;
    total_mrr: number;
    arr: number;
  };
  // Adjusted MRR for more realistic current period calculation
  adjustedMRR?: {
    profitwell: number;
    atlassian: number;
    total: number;
    note: string;
  };
}

export function combineMRRData(
  profitwellData: MRRBreakdown[],
  atlassianData: AtlassianMRRBreakdown[]
): CombinedMRRBreakdown[] {
  const combined: CombinedMRRBreakdown[] = [];
  
  // Create a map of Atlassian data by date for easy lookup
  const atlassianMap = new Map<string, AtlassianMRRBreakdown>();
  atlassianData.forEach(item => {
    atlassianMap.set(item.date, item);
  });
  
  // Sort data by date to enable previous month lookup
  const sortedProfitwell = [...profitwellData].sort((a, b) => a.date.localeCompare(b.date));
  const sortedAtlassian = [...atlassianData].sort((a, b) => a.date.localeCompare(b.date));
  
  // Iterate through Profitwell data and combine with Atlassian
  sortedProfitwell.forEach((profitwell, index) => {
    const atlassian = atlassianMap.get(profitwell.date) || {
      date: profitwell.date,
      new_revenue: 0,
      reactivations: 0,
      upgrades: 0,
      downgrades: 0,
      voluntary_churn: 0,
      delinquent_churn: 0,
      existing: 0,
      total_mrr: 0,
      arr: 0
    };
    
    const combinedItem: CombinedMRRBreakdown = {
      date: profitwell.date,
      profitwell,
      atlassian,
      combined: {
        new_revenue: profitwell.new_revenue + atlassian.new_revenue,
        reactivations: profitwell.reactivations + atlassian.reactivations,
        upgrades: profitwell.upgrades + atlassian.upgrades,
        downgrades: profitwell.downgrades + atlassian.downgrades,
        voluntary_churn: profitwell.voluntary_churn + atlassian.voluntary_churn,
        delinquent_churn: profitwell.delinquent_churn + atlassian.delinquent_churn,
        existing: profitwell.existing + atlassian.existing,
        total_mrr: profitwell.total_mrr + atlassian.total_mrr,
        arr: profitwell.arr + atlassian.arr
      }
    };
    
    // For the most recent month, use adjusted MRR calculation
    // (current Profitwell + previous month Atlassian for more realistic current MRR)
    if (index === sortedProfitwell.length - 1 && sortedAtlassian.length > 1) {
      const previousAtlassian = sortedAtlassian[sortedAtlassian.length - 2];
      if (previousAtlassian && previousAtlassian.total_mrr > atlassian.total_mrr) {
        combinedItem.adjustedMRR = {
          profitwell: profitwell.total_mrr,
          atlassian: previousAtlassian.total_mrr,
          total: profitwell.total_mrr + previousAtlassian.total_mrr,
          note: `Using ${previousAtlassian.date} Atlassian MRR ($${previousAtlassian.total_mrr.toFixed(2)}) instead of current month ($${atlassian.total_mrr.toFixed(2)}) due to incremental reporting`
        };
      }
    }
    
    combined.push(combinedItem);
  });
  
  // Add any Atlassian-only months that aren't in Profitwell
  atlassianData.forEach(atlassian => {
    const existsInProfitwell = profitwellData.some(pw => pw.date === atlassian.date);
    if (!existsInProfitwell) {
      const emptyProfitwell: MRRBreakdown = {
        date: atlassian.date,
        new_revenue: 0,
        reactivations: 0,
        upgrades: 0,
        downgrades: 0,
        voluntary_churn: 0,
        delinquent_churn: 0,
        existing: 0,
        total_mrr: 0,
        arr: 0
      };
      
      const combinedItem: CombinedMRRBreakdown = {
        date: atlassian.date,
        profitwell: emptyProfitwell,
        atlassian,
        combined: {
          new_revenue: atlassian.new_revenue,
          reactivations: atlassian.reactivations,
          upgrades: atlassian.upgrades,
          downgrades: atlassian.downgrades,
          voluntary_churn: atlassian.voluntary_churn,
          delinquent_churn: atlassian.delinquent_churn,
          existing: atlassian.existing,
          total_mrr: atlassian.total_mrr,
          arr: atlassian.arr
        }
      };
      
      combined.push(combinedItem);
    }
  });
  
  // Sort by date
  combined.sort((a, b) => a.date.localeCompare(b.date));
  
  return combined;
}

// Calculate summary metrics for the most recent month
export function calculateSummaryMetrics(combinedData: CombinedMRRBreakdown[]) {
  if (combinedData.length === 0) {
    return null;
  }
  
  const latest = combinedData[combinedData.length - 1];
  const previous = combinedData.length > 1 ? combinedData[combinedData.length - 2] : null;
  
  // Use adjusted MRR if available for more realistic current period calculation
  const currentMRR = latest.adjustedMRR ? latest.adjustedMRR.total : latest.combined.total_mrr;
  const currentARR = currentMRR * 12;
  
  // Calculate growth using adjusted values where appropriate
  const previousMRR = previous?.adjustedMRR ? previous.adjustedMRR.total : previous?.combined.total_mrr || 0;
  const growth = previousMRR > 0 ? 
    ((currentMRR - previousMRR) / previousMRR) * 100 : 
    0;
  
  // Get the effective Atlassian MRR (adjusted if available)
  const effectiveAtlassianMRR = latest.adjustedMRR ? latest.adjustedMRR.atlassian : latest.atlassian.total_mrr;
  
  return {
    currentMRR,
    currentARR,
    monthlyGrowth: growth,
    newRevenue: latest.combined.new_revenue,
    churnRevenue: Math.abs(latest.combined.voluntary_churn + latest.combined.delinquent_churn),
    netGrowth: latest.combined.new_revenue + latest.combined.voluntary_churn + latest.combined.delinquent_churn,
    profitwellMRR: latest.profitwell.total_mrr,
    atlassianMRR: effectiveAtlassianMRR,
    profitwellPercentage: currentMRR > 0 ? 
      (latest.profitwell.total_mrr / currentMRR) * 100 : 0,
    atlassianPercentage: currentMRR > 0 ? 
      (effectiveAtlassianMRR / currentMRR) * 100 : 0,
    // Additional fields to show the adjustment
    adjustmentNote: latest.adjustedMRR?.note,
    rawMRR: latest.combined.total_mrr,
    isAdjusted: !!latest.adjustedMRR
  };
}