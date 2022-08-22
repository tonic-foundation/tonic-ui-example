import Routes from './routes';
import { Toaster } from 'react-hot-toast';
import { HashRouter } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import { DepositWithdrawProvider } from '~/hooks/useDepositWithdrawModal';
import { ExchangeBalancesModalProvider } from '~/hooks/useExchangeBalancesModal';
import { MarketSelectorModalProvider } from '~/hooks/useMarketSelector';
import { useIsMobile } from './hooks/useIsMobile';
import { ThemeProvider } from '~/hooks/useTheme';
import { TxToastProvider } from './hooks/useWalletRedirectHash';
import { TonicClientContainer } from './state/TonicClientContainer';
import { WalletSelectorContextProvider } from './state/WalletSelectorContainer';

import '@near-wallet-selector/modal-ui/styles.css';

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
            <TonicClientContainer.Provider>
              <TxToastProvider>
                <MarketSelectorModalProvider>
                  <DepositWithdrawProvider>
                    <ExchangeBalancesModalProvider>
                      <Routes />
                      <Toaster
                        position={toasterPosition}
                        containerStyle={toasterContainerStyle}
                      />
                    </ExchangeBalancesModalProvider>
                  </DepositWithdrawProvider>
                </MarketSelectorModalProvider>
              </TxToastProvider>
            </TonicClientContainer.Provider>
          </WalletSelectorContextProvider>
        </HashRouter>
      </ThemeProvider>
    </RecoilRoot>
  );
};

export default App;
