import { useCallback, useEffect, useState } from 'react';
import { OpenLimitOrder } from '@tonic-foundation/tonic';

import { sleep } from '~/util';
import { createContainer } from 'unstated-next';

// TODO XXX REMOVE
import { marketIdState } from '../trade';
import { useRecoilValue } from 'recoil';
import { useTonic } from '../tonic-client';

// TODO: initial load?
function useOpenOrdersInternal() {
  const { tonic } = useTonic();
  const marketId = useRecoilValue(marketIdState);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OpenLimitOrder[]>();

  const refreshOpenOrders = useCallback(async () => {
    setLoading(true);
    try {
      const newOrders = await tonic.getOpenOrders(marketId);
      await sleep(2000);
      setOrders(newOrders);
    } finally {
      setLoading(false);
    }
  }, [marketId, setOrders, tonic]);

  useEffect(() => {
    refreshOpenOrders();
  }, [marketId, refreshOpenOrders]);

  return [orders, refreshOpenOrders, loading] as const;
}

export const OpenOrdersContainer = createContainer(useOpenOrdersInternal);

export function useOpenOrders() {
  return OpenOrdersContainer.useContainer();
}
