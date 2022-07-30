import BN from 'bn.js';
import { FungibleTokenMetadata } from '@tonic-foundation/token/lib/types';
import { ftBalanceOf, ftOrNativeNearMetadata } from '@tonic-foundation/token';
import { tonic, wallet } from './near';
import { ZERO } from '~/util/math';
import { NEAR_ENV } from '~/config';
import { Account } from 'near-api-js';

export async function getTokenMetadata(
  tokenId: string
): Promise<FungibleTokenMetadata> {
  return await ftOrNativeNearMetadata(wallet.account(), tokenId);
}

// TODO: remove
export async function getTokenBalance(tokenId: string) {
  const accountId = wallet.account().accountId;
  return wallet
    .account()
    .viewFunction(tokenId, 'ft_balance_of', { account_id: accountId })
    .then((n) => new BN(n))
    .catch(() => ZERO);
}

export const MAX_GAS = new BN(10).pow(new BN(14)).muln(3);
export async function mintTestTokens(tokenId: string, amount: BN) {
  await wallet.account().functionCall({
    contractId: tokenId,
    methodName: 'ft_mint',
    args: {
      receiver_id: tonic.account.accountId,
      amount: amount.toString(),
    },
    gas: MAX_GAS,
  });
}

/**
 * Return a list of IDs of tokens in the authenticated NEAR wallet.
 */
export async function getOwnedTokens(): Promise<string[]> {
  const accountId = wallet.account().accountId;
  const url =
    NEAR_ENV === 'testnet'
      ? `https://helper.testnet.near.org/account/${accountId}/likelyTokens`
      : `https://api.kitwallet.app/account/${accountId}/likelyTokens`;
  const res = await fetch(url);
  return await res.json();
}

export async function getTokenOrNearBalance(account: Account, tokenId: string) {
  if (tokenId.toLowerCase() === 'near') {
    const balance = await account.getAccountBalance();
    return new BN(balance.available);
  } else {
    return ftBalanceOf(account, tokenId, account.accountId);
  }
}
