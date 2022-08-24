import Routes from './routes';
import { Toaster } from 'react-hot-toast';
import { HashRouter } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import { useIsMobile } from '~/hooks/useIsMobile';
import { ThemeProvider } from '~/hooks/useTheme';
import { TxToastProvider } from '~/hooks/useWalletRedirectHash';
import { WalletSelectorContextProvider } from '~/state/WalletSelectorContainer';

import { WalletSelectorModal } from '~/components/common/WalletSelector/useWalletSelectorModal';
import { DepositWithdrawModal } from '~/components/common/DepositWithdraw/useDepositWithdrawModal';
import { ExchangeBalancesModal } from '~/components/common/ExchangeBalances/useExchangeBalancesModal';
import { MarketSelectorModal } from '~/components/trade/MarketSelector/useMarketSelectorModal';

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
