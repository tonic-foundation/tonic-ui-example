import tw from 'twin.macro';
import Fallback from '../../common/Fallback';
import React from 'react';
import useRecentTrades, { RecentTrade } from '~/hooks/useRecentTrades';
import { bnToFixed } from '@tonic-foundation/utils';
import { pairState, usePair, usePairPrecision } from '~/state/trade';
import { useRecoilValue } from 'recoil';
import { useEntering } from '~/hooks/useEntering';
import CollapseButton from '../../common/CollapseButton';
import Card, { CardBody, CardHeader } from '../../common/Card';
import { format } from 'date-fns';
import usePersistentState from '~/hooks/usePersistentState';

const Trade: React.FC<{
  trade: RecentTrade;
  /**
   * Number of decimals to show; compute this in the parent based on market
   * price tick
   */
  pricePrecision: number;
  /**
   * Number of decimals to show; compute this in the parent based on market min
   * order size
   */
  quantityPrecision: number;
}> = ({ trade, quantityPrecision, pricePrecision }) => {
  const entering = useEntering();

  const { baseTokenDecimals, quoteTokenDecimals } = useRecoilValue(pairState);
  const quantity = bnToFixed(
    trade.quantity,
    baseTokenDecimals,
    quantityPrecision
  );
  const price = bnToFixed(trade.price, quoteTokenDecimals, pricePrecision);
  const timestamp = format(trade.timestamp, 'HH:mm:ss');
  const color =
    trade.change === 'up'
      ? tw`text-up light:text-emerald-500`
      : trade.change === 'down'
      ? tw`text-down light:text-red-600`
      : undefined; // should never happen

  return (
    <div
      css={[
        tw`transition duration-300 ease-linear`,
        entering &&
          (trade.change === 'up'
            ? tw`bg-up-light bg-opacity-30`
            : tw`bg-down-light bg-opacity-30`),
      ]}
      tw="grid grid-cols-3 font-mono"
    >
      <span css={color}>{price}</span>
      <span tw="text-right">{quantity}</span>
      <span tw="text-right pr-1">{timestamp}</span>
    </div>
  );
};

const Content = () => {
  const { trades } = useRecentTrades();
  const { pricePrecision, quantityPrecision } = usePairPrecision();
  const { baseTokenMetadata, quoteTokenMetadata } = usePair();

  return (
    <React.Fragment>
      <div tw="grid grid-cols-3">
        <span>Price ({quoteTokenMetadata.symbol})</span>
        <span tw="text-right">Size ({baseTokenMetadata.symbol})</span>
        <span tw="text-right pr-2">Time</span>
      </div>
      <div tw="mt-2 space-y-0.5 flex flex-col overflow-auto">
        {!trades.length && <p tw="p-6 text-center">No recent trades</p>}
        {trades.map((trade) => {
          return (
            <Trade
              pricePrecision={pricePrecision}
              quantityPrecision={quantityPrecision}
              key={trade.reactKey}
              trade={trade}
            />
          );
        })}
      </div>
    </React.Fragment>
  );
};

const RecentTrades: React.FC<{ collapsible?: boolean }> = ({
  collapsible,
  ...props
}) => {
  const [collapsed, setCollapsed] = usePersistentState(
    'recent-trades-collapsed',
    false
  );

  return (
    <Card
      tw="flex flex-col overflow-hidden"
      css={!collapsed && tw`flex-1`}
      {...props}
    >
      <CardHeader tw="py-0 pr-2">
        <h1 tw="py-2">Recent trades</h1>
        {collapsible && (
          <CollapseButton
            css={collapsed && tw`rotate-180`}
            onClick={() => setCollapsed(!collapsed)}
          />
        )}
      </CardHeader>
      <React.Suspense fallback={<Fallback />}>
        <CardBody tw="pr-2 text-sm" css={collapsed && tw`hidden`}>
          <Content />
        </CardBody>
      </React.Suspense>
    </Card>
  );
};

export default RecentTrades;
