import { useParams } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { NewOrderParams } from '@tonic-foundation/tonic';
import RequireAccount from '~/components/common/RequireAccount';
import AppLayout from '~/layouts/AppLayout';
import React, { useEffect } from 'react';
import { getExplorerUrl } from '~/config';
import {
  marketIdState,
  useMarket,
  useOrderbook,
  usePair,
  usePairExchangeBalances,
} from '~/state/trade';
import { withToastPromise } from '~/components/common/ToastWrapper';
import ErrorBoundary from '~/components/common/ErrorBoundary';
import { useIsMobile } from '~/hooks/useIsMobile';
import DesktopContent, { Header as DesktopHeader } from './desktop';
import MobileContent, { Header as MobileHeader } from './mobile';
import OrderConfirmingToast from '~/components/common/OrderConfirming';
import WaitingForNearNetwork from '~/components/common/WaitingForNearNetwork';
import { sleep } from '../../util';

import {
  AdvancedTradingContainer,
  useOpenOrders,
} from '~/state/advanced-trading';

const Content = () => {
  const isMobile = useIsMobile();

  const [market] = useMarket();
  const { baseTokenMetadata, quoteTokenMetadata } = usePair();

  const [, refreshOrderbook] = useOrderbook();
  const [, refreshPairBalances] = usePairExchangeBalances();
  const [, refreshOpenOrders] = useOpenOrders();
  const handleClickConfirmTrade = async (params: NewOrderParams) => {
    try {
      await withToastPromise(
        market.placeOrder(params),
        {
          loading: <OrderConfirmingToast />,
          error: (error) => {
            return <p>Error placing order {`${error}`}</p>;
          },
          success: ({ executionOutcome, response }) => {
            return (
              <React.Fragment>
                {params.orderType === 'Market' ? (
                  <React.Fragment>
                    <p>Order filled</p>
                    <p tw="mt-3 text-sm">
                      Market {params.side}{' '}
                      {market.quantityBnToNumber(response.base_fill_quantity)}/
                      {params.quantity} {baseTokenMetadata.symbol}
                    </p>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <p>Order placed</p>
                    <p tw="mt-3 text-sm">
                      {params.side} {params.quantity} {baseTokenMetadata.symbol}{' '}
                      @ {params.limitPrice} {quoteTokenMetadata.symbol}
                    </p>
                  </React.Fragment>
                )}
                <p tw="text-sm">
                  <a
                    tw="text-up-dark hover:underline"
                    target="_blank"
                    rel="noreferrer"
                    href={getExplorerUrl(
                      'transaction',
                      executionOutcome.transaction_outcome.id
                    )}
                  >
                    View the transaction
                  </a>
                </p>
              </React.Fragment>
            );
          },
        },
        { duration: 3_500 }
      );
    } finally {
      await sleep(1000);
      refreshOrderbook();
      refreshPairBalances();
      refreshOpenOrders();
    }
  };

  return (
    <RequireAccount>
      {isMobile ? (
        <MobileContent onClickConfirmTrade={handleClickConfirmTrade} />
      ) : (
        <DesktopContent onClickConfirmTrade={handleClickConfirmTrade} />
      )}
    </RequireAccount>
  );
};

function TradePage() {
  const urlParams = useParams<'market'>();
  const [marketId, setMarketId] = useRecoilState(marketIdState);

  const isMobile = useIsMobile();

  // take market id from url param if set
  useEffect(() => {
    const { market: urlMarket } = urlParams;
    if (urlMarket && urlMarket !== marketId) {
      setMarketId(urlMarket);
    }
  }, [urlParams]);

  return (
    <ErrorBoundary fallbackLabel="There was an error loading the market.">
      <AdvancedTradingContainer>
        <AppLayout
          headerLeftContent={
            isMobile ? undefined : (
              <React.Suspense fallback={<React.Fragment />}>
                <DesktopHeader />
              </React.Suspense>
            )
          }
        >
          {isMobile && (
            <React.Suspense fallback={<React.Fragment />}>
              <MobileHeader />
            </React.Suspense>
          )}
          <React.Suspense fallback={<WaitingForNearNetwork />}>
            <Content />
          </React.Suspense>
        </AppLayout>
      </AdvancedTradingContainer>
    </ErrorBoundary>
  );
}

export default TradePage;
