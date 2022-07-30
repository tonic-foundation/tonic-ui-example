import tw from 'twin.macro';
import { useEffect, useState } from 'react';
import { AiOutlineWarning as WarningIcon } from 'react-icons/ai';
import CloseButton from '~/components/common/CloseButton';
import Button from '~/components/common/Button';
import Input from '~/components/common/Input';
import { useRecoilState } from 'recoil';
import { swapSettingsState } from '~/state/swap';
import Toggle from '~/components/common/Toggle';

export interface SwapSettings {
  /**
   * Slippage tolerance as a percentage, ie, 0.5 is 0.5%.
   */
  slippageTolerancePercent: number;
}

export interface SwapSettingsProps {
  onClickClose?: () => unknown;
}

const Wrapper = tw.form`
  p-6 flex flex-col items-stretch
  w-screen
`;

const SLIPPAGE_PERCENTAGES = [0.5, 1, 2.5, 5] as const;
export const DEFAULT_SLIPPAGE = SLIPPAGE_PERCENTAGES[1];

const Warning: React.FC = ({ children, ...props }) => {
  return (
    <div tw="flex items-center gap-3 text-sm text-amber-500" {...props}>
      <WarningIcon tw="text-base" />
      <div>{children}</div>
    </div>
  );
};

const SwapSettingsForm: React.FC<SwapSettingsProps> = ({
  onClickClose,
  ...props
}) => {
  const [settings, setSettings] = useRecoilState(swapSettingsState);

  const hasCustomSlippage = !SLIPPAGE_PERCENTAGES.includes(
    settings.slippageTolerancePercent as any
  );

  const [slippageBps, setSlippageBps] = useState<
    typeof SLIPPAGE_PERCENTAGES[number]
  >(hasCustomSlippage ? 0.5 : (settings.slippageTolerancePercent as any));

  const [customSlippageStr, setCustomSlippageStr] = useState<
    string | undefined
  >(
    hasCustomSlippage ? settings.slippageTolerancePercent.toString() : undefined
  );
  const customSlippage = customSlippageStr
    ? parseFloat(customSlippageStr)
    : undefined;

  const [customFocused, setCustomFocused] = useState(!!customSlippage);
  const [customWarning, setCustomWarning] = useState<string>();
  useEffect(() => {
    if ((customSlippage || 0) > 5) {
      setCustomWarning('High slippage');
    } else {
      setCustomWarning(undefined);
    }
  }, [customSlippage]);

  function saveSettings() {
    const slippageTolerance = customSlippage || slippageBps;
    setSettings({
      slippageTolerancePercent: slippageTolerance,
    });
    if (onClickClose) {
      onClickClose();
    }
  }

  return (
    <Wrapper
      {...props}
      onSubmit={(e) => {
        e.preventDefault();
        saveSettings();
      }}
    >
      <header tw="sticky top-0">
        <section tw="flex items-center justify-between">
          <h1 tw="text-lg">Swap settings</h1>
          <CloseButton onClick={onClickClose} />
        </section>
      </header>
      <div tw="mt-3">
        <p>Slippage tolerance</p>
        <Toggle.Container tw="mt-3 h-10">
          {SLIPPAGE_PERCENTAGES.map((p) => (
            <Toggle.Button
              type="button"
              key={p}
              active={!customSlippage && p === slippageBps}
              onClick={() => {
                setCustomSlippageStr(undefined);
                setCustomFocused(false);
                setSlippageBps(p);
              }}
            >
              <span>{p}</span>
              <span tw="ml-[1px]">%</span>
            </Toggle.Button>
          ))}
        </Toggle.Container>
        <div
          tw="mt-3 relative transition shadow rounded-lg"
          css={customFocused ? tw`opacity-100` : tw`opacity-30`}
        >
          <div tw="absolute left-0 top-0 bottom-0 h-full flex items-center justify-center pl-3">
            <label htmlFor="custom-slippage" tw="text-sm">
              Custom slippage
            </label>
          </div>
          <div tw="absolute right-0 top-0 bottom-0 h-full flex items-center justify-center pr-3">
            <span>%</span>
          </div>
          <Input
            id="custom-slippage"
            tw="text-right pr-7 h-10"
            onFocus={() => setCustomFocused(true)}
            onBlur={() => setCustomFocused(!!customSlippage)}
            placeholder="0.00"
            type="number"
            min="0"
            max="50"
            step="0.01"
            onChange={(e) => {
              e.preventDefault();
              if (e.target.value) {
                setCustomSlippageStr(e.target.value);
              } else {
                setCustomSlippageStr(undefined);
              }
            }}
            value={customSlippageStr}
          />
        </div>
        {customWarning && <Warning tw="mt-3">{customWarning}</Warning>}
      </div>
      <Button type="submit" variant="up" tw="mt-3 shadow">
        Save settings
      </Button>
    </Wrapper>
  );
};

export default SwapSettingsForm;
