import tw from 'twin.macro';
import { NewOrderParams, OrderSide } from '@tonic-foundation/tonic';
import React, { useState } from 'react';
import Card from '~/components/common/Card';
import Orderbook from '~/components/trade/Orderbook';
import RecentTrades from '~/components/trade/RecentTrades';
import TVChart from '~/components/trade/TVChart';
import UserOrdersTable from '~/components/trade/UserOrdersTable';
import OrderForm from '~/components/trade/OrderForm';
import {
  useMarket,
  useMidmarketPrice,
  usePair,
  usePairExchangeBalances,
  usePairPrecision,
  useTicker,
} from '~/state/trade';
import Button from '~/components/common/Button';
import { atom, useRecoilState, useSetRecoilState } from 'recoil';
import Modal, { ModalBody } from '~/components/common/Modal';
import Toggle from '~/components/common/Toggle';
import { use24hStats } from '~/hooks/use24hStats';
import { useTitle } from 'react-use';
import MarketPickerButton from '~/components/trade/MarketPickerButton';
import { colors } from '~/styles';
import AuthButton from '~/components/common/AuthButton';
import { useWalletSelector } from '~/state/WalletSelectorContainer';
import useMarketSelector from '~/components/trade/MarketSelector/useWalletSelectorModal';

export const Header: React.FC = (props) => {
  const [market] = useMarket();
  const ticker = useTicker();

  const { priceChangePercent, stats } = use24hStats(market.id);
  const { baseTokenMetadata, quoteTokenMetadata } = usePair();
  const { pricePrecision } = usePairPrecision();

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
    <header tw="flex items-stretch justify-between p-3" {...props}>
      <div tw="flex flex-col justify-between">
        <MarketPickerButton
          // TODO: stop using this component
          hideIcon
          tw="p-0 text-lg"
          ticker={ticker}
          onClick={handleClickMarketSearch}
        />
        {!!stats?.quantity && (
          <p>
            {stats.quantity.toFixed(2)} {baseTokenMetadata.symbol}{' '}
            <span tw="opacity-70">24h vol</span>
          </p>
        )}
      </div>
      <div tw="flex flex-col justify-between text-right">
        <p tw="text-lg">
          {priceFormatted} {quoteTokenMetadata.symbol}
        </p>
        {!!priceChangePercent && (
          <span css={colors.priceText(priceChangePercent || 0)}>
            {priceChangePercent >= 0 && '+'}
            {priceChangePercent.toFixed(2)}%
          </span>
        )}
      </div>
    </header>
  );
};
interface ContentProps {
  onClickConfirmTrade: (p: NewOrderParams) => Promise<unknown>;
}

const orderFormOpenState = atom<OrderSide | undefined>({
  key: 'mobile-order-form-open-state',
  default: undefined,
});

const FloatingFooter: React.FC = (props) => {
  const { activeAccount } = useWalletSelector();
  const [market] = useMarket();
  const [balances] = usePairExchangeBalances();
  const { baseBalance, quoteBalance } = balances;
  const { baseTokenMetadata, quoteTokenMetadata } = usePair();
  const baseBalanceNumber = market.quantityBnToNumber(baseBalance);
  const quoteBalanceNumber = market.priceBnToNumber(quoteBalance);

  const setOrderForm = useSetRecoilState(orderFormOpenState);

  return (
    <footer
      tw="fixed z-10 left-0 right-0 bottom-[env(safe-area-inset-bottom)] w-full p-3"
      {...props}
    >
      <Card tw="w-full m-auto rounded-xl p-2 flex items-stretch justify-between light:bg-neutral-100 shadow-lg dark:bg-neutral-700">
        <div tw="pl-2 flex-1">
          <p>
            {baseBalanceNumber}{' '}
            <span tw="opacity-70">{baseTokenMetadata.symbol}</span>
          </p>
          <p>
            {quoteBalanceNumber}{' '}
            <span tw="opacity-70">{quoteTokenMetadata.symbol}</span>
          </p>
        </div>

        {!!activeAccount ? (
          <div tw="flex-1 grid grid-cols-2 gap-2">
            <Button
              variant="up"
              tw="dark:border-none"
              onClick={(e) => {
                e.preventDefault();
                setOrderForm('Buy');
              }}
            >
              Buy
            </Button>
            <Button
              variant="down"
              tw="dark:border-none"
              onClick={(e) => {
                e.preventDefault();
                setOrderForm('Sell');
              }}
            >
              Sell
            </Button>
          </div>
        ) : (
          <div tw="flex-1 flex items-stretch justify-end">
            <AuthButton />
          </div>
        )}
      </Card>
    </footer>
  );
};

const MobileContent: React.FC<ContentProps> = ({
  onClickConfirmTrade,
  ...props
}) => {
  const [market] = useMarket();
  const ticker = useTicker();
  const [orderFormSide, setOrderFormSide] = useRecoilState(orderFormOpenState);

  const [tab, setTab] = useState<'chart' | 'orderbook' | 'trades'>('chart');

  // used to set price in the order form by clicking the orderbook
  const [selectedPrice, setSelectedPrice] = useState<number>();
  const [selectedQuantity, setSelectedQuantity] = useState<number>();

  return (
    // pb accounts for footer, roughly
    <main tw="flex-grow px-3 space-y-3 pb-32" {...props}>
      <Toggle.Container>
        <Toggle.Button
          tw="py-2"
          active={tab === 'chart'}
          onClick={(e) => {
            e.preventDefault();
            setTab('chart');
          }}
        >
          Chart
        </Toggle.Button>
        <Toggle.Button
          tw="py-2"
          active={tab === 'orderbook'}
          onClick={(e) => {
            e.preventDefault();
            setTab('orderbook');
          }}
        >
          Orderbook
        </Toggle.Button>
        <Toggle.Button
          tw="py-2"
          active={tab === 'trades'}
          onClick={(e) => {
            e.preventDefault();
            setTab('trades');
          }}
        >
          Trades
        </Toggle.Button>
      </Toggle.Container>

      {/* tvchart is always rendered because it's quite slow to switch back to */}
      <Card
        tw="relative overflow-hidden h-screen max-h-[400px]"
        css={tab === 'chart' ? tw`block` : tw`hidden`}
      >
        <TVChart tw="h-full w-full" symbol={ticker} />
      </Card>
      {tab === 'orderbook' && (
        <div tw="flex flex-col overflow-hidden h-screen max-h-[400px]">
          <Orderbook
            tw="flex flex-col overflow-hidden min-h-0 max-h-full"
            onClickPrice={setSelectedPrice}
            onClickQuantity={setSelectedQuantity}
          />
        </div>
      )}
      {tab === 'trades' && <RecentTrades tw="h-screen max-h-[400px]" />}

      <UserOrdersTable tw="flex flex-col overflow-hidden min-h-[20vh] max-h-[50vh]" />

      <Modal
        drawerOnMobile
        visible={!!orderFormSide}
        onClose={() => setOrderFormSide(undefined)}
      >
        <ModalBody>
          <OrderForm
            side={orderFormSide}
            price={selectedPrice}
            quantity={selectedQuantity}
            priceTick={market.priceTick}
            quantityTick={market.quantityTick}
            onClickConfirm={(p) =>
              onClickConfirmTrade(p).then(() => setOrderFormSide(undefined))
            }
          />
        </ModalBody>
      </Modal>

      <FloatingFooter />
    </main>
  );
};

export default MobileContent;
