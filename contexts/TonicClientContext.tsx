import { Tonic } from '@tonic-foundation/tonic';
import { useEffect, useState } from 'react';
import { createContainer } from 'unstated-next';
import { TONIC_CONTRACT_ID } from '~/config';
import { nobody } from '~/services/near';
import { useWalletSelector } from './WalletSelectorContext';

const DEFAULT_TONIC = new Tonic(nobody, TONIC_CONTRACT_ID);

function useTonicInternal() {
  const [tonic, setTonic] = useState(DEFAULT_TONIC);
  const { activeAccount } = useWalletSelector();

  useEffect(() => {
    console.log(
      `Initializing Tonic contract (wallet account: ${activeAccount?.accountId})`
    );
    if (activeAccount) {
      setTonic(new Tonic(activeAccount, TONIC_CONTRACT_ID));
    } else {
      setTonic(DEFAULT_TONIC);
    }
  }, [activeAccount]);

  return {
    tonic,
  };
}

export const TonicClient = createContainer(useTonicInternal);

export function useTonic() {
  return TonicClient.useContainer();
}
