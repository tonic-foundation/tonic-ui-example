import { ConnectConfig, keyStores } from 'near-api-js';
import { getNearConfig as getBaseNearConfig } from '@tonic-foundation/config';
import { TokenInfo } from '@tonic-foundation/token-list';
import { NEAR_DECIMALS, NEAR_METADATA } from '@tonic-foundation/token';
import { decimalToBn } from '@tonic-foundation/utils';

export const IS_DEV = process.env.NODE_ENV === 'development';

type NearEnv = 'testnet' | 'mainnet';
export const NEAR_ENV: NearEnv = (process.env.NEAR_ENV || 'testnet') as NearEnv;

/**
 * Image to render if a token's ft_metadata doesn't contain an icon.
 *
 * This is used directly in an <img />'s src attribute.
 */
export const DEFAULT_TOKEN_ICON =
  process.env.DEFAULT_TOKEN_ICON || 'https://picsum.photos/150/150';

/**
 * Prevent user from accidentally spending all of their NEAR
 */
export const NEAR_RESERVE = 0.5;
export const NEAR_RESERVE_BN = decimalToBn(NEAR_RESERVE, NEAR_DECIMALS);

/**
 * List of token that don't require storage balance. Used in swap and
 * withdrawls.
 */
export const STORAGE_EXEMPT_TOKENS =
  process.env.TONIC_STORAGE_EXEMPTY_TOKENS?.split(',') || ['usn', 'near'];

/**
 * Account ID to collect referral fees. Fees are deposited directly into this
 * account's exchange balances. The account must have a storage deposit with
 * the exchange to receive fees.
 */
export const REFERRER_ACCOUNT_ID = process.env.REFERRER_ACCOUNT_ID;
export const EXPLORER_BASE_URL =
  process.env.EXPLORER_BASE_URL || getExplorerBaseUrl(NEAR_ENV);
export const TONIC_CONTRACT_ID = process.env.TONIC_CONTRACT_ID as string;
export const TONIC_DATA_API_URL =
  process.env.TONIC_DATA_API_URL || 'http://localhost:3006';
export const TONIC_TV_URL =
  process.env.TONIC_TV_URL || `${TONIC_DATA_API_URL}/tv`;
export const TONIC_DEFAULT_MARKET_ID = process.env
  .TONIC_DEFAULT_MARKET_ID as string;
export const TONIC_LEADERBOARD_API_URL = process.env.TONIC_LEADERBOARD_API_URL;
export const TONIC_ORDERBOOK_REFRESH_INTERVAL = parseInt(
  process.env.TONIC_ORDERBOOK_REFRESH_INTERVAL || '15000'
);

export const TONIC_SWAP_ALLOW_SLIPPAGE_CONTROLS =
  !!process.env.TONIC_SWAP_ALLOW_SLIPPAGE_CONTROLS;
export const TONIC_SWAP_DEFAULT_SLIPPAGE_PERCENT = process.env
  .TONIC_SWAP_DEFAULT_SLIPPAGE_PERCENT
  ? parseInt(process.env.TONIC_SWAP_DEFAULT_SLIPPAGE_PERCENT)
  : 1;

export const DISCORD_DEVELOPERS_HREF = 'https://discord.gg/tscr95ufxx';
export const DISCORD_GENERAL_HREF = 'https://discord.gg/zedYdpyaTd';
export const DOCS_GENERAL_HREF = 'https://docs.tonic.foundation';
export const GITHUB_HREF = 'https://github.com/tonic-foundation/tonic-ui';
export const TELEGRAM_HREF = 'https://t.me/tonicdex';
export const TWITTER_HREF = 'https://twitter.com/tonicdex';
export const FEEDBACK_HREF = undefined;

export const getNearConfig = (): ConnectConfig => ({
  ...getBaseNearConfig(NEAR_ENV),
  keyStore: new keyStores.BrowserLocalStorageKeyStore(),
  // TODO: remove when config is published again
  headers: {},
});

export const NEAR_CONFIG = getNearConfig();

// token info for native near. Used in swap token selector
export const NEAR_TOKEN_INFO: TokenInfo = {
  address: 'NEAR',
  nearEnv: 'mainnet',
  logoURI: NEAR_METADATA.icon!, // oof
  ...NEAR_METADATA,
};

export function getExplorerBaseUrl(env: string) {
  switch (env) {
    case 'testnet': {
      return 'https://testnet.nearblocks.io';
    }
    case 'mainnet': {
      return 'https://nearblocks.io';
    }
    default: {
      throw new Error('Error getting explorer URL: unknown NEAR env');
    }
  }
}

export function getExplorerUrl(type: 'account' | 'transaction', id: string) {
  if (type === 'account') {
    return `${EXPLORER_BASE_URL}/address/${id}`;
  }
  if (type === 'transaction') {
    return `${EXPLORER_BASE_URL}/txns/${id}`;
  }
  throw new Error('Error getting explorer URL: invalid resource type');
}
