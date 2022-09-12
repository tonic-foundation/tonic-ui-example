import AppLayout from '~/layouts/AppLayout';
import AuthButton from '~/components/common/AuthButton';
import Button from '~/components/common/Button';
import Card from '~/components/common/Card';
import ErrorBoundary from '~/components/ErrorBoundary';
import Fallback from '~/components/common/Fallback';
import IconButton from '~/components/common/IconButton';
import Input from '~/components/common/Input';
import Modal from '~/components/common/Modal';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SwapSettingsForm from '~/components/swap/SwapSettingsForm';
import TokenIcon from '~/components/common/TokenIcon';
import TokenSelector from '~/components/swap/TokenSelector';
import tw, { styled } from 'twin.macro';
import useWalletBalance from '~/hooks/useWalletBalance';
import { CgArrowsExchangeAlt } from 'react-icons/cg';
import { ClickHandler } from '~/types/event-handlers';
import { MdSettings } from 'react-icons/md';
import { TONIC_SWAP_ALLOW_SLIPPAGE_CONTROLS } from '~/config';
import { TbSwitch } from 'react-icons/tb';
import { TokenInfo } from '@tonic-foundation/token-list';
import { atom, useRecoilState, useRecoilValue } from 'recoil';
import { bnToApproximateDecimal, decimalToBn } from '@tonic-foundation/utils';
import { swapSettingsState } from '~/state/swap';
import { truncate } from '~/util/math';
import { useTitle } from 'react-use';
import { ImplicitSignerTransaction } from '~/services/near';
import WaitingForNearNetwork from '~/components/common/WaitingForNearNetwork';
import useMarkets from '~/hooks/useMarkets';
import useHasStorageBalance from '~/hooks/useHasStorageBalance';
import {
  createSwapTransaction,
  createTokenDepositTransaction,
  getSwapRoute,
  SwapRoute,
} from './helper';
import Icon from '~/components/common/Icons';
import useSupportedTokens from '~/hooks/useSupportedTokens';
import { useWalletSelector } from '~/state/WalletSelectorContainer';
import { useTonic } from '~/state/tonic-client';
import toast from 'react-hot-toast';
import CannedToast from '~/components/common/CannedToast';

const tokenSelectorModalCbState = atom<((t: TokenInfo) => unknown) | undefined>(
  {
    key: 'swap-page-token-selector-modal-cb-state',
    default: undefined,
  }
);
const swapSettingsModalState = atom<boolean>({
  key: 'swap-page-swap-settings-modal-state',
  default: false,
});

const SwapHeading = tw.h1`text-sm mb-1`;
const SwapField = tw.div`relative`;
const SwapFormSection = styled(Card)(
  tw`p-3 border-none dark:(bg-white bg-opacity-5) light:(bg-black bg-opacity-[0.04])`
);
const LineItem = tw.div`flex items-center justify-between text-xs opacity-80`;
const SwapInput = styled(Input)(
  tw`
    px-0 pl-12 py-2 sm:py-3
    border-none
    text-right text-xl font-mono
    placeholder:font-mono
    light:(bg-transparent disabled:text-black)
    dark:bg-transparent
  `
);
const InputLeftContainer = tw.div`
  absolute left-0 top-0 bottom-0
  flex items-center
`;
const TokenButton: React.FC<{
  token: TokenInfo;
  onClick: ClickHandler;
}> = ({ token, ...props }) => {
  return (
    <button
      tw="flex items-center p-1.5 rounded-lg dark:hover:(bg-white bg-opacity-10) light:hover:underline"
      {...props}
    >
      <TokenIcon tw="w-6 h-6" src={token.logoURI} />
      <span tw="ml-2">{token.symbol}</span>
      <Icon.ArrowDown tw="ml-1" />
    </button>
  );
};

function useTokenBalanceDisplay(token: TokenInfo) {
  const [balance, loading, reload] = useWalletBalance(token.address);
  const _number = useMemo(() => {
    return balance
      ? bnToApproximateDecimal(balance, token.decimals, 5)
      : undefined;
  }, [balance, token]);
  const formatted = useMemo(() => {
    return typeof _number === 'number'
      ? truncate(_number, 5).toFixed(5) // always show 5 places. never round up
      : '---';
  }, [_number]);

  return [
    {
      raw: balance,
      number: _number,
      formatted,
    },
    loading,
    reload,
  ] as const;
}

const SwapForm: React.FC<{
  tokenIn: TokenInfo;
  tokenOut: TokenInfo;
  onClickTokenIn: () => unknown;
  onClickTokenOut: () => unknown;
  onClickReverse: () => unknown;
}> = ({
  tokenIn,
  tokenOut,
  onClickTokenIn,
  onClickTokenOut,
  onClickReverse,
  ...props
}) => {
  const { selector, accountId } = useWalletSelector();
  const { tonic } = useTonic();
  const isSignedIn = selector.isSignedIn();
  const swapSettings = useRecoilValue(swapSettingsState);
  const [markets] = useMarkets();

  const isInputNear = tokenIn.address.toLowerCase() === 'near';

  const [
    inputWalletBalance,
    inputWalletBalanceLoading,
    reloadInputWalletBalance,
  ] = useTokenBalanceDisplay(tokenIn);
  const availableToSpend = useMemo(() => {
    // prevent user from spending all of their NEAR
    if (isInputNear) {
      if (inputWalletBalance.number && inputWalletBalance.number > 0.5) {
        return inputWalletBalance.number - 0.5;
      }
      return 0;
    }
    return inputWalletBalance.number || 0;
  }, [isInputNear, inputWalletBalance]);

  const [
    outputWalletBalance,
    outputWalletBalanceLoading,
    reloadOutputWalletBalance,
  ] = useTokenBalanceDisplay(tokenOut);
  const [hasTokenOutDeposit] = useHasStorageBalance(tokenOut.address);
  const needsStorageDeposit =
    typeof hasTokenOutDeposit !== 'undefined' && !hasTokenOutDeposit;

  const [amount, setAmount] = useState('');
  const amountNumber = amount ? parseFloat(amount) : undefined;
  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState<SwapRoute>();

  // TODO: do we need to handle amount as a string?
  const handleClickMax = useCallback(() => {
    setAmount(availableToSpend > 0 ? availableToSpend.toString() : '');
  }, [availableToSpend, setAmount]);

  // Get swap route when user chooses tokens
  useEffect(() => {
    setLoading(true);
    getSwapRoute(
      tonic,
      markets,
      tokenIn.address,
      tokenOut.address,
      swapSettings
    )
      .then(setRoute)
      .finally(() => setLoading(false));
    return () => setRoute(undefined);
  }, [tonic, tokenIn, tokenOut, setRoute, swapSettings, markets]);

  // Reset input when input token changes
  useEffect(() => {
    return setAmount('');
  }, [setAmount, tokenIn]);

  const netOut = useMemo(() => {
    const parsed = parseFloat(amount);
    if (!isNaN(parsed) && route) {
      return parsed * route.netExchangeRate * (1 - route.netFeeRate / 100);
    }
    return undefined;
  }, [amount, route]);
  const minNetOut = netOut
    ? netOut * (1 - swapSettings.slippageTolerancePercent / 100)
    : 0;

  const formError = useMemo(() => {
    if (tokenIn.address === tokenOut.address) {
      return 'Choose output token';
    }
    if (!netOut) {
      return 'Enter amount';
    }
    return;
  }, [tokenIn, tokenOut, netOut]);
  const formValid = !formError;

  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (accountId && formValid && amountNumber && route && !submitting) {
      const wallet = await selector.wallet();

      setSubmitting(true); // TODO dont use useState for this
      const transactions: ImplicitSignerTransaction[] = [];
      if (needsStorageDeposit) {
        transactions.push(
          await createTokenDepositTransaction(tokenOut.address, accountId)
        );
      }
      transactions.push(
        createSwapTransaction(
          tokenIn,
          decimalToBn(amountNumber, tokenIn.decimals),
          decimalToBn(minNetOut, tokenOut.decimals),
          route
        )
      );
      try {
        const outcome = await wallet.signAndSendTransactions({
          transactions,
        });
        if (outcome?.length) {
          const swapOutcome = outcome.slice(-1)[0];
          if (typeof swapOutcome.status === 'object') {
            if (swapOutcome.status.SuccessValue) {
              toast.custom(
                <CannedToast.TxGeneric
                  id={swapOutcome.transaction_outcome.id}
                />
              );
            } else if (swapOutcome.status.Failure) {
              toast.error('transaction failed');
            }
          }
        }
      } finally {
        setSubmitting(false);
        reloadInputWalletBalance();
        reloadOutputWalletBalance();
      }
    }
  };

  return (
    // light:
    // - needs a bit of border to be distinct from bg but default is too dark
    // - with shadow it's hard to tell that the border is different, esp bc
    //   there's no other cards on this page for comparison, so should be fine
    <Card tw="relative light:(border-neutral-200 shadow-lg)" {...props}>
      {submitting && (
        <div tw="absolute inset-0 flex items-center justify-center z-20 dark:(bg-black bg-opacity-20) light:(bg-black bg-opacity-20)">
          <Fallback tw="light:text-black" />
        </div>
      )}
      <form
        id="swap"
        tw="p-3 flex flex-col items-stretch"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <SwapFormSection>
          <header tw="flex items-center justify-between">
            <SwapHeading>You sell</SwapHeading>
            {!inputWalletBalanceLoading &&
              (inputWalletBalance.number ? (
                <p tw="text-sm">
                  Wallet:{' '}
                  <button
                    tw="dark:text-up-dark light:text-blue-500 hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      handleClickMax();
                    }}
                  >
                    {inputWalletBalance.formatted}
                  </button>
                </p>
              ) : (
                <p tw="text-sm opacity-80">
                  Wallet: {inputWalletBalance.formatted}
                </p>
              ))}
          </header>

          <SwapField>
            <InputLeftContainer>
              <TokenButton
                token={tokenIn}
                onClick={(e) => {
                  e.preventDefault();
                  onClickTokenIn();
                }}
              />
            </InputLeftContainer>
            <SwapInput
              type="number"
              inputMode="decimal"
              placeholder="0"
              required
              max={availableToSpend.toString()}
              onChange={(e) => {
                setAmount(e.target.value);
              }}
              value={amount}
            />
          </SwapField>
        </SwapFormSection>

        <div tw="mt-3 flex items-center justify-center">
          <Button
            onClick={(e) => {
              e.preventDefault();
              onClickReverse();
            }}
            tw="
                border-none
                text-lg h-6 w-6 p-0 flex items-center justify-center
                dark:(border-none bg-neutral-800 hover:bg-neutral-700)
                light:(hover:(bg-black bg-opacity-[0.04]))
              "
          >
            <TbSwitch />
          </Button>
        </div>

        <SwapFormSection tw="dark:bg-transparent light:bg-transparent">
          <header tw="flex items-center justify-between">
            <SwapHeading>You receive</SwapHeading>
            {!outputWalletBalanceLoading && (
              <p tw="text-sm opacity-80">
                Wallet: {outputWalletBalance.formatted}
              </p>
            )}
          </header>
          <SwapField>
            <InputLeftContainer>
              <TokenButton
                // hack: higher z required on some mobile browsers
                tw="relative z-10"
                token={tokenOut}
                onClick={(e) => {
                  e.preventDefault();
                  onClickTokenOut();
                }}
              />
            </InputLeftContainer>
            <SwapInput
              disabled
              tw="light:border-transparent"
              placeholder="0"
              value={netOut ? truncate(netOut, 5).toString() : ''}
            />
          </SwapField>
        </SwapFormSection>

        {loading && <Fallback tw="text-2xl mb-2" />}
        {route && formValid && (
          <SwapFormSection>
            <LineItem>
              <span>Exchange rate</span>{' '}
              <p tw="flex items-center gap-1">
                <span>1 {tokenIn.symbol}</span>
                <span tw="text-base">
                  <CgArrowsExchangeAlt />
                </span>{' '}
                <span>
                  {truncate(route.netExchangeRate, 3)} {tokenOut.symbol}
                </span>
              </p>
            </LineItem>
            <LineItem>
              <span>Net fee</span>
              <span>{truncate(route.netFeeRate, 3)}%</span>
            </LineItem>
            {TONIC_SWAP_ALLOW_SLIPPAGE_CONTROLS && !!minNetOut && (
              <LineItem>
                <span>Min received</span>
                <span>{truncate(minNetOut, 3)}</span>
              </LineItem>
            )}
          </SwapFormSection>
        )}

        {isSignedIn ? (
          <Button
            type="submit"
            tw="mt-3 py-3"
            variant="up"
            disabled={submitting || !formValid}
          >
            {formError || 'Place order'}
          </Button>
        ) : (
          <AuthButton tw="mt-3 py-3" />
        )}
      </form>
    </Card>
  );
};

const Wrapper = tw.main`w-full py-20 px-3 flex-grow max-h-screen overflow-auto gap-2`;

const Content = () => {
  const swapSettings = useRecoilValue(swapSettingsState);
  const [swapSettingsModalVisible, setSwapSettingsModalVisible] =
    useRecoilState(swapSettingsModalState);
  const [allTokens] = useSupportedTokens();
  const [tokenSelectorCb, setTokenSelectorCb] = useRecoilState(
    tokenSelectorModalCbState
  );

  const [pair, setPair] = useState({
    tokenIn: allTokens[0],
    tokenOut: allTokens[1],
  });

  const setTokenIn = useCallback(
    (tokenIn: TokenInfo) => setPair({ ...pair, tokenIn }),
    [pair, setPair]
  );

  const setTokenOut = useCallback(
    (tokenOut: TokenInfo) => setPair({ ...pair, tokenOut }),
    [pair, setPair]
  );

  const reverseTokens = useCallback(() => {
    const { tokenIn, tokenOut } = pair;
    setPair({ tokenIn: tokenOut, tokenOut: tokenIn });
  }, [pair, setPair]);

  return (
    <Wrapper>
      {TONIC_SWAP_ALLOW_SLIPPAGE_CONTROLS && (
        <header tw="sm:max-w-sm m-auto mb-3 flex items-center justify-between">
          <h1 tw="text-lg">Swap</h1>
          <div tw="flex items-center gap-1.5">
            <span tw="text-sm">{swapSettings.slippageTolerancePercent}%</span>
            <IconButton
              tw="text-xl"
              onClick={(e) => {
                e.preventDefault();
                setSwapSettingsModalVisible(true);
              }}
            >
              <MdSettings />
            </IconButton>
          </div>
        </header>
      )}
      <SwapForm
        tw="sm:max-w-sm m-auto"
        tokenIn={pair.tokenIn}
        tokenOut={pair.tokenOut}
        onClickReverse={reverseTokens}
        // NB(recoil): if setAtomValue is called with a function, the function
        // gets called to produce the new value. So keeping a cb in recoil
        // requires setting the atom with a higher order fn
        onClickTokenIn={() => setTokenSelectorCb(() => setTokenIn)}
        onClickTokenOut={() => setTokenSelectorCb(() => setTokenOut)}
      />
      <Modal
        drawerOnMobile
        visible={!!tokenSelectorCb}
        onClose={() => setTokenSelectorCb(undefined)}
        render={({ closeModal }) => (
          <TokenSelector
            tokenList={allTokens}
            onClickClose={closeModal}
            onSelectToken={(t) => {
              if (tokenSelectorCb) {
                tokenSelectorCb(t);
              }
            }}
          />
        )}
      />
      <Modal
        drawerOnMobile
        visible={swapSettingsModalVisible}
        onClose={() => setSwapSettingsModalVisible(false)}
        render={({ closeModal }) => (
          <SwapSettingsForm tw="md:max-w-sm" onClickClose={closeModal} />
        )}
      />
    </Wrapper>
  );
};

function SwapPage() {
  useTitle('Tonic');

  return (
    <ErrorBoundary>
      <AppLayout>
        <React.Suspense fallback={<WaitingForNearNetwork />}>
          <Content />
        </React.Suspense>
      </AppLayout>
    </ErrorBoundary>
  );
}

export default SwapPage;
