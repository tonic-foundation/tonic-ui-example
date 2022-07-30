// TODO: good candidate for public repo
import { JsonRpcProvider } from 'near-api-js/lib/providers';
import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSearchParam } from 'react-use';
import CannedToast from '~/components/common/CannedToast';
import { wrappedToast } from '~/components/common/ToastWrapper';
import { near, wallet } from '~/services/near';

// https://github.com/ref-finance/ref-ui/blob/main/src/components/layout/transactionTipPopUp.tsx#L10
export enum TRANSACTION_WALLET_TYPE {
  NEAR_WALLET = 'transactionHashes',
  SENDER_WALLET = 'transactionHashesSender',
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
async function didTxSucceed(txId: string): Promise<boolean> {
  const ret = await (near.connection.provider as JsonRpcProvider).sendJsonRpc(
    'EXPERIMENTAL_tx_status',
    [txId, wallet.getAccountId()]
  );

  return 'SuccessValue' in (ret as any).status;
}

async function checkAndToastTx(id: string) {
  try {
    const succeeded = await didTxSucceed(id);
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

// TODO(name, refactor)
export const TxToastProvider: React.FC = ({ children }) => {
  const { txId } = useWalletRedirectHash();

  useEffect(() => {
    if (txId?.length) {
      checkAndToastTx(txId);
    }
  }, [txId]);

  return <React.Fragment>{children}</React.Fragment>;
};
