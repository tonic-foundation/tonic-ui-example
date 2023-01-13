import {
  ftOrNativeNearMetadata,
  FungibleTokenMetadata,
} from '@tonic-foundation/token';
import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useTitle } from 'react-use';
import useSWR from 'swr';
import tw, { styled } from 'twin.macro';
import Card from '~/components/common/Card';
import WaitingForNearNetwork from '~/components/common/WaitingForNearNetwork';
import ErrorBoundary from '~/components/ErrorBoundary';
import AppLayout from '~/layouts/AppLayout';
import { nobody } from '~/services/near';
import Input from '~/components/common/Input';
import Button from '~/components/common/Button';
import { useWalletSelector } from '~/state/WalletSelectorContainer';
import { useSignTransaction } from '~/hooks/useSignTransaction';
import { createMarketV1 } from '@tonic-foundation/tonic/lib/transaction';
import { TONIC_CONTRACT_ID } from '~/config';
import { storageDeposit } from '@tonic-foundation/storage/lib/transaction';
import BN from 'bn.js';
import { nearAmount } from '@tonic-foundation/tonic';
import { bnToApproximateDecimal, tgasAmount } from '@tonic-foundation/utils';
import AuthButton from '~/components/common/AuthButton';

// TODO: refactor, same as order form
const Field = tw.div`relative`;
const Label = tw.p`light:text-neutral-700 mb-1 text-sm`;
const InputInnerLabel = styled.span<{ disabled?: boolean }>(({ disabled }) => [
  tw`absolute right-0 top-0 bottom-0 p-0 text-neutral-300 light:text-neutral-700`,
  tw`flex items-center pr-3 cursor-default`,
  disabled &&
    tw`cursor-not-allowed placeholder:text-neutral-400 text-neutral-300`,
]);

const LineItem = tw.div`flex items-center justify-between text-sm`;

function useFtMetadata(address?: string) {
  return useSWR(
    address
      ? {
          __hack: 'use-ft-metadata',
          address,
        }
      : null,
    ({ address }) => ftOrNativeNearMetadata(nobody, address)
  );
}

interface FormState {
  baseTokenId?: string;
  quoteTokenId?: string;
  baseLotSize?: BN;
  quoteLotSize?: BN;
  takerFeeBaseRate?: number;
  makerRebateBaseRate?: number;
}

type FormAction =
  | { type: 'set-base-token'; payload?: string }
  | { type: 'set-quote-token'; payload?: string }
  | { type: 'set-base-lot-size'; payload?: string }
  | { type: 'set-quote-lot-size'; payload?: string }
  | { type: 'set-taker-fee-rate'; payload?: number }
  | { type: 'set-maker-rebate-rate'; payload?: number };

function formValid(state: FormState): state is Required<FormState> {
  const {
    baseLotSize,
    baseTokenId,
    makerRebateBaseRate,
    quoteLotSize,
    quoteTokenId,
    takerFeeBaseRate,
  } = state;
  const allSet = [
    baseLotSize,
    baseTokenId,
    makerRebateBaseRate,
    quoteLotSize,
    quoteTokenId,
    takerFeeBaseRate,
  ].every((v) => v !== undefined);

  if (!allSet) {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return takerFeeBaseRate! >= makerRebateBaseRate!;
}

function useFormState() {
  function reducer(state: FormState, action: FormAction): FormState {
    switch (action.type) {
      case 'set-base-token': {
        const baseTokenId =
          action.payload?.toLowerCase() === 'near' ? 'NEAR' : action.payload;
        return {
          ...state,
          baseTokenId,
        };
      }
      case 'set-quote-token': {
        const quoteTokenId =
          action.payload?.toLowerCase() === 'near' ? 'NEAR' : action.payload;
        return {
          ...state,
          quoteTokenId,
        };
      }
      case 'set-base-lot-size': {
        const baseLotSize = action.payload?.length
          ? new BN(action.payload)
          : undefined;

        return {
          ...state,
          baseLotSize,
        };
      }
      case 'set-quote-lot-size': {
        const quoteLotSize = action.payload?.length
          ? new BN(action.payload)
          : undefined;

        return {
          ...state,
          quoteLotSize,
        };
      }
      case 'set-taker-fee-rate': {
        return {
          ...state,
          takerFeeBaseRate: action.payload,
        };
      }
      case 'set-maker-rebate-rate': {
        return {
          ...state,
          makerRebateBaseRate: action.payload,
        };
      }
      default: {
        throw new Error(`unsupported action ${action}`);
      }
    }
  }

  return useReducer(reducer, {});
}

const TokenIdInput: React.FC<{
  value?: string;
  onChange: (t?: string) => unknown;
}> = ({ onChange, value }) => {
  const ref = useRef<HTMLInputElement>(null);
  const { data: metadata } = useFtMetadata(value);

  useEffect(() => {
    if (metadata) {
      ref.current?.setCustomValidity('');
    } else {
      ref.current?.setCustomValidity('Invalid token ID');
    }
  }, [metadata]);

  return (
    <React.Fragment>
      <Input
        tw="pr-20 overflow-hidden overflow-ellipsis"
        hasInnerLabel
        value={value || ''}
        ref={ref}
        placeholder={'Token ID'}
        onChange={(e) => {
          e.preventDefault();
          onChange(e.target.value);
        }}
      />
      {metadata && <InputInnerLabel>{metadata.symbol}</InputInnerLabel>}
    </React.Fragment>
  );
};

const LotSizeInput: React.FC<{
  value?: BN;
  onChange: (d?: string) => unknown;
  tokenMetadata: FungibleTokenMetadata;
}> = ({ value, onChange, tokenMetadata, ...props }) => {
  return (
    <React.Fragment>
      <Input
        {...props}
        hasInnerLabel
        tw="pr-24 overflow-hidden overflow-ellipsis"
        placeholder={
          tokenMetadata
            ? new BN(10).pow(new BN(tokenMetadata.decimals - 2)).toString()
            : undefined
        }
        value={value?.toString() || ''}
        inputMode="decimal"
        min={0}
        onChange={(e) => {
          e.preventDefault();
          if (!e.target.value.length || e.target.value.match(/^10*$/)) {
            onChange(e.target.value);
          }
        }}
      />
      {tokenMetadata && value && (
        <InputInnerLabel>
          {bnToApproximateDecimal(value, tokenMetadata.decimals)}{' '}
          {tokenMetadata.symbol}
        </InputInnerLabel>
      )}
    </React.Fragment>
  );
};

function useSubmitForm(state: FormState) {
  return useSignTransaction(
    async (wallet) => {
      if (formValid(state)) {
        const {
          baseTokenId,
          quoteTokenId,
          baseLotSize,
          makerRebateBaseRate,
          quoteLotSize,
          takerFeeBaseRate,
        } = state;

        const createMarketTransaction = createMarketV1(TONIC_CONTRACT_ID, {
          baseTokenId,
          quoteTokenId,
          baseTokenLotSize: baseLotSize.toString(),
          quoteTokenLotSize: quoteLotSize.toString(),
          takerFeeBaseRate,
          makerRebateBaseRate,
        });

        const baseStorageDepositTransaction =
          baseTokenId.toLowerCase() === 'near'
            ? []
            : [
                {
                  receiverId: state.baseTokenId,
                  actions: [
                    storageDeposit(
                      state.baseTokenId,
                      {
                        accountId: TONIC_CONTRACT_ID,
                        amount: nearAmount(0.1),
                        registrationOnly: true,
                      },
                      tgasAmount(10)
                    ).toWalletSelectorAction(),
                  ],
                },
              ];

        const quoteStorageDepositTransaction =
          quoteTokenId.toLowerCase() === 'near'
            ? []
            : [
                {
                  receiverId: state.quoteTokenId,
                  actions: [
                    storageDeposit(
                      state.quoteTokenId,
                      {
                        accountId: TONIC_CONTRACT_ID,
                        amount: nearAmount(0.1),
                        registrationOnly: true,
                      },
                      tgasAmount(10)
                    ).toWalletSelectorAction(),
                  ],
                },
              ];

        return wallet.signAndSendTransactions({
          transactions: [
            // TODO: shim should handle batch transaction case
            ...baseStorageDepositTransaction,
            ...quoteStorageDepositTransaction,
            {
              receiverId: TONIC_CONTRACT_ID,
              actions: [createMarketTransaction.toWalletSelectorAction()],
            },
          ],
        });
      }
    },
    [state]
  );
}

const CreateMarketForm: React.FC = ({ ...props }) => {
  const { selector } = useWalletSelector();
  const [state, dispatch] = useFormState();
  const isSignedIn = useMemo(() => selector.isSignedIn(), [selector]);

  const { data: baseMetadata } = useFtMetadata(state.baseTokenId);
  const { data: quoteMetadata } = useFtMetadata(state.quoteTokenId);

  const [quoteTick, setQuoteTick] = useState<number>();
  const [baseTick, setBaseTick] = useState<number>();

  const valid = useMemo(() => formValid(state), [state]);
  const [submitting, submit] = useSubmitForm(state);

  // light:
  // - needs a bit of border to be distinct from bg but default is too dark
  // - with shadow it's hard to tell that the border is different, esp bc
  //   there's no other cards on this page for comparison, so should be fine
  return (
    <Card tw="relative light:(border-neutral-200 shadow-lg)" {...props}>
      <form
        tw="p-3 flex flex-col items-stretch gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div tw="flex flex-col items-stretch gap-3">
          <div>
            <Label>Base Token</Label>
            <Field>
              <TokenIdInput
                value={state.baseTokenId}
                onChange={(payload) =>
                  dispatch({
                    type: 'set-base-token',
                    payload,
                  })
                }
              />
            </Field>
          </div>
          <div>
            <Label>Quote Token</Label>
            <Field>
              <TokenIdInput
                value={state.quoteTokenId}
                onChange={(payload) =>
                  dispatch({
                    type: 'set-quote-token',
                    payload,
                  })
                }
              />
            </Field>
          </div>
        </div>

        {(baseMetadata || quoteMetadata) && (
          <div tw="flex flex-col items-stretch gap-3">
            {baseMetadata && (
              <div>
                <Label>Base lot size</Label>
                <Field>
                  <LotSizeInput
                    tokenMetadata={baseMetadata}
                    value={state.baseLotSize}
                    onChange={(payload) =>
                      dispatch({
                        type: 'set-base-lot-size',
                        payload,
                      })
                    }
                  />
                </Field>
              </div>
            )}
            {quoteMetadata && (
              <div>
                <Label>Quote lot size</Label>
                <Field>
                  <LotSizeInput
                    tokenMetadata={quoteMetadata}
                    value={state.quoteLotSize}
                    onChange={(payload) =>
                      dispatch({
                        type: 'set-quote-lot-size',
                        payload,
                      })
                    }
                  />
                </Field>
              </div>
            )}
          </div>
        )}

        {baseMetadata && quoteMetadata && (
          <div tw="grid grid-cols-2 gap-3">
            <div>
              <Label>Taker fee bps</Label>
              <Field>
                <Input
                  value={state.takerFeeBaseRate}
                  onChange={(e) => {
                    const v = e.target.value;
                    dispatch({
                      type: 'set-taker-fee-rate',
                      payload: v?.length ? Number(v) : undefined,
                    });
                  }}
                />
              </Field>
            </div>
            <div>
              <Label>Maker rebate bps</Label>
              <Field>
                <Input
                  value={state.makerRebateBaseRate}
                  onChange={(e) => {
                    const v = e.target.value;
                    dispatch({
                      type: 'set-maker-rebate-rate',
                      payload: v?.length ? Number(v) : undefined,
                    });
                  }}
                />
              </Field>
            </div>
          </div>
        )}

        {formValid(state) && baseMetadata && quoteMetadata && (
          <div tw="flex flex-col items-stretch gap-0.5">
            <LineItem>
              <span>Pair</span>
              <span>
                {baseMetadata.symbol}/{quoteMetadata.symbol}
              </span>
            </LineItem>
            <LineItem>
              <span>Base tick</span>
              <span>
                {bnToApproximateDecimal(
                  state.baseLotSize,
                  baseMetadata.decimals
                )}{' '}
                {baseMetadata.symbol}
              </span>
            </LineItem>
            <LineItem>
              <span>Quote tick</span>
              <span>
                {bnToApproximateDecimal(
                  state.quoteLotSize,
                  quoteMetadata.decimals
                )}{' '}
                {quoteMetadata.symbol}
              </span>
            </LineItem>
            <LineItem>
              <span>Taker fee rate</span>
              <span>{state.takerFeeBaseRate / 100}%</span>
            </LineItem>
            <LineItem>
              <span>Maker rebate rate</span>
              <span>{state.makerRebateBaseRate / 100}%</span>
            </LineItem>
          </div>
        )}

        {isSignedIn ? (
          <Button
            type="submit"
            tw="py-3"
            variant="up"
            disabled={submitting || !valid}
          >
            {valid ? 'Confirm' : 'Form error'}
          </Button>
        ) : (
          <AuthButton tw="py-3" />
        )}
      </form>
    </Card>
  );
};

const Wrapper = tw.main`w-full py-20 px-3 flex-grow max-h-screen overflow-auto gap-2`;
const Content: React.FC = () => {
  return (
    <Wrapper>
      <CreateMarketForm tw="sm:max-w-sm m-auto" />
    </Wrapper>
  );
};

const ListPage: React.FC = () => {
  useTitle('Tonic - List token');

  return (
    <ErrorBoundary>
      <AppLayout>
        <React.Suspense fallback={<WaitingForNearNetwork />}>
          <Content />
        </React.Suspense>
      </AppLayout>
    </ErrorBoundary>
  );
};

export default ListPage;
