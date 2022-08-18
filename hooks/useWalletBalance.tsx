import BN from 'bn.js';
import { useEffect, useState } from 'react';
import { useWalletSelector } from '~/contexts/WalletSelectorContext';
import { getTokenOrNearBalance } from '~/services/token';

export default function useWalletBalance(tokenId: string) {
  const { activeAccount } = useWalletSelector();

  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<BN>();

  useEffect(() => {
    async function load() {
      if (!activeAccount) {
        return;
      }

      setLoading(true);
      try {
        const balance = await getTokenOrNearBalance(activeAccount, tokenId);

        setBalance(balance);
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => {
      setBalance(undefined);
    };
  }, [tokenId]);

  return [balance, loading] as const;
}
