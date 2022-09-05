import { useCallback } from 'react';
import { TONIC_DATA_API_URL } from '~/config';
import { useFetch } from '~/hooks/useFetch';
import { useWalletSelector } from '~/state/WalletSelectorContainer';
import { RewardsHistory, TotalRewardsStats, UnfinalizedReward } from './shim';

export function useRewardsHistory() {
  // const { accountId } = useWalletSelector();
  const accountId = 'tng02.near';

  const fetcher = useCallback(async () => {
    const res = await fetch(
      `${TONIC_DATA_API_URL}/rewards/history?account=${accountId}`
    );
    const data = (await res.json()) as RewardsHistory;
    return {
      total: parseFloat(data.total as unknown as string),
      rewards: data.rewards.map((r) => {
        return {
          reward: parseFloat(r.reward as unknown as string),
          reward_date: new Date(r.reward_date),
          paid_in_tx_id: r.paid_in_tx_id,
        };
      }),
    } as RewardsHistory;
  }, [accountId]);

  return useFetch(fetcher, { rewards: [], total: 0 });
}

export function useUnfinalizedRewards() {
  // const { accountId } = useWalletSelector();
  const accountId = 'tng02.near';

  const fetcher = useCallback(async () => {
    const res = await fetch(
      `${TONIC_DATA_API_URL}/rewards/unfinalized?account=${accountId}`
    );
    const data = (await res.json()) as UnfinalizedReward;
    return {
      account_id: data.account_id,
      account_unfinalized: parseFloat(
        data.account_unfinalized as unknown as string
      ),
      total_unfinalized: parseFloat(
        data.total_unfinalized as unknown as string
      ),
      reward_date: new Date(data.reward_date),
    } as UnfinalizedReward;
  }, [accountId]);

  return useFetch(fetcher, {
    account_id: accountId,
    account_unfinalized: 0,
    total_unfinalized: 0,
    reward_date: new Date(),
  });
}

export function useRewardsProgramStats() {
  const fetcher = useCallback(async () => {
    const res = await fetch(`${TONIC_DATA_API_URL}/rewards/stats`);
    return (await res.json()) as TotalRewardsStats;
  }, []);

  return useFetch(fetcher, {
    daily_stats: [],
    start_date: new Date(),
    total_participants: '0',
    total_rewards: '0',
  });
}
