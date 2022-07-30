import { useEffect, useState } from 'react';
import { STORAGE_EXEMPT_TOKENS } from '~/config';
import { wallet } from '~/services/near';

/**
 * Check if has storage balance with a contract.
 */
export default function useHasStorageBalance(address: string) {
  const [hasBalance, setHasBalance] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      // lol
      if (STORAGE_EXEMPT_TOKENS.includes(address.toLowerCase())) {
        setHasBalance(true);
        return;
      }

      const dontcare = await wallet._near.account('nobody');
      const storageBalance = await dontcare.viewFunction(
        address,
        'storage_balance_of',
        { account_id: wallet.account().accountId }
      );

      if (storageBalance) {
        setHasBalance(true);
      } else {
        setHasBalance(false);
      }
    }

    if (wallet.isSignedIn()) {
      setLoading(true);
      check().finally(() => setLoading(false));
    }
  }, [address, setHasBalance, setLoading]);

  return [hasBalance, loading] as const;
}
