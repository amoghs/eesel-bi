import { useState, useEffect } from 'react';
import { useMRRData } from '@/hooks/useMRRData';
import { useAtlassianMRRData } from '@/hooks/useAtlassianData';
import { combineMRRData, calculateSummaryMetrics, CombinedMRRBreakdown } from '@/lib/combined-metrics';

export function useCombinedMRRData(months: number = 6) {
  const { data: profitwellData, loading: profitwellLoading, error: profitwellError, refetch: refetchProfitwell } = useMRRData(months);
  const { data: atlassianData, loading: atlassianLoading, error: atlassianError, refetch: refetchAtlassian } = useAtlassianMRRData(months);
  
  const [combinedData, setCombinedData] = useState<CombinedMRRBreakdown[] | null>(null);
  const [summaryMetrics, setSummaryMetrics] = useState<ReturnType<typeof calculateSummaryMetrics>>(null);

  useEffect(() => {
    console.log('🔄 [Combined Hook] Data effect triggered:', {
      profitwellData: profitwellData?.length || 0,
      atlassianData: atlassianData?.length || 0,
      profitwellLoading,
      atlassianLoading,
      profitwellError,
      atlassianError
    });
    
    if (profitwellData && atlassianData) {
      console.log('✅ [Combined Hook] Both data sources available, combining...');
      const combined = combineMRRData(profitwellData, atlassianData);
      setCombinedData(combined);
      setSummaryMetrics(calculateSummaryMetrics(combined));
      console.log('✅ [Combined Hook] Combined data ready:', combined.length, 'months');
    } else if (profitwellData && !atlassianLoading && !atlassianData) {
      console.log('⚠️ [Combined Hook] Atlassian failed, using Profitwell only');
      // If Atlassian fails to load, use Profitwell data only
      const combined = combineMRRData(profitwellData, []);
      setCombinedData(combined);
      setSummaryMetrics(calculateSummaryMetrics(combined));
    } else if (atlassianData && !profitwellLoading && !profitwellData) {
      console.log('⚠️ [Combined Hook] Profitwell failed, using Atlassian only');
      // If Profitwell fails to load, use Atlassian data only
      const combined = combineMRRData([], atlassianData);
      setCombinedData(combined);
      setSummaryMetrics(calculateSummaryMetrics(combined));
    } else {
      console.log('🔄 [Combined Hook] Waiting for data...');
    }
  }, [profitwellData, atlassianData, profitwellLoading, atlassianLoading]);

  const loading = profitwellLoading || atlassianLoading;
  const error = profitwellError || atlassianError;
  
  const refetch = async () => {
    await Promise.all([refetchProfitwell(), refetchAtlassian()]);
  };

  return {
    combinedData,
    summaryMetrics,
    profitwellData,
    atlassianData,
    loading,
    error,
    refetch,
    // Individual service status
    services: {
      profitwell: {
        data: profitwellData,
        loading: profitwellLoading,
        error: profitwellError
      },
      atlassian: {
        data: atlassianData,
        loading: atlassianLoading,
        error: atlassianError
      }
    }
  };
}