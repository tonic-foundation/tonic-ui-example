import React, { useCallback, useEffect, useState } from 'react';
import { MdLogout } from 'react-icons/md';

import Button from './Button';
import { abbreviateCryptoString } from '~/util';
import { useWalletSelector } from '~/state/WalletSelectorContainer';
import toast from 'react-hot-toast';
import { wrappedToast } from './ToastWrapper';
import useWalletPickerModal from './WalletSelector/useWalletSelectorModal';

const LoggedInContent: React.FC<{ accountId: string }> = ({ accountId }) => {
  return (
    <React.Fragment>
      <span>{abbreviateCryptoString(accountId, 13, 5)}</span>
      <MdLogout />
    </React.Fragment>
  );
};

const LoggedOutContent = () => {
  return <span>Connect wallet</span>;
};

const AuthButton: React.FC = (props) => {
  const { selector, accountId } = useWalletSelector();
  const [, toggleWalletPicker] = useWalletPickerModal();
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
      toggleWalletPicker(true);
    }
  }, [loggedIn, selector, toggleWalletPicker]);

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
