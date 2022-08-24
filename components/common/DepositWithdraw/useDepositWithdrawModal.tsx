import Modal from '~/components/common/Modal';
import DepositWithdraw, {
  DepositWithdrawProps,
} from '~/components/common/DepositWithdraw';
import { atom, useRecoilState, useSetRecoilState } from 'recoil';

const depositWithdrawState = atom<DepositWithdrawProps | undefined>({
  key: 'deposit-withdraw-state',
  default: undefined,
});

export const DepositWithdrawModal = () => {
  const [depositWithdrawProps, setDepositWithdrawProps] =
    useRecoilState(depositWithdrawState);

  return (
    <Modal
      visible={!!depositWithdrawProps}
      onClose={() => setDepositWithdrawProps(undefined)}
      render={({ closeModal }) => {
        if (depositWithdrawProps) {
          return (
            <DepositWithdraw {...depositWithdrawProps} onClose={closeModal} />
          );
        }
        return;
      }}
    />
  );
};

const useDepositWithdrawModal = () => {
  return useSetRecoilState(depositWithdrawState);
};

export default useDepositWithdrawModal;
