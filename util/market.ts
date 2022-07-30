import BN from 'bn.js';
import { Orderbook } from '@tonic-foundation/tonic';

export const getMidmarketPrice = ({
  asks,
  bids,
}: Orderbook): BN | undefined => {
  if (asks.length && bids.length) {
    const bestAsk = asks[asks.length - 1][0];
    const bestBid = bids[0][0];
    const midmarketPrice = bestAsk.add(bestBid).divn(2);
    return midmarketPrice;
  } else if (asks.length) {
    const bestAsk = asks[asks.length - 1][0];
    return bestAsk;
  } else if (bids.length) {
    const bestBid = bids[0][0];
    return bestBid;
  }
  // no orders at all
  return;
};
