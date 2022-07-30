import { createContext, useContext, useState } from 'react';
import Modal from '~/components/common/Modal';
import DepositWithdraw, {
  DepositWithdrawProps,
} from '~/components/common/DepositWithdraw';

const DepositWithdrawContext = createContext<{
  depositWithdrawProps: DepositWithdrawProps | undefined;
  setDepositWithdrawProps: (props?: DepositWithdrawProps) => unknown;
}>({ depositWithdrawProps: undefined, setDepositWithdrawProps: () => null });

export const DepositWithdrawProvider: React.FC = ({ children }) => {
  const [depositWithdrawProps, setDepositWithdrawProps] =
    useState<DepositWithdrawProps>();

  return (
    <DepositWithdrawContext.Provider
      value={{ depositWithdrawProps, setDepositWithdrawProps }}
    >
      {children}
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
    </DepositWithdrawContext.Provider>
  );
};

const useDepositWithdrawModal = () => {
  return useContext(DepositWithdrawContext).setDepositWithdrawProps;
};

export default useDepositWithdrawModal;
