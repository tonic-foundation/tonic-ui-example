import BN from 'bn.js';
import CloseButton from '../CloseButton';
import tw from 'twin.macro';
import { InputChangeHandler } from '~/types/event-handlers';
import {
  bnToApproximateDecimal,
  bnToFixed,
  decimalToBn,
  tgasAmount,
} from '@tonic-foundation/utils';
import {
  depositNearV1,
  withdrawV1,
} from '@tonic-foundation/tonic/lib/transaction';
import { ftTransferCall as makeFtTransferCallTx } from '@tonic-foundation/token/lib/transaction';
import { storageBalanceOf } from '@tonic-foundation/storage';
import { storageDeposit as makeStorageDespositTx } from '@tonic-foundation/storage/lib/transaction';

import { getTokenBalance, getTokenMetadata } from '~/services/token';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ZERO } from '~/util/math';
import Button from '../Button';
import {
  getExplorerUrl,
  NEAR_RESERVE,
  NEAR_RESERVE_BN,
  STORAGE_EXEMPT_TOKENS,
  TONIC_CONTRACT_ID,
} from '~/config';
import Input from '../Input';
import { abbreviateAccountId } from '~/util';
import TabButton from '../TabButton';
import { CardBody, CardHeader } from '../Card';
import CannedTooltip from '../CannedTooltip';
import { useWalletSelector } from '~/state/WalletSelectorContainer';
import { useTonic } from '~/state/tonic-client';
import { Tonic } from '@tonic-foundation/tonic';
import toast from 'react-hot-toast';
import { wrappedToast } from '../ToastWrapper';
import CannedToast from '../CannedToast';
import { FinalExecutionOutcome } from '@near-wallet-selector/core';
import { useExchangeBalances } from '~/state/trade';

const MAX_DECIMALS = 5;

export interface DepositWithdrawProps {
  tokenId: string;
  direction: 'deposit' | 'withdraw';
  onClose?: () => unknown;
}

const getExchangeBalance = async (tonic: Tonic, tokenId: string) => {
  const all = await tonic.getBalances();
  return all[tokenId] || ZERO;
};

const Content: React.FC<DepositWithdrawProps> = ({
  tokenId,
  direction: initialDirection,
  onClose,
  ...props
}) => {
  const { activeAccount, selector } = useWalletSelector();
  const { tonic } = useTonic();

  // HACK: refresh in other parts of the UI on deposit/withdraw
  // TODO: use this instead of the manual loader defined below
  const [, refreshAllExchangeBalances] = useExchangeBalances();

  const inputRef = useRef<HTMLInputElement>(null);
  const [direction, setDirection] =
    useState<DepositWithdrawProps['direction']>(initialDirection);
  const [symbol, setSymbol] = useState('---');
  const [amount, setAmount] = useState<number>();
  const [decimals, setDecimals] = useState<number>();

  const [walletBalance, setWalletBalance] = useState<BN>();
  const [exchangeBalance, setExchangeBalance] = useState<BN>();

  const availableBalanceFormatted =
    decimals !== undefined
      ? direction === 'deposit'
        ? walletBalance &&
          bnToFixed(walletBalance, decimals, Math.min(MAX_DECIMALS, decimals))
        : exchangeBalance &&
          bnToFixed(exchangeBalance, decimals, Math.min(MAX_DECIMALS, decimals))
      : '---';

  // Loader for balances. Loading both at once avoids a race condition when
  // rapidly switching between deposit/withdraw.
  const refreshAllBalances = useCallback(async () => {
    if (!activeAccount) {
      return;
    }

    // load wallet balance
    if (tokenId.toUpperCase() === 'NEAR') {
      activeAccount.getAccountBalance().then(({ available }) => {
        const availableFunds = new BN(available).sub(NEAR_RESERVE_BN);
        if (availableFunds.gt(ZERO)) {
          setWalletBalance(availableFunds);
        } else {
          setWalletBalance(ZERO);
        }
      });
    } else {
      getTokenBalance(activeAccount, tokenId).then(setWalletBalance);
    }

    // get exchange balance; not usually necessary to load both balances but
    // this avoids network race condition eg when switching between
    // deposit/withdraw
    getExchangeBalance(tonic, tokenId).then(setExchangeBalance);
  }, [activeAccount, tokenId, tonic]);

  // Load token balance
  useEffect(() => {
    refreshAllBalances();
  }, [refreshAllBalances]);

  // Load token metadata
  useEffect(() => {
    getTokenMetadata(tokenId).then((m) => {
      setDecimals(m.decimals);
      setSymbol(m.symbol);
    });
  }, [tokenId]);

  const handleChangeAmount: InputChangeHandler = (e) => {
    const v = parseFloat(e.target.value);
    if (isNaN(v)) {
      setAmount(undefined);
    }
    setAmount(v);
  };

  const handleClickMax = () => {
    const balance = direction === 'deposit' ? walletBalance : exchangeBalance;
    if (decimals === undefined || !balance) {
      return;
    }
    const precision =
      direction === 'deposit' ? Math.min(MAX_DECIMALS, decimals) : decimals;
    const maxAmount = bnToApproximateDecimal(balance, decimals, precision);
    setAmount(maxAmount);
    if (inputRef.current) {
      inputRef.current.value = maxAmount.toString();
    }
  };

  const deposit = useCallback(async () => {
    if (!amount || decimals === undefined) {
      return;
    }

    const wallet = await selector.wallet();
    if (tokenId.toLowerCase() === 'near') {
      // Deposit NEAR by calling deposit_near on the Tonic contract with a
      // deposit attached.
      const tx = depositNearV1(
        TONIC_CONTRACT_ID,
        decimalToBn(amount, decimals)
      );
      return wallet.signAndSendTransaction({
        actions: [tx.toWalletSelectorAction()],
      });
    } else {
      // Deposit FT by calling ft_transfer_call on the token contract with
      // Tonic as the recipient and an empty string as the message.
      const tx = makeFtTransferCallTx(
        tokenId,
        {
          receiverId: TONIC_CONTRACT_ID,
          amount: decimalToBn(amount, decimals),
          msg: '',
        },
        tgasAmount(100)
      );
      return wallet.signAndSendTransaction({
        // note the receiver ID
        receiverId: tokenId,
        actions: [tx.toWalletSelectorAction()],
      });
    }
  }, [tokenId, decimals, selector, amount]);

  const withdraw = useCallback(async () => {
    if (!amount || decimals === undefined) {
      return;
    }

    const wallet = await selector.wallet();
    const tx = withdrawV1(
      TONIC_CONTRACT_ID,
      tokenId,
      decimalToBn(amount, decimals)
    );
    return wallet.signAndSendTransaction({
      actions: [tx.toWalletSelectorAction()],
    });
  }, [tokenId, decimals, selector, amount]);

  const storageDeposit = useCallback(async () => {
    if (!activeAccount) {
      return;
    }

    const wallet = await selector.wallet();
    const tx = makeStorageDespositTx(
      tokenId,
      {
        accountId: activeAccount.accountId,
        amount: 0.1,
        registrationOnly: true,
      },
      tgasAmount(100)
    );
    return wallet.signAndSendTransaction({
      receiverId: tokenId,
      actions: [tx.toWalletSelectorAction()],
    });
  }, [activeAccount, selector, tokenId]);

  const [canWithdraw, setCanWithdraw] = useState<boolean>();
  useEffect(() => {
    async function checkCanWithdraw() {
      if (!activeAccount) {
        return;
      }

      if (STORAGE_EXEMPT_TOKENS.includes(tokenId.toLowerCase())) {
        setCanWithdraw(true);
      } else {
        const hasQuoteDeposit = await storageBalanceOf(activeAccount, tokenId);
        setCanWithdraw(!!hasQuoteDeposit);
      }
    }
    if (direction === 'withdraw') {
      checkCanWithdraw();
    }
  }, [tokenId, direction, activeAccount]);

  const handleClickConfirm = useCallback(async () => {
    if (!activeAccount) {
      return;
    }

    try {
      let outcome: void | FinalExecutionOutcome;

      if (direction === 'deposit') {
        outcome = await deposit();
      } else if (canWithdraw) {
        outcome = await withdraw();
      } else if (canWithdraw === undefined) {
        return;
      } else {
        // canWithdraw is false, need storage deposit.
        outcome = await storageDeposit();
      }

      if (outcome) {
        toast.custom(
          wrappedToast(
            <CannedToast.TxGeneric id={outcome.transaction_outcome.id} />
          )
        );
      }
      if (onClose) {
        onClose();
      }
      refreshAllExchangeBalances();
    } catch (e) {
      console.error(e);
      toast.custom(
        wrappedToast(<CannedToast.ErrorSendingTx />, { variant: 'error' })
      );
    }
  }, [
    activeAccount,
    direction,
    canWithdraw,
    onClose,
    refreshAllExchangeBalances,
    deposit,
    withdraw,
    storageDeposit,
  ]);

  return (
    <div tw="overflow-hidden w-full md:w-[300px]" {...props}>
      <CardHeader tw="p-0 pr-3">
        <div tw="flex items-center">
          <TabButton
            active={direction !== 'deposit'}
            onClick={() => setDirection('withdraw')}
          >
            Withdraw
          </TabButton>
          <TabButton
            active={direction === 'deposit'}
            onClick={() => setDirection('deposit')}
          >
            Deposit
          </TabButton>
        </div>
        <CloseButton hideOnMobile onClick={onClose} />
      </CardHeader>

      <CardBody tw="pt-0 p-6">
        {(direction === 'deposit' || canWithdraw) && (
          <React.Fragment>
            <div tw="relative">
              <Input
                inputMode="decimal"
                ref={inputRef}
                placeholder="0"
                onChange={handleChangeAmount}
              />
              <button
                tw="absolute right-4 top-0 bottom-0 text-sm text-white light:text-black hover:text-up"
                onClick={handleClickMax}
              >
                Max
              </button>
            </div>
            <div tw="mt-2 text-right text-sm">
              <span>
                Available balance: {availableBalanceFormatted} {symbol}
              </span>
            </div>
            {direction === 'deposit' && tokenId.toUpperCase() === 'NEAR' && (
              <div tw="mt-1 flex items-center justify-end gap-x-1 text-sm">
                {NEAR_RESERVE} reserved
                {tokenId.toUpperCase() === 'NEAR' && (
                  <CannedTooltip.NearReserved tw="group-hover:right-full" />
                )}
              </div>
            )}
            <Button
              tw="mt-6 w-full"
              disabled={!amount}
              variant={amount ? 'up' : undefined}
              css={
                !!amount &&
                tw`bg-up-dark bg-opacity-60 border-transparent hover:border-up`
              }
              onClick={handleClickConfirm}
            >
              Confirm
            </Button>
          </React.Fragment>
        )}

        {direction === 'withdraw' && canWithdraw !== undefined && !canWithdraw && (
          <React.Fragment>
            <p tw="text-sm">
              You must create an account with the{' '}
              <a
                tw="underline"
                href={getExplorerUrl('account', tokenId)}
                target="_blank"
                rel="noreferrer"
              >
                {abbreviateAccountId(tokenId, 24, 8)}
              </a>{' '}
              contract to withdraw {symbol}.
            </p>
            <Button tw="mt-6 w-full" onClick={handleClickConfirm}>
              Continue
            </Button>
          </React.Fragment>
        )}
      </CardBody>
    </div>
  );
};

const DepositWithdraw: React.FC<DepositWithdrawProps> = (props) => {
  return <Content {...props} />;
};

export default DepositWithdraw;
