import React, { useCallback, useState } from 'react';
import { MdLogout } from 'react-icons/md';

import Button from './Button';
import { TONIC_CONTRACT_ID } from '~/config';
import { wallet } from '~/services/near';
import { abbreviateAccountId } from '~/util';

const LoggedInContent = () => {
  const account = wallet.account();
  return (
    <React.Fragment>
      <span>{abbreviateAccountId(account.accountId, 13, 5)}</span>
      <MdLogout />
    </React.Fragment>
  );
};

const LoggedOutContent = () => {
  return <span>Connect wallet</span>;
};

const AuthButton: React.FC = (props) => {
  const [loggedIn, setLoggedIn] = useState(wallet.isSignedIn());

  const handleClick = useCallback(() => {
    if (loggedIn) {
      wallet.signOut();
      setLoggedIn(false);
      window.location.reload();
    } else {
      wallet.requestSignIn(TONIC_CONTRACT_ID);
    }
  }, [loggedIn, setLoggedIn]);

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
      {loggedIn ? <LoggedInContent /> : <LoggedOutContent />}
    </Button>
  );
};

export default AuthButton;
