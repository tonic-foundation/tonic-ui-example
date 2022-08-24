import { TONIC_CONTRACT_ID } from '~/config';
import { WalletSelector } from '.';
import Modal from '../Modal';
import { useWalletPickerModal } from './state';

export const WalletSelectorModal: React.FC = () => {
  const [visible, setVisible] = useWalletPickerModal();

  return (
    <Modal
      drawerOnMobile
      visible={visible}
      onClose={() => setVisible(false)}
      render={({ closeModal }) => {
        return (
          <WalletSelector
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

export default useWalletPickerModal;
