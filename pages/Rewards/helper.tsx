import { useCallback } from 'react';
import { TONIC_DATA_API_URL } from '~/config';
import { useFetch } from '~/hooks/useFetch';
import { useWalletSelector } from '~/state/WalletSelectorContainer';
import { RewardEntry, TotalRewardsStats, UnfinalizedReward } from './shim';

export function useRewardsHistory() {
  // const { accountId } = useWalletSelector();
  const accountId = 'tng02.near';

  const fetcher = useCallback(async () => {
    const res = await fetch(
      `${TONIC_DATA_API_URL}/rewards/history?account=${accountId}`
    );
    return (await res.json()) as RewardEntry[];
  }, [accountId]);

  return useFetch(fetcher, []);
}

export function useUnfinalizedRewards() {
  // const { accountId } = useWalletSelector();
  const accountId = 'tng02.near';

  const fetcher = useCallback(async () => {
    const res = await fetch(
      `${TONIC_DATA_API_URL}/rewards/unfinalized?account=${accountId}`
    );
    return (await res.json()) as UnfinalizedReward[];
  }, [accountId]);

  return useFetch(fetcher, []);
}

export function useRewardsProgramStats() {
  const fetcher = useCallback(async () => {
    const res = await fetch(`${TONIC_DATA_API_URL}/rewards/stats`);
    return (await res.json()) as TotalRewardsStats[];
  }, []);

  return useFetch(fetcher, []);
}
