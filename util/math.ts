import BN from 'bn.js';

export const ZERO = new BN(0);

export function denomination(decimals: number): BN {
  return new BN(10).pow(new BN(decimals));
}

export function roundDownTo(v: BN, nearest: BN): BN {
  return v.div(nearest).mul(nearest);
}

/**
 * Number.floor for on-chain integer values
 */
export function bnFloor(v: BN, decimals: number): BN {
  const mask = denomination(decimals);
  return v.div(mask).mul(mask);
}

export function truncate(v: number, places: number) {
  const mul = Math.pow(10, places);
  return Math.floor(v * mul) / mul;
}
