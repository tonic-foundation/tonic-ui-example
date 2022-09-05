import { useCallback, useEffect, useState } from 'react';

// off-brand useSwr
export function useFetch<T>(
  fetcher: () => Promise<T>,
  initial: T
): readonly [T, boolean, () => Promise<unknown>] {
  const [fetched, setFetched] = useState<T>(initial);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setFetched(await fetcher());
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    load();

    return () => setFetched(initial);
  }, [load]); // making this depend on initial can cause loop

  return [fetched, loading, load] as const;
}
