import { useEffect, useState } from 'react';
import { NEAR_CONFIG } from '~/config';
import { near } from '~/services/near';

const RpcStatus: React.FC = (props) => {
  const rpcUrl = new URL(NEAR_CONFIG.nodeUrl).hostname;
  const [rpcTiming, setRpcTiming] = useState<number>();
  const rpcTimingText = rpcTiming ? `${rpcTiming}ms` : `--`;

  const [status, setStatus] = useState<
    'Operational' | 'Connecting' | 'Degraded'
  >('Connecting');

  useEffect(() => {
    function updateAndTimeRpc() {
      const start = Date.now();
      const timeout = new Promise((_, reject) => setTimeout(reject, 10_000));
      Promise.race([near.connection.provider.status(), timeout])
        .then(() => {
          if (status !== 'Operational') {
            setStatus('Operational');
          }
        })
        .catch(() => {
          setRpcTiming(undefined);
          setStatus('Degraded');
        })
        .finally(() => setRpcTiming(Date.now() - start));
    }

    updateAndTimeRpc();

    const id = setInterval(updateAndTimeRpc, 5_000);

    return () => clearInterval(id);
  }, []);

  return (
    <div tw="flex items-center text-white light:text-black" {...props}>
      <a
        target="_blank"
        rel="noreferrer"
        href="https://nearprotocol.statuspal.io/"
        tw="flex items-center gap-x-1.5 opacity-50 hover:opacity-100 light:hover:underline"
      >
        {status === 'Connecting' ? (
          <span tw="h-2.5 w-2.5 rounded-full bg-slate-400"></span>
        ) : status === 'Operational' ? (
          <span tw="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
        ) : (
          <span tw="h-2.5 w-2.5 rounded-full bg-yellow-500"></span>
        )}
        <span>{status}</span>
      </a>
      <span tw="hidden md:inline ml-1 opacity-50">
        &middot; {rpcUrl} ({rpcTimingText}) &middot; {NEAR_CONFIG.networkId}
      </span>
    </div>
  );
};

export default RpcStatus;
