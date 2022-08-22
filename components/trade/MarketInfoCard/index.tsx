import React from 'react';
import tw from 'twin.macro';
import usePairWalletBalances from '~/hooks/usePairWalletBalances';
import { useOpenOrders } from '~/state/advanced-trading';
import {
  useMarket,
  usePair,
  usePairExchangeBalances,
  usePairPrecision,
} from '~/state/trade';
import Card from '../../common/Card';
import RequireAuth from '../../common/RequireAuth';
import TokenIcon from '../../common/TokenIcon';

const LineItem = tw.p`flex items-center justify-between text-sm`;

/**
 * Market parameters (price tick, min order) and pair balances.
 */
const Content: React.FC = () => {
  const [market] = useMarket();
  const [orders] = useOpenOrders();

  const { quoteTokenMetadata, baseTokenMetadata } = usePair();

  const { pricePrecision, quantityPrecision } = usePairPrecision();
  const [exchangeBalances] = usePairExchangeBalances(10_000);
  const { quoteBalance, baseBalance } = exchangeBalances;

  const [walletBalances] = usePairWalletBalances();
  const { baseWalletBalance, quoteWalletBalance } = walletBalances;

  return (
    <React.Fragment>
      <section>
        <div>
          <div tw="flex items-center gap-x-3">
            <div tw="flex-grow grid grid-cols-2 gap-3 items-start text-sm">
              <p>Exchange</p>
              <p>Wallet</p>
            </div>
            <span tw="w-10" />
            {/* same size as token icon */}
          </div>
          <div tw="flex items-center gap-x-3">
            <div tw="flex-grow grid grid-cols-2 gap-x-3 gap-y-1">
              <p>{market.priceBnToNumber(quoteBalance, pricePrecision)}</p>
              <p>
                {quoteWalletBalance
                  ? market.priceBnToNumber(quoteWalletBalance, pricePrecision)
                  : '--'}
              </p>
            </div>
            <TokenIcon src={quoteTokenMetadata.icon} />
          </div>
          <div tw="flex items-center gap-x-3">
            <div tw="flex-grow grid grid-cols-2 gap-x-3 gap-y-1">
              <p>{market.quantityBnToNumber(baseBalance, quantityPrecision)}</p>
              <p>
                {baseWalletBalance
                  ? market.quantityBnToNumber(
                      baseWalletBalance,
                      quantityPrecision
                    )
                  : '--'}
              </p>
            </div>
            <TokenIcon src={baseTokenMetadata.icon} />
          </div>
        </div>
      </section>
      <section>
        <div tw="space-y-1.5">
          <LineItem>
            <span>Price tick</span>
            <span>
              {market.priceTick} {quoteTokenMetadata.symbol}
            </span>
          </LineItem>
          <LineItem>
            <span>Min order size</span>
            <span>
              {market.quantityTick} {baseTokenMetadata.symbol}
            </span>
          </LineItem>
          <LineItem>
            <span>Taker fee</span>
            <span>{market.takerFeeBaseRate / 100}%</span>
          </LineItem>
          <LineItem>
            <span>Maker rebate</span>
            <span>{market.makerRebateBaseRate / 100}%</span>
          </LineItem>
          <LineItem>
            <span>Max open orders</span>
            <span>
              {market.inner.max_orders_per_account} ({orders?.length || '--'}/
              {market.inner.max_orders_per_account})
            </span>
          </LineItem>
        </div>
      </section>
    </React.Fragment>
  );
};

const MarketInfoCard: React.FC = (props) => {
  return (
    <Card
      tw="p-3 relative flex flex-col items-stretch gap-y-3 overflow-auto"
      {...props}
    >
      <RequireAuth>
        <Content />
      </RequireAuth>
    </Card>
  );
};

export default MarketInfoCard;
