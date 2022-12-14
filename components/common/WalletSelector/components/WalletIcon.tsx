import { NearIcon } from '../../NearLogo';
import { isLegacyNearWallet } from '../util';

const WalletIcon: React.FC<{
  walletId: string;
  iconUrl: string;
  alt?: string;
}> = ({ walletId, iconUrl, alt, ...props }) => {
  if (isLegacyNearWallet(walletId)) {
    return <NearIcon tw="dark:text-white light:text-black" {...props} />;
  }
  return <img src={iconUrl} alt={alt} tw="object-cover" {...props} />;
};

export default WalletIcon;
