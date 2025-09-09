'use client';

import { useEffect, useState } from 'react';
import { MRRBreakdown } from '@/lib/profitwell/types';
import { createProfitwellClient } from '@/lib/profitwell/client';

export interface UseMRRDataReturn {
  data: MRRBreakdown[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMRRData(months: number = 6): UseMRRDataReturn {
  const [data, setData] = useState<MRRBreakdown[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    console.log('🔄 [Profitwell Hook] Starting data fetch for', months, 'months');
    try {
      setLoading(true);
      setError(null);

      const apiKey = process.env.NEXT_PUBLIC_PROFITWELL_API_KEY || 
                    process.env.REACT_APP_PROFITWELL_API_KEY ||
                    process.env.PROFITWELL_API_KEY;
      
      if (!apiKey) {
        throw new Error('Profitwell API key not configured');
      }

      console.log('🔄 [Profitwell Hook] Client created, calling getMRRBreakdown...');
      const client = createProfitwellClient(apiKey);
      const response = await client.getMRRBreakdown(months);

      if (!response.success || !response.data) {
        console.error('❌ [Profitwell Hook] API Error:', response.error?.message);
        throw new Error(response.error?.message || 'Failed to fetch MRR data');
      }

      console.log('✅ [Profitwell Hook] Data received:', response.data.length, 'months');
      setData(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ [Profitwell Hook] Exception:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
      console.log('🏁 [Profitwell Hook] Fetch complete');
    }
  };

  useEffect(() => {
    fetchData();
  }, [months]);

  const refetch = () => {
    fetchData();
  };

  return {
    data,
    loading,
    error,
    refetch
  };
}