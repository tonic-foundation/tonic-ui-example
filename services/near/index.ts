import { Transaction as WalletTransaction } from '@near-wallet-selector/core';
import * as nearApi from 'near-api-js';
import { NEAR_CONFIG } from '~/config';
import { Account } from 'near-api-js';

export const near = new nearApi.Near(NEAR_CONFIG);

export const nobody = new Account(near.connection, 'nobody');

export type ImplicitSignerTransaction = Omit<WalletTransaction, 'signerId'>;
