import BN from 'bn.js';
import CloseButton from '../CloseButton';
import tw from 'twin.macro';
import { InputChangeHandler } from '~/types/event-handlers';
import {
  bnToApproximateDecimal,
  bnToFixed,
  decimalToBn,
} from '@tonic-foundation/utils';
import { getTokenBalance, getTokenMetadata } from '~/services/token';
import { tonic, wallet } from '~/services/near';
import React, { useEffect, useRef, useState } from 'react';
import { ZERO } from '~/util/math';
import Button from '../Button';
import { storageBalanceOf, storageDeposit } from '@tonic-foundation/storage';
import { getExplorerUrl, NEAR_RESERVE, NEAR_RESERVE_BN } from '~/config';
import Tooltip from '../Tooltip';
import Input from '../Input';
import { abbreviateAccountId } from '~/util';
import TabButton from '../TabButton';
import { CardBody, CardHeader } from '../Card';
import CannedTooltip from '../CannedTooltip';

const MAX_DECIMALS = 5;

export interface DepositWithdrawProps {
  tokenId: string;
  direction: 'deposit' | 'withdraw';
  onClose?: () => unknown;
}

const getExchangeBalance = async (tokenId: string) => {
  const all = await tonic.getBalances();
  return all[tokenId] || ZERO;
};

const Content: React.FC<DepositWithdrawProps> = ({
  tokenId,
  direction: initialDirection,
  onClose,
  ...props
}) => {
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

  // Load balance and decimals
  useEffect(() => {
    getTokenMetadata(tokenId).then((m) => {
      setDecimals(m.decimals);
      setSymbol(m.symbol);
    });

    // load wallet balance
    if (tokenId.toUpperCase() === 'NEAR') {
      wallet
        .account()
        .getAccountBalance()
        .then(({ available }) => {
          const availableFunds = new BN(available).sub(NEAR_RESERVE_BN);
          if (availableFunds.gt(ZERO)) {
            setWalletBalance(availableFunds);
          } else {
            setWalletBalance(ZERO);
          }
        });
    } else {
      getTokenBalance(tokenId).then(setWalletBalance);
    }

    // get exchange balance; not usually necessary to load both balances but
    // this avoids network race condition eg when switching between
    // deposit/withdraw
    getExchangeBalance(tokenId).then(setExchangeBalance);
  }, [tokenId, direction]);

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

  const handleConfirm = () => {
    if (!amount || decimals === undefined) {
      return;
    }
    const amountBN = decimalToBn(amount, decimals);
    if (direction === 'deposit') {
      tonic.deposit(tokenId, amountBN);
    } else {
      tonic.withdraw(tokenId, amountBN);
    }
  };

  const [canWithdraw, setCanWithdraw] = useState<boolean>();

  useEffect(() => {
    async function checkCanWithdraw() {
      if (tokenId.toLowerCase() === 'near') {
        setCanWithdraw(true);
      } else {
        const hasQuoteDeposit = await storageBalanceOf(
          wallet.account(),
          tokenId
        );
        setCanWithdraw(!!hasQuoteDeposit);
      }
    }
    if (direction === 'withdraw') {
      checkCanWithdraw();
    }
  }, [tokenId, direction]);

  function handleDeposit() {
    if (direction === 'deposit' || canWithdraw) {
      handleConfirm();
      return;
    }
    if (canWithdraw === undefined) {
      return;
    } else {
      storageDeposit(wallet.account(), tokenId, {
        amount: 0.1,
        registrationOnly: true,
      });
    }
  }

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
              onClick={handleConfirm}
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
            <Button tw="mt-6 w-full" onClick={handleDeposit}>
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
