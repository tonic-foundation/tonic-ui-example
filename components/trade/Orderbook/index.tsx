import tw from 'twin.macro';
import {
  L2Order,
  Orderbook as OrderbookView,
  OrderSide,
} from '@tonic-foundation/tonic';
import {
  decimalToBn,
  bnToFixed,
  bnToApproximateDecimal,
} from '@tonic-foundation/utils';
import React, { useEffect } from 'react';
import { bnFloor, ZERO } from '~/util/math';
import {
  atom,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from 'recoil';
import {
  useMarket,
  useMidmarketPrice,
  useOrderbook,
  usePair,
  usePairPrecision,
} from '~/state/trade';
import Fallback from '../../common/Fallback';
import { useEntering } from '~/hooks/useEntering';
import Card, { CardBody, CardHeader } from '../../common/Card';
import { TONIC_ORDERBOOK_REFRESH_INTERVAL } from '~/config';

// TODO: use usePairPrecision
const groupingPrecisionState = atom<number>({
  key: 'grouping-precision-state',
  default: 3, // number of decimal places to round to
});

const groupByPriceLevel = (orders: L2Order[], decimals: number) => {
  return orders.reduce((acc, curr) => {
    if (!acc.length) {
      return [curr];
    }
    const [[prevPrice, prevSize]] = acc.slice(-1);
    const [currPrice, currSize] = curr;
    const prevPriceTrunc = bnFloor(prevPrice, decimals);
    const currPriceTrunc = bnFloor(currPrice, decimals);
    if (prevPriceTrunc.eq(currPriceTrunc)) {
      return [
        ...acc.slice(0, -1),
        [prevPrice, prevSize.add(currSize)] as L2Order,
      ];
    }
    return [...acc, curr];
  }, [] as L2Order[]);
};

function groupOrderbook(
  orderbook: OrderbookView,
  decimals: number,
  precision: number
) {
  const { bids, asks } = orderbook;
  const priceLevelDecimals = decimals - precision;

  return {
    asks: groupByPriceLevel(asks, priceLevelDecimals),
    bids: groupByPriceLevel(bids, priceLevelDecimals),
  };
}

const TradeSizeBar: React.FC<{ width: number; direction: OrderSide }> = ({
  width,
  direction,
  ...props
}) => {
  // don't let the bar completely disappear
  const _width = Math.max(0.1, width);

  return (
    <div
      style={{ width: `${_width}%` }}
      css={[
        tw`absolute right-0 top-0 bottom-0`,
        direction === 'Buy'
          ? tw`bg-up-dark bg-opacity-10 light:(bg-up bg-opacity-20)`
          : tw`bg-down-dark bg-opacity-10 light:(bg-down bg-opacity-20)`,
      ]}
      {...props}
    ></div>
  );
};

const OrderRow: React.FC<{
  onClickPrice?: () => unknown;
  onClickQuantity?: () => unknown;
  order: L2Order;
  side: OrderSide;
  cumulativeSize: number;
  runningTotal: number;
  priceDecimals: number;
  quantityDecimals: number;
}> = ({
  order,
  side,
  cumulativeSize,
  runningTotal,
  priceDecimals,
  quantityDecimals,
  onClickPrice,
  onClickQuantity,
}) => {
  const entering = useEntering();

  const [price, size] = order;
  const precision = useRecoilValue(groupingPrecisionState);

  const width =
    (bnToApproximateDecimal(size, quantityDecimals) / cumulativeSize) * 100;
  const runningTotalWidth = (runningTotal / cumulativeSize) * 100;

  const textColor =
    side === 'Buy'
      ? tw`text-up light:text-up-extraDark`
      : tw`text-down light:text-down-extraDark`;

  return (
    <div
      tw="pr-0.5 tabular-nums py-[1px] relative flex items-center justify-between text-right font-mono cursor-pointer"
      css={
        side === 'Buy'
          ? tw`hover:(bg-up bg-opacity-20)`
          : tw`hover:(bg-down bg-opacity-20)`
      }
    >
      <div
        tw="absolute inset-0 transition duration-500 ease-linear"
        css={
          // Entrance flash. We'd like the entrance flash to have a transition,
          // but the mouse hover to not. It's easiest to do this by having the
          // flash happen on its own element, and hover on the parent.
          entering &&
          (side === 'Buy' ? tw`bg-up bg-opacity-60` : tw`bg-down bg-opacity-60`)
        }
      />

      <p tw="relative z-10 text-left" onClick={onClickPrice}>
        {bnToFixed(price, priceDecimals, precision)}
      </p>
      <span tw="relative z-10" css={textColor} onClick={onClickQuantity}>
        {bnToFixed(size, quantityDecimals, Math.min(quantityDecimals, 3))}
      </span>

      <TradeSizeBar direction={side} width={width} tw="bg-opacity-20" />
      <TradeSizeBar direction={side} width={runningTotalWidth} />
    </div>
  );
};

// sums only the size of bids and asks
function getCumulativeSize(orders: L2Order[], baseDecimals: number): number {
  const sum = orders
    .map(([, quantity]) => quantity)
    .reduce((acc, q) => acc.add(q), ZERO);
  return bnToApproximateDecimal(sum, baseDecimals);
}

type OrderWithRunningTotal = { total: number; order: L2Order };
function withRunningTotal(
  orders: L2Order[],
  baseDecimals: number
): OrderWithRunningTotal[] {
  return orders.reduce((acc, order) => {
    const [, size] = order;
    if (!acc.length) {
      return [
        {
          order,
          total: bnToApproximateDecimal(size, baseDecimals),
        },
      ];
    }
    const [prev] = acc.slice(-1);
    const total = prev.total + bnToApproximateDecimal(size, baseDecimals);
    return [...acc, { order, total }];
  }, [] as OrderWithRunningTotal[]);
}

const Book: React.FC<{
  onClickPrice: (p: number) => unknown;
  onClickQuantity: (p: number) => unknown;
}> = ({ onClickPrice, onClickQuantity }) => {
  const [market] = useMarket();
  const midmarketPrice = useMidmarketPrice();
  const [orderbook, refreshOrderbook] = useOrderbook(false);

  const { baseTokenMetadata, quoteTokenMetadata } = usePair();
  const { pricePrecision } = usePairPrecision();
  const groupingPrecision = useRecoilValue(groupingPrecisionState);
  const setGroupingPrecision = useSetRecoilState(groupingPrecisionState);

  useEffect(() => {
    const id = setInterval(refreshOrderbook, TONIC_ORDERBOOK_REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [refreshOrderbook]);

  useEffect(() => {
    setGroupingPrecision(pricePrecision);
  }, [pricePrecision, setGroupingPrecision]);

  const groupedOrderbook = groupOrderbook(
    orderbook,
    quoteTokenMetadata.decimals,
    groupingPrecision
  );

  const { asks, bids } = groupedOrderbook;
  const cumulativeAskSize = getCumulativeSize(asks, market.baseDecimals);
  const cumulativeBidSize = getCumulativeSize(bids, market.baseDecimals);

  const midMarketPriceOrDefault =
    midmarketPrice || decimalToBn(1, market.quoteDecimals);
  const priceFormatted = bnToFixed(
    midMarketPriceOrDefault,
    market.quoteDecimals,
    pricePrecision
  );

  return (
    <React.Fragment>
      <div tw="mb-2 font-primary flex justify-between">
        <span>Price ({quoteTokenMetadata.symbol})</span>
        <span tw="pr-2">Size ({baseTokenMetadata.symbol})</span>
      </div>

      <div tw="h-full flex flex-col overflow-hidden">
        <div tw="flex-1 flex flex-col-reverse overflow-auto">
          {/* flex col reverse keeps the asks scrolled to the bottom */}
          {withRunningTotal([...asks].reverse(), market.baseDecimals).map(
            ({ order, total }) => (
              <OrderRow
                onClickPrice={() =>
                  onClickPrice(market.priceBnToNumber(order[0]))
                }
                onClickQuantity={() =>
                  onClickQuantity(market.quantityBnToNumber(order[1]))
                }
                key={order[0].toString() + order[1].toString()}
                order={order}
                side="Sell"
                runningTotal={total}
                priceDecimals={market.quoteDecimals}
                quantityDecimals={market.baseDecimals}
                cumulativeSize={cumulativeAskSize}
              />
            )
          )}
        </div>

        <div tw="text-center font-mono pb-1 px-1.5 text-base">
          <button
            onClick={() =>
              onClickPrice(market.priceBnToNumber(midMarketPriceOrDefault))
            }
          >
            {priceFormatted} {quoteTokenMetadata.symbol}
          </button>
        </div>

        <div tw="flex-1 overflow-auto">
          {withRunningTotal(bids, market.baseDecimals).map(
            ({ order, total }) => (
              <OrderRow
                onClickPrice={() =>
                  onClickPrice(market.priceBnToNumber(order[0]))
                }
                onClickQuantity={() =>
                  onClickQuantity(market.quantityBnToNumber(order[1]))
                }
                key={order[0].toString() + order[1].toString()}
                order={order}
                runningTotal={total}
                side="Buy"
                priceDecimals={market.quoteDecimals}
                quantityDecimals={market.baseDecimals}
                cumulativeSize={cumulativeBidSize}
              />
            )
          )}
        </div>
      </div>
    </React.Fragment>
  );
};

const PrecisionButton = tw.button`w-5 h-5 flex items-center justify-center rounded transition`;
const PrecisionControl = () => {
  const steps = [0.1, 0.01, 0.001, 0.0001, 0.00001];
  const [precision, setPrecision] = useRecoilState(groupingPrecisionState);

  const changePrecision = (direction: 'up' | 'down') => {
    if (direction === 'up') {
      setPrecision(Math.min(steps.length, precision + 1));
    } else {
      setPrecision(Math.max(1, precision - 1));
    }
  };

  return (
    <div tw="flex items-center">
      <span tw="mr-1.5">Grouping</span>
      <span tw="mr-1">{steps[precision - 1]}</span>
      <PrecisionButton onClick={() => changePrecision('down')}>
        -
      </PrecisionButton>
      <PrecisionButton onClick={() => changePrecision('up')}>+</PrecisionButton>
    </div>
  );
};

const Orderbook: React.FC<{
  onClickPrice: (p: number) => unknown;
  onClickQuantity: (p: number) => unknown;
}> = ({ onClickPrice, onClickQuantity, ...props }) => {
  return (
    <Card tw="flex-1 flex flex-col overflow-hidden" {...props}>
      <CardHeader tw="pr-2">
        <h1>Orderbook</h1>
        <PrecisionControl />
      </CardHeader>
      <CardBody tw="pr-2 flex-grow text-sm">
        <React.Suspense fallback={<Fallback />}>
          <Book onClickPrice={onClickPrice} onClickQuantity={onClickQuantity} />
        </React.Suspense>
      </CardBody>
    </Card>
  );
};

export default Orderbook;
