/**
 * Defines a wrapper which pops up a "create account" modal if signed-in wallet
 * doesn't have a Tonic deposit
 */
import React, { useEffect, useState } from 'react';
import Welcome from '~/components/trade/Welcome';
import Modal from '~/components/common/Modal';
import useHasTonicAccount from '~/hooks/useHasTonicAccount';

const RequireAccount: React.FC = ({ children }) => {
  const [hasAccount, loading] = useHasTonicAccount();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!loading && !hasAccount) {
      setVisible(true);
    }
  }, [loading, hasAccount]);

  return (
    <React.Fragment>
      <Modal
        drawerOnMobile
        visible={visible}
        onClose={() => setVisible(false)}
        shouldHandleClose={false}
        render={({ closeModal }) => <Welcome onClose={closeModal} />}
        disableTransitions
      />
      {children}
    </React.Fragment>
  );
};

export default RequireAccount;
