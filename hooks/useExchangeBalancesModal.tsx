import { createContext, useContext, useState } from 'react';
import Modal from '~/components/common/Modal';
import ExchangeBalancesCard from '~/components/common/ExchangeBalances';

const ExchangeBalancesModalContext = createContext<{
  visible: boolean;
  setVisible: (visible: boolean) => unknown;
}>({
  visible: false,
  setVisible: () => null,
});

export const ExchangeBalancesModalProvider: React.FC = ({ children }) => {
  const [visible, setVisible] = useState(false);

  return (
    <ExchangeBalancesModalContext.Provider value={{ visible, setVisible }}>
      {children}
      <Modal
        drawerOnMobile
        visible={visible}
        onClose={() => setVisible(false)}
        render={({ closeModal }) => {
          return <ExchangeBalancesCard onClickClose={closeModal} />;
        }}
      />
    </ExchangeBalancesModalContext.Provider>
  );
};

export default function useExchangeBalancesModal() {
  return useContext(ExchangeBalancesModalContext).setVisible;
}
