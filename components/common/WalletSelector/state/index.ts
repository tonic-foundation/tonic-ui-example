import { ModuleState, Wallet } from '@near-wallet-selector/core';
import { atom, useRecoilState } from 'recoil';

const walletSelectorVisibleState = atom<boolean>({
  key: 'wallet-selector-visible-state',
  default: false,
});

export type WalletSelectorState =
  | { route: 'home' }
  | { route: 'wallet-select' }
  | { route: 'wallet-connect'; wallet: Wallet }
  | { route: 'wallet-install'; state: ModuleState<Wallet> };

const walletSelectorPageState = atom<WalletSelectorState>({
  key: 'wallet-selector-page-state',
  default: { route: 'home' },
});

export function useWalletPickerModal() {
  return useRecoilState(walletSelectorVisibleState);
}

export function useWalletPickerPage() {
  return useRecoilState(walletSelectorPageState);
}
