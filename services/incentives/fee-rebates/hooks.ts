import { useCallback } from 'react';
import useSWR from 'swr';
import { TONIC_DATA_API_URL } from '~/config';
import { useWalletSelector } from '~/state/WalletSelectorContainer';
import { forceFloat, forceTzDate } from '~/util/parse';

interface FeeSummary {
  total_paid: number;
  total_eligible: number;
  outstanding: number;
}

interface FeeRebate {
  /**
   * Not displayed, only included in type because we use it for a React key
   */
  paid_at: Date;
  paid_in_tx_id: string | null;
  amount: number;
}

export function useFeeSummary() {
  const { accountId } = useWalletSelector();

  const fetcher = useCallback(async (url: string): Promise<FeeSummary> => {
    const res = await fetch(url);

    const data = (await res.json()) as FeeSummary;
    return {
      outstanding: forceFloat(data.outstanding),
      total_eligible: forceFloat(data.total_eligible),
      total_paid: forceFloat(data.total_paid),
    };
  }, []);

  return useSWR(
    `${TONIC_DATA_API_URL}/rebates/v1/summary?account=${accountId}`,
    fetcher
  );
}

export function useFeeRebateHistory() {
  const { accountId } = useWalletSelector();

  const fetcher = useCallback(async (url: string): Promise<FeeRebate[]> => {
    const res = await fetch(url);

    const data = (await res.json()) as FeeRebate[];
    return data.map((r) => {
      return {
        paid_at: forceTzDate(r.paid_at),
        amount: forceFloat(r.amount),
        paid_in_tx_id: r.paid_in_tx_id,
      };
    });
  }, []);

  return useSWR(
    `${TONIC_DATA_API_URL}/rebates/v1/history?account=${accountId}`,
    fetcher
  );
}
