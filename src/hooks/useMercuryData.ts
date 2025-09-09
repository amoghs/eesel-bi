import { useState, useEffect } from 'react';
import { createMercuryClient } from '@/lib/mercury/client';
import { BurnRateMetrics, BankBalance } from '@/lib/mercury/types';

export function useMercuryBurnData(months: number = 3) {
  const [data, setData] = useState<BurnRateMetrics[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      console.log('🔄 [Mercury Burn Hook] Starting burn data fetch for', months, 'months');
      setLoading(true);
      setError(null);

      const client = createMercuryClient();
      console.log('🔄 [Mercury Burn Hook] Client created, calling getBurnRateMetrics...');
      
      const response = await client.getBurnRateMetrics(months);
      
      if (response.success && response.data) {
        console.log('✅ [Mercury Burn Hook] Data received:', response.data.length, 'months');
        setData(response.data);
        setError(null);
      } else {
        console.log('❌ [Mercury Burn Hook] API Error:', response.error?.message);
        setError(response.error?.message || 'Failed to fetch burn rate data');
        setData(null);
      }
    } catch (err) {
      console.error('❌ [Mercury Burn Hook] Hook Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [months]);

  const refetch = () => fetchData();

  return { data, loading, error, refetch };
}

export function useMercuryBalances() {
  const [data, setData] = useState<BankBalance[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      console.log('🔄 [Mercury Balance Hook] Starting balance fetch');
      setLoading(true);
      setError(null);

      const client = createMercuryClient();
      console.log('🔄 [Mercury Balance Hook] Client created, calling getBankBalances...');
      
      const response = await client.getBankBalances();
      
      if (response.success && response.data) {
        console.log('✅ [Mercury Balance Hook] Data received:', response.data.length, 'accounts');
        
        // Add Macquarie manual balance from environment
        const balances = [...response.data];
        const macquarieBalance = process.env.NEXT_PUBLIC_MACQUARIE_BALANCE || 
                                process.env.REACT_APP_MACQUARIE_BALANCE;
        
        if (macquarieBalance) {
          balances.push({
            source: 'macquarie' as const,
            accountName: 'Macquarie Australia',
            balance: parseFloat(macquarieBalance),
            currency: 'AUD',
            lastUpdated: new Date().toISOString()
          });
          console.log('📊 [Mercury Balance Hook] Added Macquarie balance:', macquarieBalance);
        }
        
        setData(balances);
        setError(null);
      } else {
        console.log('❌ [Mercury Balance Hook] API Error:', response.error?.message);
        
        // If Mercury fails but we have Macquarie data, show that
        const macquarieBalance = process.env.NEXT_PUBLIC_MACQUARIE_BALANCE || 
                                process.env.REACT_APP_MACQUARIE_BALANCE;
        
        if (macquarieBalance) {
          console.log('⚠️ [Mercury Balance Hook] Mercury failed, using Macquarie only');
          setData([{
            source: 'macquarie' as const,
            accountName: 'Macquarie Australia',
            balance: parseFloat(macquarieBalance),
            currency: 'AUD',
            lastUpdated: new Date().toISOString()
          }]);
          setError(`Mercury API unavailable: ${response.error?.message}`);
        } else {
          setError(response.error?.message || 'Failed to fetch bank balances');
          setData(null);
        }
      }
    } catch (err) {
      console.error('❌ [Mercury Balance Hook] Hook Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refetch = () => fetchData();

  return { data, loading, error, refetch };
}