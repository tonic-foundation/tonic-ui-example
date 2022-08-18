import { useEffect, useState } from 'react';
import { STORAGE_EXEMPT_TOKENS } from '~/config';
import { useWalletSelector } from '~/contexts/WalletSelectorContext';
import { nobody } from '~/services/near';

/**
 * Check if has storage balance with a contract.
 */
export default function useHasStorageBalance(address: string) {
  const { accountId } = useWalletSelector();
  const [hasBalance, setHasBalance] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      if (STORAGE_EXEMPT_TOKENS.includes(address.toLowerCase())) {
        setHasBalance(true);
        return;
      }

      const storageBalance = await nobody.viewFunction(
        address,
        'storage_balance_of',
        { account_id: accountId }
      );

      if (storageBalance) {
        setHasBalance(true);
      } else {
        setHasBalance(false);
      }
    }

    if (accountId?.length) {
      setLoading(true);
      check().finally(() => setLoading(false));
    }
  }, [accountId, address, setHasBalance, setLoading]);

  return [hasBalance, loading] as const;
}
