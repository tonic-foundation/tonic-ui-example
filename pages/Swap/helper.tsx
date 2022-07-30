import { NEAR_DECIMALS } from '@tonic-foundation/storage';
import { TokenInfo } from '@tonic-foundation/token-list';
import { getMidmarketPrice } from '@tonic-foundation/tonic';
import { SwapParamsV1 } from '@tonic-foundation/tonic/lib/types/v1';
import {
  bnToApproximateDecimal,
  decimalToBn,
  MAX_GAS,
  tgasAmount,
} from '@tonic-foundation/utils';
import BN from 'bn.js';
import { functionCall, Transaction } from 'near-api-js/lib/transaction';
import { SwapSettings } from '~/components/swap/SwapSettingsForm';
import { TONIC_CONTRACT_ID } from '~/config';
import { HydratedMarketInfo } from '~/hooks/useMarkets';
import { tonic, wallet } from '~/services/near';
import { createGraph, findRoute } from '~/services/swap';

export interface SwapRoute {
  netExchangeRate: number;
  netFeeRate: number;
  swaps: SwapParamsV1[];
}

/**
 * [Naively] find a route to swap the input token for the output token.
 *
 * Does not account for input amount or slippage tolerance. Slippage
 * tolerance is applied after the fact, eg, in `createSwapTransaction`.
 */
export async function getSwapRoute(
  markets: HydratedMarketInfo[],
  tokenInId: string,
  tokenOutId: string,
  settings: SwapSettings
): Promise<SwapRoute | undefined> {
  const graph = createGraph(markets);
  const path = findRoute(graph, tokenInId, tokenOutId);
  const swaps: Array<
    SwapParamsV1 & {
      takerFeeBaseRate?: number;
      exchangeRate?: number;
    }
  > = [];
  for (const edge of path) {
    const market = await tonic.getMarket(edge.marketId);
    const orderbook = await tonic.getOrderbook(edge.marketId);
    // what happens if there's no route?
    const marketPrice = bnToApproximateDecimal(
      getMidmarketPrice(orderbook) as BN,
      market.quoteDecimals
    );
    const exchangeRate =
      edge.direction === 'Sell' ? marketPrice : 1 / marketPrice;
    swaps.push({
      type: 'Swap' as const,
      market_id: market.id,
      side: edge.direction,
      min_output_token: new BN(0),
      takerFeeBaseRate: market.takerFeeBaseRate,
      exchangeRate,
    });
  }
  const netFeeRate =
    swaps.reduce((rate, curr) => rate * (1 + curr.takerFeeBaseRate! / 100), 1) -
    1;
  const netExchangeRate = swaps.reduce(
    (rate, curr) => rate * curr.exchangeRate!,
    1
  );
  // remove excess params
  for (let i = 0; i < swaps.length; i++) {
    delete swaps[i]['takerFeeBaseRate'];
    delete swaps[i]['exchangeRate'];
  }
  return {
    netExchangeRate,
    netFeeRate,
    swaps,
  };
}

function nearAmount(n: number) {
  return decimalToBn(n, NEAR_DECIMALS);
}

export async function createTokenDepositTransaction(
  receiverId: string,
  accountId: string
): Promise<Transaction> {
  return wallet.createTransaction({
    receiverId,
    actions: [
      functionCall(
        'storage_deposit',
        {
          account_id: accountId,
          registration_only: true,
        },
        tgasAmount(10),
        nearAmount(0.1)
      ),
    ],
  });
}

function getSwapFromFtCall(
  token: TokenInfo,
  amount: BN,
  minOutAmount: BN,
  route: SwapRoute
) {
  const params = route.swaps.map((s) => ({
    ...s,
    min_output_token: s.min_output_token?.toString(),
    // NOTE: since we only need the last swap in the chain to
    // have this set, it's OK for this to be unset in all the
    // intermediate steps
  }));
  params[params.length - 1].min_output_token = minOutAmount.toString();

  return {
    receiverId: token.address,
    actions: [
      functionCall(
        'ft_transfer_call',
        {
          receiver_id: TONIC_CONTRACT_ID,
          amount: amount.toString(),
          msg: JSON.stringify({
            action: 'Swap',
            params,
          }),
        },
        new BN('180000000000000'),
        new BN(1)
      ),
    ],
  };
}

function getSwapFromNearCall(amount: BN, minOutAmount: BN, route: SwapRoute) {
  const swaps = route.swaps.map((s) => ({
    ...s,
    min_output_token: s.min_output_token?.toString(),
    // NOTE: since we only need the last swap in the chain to
    // have this set, it's OK for this to be unset in all the
    // intermediate steps
  }));
  swaps[swaps.length - 1].min_output_token = minOutAmount.toString();

  return {
    receiverId: TONIC_CONTRACT_ID,
    actions: [
      functionCall(
        'swap_near',
        {
          swaps,
        },
        MAX_GAS,
        amount
      ),
    ],
  };
}

/**
 * Create a transaction to perform the swap. Input and output amounts must
 * account for the tokens' decimals.
 */
export function createSwapTransaction(
  tokenIn: TokenInfo,
  tokenInAmount: BN,
  minNetOutAmount: BN,
  route: SwapRoute
): Promise<Transaction> {
  const params =
    tokenIn.address.toLowerCase() === 'near'
      ? getSwapFromNearCall(tokenInAmount, minNetOutAmount, route)
      : getSwapFromFtCall(tokenIn, tokenInAmount, minNetOutAmount, route);

  return wallet.createTransaction(params);
}
