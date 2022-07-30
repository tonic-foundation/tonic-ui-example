import { useEffect, useRef, useState } from 'react';
import { TONIC_LEADERBOARD_API_URL } from '~/config';

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

export function useLeaderboard(race: Race, batchSize = 50, start = 0) {
  const [fetched, setFetched] = useState<TraderStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const prev = useRef(start);
  async function fetchMore() {
    setLoading(true);
    try {
      const res = await fetch(
        `${TONIC_LEADERBOARD_API_URL}/api/v1/rankings?limit=${batchSize}&offset=${prev.current}&race=${race}`
      );
      const next = (await res.json()) as {
        ranks: TraderStats[];
        hasMore: boolean;
      };
      setHasMore(next.hasMore);
      setFetched((existing) => {
        return [...existing, ...next?.ranks];
      });
      prev.current += next.ranks.length;
    } finally {
      setLoading(false);
    }
  }

  // initial fetch
  useEffect(() => {
    fetchMore();

    return () => {
      prev.current = 0;
      setFetched([]);
    };
  }, [race]);

  return [fetched, hasMore, fetchMore, loading] as const;
}
