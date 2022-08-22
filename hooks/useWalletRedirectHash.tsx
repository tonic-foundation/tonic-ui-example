// TODO: good candidate for public repo
import { JsonRpcProvider } from 'near-api-js/lib/providers';
import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSearchParam } from 'react-use';
import CannedToast from '~/components/common/CannedToast';
import { wrappedToast } from '~/components/common/ToastWrapper';
import { near } from '~/services/near';
import { useWalletSelector } from '~/state/WalletSelectorContainer';

// https://github.com/ref-finance/ref-ui/blob/main/src/components/layout/transactionTipPopUp.tsx#L10
export enum TRANSACTION_WALLET_TYPE {
  NEAR_WALLET = 'transactionHashes',
  // SENDER_WALLET = 'transactionHashesSender',
}

/**
 * Get information from the URL hashes due to wallet callback redirect
 */
export default function useWalletRedirectHash() {
  const txId = useSearchParam(TRANSACTION_WALLET_TYPE.NEAR_WALLET);

  return { txId };
}

/**
 *
 * @param txId
 * @returns true if success, false otherwise
 */
async function didTxSucceed(accountId: string, txId: string): Promise<boolean> {
  const ret = await (near.connection.provider as JsonRpcProvider).sendJsonRpc(
    'EXPERIMENTAL_tx_status',
    [txId, accountId]
  );

  return 'SuccessValue' in (ret as any).status;
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
