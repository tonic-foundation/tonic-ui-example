// TODO: remove recoil
import BN from 'bn.js';
import { useCallback, useEffect, useState } from 'react';
import {
  atom,
  DefaultValue,
  selector,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from 'recoil';
import {
  ExchangeBalances,
  Market,
  OpenLimitOrder,
  Orderbook,
} from '@tonic-foundation/tonic';

import { TONIC_DEFAULT_MARKET_ID } from '~/config';
import { ZERO } from '~/util/math';
import { getMidmarketPrice } from '~/util/market';
import { getTokenMetadata } from '~/services/token';
import { getDecimalPrecision, sleep } from '~/util';
import { tonic } from '~/services/near';

export const marketIdState = atom<string>({
  key: 'market-id-state',
  default: TONIC_DEFAULT_MARKET_ID,
});

export const marketState = selector<Market>({
  key: 'market-selector',
  get: async ({ get }) => {
    const marketId = get(marketIdState);
    return await tonic.getMarket(marketId);
  },
  set: ({ set }, v) => {
    if (v instanceof DefaultValue) {
      set(marketIdState, v);
    } else {
      set(marketIdState, v.id);
      set(marketState, v);
    }
  },
  // the market object may populate some private properties asynchronously
  dangerouslyAllowMutability: true,
});

export function useMarket() {
  const [market, setMarket] = useRecoilState(marketState);
  const marketId = useRecoilValue(marketIdState);

  const refreshMarket = useCallback(
    async (id?: string) => {
      const newMarket = await tonic.getMarket(id || marketId);
      setMarket(newMarket);
    },
    [marketId]
  );

  return [market, refreshMarket] as const;
}

export const pairState = selector({
  key: 'pair-selector',
  get: async ({ get }) => {
    const market = get(marketState);
    return {
      baseTokenId: market.baseTokenId,
      baseTokenDecimals: market.baseDecimals,
      baseTokenMetadata: await getTokenMetadata(market.baseTokenId),
      quoteTokenId: market.quoteTokenId,
      quoteTokenDecimals: market.quoteDecimals,
      quoteTokenMetadata: await getTokenMetadata(market.quoteTokenId),
    };
  },
});

export function usePair() {
  return useRecoilValue(pairState);
}

export const pairTickState = selector({
  key: 'pair-tick-selector',
  get: ({ get }) => {
    const market = get(marketState);
    const { priceTick, quantityTick } = market;
    return {
      pricePrecision: getDecimalPrecision(priceTick),
      quantityPrecision: getDecimalPrecision(quantityTick),
      priceTick,
      quantityTick,
    };
  },
});

export function usePairPrecision() {
  return useRecoilValue(pairTickState);
}

export const tickerState = selector({
  key: 'ticker-selector',
  get: ({ get }) => {
    const { baseTokenMetadata, quoteTokenMetadata } = get(pairState);
    return `${baseTokenMetadata.symbol}/${quoteTokenMetadata.symbol}`;
  },
});

export function useTicker() {
  return useRecoilValue(tickerState);
}

// intermediate step for pairBalancesState
const exchangeBalancesState = atom<ExchangeBalances>({
  key: 'exchange-balances-state',
  default: {},
});

export const pairBalancesState = selector<{
  baseBalance: BN;
  quoteBalance: BN;
}>({
  key: 'market-pair-balances-selector',
  get: ({ get }) => {
    const balances = get(exchangeBalancesState);
    const { baseTokenId, quoteTokenId } = get(pairState);

    return {
      baseBalance: balances[baseTokenId] || ZERO,
      quoteBalance: balances[quoteTokenId] || ZERO,
    };
  },
});

/**
 * Token balances _in the exchange_
 */
export function usePairExchangeBalances(refreshIntervalMs?: number) {
  const balances = useRecoilValue(pairBalancesState);
  const setBalances = useSetRecoilState(exchangeBalancesState);
  const { baseTokenId, quoteTokenId } = useRecoilValue(pairState);

  // manual refresh to avoid suspense
  const refreshBalances = useCallback(async () => {
    try {
      setBalances(await tonic.getBalances());
    } catch (e) {
      setBalances({});
    }
  }, [setBalances]);

  useEffect(() => {
    if (refreshIntervalMs) {
      console.log(
        `fetching exchange balances with refresh ${refreshIntervalMs}`
      );
      const id = setInterval(refreshBalances, refreshIntervalMs);
      return () => clearInterval(id);
    }
  }, [refreshIntervalMs, refreshBalances]);

  useEffect(() => {
    refreshBalances();
  }, [baseTokenId, quoteTokenId]);

  return [balances, refreshBalances] as const;
}

export const orderbookState = atom<Orderbook>({
  key: 'orderbook-state',
  default: { asks: [], bids: [] },
});

export function useOrderbook(initialLoad = true) {
  const marketId = useRecoilValue(marketIdState);
  const [loading, setLoading] = useState(false);
  const [orderbook, setOrderbook] = useRecoilState(orderbookState);

  // manually update instead of using the recoil refresher to avoid showing a
  // spinner over the orderbook
  const refreshOrderbook = useCallback(
    async (id?: string) => {
      setLoading(true);
      try {
        setOrderbook(await tonic.getOrderbook(id || marketId, 30));
      } finally {
        setLoading(false);
      }
    },
    [marketId]
  );

  useEffect(() => {
    refreshOrderbook(marketId);
  }, [marketId]);

  useEffect(() => {
    if (initialLoad) {
      refreshOrderbook();
    }
  }, []);

  return [orderbook, refreshOrderbook, loading] as const;
}

export const midmarketPriceState = selector({
  key: 'midmarket-selector',
  get: ({ get }) => {
    const orderbook = get(orderbookState);
    return getMidmarketPrice(orderbook);
  },
});

export function useMidmarketPrice() {
  return useRecoilValue(midmarketPriceState);
}

const openOrdersState = atom<OpenLimitOrder[] | undefined>({
  key: 'open-orders-state',
  default: undefined,
});

export function useOpenOrders(initialLoad = true) {
  const marketId = useRecoilValue(marketIdState);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useRecoilState(openOrdersState);

  //  manually update instead of using the recoil refresher to avoid showing a
  //  spinner over the orderbook
  const refreshOpenOrders = useCallback(
    async (id?: string) => {
      setLoading(true);
      try {
        const newOrders = await tonic.getOpenOrders(id || marketId);
        await sleep(2000);
        setOrders(newOrders);
      } finally {
        setLoading(false);
      }
    },
    [marketId]
  );

  useEffect(() => {
    refreshOpenOrders(marketId);
  }, [marketId, refreshOpenOrders]);

  useEffect(() => {
    if (initialLoad) {
      refreshOpenOrders();
    }
  }, []);

  return [orders, refreshOpenOrders, loading] as const;
}
