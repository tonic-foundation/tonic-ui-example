import * as nearApi from 'near-api-js';
import { Tonic } from '@tonic-foundation/tonic';
import { TONIC_CONTRACT_ID, NEAR_CONFIG } from '~/config';
import BatchWallet from './BatchWallet';
import { Account } from 'near-api-js';

export const near = new nearApi.Near(NEAR_CONFIG);

export const nobody = new Account(near.connection, 'nobody');

export const wallet = new BatchWallet(near, TONIC_CONTRACT_ID);

export const tonic = new Tonic(wallet.account(), TONIC_CONTRACT_ID);
