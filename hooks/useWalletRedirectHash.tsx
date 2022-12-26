import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSearchParam } from 'react-use';
import CannedToast from '~/components/common/CannedToast';
import { wrappedToast } from '~/components/common/ToastWrapper';
import { near } from '~/services/near';
import { didTxSucceed } from '@tonic-foundation/transaction/lib/status';
import { useWalletSelector } from '~/state/WalletSelectorContainer';

/**
 * Get information from the URL hashes due to wallet callback redirect. This is
 * only necessary for the NEAR web wallet. The other wallets return the
 * transaction outcome without requiring a page nav.
 */
export default function useWalletRedirectHash() {
  const txId = useSearchParam('transactionHashes');

  return { txId };
}

async function checkAndToastTx(accountId: string, id: string) {
  try {
    const succeeded = await didTxSucceed(near, accountId, id);
    toast.custom(
      wrappedToast(<CannedToast.TxGeneric id={id} succeeded={succeeded} />, {
        variant: succeeded ? 'success' : 'error',
      }),
      {
        // don't close by default if failed
        duration: succeeded ? undefined : Infinity,
      }
    );
  } catch (e) {
    console.info('error checking transaction', e);
  }
}

/**
 * This is only necessary for the NEAR web wallet. The other wallets return the
 * transaction outcome without requiring a page nav.
 */
export const TxToastProvider: React.FC = ({ children }) => {
  const { txId } = useWalletRedirectHash();
  const { accountId } = useWalletSelector();

  useEffect(() => {
    if (accountId && txId?.length) {
      checkAndToastTx(accountId, txId);
    }
  }, [txId]);

  return <React.Fragment>{children}</React.Fragment>;
};
