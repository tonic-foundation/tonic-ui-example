import Modal from '~/components/common/Modal';
import ExchangeBalancesCard from '~/components/common/ExchangeBalances';
import { atom, useRecoilState, useSetRecoilState } from 'recoil';

const visibleState = atom<boolean>({
  key: 'exchange-balances-modal-visibile-state',
  default: false,
});

export const ExchangeBalancesModal = () => {
  const [visible, setVisible] = useRecoilState(visibleState);

  return (
    <Modal
      drawerOnMobile
      visible={visible}
      onClose={() => setVisible(false)}
      render={({ closeModal }) => {
        return <ExchangeBalancesCard onClickClose={closeModal} />;
      }}
    />
  );
};

export default function useExchangeBalancesModal() {
  return useSetRecoilState(visibleState);
}
