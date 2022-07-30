// TODO move to state
import { MarketStats } from '@tonic-foundation/data-client';
import { useEffect, useState } from 'react';
import { indexer } from '~/services/indexer';

/**
 * Fetch 24h price change data (formatted numbers).
 */
export function use24hStats(marketId: string, refreshIntervalMs = 20_000) {
  const [priceChangePercent, setPriceChangePercent] = useState<number>();
  const [priceChange, setPriceChange] = useState<number>();
  const [stats, setStats] = useState<MarketStats>();

  useEffect(() => {
    async function refresh() {
      const stats = await indexer.marketStats(marketId);
      const { latest, previous } = stats;
      if (latest && previous) {
        const diff = latest - previous;
        const diffPercent = (100 * diff) / previous;
        setPriceChangePercent(diffPercent);
        setPriceChange(diff);
      } else {
        setPriceChangePercent(undefined);
      }
      setStats(stats);
    }

    refresh();

    const id = setInterval(refresh, refreshIntervalMs);

    return () => {
      setPriceChangePercent(undefined);
      setPriceChange(undefined);
      clearInterval(id);
    };
  }, [marketId, refreshIntervalMs]);

  return {
    stats,
    priceChange,
    priceChangePercent,
  };
}
