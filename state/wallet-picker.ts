export {};
// import { atom, useRecoilState } from 'recoil';

// const walletSelectorVisibleState = atom<boolean>({
//   key: 'wallet-selector-visible-state',
//   default: false,
// });

// type WalletSelectorState =
//   | { route: 'home' }
//   | { route: 'wallet-connect'; walletId: string }
//   | { route: 'wallet-install'; walletId: string };

// // const walletSelectorPageState = atom<WalletSelectorState>({
// //   key: 'wallet-selector-page-state',
// //   default: { route: 'home' },
// // });

// export function useWalletPickerModal() {
//   return useRecoilState(walletSelectorVisibleState);
// }
