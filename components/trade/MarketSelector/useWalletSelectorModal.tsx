import MarketSelector from '~/components/trade/MarketSelector';
import Modal from '~/components/common/Modal';
import useMarkets from '~/hooks/useMarkets';
import { atom, useRecoilState, useSetRecoilState } from 'recoil';

const visibleState = atom<boolean>({
  key: 'market-selector-modal-visible',
  default: false,
});

export const MarketSelectorModal = () => {
  const [markets] = useMarkets();
  const [visible, setVisible] = useRecoilState(visibleState);

  return (
    <Modal
      drawerOnMobile
      visible={visible}
      onClose={() => setVisible(false)}
      render={({ closeModal }) => (
        <MarketSelector markets={markets} onClickClose={closeModal} />
      )}
    />
  );
};

const useMarketSelector = () => {
  return useSetRecoilState(visibleState);
};

export default useMarketSelector;
