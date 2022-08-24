const WalletConnect: React.FC<{ walletId: string }> = ({
  walletId,
  ...props
}) => {
  return <p>wallet connect {walletId}</p>;
};

export default WalletConnect;
