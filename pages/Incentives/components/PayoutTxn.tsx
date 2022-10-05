import { getExplorerUrl } from '~/config';
import { abbreviateCryptoString } from '~/util';
import Typography from './Typography';

const PayoutTxn: React.FC<{ txId: string | null; abbreviateTo?: number }> = ({
  txId,
  abbreviateTo = 9,
}) => {
  if (txId) {
    return (
      <div tw="flex items-center gap-1.5">
        <span tw="mt-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
        <Typography.Link url={getExplorerUrl('transaction', txId)}>
          {abbreviateCryptoString(txId, abbreviateTo, 3)}
        </Typography.Link>
      </div>
    );
  } else {
    return (
      <div tw="flex items-center gap-1.5">
        <span tw="mt-0.5 h-2.5 w-2.5 rounded-full bg-yellow-500"></span>
        <span>Pending</span>
      </div>
    );
  }
};

export default PayoutTxn;
