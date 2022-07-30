const STORAGE_PREFIX = '__tonic-ui';

/**
 * Used for localstorage.
 */
export function makeStorageKey(name: string) {
  return `${STORAGE_PREFIX}_${name}`;
}
