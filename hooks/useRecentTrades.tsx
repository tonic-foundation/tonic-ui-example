import { RecentTrade as BaseRecentTrade } from '@tonic-foundation/data-client';
import { indexer } from '~/services/indexer';
import { marketIdState } from '~/state/trade';
import { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { subHours } from 'date-fns';

type Change = 'up' | 'down';
export type RecentTrade = {
  change: Change;
  reactKey: string;
} & BaseRecentTrade;

const useRecentTrades = () => {
  const marketId = useRecoilValue(marketIdState);

  const [trades, setTrades] = useState<RecentTrade[]>([]);

  useEffect(() => {
    const initial = subHours(new Date(), 1);
    const [stream, stop] = indexer.recentTradeStream(marketId, initial);

    let counter = 0; // use this to generate unique react keys
    async function listen() {
      for await (const trade of stream) {
        counter += 1;
        const reactKey = `${marketId}-${counter}`;
        setTrades((trades) => {
          if (!trades.length) {
            return [{ ...trade, change: 'up', reactKey }];
          }

          const prev = trades[0];
          const change: Change = trade.price.gt(prev.price)
            ? 'up'
            : trade.price.lt(prev.price)
            ? 'down'
            : prev.change; // no change = continue the streak

          // don't keep too many around
          return [{ ...trade, change, reactKey }, ...trades.slice(0, 199)];
        });
      }
    }

    listen();

    return () => {
      setTrades([]);
      stop();
    };
  }, [marketId]);

  return {
    trades,
  };
};

export default useRecentTrades;
