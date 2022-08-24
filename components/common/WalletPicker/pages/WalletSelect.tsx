// A lot of logic copied from the react example
// https://github.com/near/wallet-selector/blob/5da151430372d4e4b0edf56feed407a71fabce5f/packages/modal-ui/src/lib/components/WalletOptions.tsx
import React, { useEffect, useState } from 'react';
import tw from 'twin.macro';

import type {
  WalletSelector,
  ModuleState,
  Wallet,
} from '@near-wallet-selector/core';
import { ModalOptions } from '@near-wallet-selector/modal-ui';

import { searchStyles } from '../../search';
import WalletIcon from '../components/WalletIcon';

interface WalletOptionsProps {
  selector: WalletSelector;
  options: ModalOptions;
  onWalletNotInstalled: (module: ModuleState) => void;
  //   onConnectHardwareWallet: () => void;
  onConnected: () => void;
  onConnecting: (wallet: Wallet) => void;
  onError: (error: Error) => void;
}

const WalletSelect: React.FC<WalletOptionsProps> = ({
  selector,
  options,
  onWalletNotInstalled,
  onError,
  //   onConnectHardwareWallet,
  onConnecting,
  onConnected,
}) => {
  // <COPYPASTE>
  const [modules, setModules] = useState<Array<ModuleState>>([]);

  useEffect(() => {
    const subscription = selector.store.observable.subscribe((state) => {
      state.modules.sort((current, next) => {
        if (current.metadata.deprecated === next.metadata.deprecated) {
          return 0;
        }

        return current.metadata.deprecated ? 1 : -1;
      });
      setModules(state.modules);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleWalletClick = (module: ModuleState) => async () => {
    try {
      const { deprecated, available } = module.metadata;

      if (module.type === 'injected' && !available) {
        return onWalletNotInstalled(module);
      }

      if (deprecated) {
        return onError(
          new Error(
            `${module.metadata.name} is deprecated. Please select another wallet.`
          )
        );
      }

      const wallet = await module.wallet();
      onConnecting(wallet);

      // TODO: hardware wallet support
      if (wallet.type === 'hardware') {
        onError(new Error('Hardware wallet support not implemented'));
        return;
        // return onConnectHardwareWallet();
      }

      await wallet.signIn({
        contractId: options.contractId,
        methodNames: options.methodNames,
      });

      onConnected();
    } catch (err) {
      const { name } = module.metadata;

      const message =
        err instanceof Error ? err.message : 'Something went wrong';

      onError(new Error(`Failed to sign in with ${name}: ${message}`));
    }
  };
  // </COPYPASTE>

  return (
    <div tw="flex-grow overflow-hidden p-6">
      <h1 tw="text-xl">Select your wallet</h1>
      <ul tw="py-6 flex flex-col items-stretch overflow-hidden">
        {/* <COPYPASTE> (restyled) */}
        {modules.reduce<Array<JSX.Element>>((result, module) => {
          // TODO: just make this be a component wtf
          const { selectedWalletId } = selector.store.getState();
          const { name, description, iconUrl, deprecated } = module.metadata;
          const selected = module.id === selectedWalletId;

          result.push(
            <li
              key={module.id}
              id={module.id}
              onClick={selected ? undefined : handleWalletClick(module)}
            >
              <div
                title={description || ''}
                tw="flex items-center justify-between cursor-pointer"
                css={searchStyles.result}
              >
                <div tw="flex items-center gap-3">
                  <WalletIcon
                    iconUrl={iconUrl}
                    alt={name}
                    walletId={module.id}
                    tw="h-8 w-8"
                  />
                  <div>
                    <p
                      css={[
                        selected && tw`dark:text-up-dark light:underline`,
                        deprecated && tw`text-down-dark`,
                      ]}
                    >
                      {name}
                      {selected && ' (Connected)'}
                    </p>
                    <p tw="text-sm opacity-80">
                      {module.type === 'browser'
                        ? 'Web'
                        : module.type === 'injected'
                        ? 'Extension'
                        : ''}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          );

          return result;
        }, [])}
        {/* </COPYPASTE> */}
      </ul>
    </div>
  );
};

export default WalletSelect;
