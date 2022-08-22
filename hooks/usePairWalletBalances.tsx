import BN from 'bn.js';
import { useEffect, useState } from 'react';
import { getTokenOrNearBalance } from '~/services/token';
import { usePair } from '~/state/trade';
import { useWalletSelector } from '~/state/WalletSelectorContainer';

// TODO: move to state
// TODO: use useWalletBalance
export default function usePairWalletBalances() {
  const { activeAccount } = useWalletSelector();
  const { baseTokenId, quoteTokenId } = usePair();

  const [loading, setLoading] = useState(false);
  const [baseWalletBalance, setBaseWalletBalance] = useState<BN>();
  const [quoteWalletBalance, setQuoteWalletBalance] = useState<BN>();

  useEffect(() => {
    async function load() {
      if (!activeAccount) {
        return;
      }
      setLoading(true);
      try {
        const [baseWalletBalance, quoteWalletBalance] = await Promise.all([
          getTokenOrNearBalance(activeAccount, baseTokenId),
          getTokenOrNearBalance(activeAccount, quoteTokenId),
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
