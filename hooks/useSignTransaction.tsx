import { Wallet } from '@near-wallet-selector/core';
import { Account } from 'near-api-js';
import { FinalExecutionOutcome } from 'near-api-js/lib/providers';
import React, { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { getExplorerUrl } from '~/config';
import { useWalletSelector } from '~/state/WalletSelectorContainer';

export function useSignTransaction(
  cb: (
    wallet: Wallet,
    activeAccount: Account | null
  ) => Promise<FinalExecutionOutcome | FinalExecutionOutcome[] | void>,
  deps: React.DependencyList
) {
  const { selector, activeAccount } = useWalletSelector();
  const [loading, setLoading] = useState(false);

  const wrapped = useCallback(async () => {
    setLoading(true);
    try {
      const wallet = await selector.wallet();
      const res = await cb(wallet, activeAccount);

      if (res) {
        if (!('length' in res)) {
          return res.transaction_outcome;
        }
        if (res.length) {
          const [lastOutcome] = res.slice(-1);
          return lastOutcome.transaction_outcome;
        }
      }
    } finally {
      setLoading(false);
    }
  }, [activeAccount, cb, selector, ...deps]);

  const withToast = useCallback(async () => {
    return toast.promise(wrapped(), {
      loading: 'Confirming transaction...',
      success: (outcome) => {
        return (
          <div>
            <p tw="text-sm font-medium">Transaction confirmed</p>
            <a
              tw="mt-2 text-sm"
              target="_blank"
              rel="noreferrer"
              // if we get here, outcome is never undefined.
              // the wallet selector could use better types...
              href={getExplorerUrl('transaction', outcome ? outcome.id : '')}
            >
              <span tw="underline">View in the explorer</span> &rarr;
            </a>
          </div>
        );
      },
      error: (e) => `Error: ${e}`,
    });
  }, [wrapped]);

  return [loading, withToast] as const;
}
