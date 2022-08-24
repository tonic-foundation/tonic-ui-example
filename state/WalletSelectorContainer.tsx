// Copied from the react example https://github.com/near/wallet-selector
//
// Mostly the same, but automatically connects the active account and uses
// a custom modal.
//
// TODO: render the modal here
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Account } from 'near-api-js';
import { map, distinctUntilChanged } from 'rxjs';
import { setupWalletSelector } from '@near-wallet-selector/core';
import type { WalletSelector, AccountState } from '@near-wallet-selector/core';
import { setupNearWallet } from '@near-wallet-selector/near-wallet';
import { setupSender } from '@near-wallet-selector/sender';
import { setupNightly } from '@near-wallet-selector/nightly';
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet';

import { IS_DEV } from '~/config';
import { near } from '~/services/near';

declare global {
  interface Window {
    selector: WalletSelector;
  }
}

interface WalletSelectorContextValue {
  selector: WalletSelector;
  accounts: Array<AccountState>;
  accountId: string | null;
  activeAccount: Account | null;
  isSignedIn: boolean;
}

const WalletSelectorContext =
  React.createContext<WalletSelectorContextValue | null>(null);

export const WalletSelectorContextProvider: React.FC = ({ children }) => {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [accounts, setAccounts] = useState<Array<AccountState>>([]);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);

  const init = useCallback(async () => {
    const _selector = await setupWalletSelector({
      network: 'mainnet',
      debug: IS_DEV,
      modules: [
        setupNearWallet(),
        setupMyNearWallet(),
        setupSender(),
        setupNightly(),
      ],
    });

    const state = _selector.store.getState();

    setAccounts(state.accounts);

    window.selector = _selector;

    setSelector(_selector);
  }, []);

  useEffect(() => {
    init().catch((e) => {
      console.error(e);
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

  if (!selector) {
    return null;
  }

  const accountId =
    accounts.find((account) => account.active)?.accountId || null;

  return (
    <WalletSelectorContext.Provider
      value={{
        selector,
        accounts,
        accountId,
        activeAccount,
        isSignedIn: !!activeAccount,
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
