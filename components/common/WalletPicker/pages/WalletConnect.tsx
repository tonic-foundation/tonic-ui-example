import Spinner from '../../Spinner';
import { useWalletPickerPage } from '../state';

const WalletConnect: React.FC = (props) => {
  const [page] = useWalletPickerPage();

  if (page.route !== 'wallet-connect') {
    throw new Error('page can only be rendered on wallet-connect stage');
  }

  return (
    <div tw="p-6 flex-grow flex flex-col items-stretch">
      <h1 tw="text-xl">Wallet connecting</h1>

      <div tw="flex-grow flex items-center justify-center">
        <Spinner tw="text-7xl" />
      </div>
    </div>
  );
};

export default WalletConnect;
