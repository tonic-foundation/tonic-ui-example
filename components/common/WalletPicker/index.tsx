import React, { useCallback } from 'react';
import tw from 'twin.macro';
import { ModalOptions } from '@near-wallet-selector/modal-ui';
import { TONIC_CONTRACT_ID } from '~/config';
import Modal, { ModalHeader } from '../Modal';
import Home from './pages/Home';
import WalletConnect from './pages/WalletConnect';
import WalletInstall from './pages/WalletInstall';
import CloseButton from '../CloseButton';
import { TbArrowLeft, TbArrowNarrowLeft } from 'react-icons/tb';
import { useWalletPickerModal, useWalletPickerPage } from './state';
import WalletSelect from './pages/WalletSelect';
import IconButton from '../IconButton';
import { useWalletSelector } from '~/state/WalletSelectorContainer';

export { useWalletPickerModal } from './state';

const Wrapper = tw.div`
  overflow-hidden flex flex-col items-stretch
  w-screen h-[60vh] sm:max-w-sm
`;

const Content: React.FC<{
  options: ModalOptions;
}> = ({ options }) => {
  // TODO
  const { selector } = useWalletSelector();

  const [page] = useWalletPickerPage();

  switch (page.route) {
    case 'home': {
      return <Home />;
    }
    case 'wallet-select': {
      return (
        <WalletSelect
          selector={selector}
          onConnected={() => alert('connected')}
          onConnecting={() => alert('connecting')}
          onError={(e) => {
            alert('error! see console');
            console.error('error', e);
          }}
          onWalletNotInstalled={(m) => {
            alert('wallet not installed');
            console.error('wallet not installed', m);
          }}
          options={options}
        />
      );
    }
    case 'wallet-connect': {
      const { walletId } = page;
      return <WalletConnect walletId={walletId} />;
    }
    case 'wallet-install': {
      const { walletId } = page;
      return <WalletInstall walletId={walletId} />;
    }
  }
};

const BackButton: React.FC<React.HTMLProps<HTMLButtonElement>> = (props) => {
  return (
    <IconButton {...props} type="button">
      <TbArrowLeft />
    </IconButton>
  );
};

// the official one just doesn't look very good... lmao
const WalletPicker: React.FC<{
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
        <Content options={options} />
      </div>
    </Wrapper>
  );
};

export const WalletPickerModal: React.FC = () => {
  const [visible, setVisible] = useWalletPickerModal();

  return (
    <Modal
      drawerOnMobile
      visible={visible}
      onClose={() => setVisible(false)}
      render={({ closeModal }) => {
        return (
          <WalletPicker
            options={{
              contractId: TONIC_CONTRACT_ID,
            }}
            onClose={closeModal}
          />
        );
      }}
    />
  );
};
