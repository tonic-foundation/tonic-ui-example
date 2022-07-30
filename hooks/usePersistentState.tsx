import { useLocalStorage } from 'react-use';
import { makeStorageKey } from '~/util/storage';

export default function usePersistentState<T>(key: string, initial?: T) {
  const storageKey = makeStorageKey(key);
  return useLocalStorage<T>(storageKey, initial);
}
