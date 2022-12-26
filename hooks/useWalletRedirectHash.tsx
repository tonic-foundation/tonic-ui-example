// TODO: good candidate for public repo
import {
  FinalExecutionOutcome,
  JsonRpcProvider,
} from 'near-api-js/lib/providers';
import { ExecutionOutcome } from 'near-api-js/lib/providers/provider';
import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSearchParam } from 'react-use';
import CannedToast from '~/components/common/CannedToast';
import { wrappedToast } from '~/components/common/ToastWrapper';
import { near } from '~/services/near';
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

function isErrorStatus(
  s: ExecutionOutcome['status'] | FinalExecutionOutcome['status']
): boolean {
  if (typeof s === 'string') {
    return s === 'Failure';
  }
  return 'Failure' in s;
}

/**
 *
 * @param txId
 * @returns true if success, false otherwise
 */
async function didTxSucceed(accountId: string, txId: string): Promise<boolean> {
  // It's not exactly this. Actual rpc response has more fields, but we only
  // need these fields for what we're doing. RPC will throw its own errors,
  // so it's fine to use the type as is.
  const ret: FinalExecutionOutcome = await (
    near.connection.provider as JsonRpcProvider
  ).sendJsonRpc('EXPERIMENTAL_tx_status', [txId, accountId]);

  const hasError = ret.receipts_outcome.some((o) => {
    return isErrorStatus(o.outcome.status);
  });

  return !isErrorStatus(ret.status) && !hasError;
}

async function checkAndToastTx(accountId: string, id: string) {
  try {
    const succeeded = await didTxSucceed(accountId, id);
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
