import { useCallback } from 'react';
import { TONIC_DATA_API_URL } from '~/config';
import { useFetch } from '~/hooks/useFetch';

export type Race = 'usdc' | 'stable'; // hardcode lol
export interface MarketStats {
  market_id: string;
  volume: number;
}

export interface TraderStats {
  overall_rank: number;
  account_id: string;
  total_volume: number;
  after_multiplier: number;
  n_held: number;
  multiplier: number;
  stats: Record<string, MarketStats>;
  /**
   * Timestamp when user achieved the winner threshold. Assume that the backend
   * query only counts the first N where N is the total number of winners to be
   * accepted per competition rules, ie, if this account has this field set,
   * it's a winner.
   */
  threshold_achieved_at?: Date;
}

export function useLeaderboard(race: Race, batchSize = 50) {
  const fetcher = useCallback(async () => {
    const res = await fetch(
      `${TONIC_DATA_API_URL}/leaderboard/rankings?limit=${batchSize}&race=${race}`
    );

    const data = (await res.json()) as {
      ranks: TraderStats[];
      hasMore: boolean;
    };

    // ignore pagination, it never matters for this view
    return data.ranks;
  }, [batchSize, race]);

  return useFetch(fetcher, []);
}
