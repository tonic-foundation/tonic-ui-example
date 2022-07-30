// Defines a wallet capable of batching transactions. Mostly copied from ref.
// https://github.com/ref-finance/ref-ui/blob/239080283a1f3aeaffe290ebbe4747eeb383f021/src/services/SpecialWallet.ts
import { baseDecode } from 'borsh';
import { ConnectedWalletAccount, WalletConnection } from 'near-api-js';
import { Action, createTransaction } from 'near-api-js/lib/transaction';
import { PublicKey } from 'near-api-js/lib/utils';

/**
 * Wallet that can sign transaction with multiple actions.
 */
export default class BatchWallet extends WalletConnection {
  declare _connectedAccount: Account;

  account() {
    if (!this._connectedAccount) {
      this._connectedAccount = new Account(
        this,
        this._near.connection,
        this._authData.accountId
      );
    }

    return this._connectedAccount;
  }

  createTransaction({
    receiverId,
    actions,
    nonceOffset = 1,
  }: {
    receiverId: string;
    actions: Action[];
    nonceOffset?: number;
  }) {
    return this._connectedAccount.createTransaction({
      receiverId,
      actions,
      nonceOffset,
    });
  }
}

/**
 * Account, but can sign transaction with multiple actions.
 */
class Account extends ConnectedWalletAccount {
  async sendTransactionWithActions(receiverId: string, actions: Action[]) {
    return this.signAndSendTransaction(receiverId, actions);
  }

  async createTransaction({
    receiverId,
    actions,
    nonceOffset = 1,
  }: {
    receiverId: string;
    actions: Action[];
    nonceOffset?: number;
  }) {
    const localKey = await this.connection.signer.getPublicKey(
      this.accountId,
      this.connection.networkId
    );
    const accessKey = await this.accessKeyForTransaction(
      receiverId,
      actions,
      localKey
    );
    if (!accessKey) {
      throw new Error(
        `Cannot find matching key for transaction sent to ${receiverId}`
      );
    }

    const block = await this.connection.provider.block({ finality: 'final' });
    const blockHash = baseDecode(block.header.hash);

    const publicKey = PublicKey.from(accessKey.public_key);
    const nonce = accessKey.access_key.nonce + nonceOffset;

    return createTransaction(
      this.accountId,
      publicKey,
      receiverId,
      nonce,
      actions,
      blockHash
    );
  }
}
