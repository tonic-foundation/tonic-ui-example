import { getExplorerUrl } from '~/config';

const TxGeneric: React.FC<{
  id: string;
  succeeded?: boolean;
}> = ({ id, succeeded = true }) => {
  const text = succeeded ? 'Transaction success' : 'Transaction failure';
  const href = getExplorerUrl('transaction', id);
  return (
    <a target="_black" rel="noreferrer" href={href} className="group">
      <p>{text}</p>
      <div tw="mt-2 text-sm">
        <p tw="group-hover:underline">Click to view transaction</p>
      </div>
    </a>
  );
};

const ErrorSendingTx: React.FC = () => {
  return <p>Error sending transaction</p>;
};

const CannedToast = {
  TxGeneric,
  ErrorSendingTx,
};

export default CannedToast;
