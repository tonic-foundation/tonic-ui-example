import { TonicIndexer } from '@tonic-foundation/data-client';
import { TONIC_DATA_API_URL } from '~/config';

export const indexer = new TonicIndexer(TONIC_DATA_API_URL);
