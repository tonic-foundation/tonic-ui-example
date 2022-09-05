export function sleep(n: number) {
  return new Promise((resolve) => setTimeout(resolve, n));
}

/**
 * Return the number of decimals to show in a price/quantity. You usually use
 * this to compute the argument to Number.toFixed()
 */
export function getDecimalPrecision(tick: number): number {
  if (tick >= 1) {
    return 0;
  }
  return tick.toString().length - 2;
}

export function abbreviateAccountId(s: string, maxLength = 20, gutter = 0) {
  if (s.length > maxLength) {
    const head = s.slice(0, maxLength - 3 - gutter);
    const tail = s.slice(s.length - gutter);
    return head + '...' + tail;
  }
  return s;
}

export function range(n: number) {
  return [...new Array(n).keys()];
}
