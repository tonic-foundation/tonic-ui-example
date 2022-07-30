import { createContext, useContext, useState } from 'react';

import MarketSelector from '~/components/trade/MarketSelector';
import Modal from '~/components/common/Modal';
import useMarkets from './useMarkets';

const MarketSearchContext = createContext<{
  visible: boolean;
  setVisible: (visible: boolean) => unknown;
}>({
  visible: false,
  setVisible: () => null,
});

export const MarketSelectorModalProvider: React.FC = ({ children }) => {
  const [markets] = useMarkets();
  const [visible, setVisible] = useState(false);

  return (
    <MarketSearchContext.Provider value={{ visible, setVisible }}>
      {children}
      <Modal
        drawerOnMobile
        visible={visible}
        onClose={() => setVisible(false)}
        render={({ closeModal }) => (
          <MarketSelector markets={markets} onClickClose={closeModal} />
        )}
      />
    </MarketSearchContext.Provider>
  );
};

const useMarketSelector = () => {
  return useContext(MarketSearchContext).setVisible;
};

export default useMarketSelector;
