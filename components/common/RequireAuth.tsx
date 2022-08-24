import React from 'react';
import tw from 'twin.macro';
import { useWalletSelector } from '~/state/WalletSelectorContainer';
import AuthButton from './AuthButton';

const Wrapper = tw.div`
  absolute z-10 inset-0 flex items-center justify-center
`;
const Background = tw.div`absolute h-full w-full inset-0 bg-black opacity-20 dark:opacity-60`;
/**
 * Require a wallet connection; render a "connect wallet" button over the child
 * if not connected. Not reactive, but close enough (updates when React ticks)
 */
const RequireAuth: React.FC = ({ children }) => {
  const { isSignedIn } = useWalletSelector();

  return (
    <React.Fragment>
      {children}
      {!isSignedIn && (
        <Wrapper>
          <Background />
          <AuthButton tw="relative" />
        </Wrapper>
      )}
    </React.Fragment>
  );
};

export default RequireAuth;
