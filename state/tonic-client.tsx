import { Tonic } from '@tonic-foundation/tonic';
import { useEffect } from 'react';
import { atom, useRecoilState } from 'recoil';
import { TONIC_CONTRACT_ID } from '~/config';
import { nobody } from '~/services/near';
import { useWalletSelector } from './WalletSelectorContainer';

export const UNAUTHENTICATED_TONIC = new Tonic(nobody, TONIC_CONTRACT_ID);

const tonicClientState = atom<Tonic>({
  key: 'tonic-client-state',
  default: UNAUTHENTICATED_TONIC,
  dangerouslyAllowMutability: true,
});

export function useTonic() {
  const [tonic, setTonic] = useRecoilState(tonicClientState);
  const { activeAccount } = useWalletSelector();

  useEffect(() => {
    console.log(
      `Initializing Tonic contract (wallet account: ${activeAccount?.accountId})`
    );
    if (activeAccount) {
      setTonic(new Tonic(activeAccount, TONIC_CONTRACT_ID));
    } else {
      setTonic(UNAUTHENTICATED_TONIC);
    }
  }, [activeAccount, setTonic]);

  return { tonic };
}
