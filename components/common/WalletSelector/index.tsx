// TODO: move the "wallet selector container" into this component
import React, { useCallback } from 'react';
import tw from 'twin.macro';
import { ModalOptions } from '@near-wallet-selector/modal-ui';
import { ModalHeader } from '../Modal';
import Home from './pages/Home';
import WalletConnect from './pages/WalletConnect';
import WalletInstall from './pages/WalletInstall';
import CloseButton from '../CloseButton';
import { useWalletPickerPage } from './state';
import WalletSelect from './pages/WalletSelect';
import IconButton from '../IconButton';
import { useWalletSelector } from '~/state/WalletSelectorContainer';
import { ModuleState, Wallet } from '@near-wallet-selector/core';
import toast from 'react-hot-toast';
import { wrappedToast } from '../ToastWrapper';
import Icon from '../Icon';

const Wrapper = tw.div`
  overflow-hidden flex flex-col items-stretch
  w-screen min-h-[65vh] sm:max-w-sm
`;

const Content: React.FC<{
  options: ModalOptions;
  onConnected: () => unknown;
}> = ({ options, onConnected }) => {
  const { selector } = useWalletSelector();

  const [page, setPage] = useWalletPickerPage();

  const handleWalletConnecting = (wallet: Wallet) => {
    setPage({ route: 'wallet-connect', wallet });
  };

  const handleWalletNotInstalled = (state: ModuleState<Wallet>) => {
    setPage({ route: 'wallet-install', state });
  };

  const handleError = (e: Error) => {
    toast.custom(
      wrappedToast(
        <div>
          <p>Error connecting wallet</p>
          <p tw="mt-3 text-sm opacity-80">{e.message}</p>
        </div>
      )
    );
    setPage({ route: 'wallet-select' });
  };

  switch (page.route) {
    case 'home': {
      return <Home />;
    }
    case 'wallet-select': {
      return (
        <WalletSelect
          selector={selector}
          onConnected={onConnected}
          onConnecting={handleWalletConnecting}
          onError={handleError}
          onWalletNotInstalled={handleWalletNotInstalled}
          options={options}
        />
      );
    }
    case 'wallet-connect': {
      return <WalletConnect />;
    }
    case 'wallet-install': {
      return <WalletInstall />;
    }
  }
};

const BackButton: React.FC<React.HTMLProps<HTMLButtonElement>> = (props) => {
  return <IconButton.Base {...props} icon={Icon.Back} type="button" />;
};

export const WalletSelector: React.FC<{
  options: ModalOptions;
  onClose: () => unknown;
}> = ({ options, onClose, ...props }) => {
  const [page, setPage] = useWalletPickerPage();

  // the routing logic is pretty ad hoc but it's fine for how simple
  // this use case is
  const showBack = page.route !== 'home';
  const handleClickBack = useCallback(() => {
    switch (page.route) {
      case 'home': {
        return;
      }
      case 'wallet-install': {
        setPage({ route: 'wallet-select' });
        return;
      }
      case 'wallet-connect': {
        setPage({ route: 'wallet-select' });
        return;
      }
      default: {
        setPage({ route: 'home' });
      }
    }
  }, [setPage, page]);

  return (
    <Wrapper {...props}>
      <ModalHeader tw="justify-between">
        {showBack ? <BackButton onClick={handleClickBack} /> : <span />}
        <CloseButton onClick={onClose} />
      </ModalHeader>
      <div tw="flex-grow flex flex-col items-stretch overflow-auto">
        <Content options={options} onConnected={onClose} />
      </div>
    </Wrapper>
  );
};
