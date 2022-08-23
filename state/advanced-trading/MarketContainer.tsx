import BN from 'bn.js';
import { useCallback, useEffect, useState } from 'react';
import { ExchangeBalances, Market, Orderbook } from '@tonic-foundation/tonic';

import { TONIC_DEFAULT_MARKET_ID } from '~/config';
import { ZERO } from '~/util/math';
import { getMidmarketPrice } from '~/util/market';
import { getTokenMetadata } from '~/services/token';
import { getDecimalPrecision } from '~/util';
import { UNAUTHENTICATED_TONIC, useTonic } from '../tonic-client';
import { createContainer } from 'unstated-next';
import { FungibleTokenMetadata } from '@tonic-foundation/token';

function useMarketIdInternal() {
  const [marketId, setMarketId] = useState<string>(TONIC_DEFAULT_MARKET_ID);

  return {
    marketId,
    setMarketId,
  };
}

const InternalMarketIdContainer = createContainer(useMarketIdInternal);

/**
 * Entrypoint function for setting the active market.
 */
export function useMarketId() {
  return InternalMarketIdContainer.useContainer();
}

function useMarketInternal() {
  const [market, setMarket] = useState<Market | null>(null);
  const { marketId } = useMarketId();

  const refresh = useCallback(() => {
    UNAUTHENTICATED_TONIC.getMarket(marketId).then(setMarket);
  }, [marketId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { market, refresh };
}

export const MarketContainer = createContainer(useMarketInternal);

export function useMarket() {
  return MarketContainer.useContainer();
}

interface PairInfo {
  baseTokenId: string;
  baseTokenDecimals: number;
  baseTokenMetadata: FungibleTokenMetadata;
  quoteTokenId: string;
  quoteTokenDecimals: number;
  quoteTokenMetadata: FungibleTokenMetadata;
}

/**
 * Token ID, decimals, and FT metadata for token pair in the active market.
 */
export function usePair() {
  const { market } = useMarket();
  const [pair, setPair] = useState<PairInfo | null>(null);

  const load = useCallback(async () => {
    if (market) {
      setPair({
        baseTokenId: market.baseTokenId,
        baseTokenDecimals: market.baseDecimals,
        baseTokenMetadata: await getTokenMetadata(market.baseTokenId),
        quoteTokenId: market.quoteTokenId,
        quoteTokenDecimals: market.quoteDecimals,
        quoteTokenMetadata: await getTokenMetadata(market.quoteTokenId),
      });
    }
  }, [market]);

  useEffect(() => {
    load();
  }, [load]);

  return { pair };
}

interface PairPrecisionInfo {
  pricePrecision: number;
  quantityPrecision: number;
  priceTick: number;
  quantityTick: number;
}

/**
 * Price/quantity tick size/decimals for the active market.
 */
export function usePairPrecision() {
  const { market } = useMarket();
  const [precision, setPrecision] = useState<PairPrecisionInfo | null>(null);

  useEffect(() => {
    if (market) {
      const { quantityTick, priceTick } = market;
      setPrecision({
        pricePrecision: getDecimalPrecision(priceTick),
        quantityPrecision: getDecimalPrecision(quantityTick),
        priceTick,
        quantityTick,
      });
    }

    return () => setPrecision(null);
  }, [market]);

  return { precision };
}

/**
 * Ticker for the active market.
 */
export function useTicker() {
  const { pair } = usePair();
  const [ticker, setTicker] = useState<string | null>();

  useEffect(() => {
    if (pair) {
      setTicker(
        `${pair.baseTokenMetadata.symbol}/${pair.quoteTokenMetadata.symbol}`
      );
    }

    return setTicker(null);
  }, [pair]);

  return { ticker };
}

/**
 * Since exchange balances are used in a number of places, keep an intermediate
 * context of all exchange balances to prevent redundant loads.
 */
function useExchangeBalancesInternal() {
  const [exchangeBalances, setExchangeBalances] = useState<ExchangeBalances>(
    {}
  );

  return { exchangeBalances, setExchangeBalances };
}
// TODO: start here

// const InternalExchangeBalancesContainer = createContainer(
//   useExchangeBalancesInternal
// );

// /**
//  * Token balances in the exchange.
//  */
// export function usePairExchangeBalances(refreshIntervalMs?: number) {
//   const { tonic } = useTonic();
//   const { exchangeBalances, setExchangeBalances } =
//     useExchangeBalancesInternal();
//   const pair = usePair();
//   //   const balances = useS

//   // manual refresh to avoid suspense
//   const refreshBalances = useCallback(async () => {
//     try {
//       setBalances(await tonic.getBalances());
//     } catch (e) {
//       setBalances({});
//     }
//   }, [setBalances]);

//   useEffect(() => {
//     if (refreshIntervalMs) {
//       console.log(
//         `fetching exchange balances with refresh ${refreshIntervalMs}`
//       );
//       const id = setInterval(refreshBalances, refreshIntervalMs);
//       return () => clearInterval(id);
//     }
//   }, [refreshIntervalMs, refreshBalances]);

//   useEffect(() => {
//     refreshBalances();
//   }, [baseTokenId, quoteTokenId]);

//   return [balances, refreshBalances] as const;
// }

// export const orderbookState = atom<Orderbook>({
//   key: 'orderbook-state',
//   default: { asks: [], bids: [] },
// });

// export function useOrderbook(initialLoad = true) {
//   const marketId = useRecoilValue(marketIdState);
//   const [loading, setLoading] = useState(false);
//   const [orderbook, setOrderbook] = useRecoilState(orderbookState);

//   // manually update instead of using the recoil refresher to avoid showing a
//   // spinner over the orderbook
//   const refreshOrderbook = useCallback(
//     async (id?: string) => {
//       setLoading(true);
//       try {
//         setOrderbook(
//           await UNAUTHENTICATED_TONIC.getOrderbook(id || marketId, 30)
//         );
//       } finally {
//         setLoading(false);
//       }
//     },
//     [marketId]
//   );

//   useEffect(() => {
//     refreshOrderbook(marketId);
//   }, [marketId]);

//   useEffect(() => {
//     if (initialLoad) {
//       refreshOrderbook();
//     }
//   }, []);

//   return [orderbook, refreshOrderbook, loading] as const;
// }

// export const midmarketPriceState = selector({
//   key: 'midmarket-selector',
//   get: ({ get }) => {
//     const orderbook = get(orderbookState);
//     return getMidmarketPrice(orderbook);
//   },
// });

// export function useMidmarketPrice() {
//   return useRecoilValue(midmarketPriceState);
// }
