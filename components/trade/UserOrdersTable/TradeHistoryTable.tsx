import React, { useEffect, useState } from 'react';
import tw from 'twin.macro';

import { Trade } from '@tonic-foundation/data-client';

import Fallback from '~/components/common/Fallback';
import { usePairPrecision } from '~/state/trade';
import { colors } from '~/styles';
import { wallet } from '~/services/near';
import { useMarket } from '~/state/trade';
import { indexer } from '~/services/indexer';

const styles = {
  row: tw`flex items-center gap-x-0.5 font-mono`,
};

const Content = () => {
  const [market] = useMarket();
  const [loading, setLoading] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const { pricePrecision, quantityPrecision } = usePairPrecision();

  useEffect(() => {
    async function hydrate() {
      setLoading(true);
      try {
        if (wallet.isSignedIn()) {
          const history = await indexer.tradeHistory(
            market.id,
            wallet.account().accountId
          );
          setTrades(history);
        }
      } catch (e) {
        console.error('Error getting trade history', e);
      } finally {
        setLoading(false);
      }
    }

    hydrate();

    const id = setInterval(hydrate, 10_000);

    return () => {
      clearInterval(id);
      setTrades([]);
    };
  }, [market]);

  return (
    <React.Fragment>
      {trades.length ? (
        <div tw="space-y-0.5">
          {trades.map((trade) => (
            <p
              key={`${trade.order_id}-${
                trade.quantity
              }-${trade.created_at.getTime()}`}
              css={styles.row}
              tw="font-mono"
            >
              <span
                css={[
                  tw`w-[11%]`,
                  trade.direction === 'Buy' ? colors.upText : colors.downText,
                ]}
              >
                {trade.direction}
              </span>
              <span
                css={[
                  tw`w-[25%]`,
                  trade.direction === 'Buy' ? colors.upText : colors.downText,
                ]}
              >
                {trade.price.toFixed(pricePrecision)}
              </span>
              <span tw="w-[25%]">
                {trade.quantity.toFixed(quantityPrecision)}
              </span>
              <span tw="w-[39%]">{trade.created_at.toLocaleString()}</span>
            </p>
          ))}
        </div>
      ) : loading ? (
        <Fallback tw="my-6" />
      ) : (
        <div tw="flex items-center justify-center p-8">
          <p>No past trades</p>
        </div>
      )}
    </React.Fragment>
  );
};

const TableHeadings = () => {
  return (
    <div css={styles.row} tw="font-primary mb-2">
      <span tw="w-[11%]">Side</span>
      <span tw="w-[25%]">Price</span>
      <span tw="w-[25%]">Quantity</span>
      <span tw="w-[39%]">Time</span>
    </div>
  );
};

const TradeHistoryTable = () => {
  return (
    <React.Fragment>
      <TableHeadings />
      <div tw="flex flex-col overflow-auto">
        <Content />
      </div>
    </React.Fragment>
  );
};

export default TradeHistoryTable;
