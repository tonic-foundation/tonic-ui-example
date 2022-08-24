import BN from 'bn.js';
import { useCallback, useEffect, useState } from 'react';
import { useWalletSelector } from '~/state/WalletSelectorContainer';
import { getTokenOrNearBalance } from '~/services/token';

export default function useWalletBalance(tokenId: string) {
  const { activeAccount } = useWalletSelector();

  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<BN>();

  const load = useCallback(async () => {
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
  }, [activeAccount, tokenId]);

  useEffect(() => {
    load();

    return () => {
      setBalance(undefined);
    };
  }, [load]);

  return [balance, loading, load] as const;
}
