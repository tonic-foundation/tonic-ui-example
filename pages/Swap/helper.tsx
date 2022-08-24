import { FunctionCallAction } from '@near-wallet-selector/core';
import { NEAR_DECIMALS } from '@tonic-foundation/token';
import { TokenInfo } from '@tonic-foundation/token-list';
import { getMidmarketPrice, Tonic } from '@tonic-foundation/tonic';
import { SwapParamsV1 } from '@tonic-foundation/tonic/lib/types/v1';
import {
  bnToApproximateDecimal,
  decimalToBn,
  MAX_GAS,
  tgasAmount,
} from '@tonic-foundation/utils';
import BN from 'bn.js';
import { FunctionCall as NearApiJsFunctionCall } from 'near-api-js/lib/transaction';
import { SwapSettings } from '~/components/swap/SwapSettingsForm';
import { TONIC_CONTRACT_ID } from '~/config';
import { HydratedMarketInfo } from '~/hooks/useMarkets';
import { ImplicitSignerTransaction } from '~/services/near';
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
  tonic: Tonic,
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

// XXX TODO FIXME: the functionCall function in near-api-js isn't compatible
// with the FunctionCallAction type (gas/deposit are BN in near-api-js, string in
// wallet-selector/core), so here we are
type FunctionCallParams = Omit<NearApiJsFunctionCall, 'args'> & {
  args: object;
};
function createFunctionCall(_params: FunctionCallParams): FunctionCallAction {
  const params: FunctionCallAction['params'] = {
    ..._params,
    gas: _params.gas.toString(),
    deposit: _params.deposit.toString(),
  };
  return {
    type: 'FunctionCall',
    params,
  };
}

export async function createTokenDepositTransaction(
  receiverId: string,
  accountId: string
): Promise<ImplicitSignerTransaction> {
  return {
    receiverId,
    actions: [
      createFunctionCall({
        methodName: 'storage_deposit',
        args: {
          account_id: accountId,
          registration_only: true,
        },
        gas: tgasAmount(10),
        deposit: nearAmount(0.1),
      }),
    ],
  };
}

function getSwapFromFtCall(
  token: TokenInfo,
  amount: BN,
  minOutAmount: BN,
  route: SwapRoute
): ImplicitSignerTransaction {
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
      createFunctionCall({
        methodName: 'ft_transfer_call',
        args: {
          receiver_id: TONIC_CONTRACT_ID,
          amount: amount.toString(),
          msg: JSON.stringify({
            action: 'Swap',
            params,
          }),
        },
        gas: tgasAmount(180),
        deposit: new BN(1),
      }),
    ],
  };
}

function getSwapFromNearCall(
  amount: BN,
  minOutAmount: BN,
  route: SwapRoute
): ImplicitSignerTransaction {
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
      createFunctionCall({
        methodName: 'swap_near',
        args: { swaps },
        gas: MAX_GAS,
        deposit: amount,
      }),
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
): ImplicitSignerTransaction {
  if (tokenIn.address.toLowerCase() === 'near') {
    return getSwapFromNearCall(tokenInAmount, minNetOutAmount, route);
  }
  return getSwapFromFtCall(tokenIn, tokenInAmount, minNetOutAmount, route);
}
