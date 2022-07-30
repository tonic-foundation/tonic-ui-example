import { atom } from 'recoil';
import { SwapSettings } from '~/components/swap/SwapSettingsForm';
import { TONIC_SWAP_DEFAULT_SLIPPAGE_PERCENT } from '~/config';

export const swapSettingsState = atom<SwapSettings>({
  key: 'swap-settings-state',
  default: {
    slippageTolerancePercent: TONIC_SWAP_DEFAULT_SLIPPAGE_PERCENT,
  },
});
