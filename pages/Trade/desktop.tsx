import { NewOrderParams } from '@tonic-foundation/tonic';
import React, { useState } from 'react';
import Card from '~/components/common/Card';
import Orderbook from '~/components/trade/Orderbook';
import RecentTrades from '~/components/trade/RecentTrades';
import TVChart from '~/components/trade/TVChart';
import UserOrdersTable from '~/components/trade/UserOrdersTable';
import OrderForm from '~/components/trade/OrderForm';
import MarketInfoCard from '~/components/trade/MarketInfoCard';
import {
  useMarket,
  useMidmarketPrice,
  usePair,
  usePairPrecision,
  useTicker,
} from '~/state/trade';
import tw from 'twin.macro';
import { use24hStats } from '~/hooks/use24hStats';
import { useTitle } from 'react-use';
import MarketPickerButton from '~/components/trade/MarketPickerButton';
import { colors } from '~/styles';
import RequireAuth from '~/components/common/RequireAuth';
import Fallback from '~/components/common/Fallback';
import useMarketSelector from '~/components/trade/MarketSelector/useMarketSelectorModal';

const StatContainer = tw.div`flex flex-col`;
const StatTitle = tw.h2`text-sm text-neutral-400 light:text-black`;

export const Header: React.FC = (props) => {
  const [market] = useMarket();
  const ticker = useTicker();

  const { priceChangePercent, stats } = use24hStats(market.id);
  const { baseTokenMetadata, quoteTokenMetadata } = usePair();
  const { pricePrecision } = usePairPrecision();

  const showQuoteSymbolInPrice = !quoteTokenMetadata.symbol
    .toLowerCase()
    .includes('usd');

  const midmarketPrice = useMidmarketPrice();
  const priceFormatted = midmarketPrice
    ? market
        .priceBnToNumber(midmarketPrice, pricePrecision)
        .toFixed(pricePrecision)
    : stats?.previous?.toFixed(pricePrecision) || '---';

  useTitle(`${priceFormatted} ${ticker}`);

  const showMarketSearch = useMarketSelector();
  const handleClickMarketSearch = () => showMarketSearch(true);

  return (
    <header
      tw="flex flex-col gap-1 px-3 md:(flex-row items-stretch)"
      {...props}
    >
      <MarketPickerButton ticker={ticker} onClick={handleClickMarketSearch} />
      <div tw="px-3 py-2 flex items-center gap-x-3 overflow-x-auto">
        <StatContainer>
          <React.Fragment>
            <StatTitle>Price</StatTitle>
            <p>
              {priceFormatted}
              {!!priceChangePercent && (
                <span css={colors.priceText(priceChangePercent || 0)}>
                  {' '}
                  {priceChangePercent >= 0 && '+'}
                  {priceChangePercent.toFixed(2)}%
                  {showQuoteSymbolInPrice && quoteTokenMetadata.symbol}
                </span>
              )}
            </p>
          </React.Fragment>
        </StatContainer>
        {stats?.high && (
          <StatContainer>
            <React.Fragment>
              <StatTitle>24h High</StatTitle>
              <span>{stats.high.toFixed(2)}</span>
            </React.Fragment>
          </StatContainer>
        )}
        {stats?.low && (
          <StatContainer>
            <React.Fragment>
              <StatTitle>24h Low</StatTitle>
              <span>{stats.low.toFixed(2)}</span>
            </React.Fragment>
          </StatContainer>
        )}
        {!!stats?.quantity && (
          <StatContainer>
            <React.Fragment>
              <StatTitle>24h Volume</StatTitle>
              <span>
                {stats.quantity.toFixed(2)} {baseTokenMetadata.symbol}
              </span>
            </React.Fragment>
          </StatContainer>
        )}
      </div>
    </header>
  );
};

interface ContentProps {
  onClickConfirmTrade: (p: NewOrderParams) => Promise<unknown>;
}

const DesktopContent: React.FC<ContentProps> = ({
  onClickConfirmTrade,
  ...props
}) => {
  const [market] = useMarket();
  const ticker = useTicker();

  // used to set price in the order form by clicking the orderbook
  const [selectedPrice, setSelectedPrice] = useState<number>();
  const [selectedQuantity, setSelectedQuantity] = useState<number>();

  return (
    <main
      tw="flex-grow flex items-stretch px-3 max-h-screen overflow-auto gap-2"
      {...props}
    >
      <section tw="flex flex-grow flex-col gap-2">
        <Card tw="block overflow-hidden flex-grow">
          <TVChart tw="h-full w-full" symbol={ticker} />
        </Card>
        <UserOrdersTable
          tw="flex flex-col overflow-hidden min-h-0 max-h-[30vh]"
          collapsible
        />
      </section>

      <section tw="flex flex-col flex-shrink-0 gap-2 overflow-hidden w-[300px]">
        <Orderbook
          tw="flex flex-col overflow-hidden min-h-0 max-h-full"
          onClickPrice={setSelectedPrice}
          onClickQuantity={setSelectedQuantity}
        />
        <RecentTrades collapsible />
      </section>

      <section tw="flex flex-col flex-shrink-0 overflow-hidden gap-2 w-[340px]">
        <Card tw="relative p-3 pt-2 flex-shrink-0 overflow-hidden" {...props}>
          <React.Suspense fallback={<Fallback tw="absolute inset-0" />}>
            <RequireAuth>
              <OrderForm
                price={selectedPrice}
                quantity={selectedQuantity}
                priceTick={market.priceTick}
                quantityTick={market.quantityTick}
                onClickConfirm={onClickConfirmTrade}
              />
            </RequireAuth>
          </React.Suspense>
        </Card>
        <MarketInfoCard tw="flex-grow" />
      </section>
    </main>
  );
};

export default DesktopContent;
