import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import tw from 'twin.macro';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { OpenLimitOrder } from '@tonic-foundation/tonic';
import {
  cancelAllOrdersV1,
  cancelOrderV1,
} from '@tonic-foundation/tonic/lib/transaction';
import { colors } from '~/styles';
import { TONIC_CONTRACT_ID } from '~/config';
import {
  useMarket,
  useOpenOrders,
  useOrderbook,
  usePairExchangeBalances,
  usePairPrecision,
} from '~/state/trade';
import { wrappedToast } from '~/components/common/ToastWrapper';
import Fallback from '../../common/Fallback';
import IconButton from '../../common/IconButton';
import Button from '../../common/Button';
import { bnToFixed } from '@tonic-foundation/utils';
import { useWalletSelector } from '~/state/WalletSelectorContainer';
import CannedToast from '~/components/common/CannedToast';
import Icon from '~/components/common/Icon';

const styles = {
  row: tw`flex items-center gap-x-0.5 font-mono overflow-hidden`,
};

const CancelButton: React.FC<{ loading: boolean; onCancel: () => unknown }> = ({
  loading,
  onCancel,
}) => {
  return (
    <IconButton.Base
      css={loading && tw`animate-spin`}
      disabled={loading}
      onClick={(e) => {
        e.preventDefault();
        onCancel();
      }}
      icon={loading ? <Icon.LoadingSpin /> : <Icon.Close />}
    />
  );
};

const OpenOrder: React.FC<{
  quantityDecimals: number;
  priceDecimals: number;
  order: OpenLimitOrder;
  onCancel: (orderId: string) => Promise<unknown>;
}> = ({ quantityDecimals, priceDecimals, order, onCancel, ...props }) => {
  const [loading, setLoading] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const { pricePrecision, quantityPrecision } = usePairPrecision();

  const handleCancel = async () => {
    if (!cancelled && !loading) {
      setLoading(true);
      onCancel(order.id)
        .then(() => {
          setCancelled(true);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  return (
    <div css={[styles.row, cancelled && tw`opacity-50`]} {...props}>
      <div
        css={order.side === 'Buy' ? colors.upText : colors.downText}
        tw="w-[11%]"
      >
        {cancelled ? <del>{order.side}</del> : <span>{order.side}</span>}
      </div>
      <p
        css={order.side === 'Buy' ? colors.upText : colors.downText}
        tw="w-[25%]"
      >
        {bnToFixed(order.limitPrice, priceDecimals, pricePrecision)}
      </p>
      <p tw="w-[25%]">
        {bnToFixed(
          order.remainingQuantity,
          quantityDecimals,
          quantityPrecision
        )}
      </p>
      <p tw="w-[25%]">
        {bnToFixed(
          // This is definitely available if the order owner is the one viewing
          order.originalQuantity!.sub(order.remainingQuantity),
          quantityDecimals,
          quantityPrecision
        )}
      </p>
      <div tw="flex items-center justify-end w-[14%]">
        <CancelButton loading={loading} onCancel={handleCancel} />
      </div>
    </div>
  );
};

const Content: React.FC<{
  onCancelOrder: (id: string) => Promise<unknown>;
}> = ({ onCancelOrder }) => {
  const [market] = useMarket();
  const [orders, refreshOrders, ordersLoading] = useOpenOrders();

  useEffect(() => {
    const id = setInterval(refreshOrders, 10_000);
    return () => clearInterval(id);
  }, [refreshOrders]);

  // a bit complicated here: if `orders` is undefined, we have never loaded
  // anything and should show a spinner. we don't want that spinner after
  // the first load though, so there's a bit of extra logic
  if (!orders) {
    return (
      <div tw="flex items-center justify-center p-8">
        {ordersLoading ? <Fallback /> : <p>No open orders</p>}
      </div>
    );
  }
  return (
    <React.Fragment>
      {orders.length ? (
        <div tw="space-y-0.5">
          {orders.map((order) => (
            <OpenOrder
              key={order.id}
              quantityDecimals={market.baseDecimals}
              priceDecimals={market.quoteDecimals}
              order={order}
              onCancel={onCancelOrder}
            />
          ))}
        </div>
      ) : (
        <div tw="flex items-center justify-center p-8">
          <p>No open orders</p>
        </div>
      )}
    </React.Fragment>
  );
};

const TableHeadings: React.FC<{ onCancelAll: () => Promise<unknown> }> = ({
  onCancelAll,
}) => {
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!loading) {
      setLoading(true);
      onCancelAll().finally(() => {
        setLoading(false);
      });
    }
  };

  return (
    <div css={styles.row} tw="font-primary mb-2">
      <span tw="w-[11%]">Side</span>
      <span tw="w-[25%]">Price</span>
      <span tw="w-[25%]">Open</span>
      <span tw="w-[25%]">Filled</span>
      <div tw="h-full relative w-[14%] flex items-stretch justify-center">
        {loading ? (
          <AiOutlineLoading3Quarters tw="animate-spin" />
        ) : (
          <Button
            tw="flex-grow hidden md:inline-block text-sm p-0 whitespace-nowrap"
            onClick={(e) => {
              e.preventDefault();
              handleCancel();
            }}
          >
            Cancel all
          </Button>
        )}
      </div>
    </div>
  );
};

const OpenOrdersTable = () => {
  const { selector } = useWalletSelector();
  const [market] = useMarket();
  const [, refreshOrderbook] = useOrderbook();
  const [, refreshPairBalances] = usePairExchangeBalances();
  const [, refreshOrders] = useOpenOrders();

  useEffect(() => {
    const id = setInterval(refreshOrders, 10_000);
    return () => clearInterval(id);
  }, [refreshOrders]);

  const refresh = useCallback(() => {
    return Promise.all([
      refreshPairBalances(),
      refreshOrderbook(),
      refreshOrders(),
    ]);
  }, [refreshPairBalances, refreshOrderbook, refreshOrders]);

  const handleCancel = useCallback(
    async (orderId: string) => {
      const wallet = await selector.wallet();
      const tx = cancelOrderV1(TONIC_CONTRACT_ID, market.id, orderId);
      const outcome = await wallet.signAndSendTransaction({
        actions: [tx.toWalletSelectorAction()],
      });

      if (outcome) {
        toast.custom(
          wrappedToast(
            <CannedToast.TxGeneric id={outcome.transaction_outcome.id} />
          )
        );
      }

      refresh();
    },
    [market, refresh, selector]
  );

  const handleCancelAll = useCallback(async () => {
    const wallet = await selector.wallet();
    const tx = cancelAllOrdersV1(TONIC_CONTRACT_ID, market.id);
    const outcome = await wallet.signAndSendTransaction({
      actions: [tx.toWalletSelectorAction()],
    });

    if (outcome) {
      toast.custom(
        wrappedToast(
          <CannedToast.TxGeneric id={outcome.transaction_outcome.id} />
        )
      );
    }

    refresh();
  }, [market, refresh, selector]);

  return (
    <React.Fragment>
      <TableHeadings onCancelAll={handleCancelAll} />
      <div tw="flex flex-col overflow-auto">
        <Content onCancelOrder={handleCancel} />
      </div>
    </React.Fragment>
  );
};

export default OpenOrdersTable;
