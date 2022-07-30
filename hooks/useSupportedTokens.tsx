import { useEffect, useState } from 'react';

import { indexer } from '~/services/indexer';
import { atom, useRecoilState } from 'recoil';
import { TokenInfo } from '@tonic-foundation/token-list';
import { ftOrNativeNearMetadata } from '@tonic-foundation/token';
import { nobody } from '~/services/near';
import { NEAR_ENV } from '~/config';

async function idToInfo(id: string): Promise<TokenInfo> {
  const info = await ftOrNativeNearMetadata(nobody, id);
  return {
    address: id,
    logoURI: info.icon || undefined, // XXX bad type
    ...info,
    nearEnv: NEAR_ENV,
  };
}

async function hydrate(ts: { id: string }[]) {
  const allInfos = await Promise.all(ts.map((t) => idToInfo(t.id)));
  allInfos.sort((a) => {
    if (a.address.toLowerCase() === 'near') {
      return -1;
    }
    return 1;
  });
  return allInfos;
}

// TODO: make markets hook match
// TODO: move to ~/state/global
export const supportedTokenInfosState = atom<TokenInfo[]>({
  key: 'global-supported-token-ids-state',
  default: indexer.tokens().then(hydrate),
});
export default function useSupportedTokens(refresh = false) {
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useRecoilState(supportedTokenInfosState);

  useEffect(() => {
    if (refresh) {
      setLoading(true);
      indexer
        .tokens()
        .then(hydrate)
        .then(setTokens)
        .finally(() => setLoading(false));
    }
  }, [refresh, setTokens]);

  return [tokens, loading] as const;
}
