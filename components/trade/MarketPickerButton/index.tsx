import 'twin.macro';
import { useRecoilValue } from 'recoil';
import { ClickHandler } from '~/types/event-handlers';
import { pairState } from '~/state/trade';
import TokenIcon from '~/components/common/TokenIcon';
import Icon from '~/components/common/Icon';

const MarketPickerButton: React.FC<{
  ticker: string;
  onClick: ClickHandler;
  hideIcon?: boolean;
}> = ({ ticker, hideIcon, ...props }) => {
  const { baseTokenMetadata } = useRecoilValue(pairState);

  return (
    <button
      tw="flex items-center p-2 dark:hover:text-up light:hover:underline"
      {...props}
    >
      {!hideIcon && (
        <TokenIcon tw="h-6 w-6 mr-2 " src={baseTokenMetadata.icon} />
      )}
      <span tw="font-medium">{ticker}</span>
      <Icon.ChevronDown tw="ml-2 text-lg" />
    </button>
  );
};

export default MarketPickerButton;
