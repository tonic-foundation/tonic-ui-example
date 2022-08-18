// Adapted from the react example https://github.com/near/wallet-selector
//
// Mostly the same, but automatically connects the active account.
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { map, distinctUntilChanged } from 'rxjs';
import { setupWalletSelector } from '@near-wallet-selector/core';
import { setupModal } from '@near-wallet-selector/modal-ui';
import type { WalletSelector, AccountState } from '@near-wallet-selector/core';
import type { WalletSelectorModal } from '@near-wallet-selector/modal-ui';
import { setupNearWallet } from '@near-wallet-selector/near-wallet';
import { setupSender } from '@near-wallet-selector/sender';
import { IS_DEV, TONIC_CONTRACT_ID } from '~/config';
import { Account } from 'near-api-js';
import { near } from '~/services/near';

declare global {
  interface Window {
    selector: WalletSelector;
    modal: WalletSelectorModal;
  }
}

interface WalletSelectorContextValue {
  selector: WalletSelector;
  modal: WalletSelectorModal;
  accounts: Array<AccountState>;
  accountId: string | null;
  activeAccount: Account | null;
}

const WalletSelectorContext =
  React.createContext<WalletSelectorContextValue | null>(null);

export const WalletSelectorContextProvider: React.FC = ({ children }) => {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<WalletSelectorModal | null>(null);
  const [accounts, setAccounts] = useState<Array<AccountState>>([]);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);

  const init = useCallback(async () => {
    const _selector = await setupWalletSelector({
      network: 'mainnet',
      debug: IS_DEV,
      modules: [setupNearWallet(), setupSender()],
    });
    // TODO(renthog): custom modal
    const _modal = setupModal(_selector, { contractId: TONIC_CONTRACT_ID });
    const state = _selector.store.getState();

    setAccounts(state.accounts);

    window.selector = _selector;
    window.modal = _modal;

    setSelector(_selector);
    setModal(_modal);
  }, []);

  useEffect(() => {
    init().catch((err) => {
      alert('Failed to initialise wallet selector');
    });
  }, [init]);

  useEffect(() => {
    if (!selector) {
      return;
    }

    const subscription = selector.store.observable
      .pipe(
        map((state) => state.accounts),
        distinctUntilChanged()
      )
      .subscribe(setAccounts);

    return () => subscription.unsubscribe();
  }, [selector]);

  useEffect(() => {
    console.log(
      `updating active account (accounts changed, ${accounts.map(
        (a) => a.accountId
      )})`
    );

    const activeAccountId = accounts.find(
      (account) => account.active
    )?.accountId;
    if (activeAccountId?.length) {
      setActiveAccount(new Account(near.connection, activeAccountId));
    } else {
      setActiveAccount(null);
    }
  }, [accounts]);

  if (!selector || !modal) {
    return null;
  }

  const accountId =
    accounts.find((account) => account.active)?.accountId || null;

  return (
    <WalletSelectorContext.Provider
      value={{
        selector,
        modal,
        accounts,
        accountId,
        activeAccount,
      }}
    >
      {children}
    </WalletSelectorContext.Provider>
  );
};

export function useWalletSelector() {
  const context = useContext(WalletSelectorContext);

  if (!context) {
    throw new Error(
      'useWalletSelector must be used within a WalletSelectorContextProvider'
    );
  }

  return context;
}
