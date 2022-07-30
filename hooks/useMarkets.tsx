import { ftOrNativeNearMetadata } from '@tonic-foundation/token';
import { useEffect, useState } from 'react';

import { indexer } from '~/services/indexer';
import { wallet } from '~/services/near';
import { FungibleTokenMetadata } from '@tonic-foundation/token';
import { atom, useRecoilState } from 'recoil';

export interface HydratedMarketInfo {
  id: string;
  ticker: string;
  quoteToken: {
    id: string;
    metadata: Pick<FungibleTokenMetadata, 'name' | 'icon' | 'symbol'>;
  };
  baseToken: {
    id: string;
    metadata: Pick<FungibleTokenMetadata, 'name' | 'icon' | 'symbol'>;
  };
}

let cache: HydratedMarketInfo[] = [];
const marketsListState = atom<HydratedMarketInfo[]>({
  key: 'global-markets-list-state',
  default: cache,
});

export default function useMarkets(initialLoad = true) {
  const [loading, setLoading] = useState(true);
  const [markets, setMarkets] = useRecoilState(marketsListState);

  async function hydrate() {
    setLoading(true);
    try {
      const marketInfos = await indexer.markets();
      const hydrated = await Promise.all(
        marketInfos.map(async (info): Promise<HydratedMarketInfo> => {
          return {
            id: info.id,
            ticker: info.symbol,
            baseToken: {
              id: info.base_token_id,
              metadata: await ftOrNativeNearMetadata(
                wallet.account(),
                info.base_token_id
              ),
            },
            quoteToken: {
              id: info.quote_token_id,
              metadata: await ftOrNativeNearMetadata(
                wallet.account(),
                info.quote_token_id
              ),
            },
          };
        })
      );
      cache = hydrated;
      setMarkets(hydrated);
    } catch (e) {
      console.error('Error loading markets', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialLoad) {
      hydrate();
    }
  }, [initialLoad]);

  return [markets, loading] as const;
}
