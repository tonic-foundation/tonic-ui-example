import { useTonic } from '~/state/tonic-client';
import useHasStorageBalance from './useHasStorageBalance';

/**
 * Check if has account. Flag is undefined if loading.
 */
export default function useHasTonicAccount() {
  const { tonic } = useTonic();
  return useHasStorageBalance(tonic.contractId);
}
