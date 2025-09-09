import { useState, useEffect } from 'react';
import { createAtlassianClient } from '@/lib/atlassian/client';
import { AtlassianMRRBreakdown, AtlassianMonthlyData } from '@/lib/atlassian/types';

export function useAtlassianMRRData(months: number = 6) {
  const [data, setData] = useState<AtlassianMRRBreakdown[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    console.log('🔄 [Atlassian Hook] Starting data fetch for', months, 'months');
    try {
      setLoading(true);
      setError(null);
      
      const client = createAtlassianClient();
      console.log('🔄 [Atlassian Hook] Client created, calling getMRRBreakdown...');
      const response = await client.getMRRBreakdown(months);
      
      if (response.success && response.data) {
        console.log('✅ [Atlassian Hook] Data received:', response.data.length, 'months');
        setData(response.data);
      } else {
        console.error('❌ [Atlassian Hook] API Error:', response.error?.message);
        setError(response.error?.message || 'Failed to fetch Atlassian data');
      }
    } catch (err) {
      console.error('❌ [Atlassian Hook] Exception:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
      console.log('🏁 [Atlassian Hook] Fetch complete');
    }
  };

  useEffect(() => {
    fetchData();
  }, [months]);

  return { data, loading, error, refetch: fetchData };
}

export function useAtlassianMonthlyData(months: number = 6) {
  const [data, setData] = useState<AtlassianMonthlyData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const client = createAtlassianClient();
      const response = await client.getMonthlyData(months);
      
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch Atlassian monthly data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [months]);

  return { data, loading, error, refetch: fetchData };
}