import { tonic } from '~/services/near';
import useHasStorageBalance from './useHasStorageBalance';

/**
 * Check if has account. Flag is undefined if loading.
 */
export default function useHasTonicAccount() {
  return useHasStorageBalance(tonic.contractId);
}
