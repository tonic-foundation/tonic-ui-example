import 'twin.macro';
import Button from '../../common/Button';
import Logo from '../../common/Logo';
import { useNavigate } from 'react-router';
import { useWalletSelector } from '~/state/WalletSelectorContainer';
import { useCallback } from 'react';
import { storageDeposit as makeDepositTxn } from '@tonic-foundation/storage/lib/transaction';
import { TONIC_CONTRACT_ID } from '~/config';
import { nearAmount } from '@tonic-foundation/tonic';
import { tgasAmount } from '@tonic-foundation/utils';

const Welcome: React.FC<{ onClose: () => unknown }> = ({
  onClose,
  ...props
}) => {
  const { selector, accountId, activeAccount } = useWalletSelector();

  const navigate = useNavigate();
  const noThanks = () => {
    navigate('/simple');
  };

  const handleDeposit = useCallback(async () => {
    if (accountId && activeAccount) {
      const tx = makeDepositTxn(
        TONIC_CONTRACT_ID,
        {
          accountId,
          amount: nearAmount(0.5),
          registrationOnly: false,
        },
        tgasAmount(100)
      );
      const wallet = await selector.wallet();
      await wallet.signAndSendTransaction({
        receiverId: TONIC_CONTRACT_ID,
        actions: [tx.toWalletSelectorAction()],
      });
      window.location.reload();
    }
  }, [selector, accountId, activeAccount]);

  return (
    <div
      tw="p-6 mx-3 sm:(mx-0 w-[400px]) pb-0 text-white light:text-black"
      {...props}
    >
      <Logo tw="text-xl" />

      <p tw="mt-6">An account is required to use advanced trading features.</p>
      <p tw="mt-3">
        Click below to get started. You&apos;ll be prompted for a 0.5 NEAR
        deposit.
      </p>

      <p tw="mt-3 text-down-dark opacity-90">
        A security audit of the core contract is in progress. Use this
        application at your own risk.
      </p>

      <Button
        tw="mt-6 w-full"
        variant="up"
        disabled={false}
        onClick={handleDeposit}
      >
        Create account
      </Button>

      <p tw="my-3 text-center">
        <button
          tw="dark:(text-neutral-300 hover:text-white) light:(text-neutral-500 hover:text-black)"
          onClick={() => {
            onClose();
            noThanks();
          }}
        >
          No thanks
        </button>
      </p>
    </div>
  );
};

export default Welcome;
