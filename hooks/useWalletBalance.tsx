import BN from 'bn.js';
import { useEffect, useState } from 'react';
import { wallet } from '~/services/near';
import { getTokenOrNearBalance } from '~/services/token';

export default function useWalletBalance(tokenId: string) {
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<BN>();

  useEffect(() => {
    async function load() {
      if (!wallet.isSignedIn()) {
        return;
      }
      setLoading(true);
      try {
        const account = wallet.account();
        const balance = await getTokenOrNearBalance(account, tokenId);

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
