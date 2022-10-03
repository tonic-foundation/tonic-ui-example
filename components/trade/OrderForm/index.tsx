import React, { EventHandler, FormEvent, useEffect, useState } from 'react';
import tw, { styled } from 'twin.macro';
import {
  Market,
  NewOrderParams,
  OrderSide,
  OrderType,
} from '@tonic-foundation/tonic';
import { bnToApproximateDecimal } from '@tonic-foundation/utils';
import Button from '../../common/Button';
import { InputChangeHandler } from '~/types/event-handlers';
import {
  useMarket,
  useMidmarketPrice,
  usePair,
  usePairExchangeBalances,
  usePairPrecision,
} from '~/state/trade';
import Input from '../../common/Input';
import Tooltip from '../../common/Tooltip';
import Toggle from '../../common/Toggle';
import { truncate } from '~/util/math';
import { TONIC_HAS_FEE_REBATES } from '~/config';

const Field = tw.div`relative`;
const Label = tw.p`light:text-neutral-700 mb-1 text-sm`;
const InputInnerLabel = styled.span<{ disabled?: boolean }>(({ disabled }) => [
  tw`absolute right-0 top-0 bottom-0 p-0 text-neutral-300 light:text-neutral-700`,
  tw`flex items-center pr-3 cursor-default`,
  disabled &&
    tw`cursor-not-allowed placeholder:text-neutral-400 text-neutral-300`,
]);

const LineItem = tw.div`flex items-center justify-between text-sm`;

const SliderContainer = tw.div`
  w-full grid grid-cols-4
  place-content-center overflow-hidden
  rounded-md border
  dark:(border-neutral-700 bg-neutral-800)
  light:(border-neutral-900)
`;
const PercentButton = tw.button`
  py-1.5 font-primary
  dark:(text-white hover:bg-neutral-700)
  light:(text-black hover:underline active:bg-neutral-200)
`;
const SpendPercentageSlider: React.FC<{
  onClickPercentage: (percent: number) => unknown;
}> = ({ onClickPercentage, ...props }) => {
  const percentages = [25, 50, 75, 100] as const;

  return (
    <SliderContainer {...props}>
      {percentages.map((percent) => {
        return (
          <PercentButton
            key={percent}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onClickPercentage(percent);
            }}
          >
            {percent}%
          </PercentButton>
        );
      })}
    </SliderContainer>
  );
};

function calculateTakerFee(market: Market, subtotal: number) {
  const rate = market.takerFeeBaseRate / 10_000;
  return subtotal * (rate / (1 - rate));
}

function withholdTakerFee(market: Market, fundingAmount: number) {
  const fee = calculateTakerFee(market, fundingAmount);
  return fundingAmount - fee;
}

interface OrderFormProps {
  /**
   * Optional price. Allows parent to set the price from outside of the form.
   */
  price?: number;
  /**
   * Optional quantity. Allows parent to set the quantity from outside of the
   * form.
   */
  quantity?: number;
  /**
   * Initial side to select on first render.
   */
  side?: OrderSide;
  priceTick: number; // TODO: these ticks can be taken from recoil
  quantityTick: number;
  onClickConfirm: (params: NewOrderParams) => Promise<unknown>;
}
const OrderForm: React.FC<OrderFormProps> = ({
  price: priceFromParent,
  quantity: quantityFromParent,
  side: initialSide = 'Buy',
  priceTick,
  quantityTick,
  onClickConfirm,
  ...props
}) => {
  const [market] = useMarket();
  const { baseTokenId, baseTokenMetadata, quoteTokenId, quoteTokenMetadata } =
    usePair();
  const midmarketPrice = useMidmarketPrice();
  const defaultPrice = midmarketPrice
    ? bnToApproximateDecimal(midmarketPrice, quoteTokenMetadata.decimals)
    : undefined;

  const { pricePrecision, quantityPrecision } = usePairPrecision();

  const [orderType, setOrderType] = useState<OrderType>('Limit');
  const [side, setSide] = useState<OrderSide>(initialSide);

  const [priceStr, setPriceStr] = useState<string>();
  const [quantityStr, setQuantityStr] = useState<string>();

  // Get available funds in exchange
  const [balances, refreshBalances] = usePairExchangeBalances();
  const fundsToken = side === 'Buy' ? quoteTokenMetadata : baseTokenMetadata;
  const fundsBalance =
    side === 'Buy' ? balances.quoteBalance : balances.baseBalance;
  const fundsBalanceNumber = bnToApproximateDecimal(
    fundsBalance,
    fundsToken.decimals
  );

  const limitPrice = priceStr ? parseFloat(priceStr) : undefined;
  const quantity = quantityStr ? parseFloat(quantityStr) : undefined;
  const subtotal = limitPrice && quantity ? limitPrice * quantity : undefined;
  const takerFee = subtotal ? calculateTakerFee(market, subtotal) : undefined;
  const total =
    subtotal && takerFee
      ? side === 'Buy'
        ? subtotal + takerFee
        : subtotal - takerFee
      : undefined;

  // price tick is a number, eg, 0.001. precision is the number of decimals in
  // the tick, ie, length of the price tick with the whole part and dot removed
  function setPrice(p?: number | string) {
    if (typeof p === 'number') {
      setPriceStr(truncate(p, pricePrecision).toString());
    } else {
      setPriceStr(p);
    }
  }

  function setQuantity(q?: number | string) {
    if (typeof q === 'number') {
      setQuantityStr(truncate(q, quantityPrecision).toString());
    } else {
      setQuantityStr(q);
    }
  }

  const resetFormValues = () => {
    setPrice('');
    setQuantity('');
  };

  useEffect(() => {
    resetFormValues();
  }, [baseTokenId, quoteTokenId]);

  // React to the parent resetting prices/quantities
  useEffect(() => {
    if (priceFromParent) {
      setPrice(priceFromParent);
    }
  }, [priceFromParent]);

  useEffect(() => {
    if (quantityFromParent) {
      setQuantity(quantityFromParent);
    }
  }, [quantityFromParent]);

  const [formValid, setFormValid] = useState(false);
  const [validationReason, setValidationReason] = useState<string>();
  useEffect(() => {
    if (fundsBalanceNumber === 0) {
      setFormValid(false);
      setValidationReason(`Deposit ${fundsToken.symbol} to trade`);
      return;
    }
    if (orderType === 'Market' && quantity && quantity > 0) {
      setFormValid(true);
      setValidationReason(undefined);
      return;
    }
    if (side === 'Buy' && total && total > fundsBalanceNumber) {
      setFormValid(false);
      setValidationReason('Insufficient funds');
    } else if (side === 'Sell' && quantity && quantity > fundsBalanceNumber) {
      setFormValid(false);
      setValidationReason('Insufficient funds');
    } else if (total && total > 0) {
      setFormValid(true);
      setValidationReason(undefined);
    } else if (!limitPrice) {
      setFormValid(false);
      setValidationReason('Enter price');
    } else if (!quantity) {
      setFormValid(false);
      setValidationReason('Enter order');
    } else if (!total || total <= 0) {
      setFormValid(false);
    }
  }, [
    total,
    limitPrice,
    quantity,
    orderType,
    side,
    fundsBalanceNumber,
    fundsToken.symbol,
  ]);

  const handleChangePrice: InputChangeHandler = (e) => {
    setPrice(e.target.value);
  };

  const handleChangeQuantity: InputChangeHandler = (e) => {
    setQuantity(e.target.value);
  };

  const handleClickFundingPercent = (percent: number) => {
    if (side === 'Buy') {
      const fundsToUse =
        withholdTakerFee(market, fundsBalanceNumber) * (percent / 100);
      const p = limitPrice || defaultPrice;
      setPrice(p);
      if (p) {
        setQuantity(fundsToUse / p);
      }
    } else {
      const fundsToUse = (fundsBalanceNumber * percent) / 100;
      setQuantity(fundsToUse);
      setPrice(limitPrice || defaultPrice);
    }
  };

  const handleSubmit: EventHandler<FormEvent> = (e) => {
    e.preventDefault();
    if (formValid && quantity && total) {
      resetFormValues();
      const maxSpend =
        side === 'Buy' ? Math.min(total, fundsBalanceNumber) : undefined;
      onClickConfirm({
        quantity,
        limitPrice, // not required if market order
        side,
        orderType,
        maxSpend, // unused if selling
      }).then(refreshBalances);
    }
  };

  return (
    <form tw="space-y-3 relative" {...props} onSubmit={handleSubmit}>
      <header tw="grid grid-cols-2 gap-3 items-stretch">
        <div>
          <Label>Direction</Label>
          <Toggle.Container>
            <Toggle.Button
              active={side === 'Buy'}
              activeStyle={tw`bg-up-extraDark light:bg-up`}
              baseStyle={tw`dark:(text-neutral-400 hover:text-up-dark)`}
              onClick={(e) => {
                e.preventDefault();
                setSide('Buy');
              }}
            >
              Buy
            </Toggle.Button>
            <Toggle.Button
              active={side === 'Sell'}
              activeStyle={tw`bg-down-extraDark text-white`}
              baseStyle={tw`dark:(text-neutral-400 hover:text-down-dark)`}
              onClick={(e) => {
                e.preventDefault();
                setSide('Sell');
              }}
            >
              Sell
            </Toggle.Button>
          </Toggle.Container>
        </div>

        <div>
          <Label>Order type</Label>
          <Toggle.Container>
            <Toggle.Button
              active={orderType === 'Limit'}
              onClick={(e) => {
                e.preventDefault();
                setOrderType('Limit');
              }}
            >
              Limit
            </Toggle.Button>
            <Toggle.Button
              active={orderType === 'Market'}
              onClick={(e) => {
                e.preventDefault();
                setOrderType('Market');
                setPrice(defaultPrice);
                // set the price so that we can estimate the total volume to
                // display to the user in this case. this is purely visual; it
                // doesn't matter what the price parameter is for market orders
              }}
            >
              Market
            </Toggle.Button>
          </Toggle.Container>
        </div>
      </header>

      <div tw="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>Price</Label>
          <Field>
            <Input
              placeholder={orderType === 'Market' ? 'Market' : 'Price'}
              hasInnerLabel
              tw="pr-12"
              id="price"
              type="number"
              inputMode="decimal"
              min={0}
              disabled={orderType === 'Market'}
              value={orderType === 'Market' ? '' : priceStr}
              onChange={handleChangePrice}
              step={priceTick}
            />
            <InputInnerLabel disabled={orderType === 'Market'}>
              {quoteTokenMetadata.symbol}
            </InputInnerLabel>
          </Field>
        </div>

        <div>
          <Label>Size</Label>
          <Field>
            <Input
              placeholder="Size"
              hasInnerLabel
              tw="pr-12"
              id="quantity"
              inputMode="decimal"
              type="number"
              min={0}
              step={quantityTick}
              value={quantityStr}
              onChange={handleChangeQuantity}
            />
            <InputInnerLabel>{baseTokenMetadata.symbol}</InputInnerLabel>
          </Field>
        </div>
      </div>

      <SpendPercentageSlider onClickPercentage={handleClickFundingPercent} />

      <section tw="space-y-1.5">
        <LineItem>
          <span>Available</span>
          <span>
            {fundsBalanceNumber} {fundsToken.symbol}
          </span>
        </LineItem>

        <LineItem>
          <span>Volume</span>
          <span>
            {subtotal ? truncate(subtotal, pricePrecision) : 0}{' '}
            {quoteTokenMetadata.symbol}
          </span>
        </LineItem>

        <LineItem>
          <div tw="flex items-center gap-x-1">
            <span>Fee (estimate)</span>
            <Tooltip>
              The estimated fee if the whole order executes as a taker order.
              Most orders won&apos;t incur the full fee amount.
            </Tooltip>
          </div>
          <span>
            {takerFee ? truncate(takerFee, pricePrecision) : 0}{' '}
            {quoteTokenMetadata.symbol}
          </span>
        </LineItem>

        <LineItem>
          <span>Total</span>
          <span>
            {total ? truncate(total, pricePrecision) : 0}{' '}
            {quoteTokenMetadata.symbol}
          </span>
        </LineItem>

        {TONIC_HAS_FEE_REBATES &&
          takerFee &&
          truncate(takerFee, pricePrecision) > 0 && (
            <React.Fragment>
              <hr tw="dark:opacity-50" />
              <LineItem>
                <div tw="flex items-center gap-x-1">
                  <span>Rebate (estimate)</span>
                  <Tooltip>
                    All taker fees are rebated at the end of the day.
                  </Tooltip>
                </div>
                <span>
                  -{truncate(takerFee, pricePrecision)}{' '}
                  {quoteTokenMetadata.symbol}
                </span>
              </LineItem>
            </React.Fragment>
          )}
      </section>

      <Button
        type="submit"
        disabled={!formValid}
        tw="w-full border-transparent"
        variant={formValid ? (side === 'Buy' ? 'up' : 'down') : undefined}
      >
        {!formValid ? validationReason : 'Place order'}
      </Button>
    </form>
  );
};

export default OrderForm;
