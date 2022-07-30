import { NEAR_RESERVE } from '~/config';
import Tooltip from '../Tooltip';

const NearReserved: React.FC = (props) => {
  return (
    <Tooltip {...props}>
      {NEAR_RESERVE} NEAR will be reserved in your wallet for signing
      transactions. This amount is not available for deposit.
    </Tooltip>
  );
};

const CannedTooltip = {
  NearReserved,
};

export default CannedTooltip;
