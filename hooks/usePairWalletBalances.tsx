import BN from 'bn.js';
import { useEffect, useState } from 'react';
import { wallet } from '~/services/near';
import { getTokenOrNearBalance } from '~/services/token';
import { usePair } from '~/state/trade';

// TODO: move to state
// TODO: use useWalletBalance
export default function usePairWalletBalances() {
  const { baseTokenId, quoteTokenId } = usePair();

  const [loading, setLoading] = useState(false);
  const [baseWalletBalance, setBaseWalletBalance] = useState<BN>();
  const [quoteWalletBalance, setQuoteWalletBalance] = useState<BN>();

  useEffect(() => {
    async function load() {
      if (!wallet.isSignedIn()) {
        return;
      }
      setLoading(true);
      try {
        const account = wallet.account();
        const [baseWalletBalance, quoteWalletBalance] = await Promise.all([
          getTokenOrNearBalance(account, baseTokenId),
          getTokenOrNearBalance(account, quoteTokenId),
        ] as const);

        setBaseWalletBalance(baseWalletBalance);
        setQuoteWalletBalance(quoteWalletBalance);
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => {
      setBaseWalletBalance(undefined);
      setQuoteWalletBalance(undefined);
    };
  }, [baseTokenId, quoteTokenId]);

  return [
    {
      baseWalletBalance,
      quoteWalletBalance,
    },
    loading,
  ] as const;
}
