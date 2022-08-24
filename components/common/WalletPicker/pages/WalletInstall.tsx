const WalletInstall: React.FC<{ walletId: string }> = ({
  walletId,
  ...props
}) => {
  return <p>wallet install {walletId}</p>;
};

export default WalletInstall;
