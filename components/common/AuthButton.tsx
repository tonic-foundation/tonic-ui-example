import React, { useCallback, useEffect, useState } from 'react';
import { MdLogout } from 'react-icons/md';

import Button from './Button';
import { abbreviateAccountId } from '~/util';
import { useWalletSelector } from '~/contexts/WalletSelectorContext';
import toast from 'react-hot-toast';
import { wrappedToast } from './ToastWrapper';

const LoggedInContent: React.FC<{ accountId: string }> = ({ accountId }) => {
  return (
    <React.Fragment>
      <span>{abbreviateAccountId(accountId, 13, 5)}</span>
      <MdLogout />
    </React.Fragment>
  );
};

const LoggedOutContent = () => {
  return <span>Connect wallet</span>;
};

const AuthButton: React.FC = (props) => {
  const { selector, modal, accountId } = useWalletSelector();
  const [loggedIn, setLoggedIn] = useState(selector.isSignedIn());

  const handleClick = useCallback(async () => {
    if (loggedIn) {
      const wallet = await selector.wallet();
      await wallet.signOut();
      setLoggedIn(false);
      toast.custom(
        wrappedToast(<p>Wallet disconnected.</p>, { variant: 'error' })
      );
    } else {
      modal.show();
    }
  }, [loggedIn, setLoggedIn, modal, selector]);

  useEffect(() => {
    const sub = selector.store.observable.subscribe((s) => {
      if (s.selectedWalletId?.length) {
        setLoggedIn(true);
      }
    });

    return sub.unsubscribe;
  }, []);

  return (
    <Button
      tw="flex items-center justify-center gap-x-1 dark:border-transparent"
      onClick={(e) => {
        e.preventDefault();
        handleClick();
      }}
      variant="down"
      {...props}
    >
      {loggedIn && accountId ? (
        <LoggedInContent accountId={accountId} />
      ) : (
        <LoggedOutContent />
      )}
    </Button>
  );
};

export default AuthButton;
