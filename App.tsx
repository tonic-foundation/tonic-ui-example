import { useEffect } from 'react';
import { ArcElement, Chart, DoughnutController, Tooltip } from 'chart.js';
import { Toaster } from 'react-hot-toast';
import { HashRouter } from 'react-router-dom';
import { RecoilRoot } from 'recoil';

import { useIsMobile } from '~/hooks/useIsMobile';
import { ThemeProvider } from '~/hooks/useTheme';
import { TxToastProvider } from '~/hooks/useWalletRedirectHash';
import { WalletSelectorContextProvider } from '~/state/WalletSelectorContainer';

import Routes from './routes';
import { WalletSelectorModal } from '~/components/common/WalletSelector/useWalletSelectorModal';
import { DepositWithdrawModal } from '~/components/common/DepositWithdraw/useDepositWithdrawModal';
import { ExchangeBalancesModal } from '~/components/common/ExchangeBalances/useExchangeBalancesModal';
import { MarketSelectorModal } from '~/components/trade/MarketSelector/useMarketSelectorModal';
import RewardsWelcomeModal from './components/rewards/RewardsWelcomeModal';
import { TONIC_HAS_REWARDS } from './config';
import Notices from './components/Notices';

const App = () => {
  const isMobile = useIsMobile();
  const toasterPosition = isMobile ? 'top-center' : 'bottom-right';
  const toasterContainerStyle = isMobile
    ? {
        marginRight: '0.5rem',
        marginTop: '4rem',
      }
    : {
        marginRight: '0.5rem',
        marginBottom: '2rem',
      };

  // required for pie chart
  useEffect(() => {
    Chart.register(ArcElement, DoughnutController, Tooltip);
  }, []);

  return (
    <RecoilRoot>
      <ThemeProvider>
        <HashRouter>
          <WalletSelectorContextProvider>
            <TxToastProvider>
              <Routes />
              <MarketSelectorModal />
              <ExchangeBalancesModal />
              <DepositWithdrawModal />
              <WalletSelectorModal />
              {/* TODO: make notices mobile-friendly */}
              {/* XXX: dont show on mobile anymore lol */}
              {false && TONIC_HAS_REWARDS && isMobile && (
                <RewardsWelcomeModal />
              )}
              {TONIC_HAS_REWARDS && !isMobile && (
                <Notices tw="fixed z-20 bottom-9 right-2" />
              )}
              <Toaster
                position={toasterPosition}
                containerStyle={toasterContainerStyle}
              />
            </TxToastProvider>
          </WalletSelectorContextProvider>
        </HashRouter>
      </ThemeProvider>
    </RecoilRoot>
  );
};

export default App;
