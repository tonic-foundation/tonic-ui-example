import { InjectedWallet, Wallet } from '@near-wallet-selector/core';
import { useMemo } from 'react';
import Button from '../../Button';
import { NearIcon } from '../../NearLogo';
import { useWalletPickerPage } from '../state';

type InjectedWalletMeta = InjectedWallet['metadata'];

/**
 * assert that the metadata is for an injected wallet
 */
function assertExtension(
  meta: Wallet['metadata'],
  type: Wallet['type']
): meta is InjectedWalletMeta {
  return type === 'injected';
}

const WalletInstall: React.FC = (props) => {
  const [page] = useWalletPickerPage();

  if (page.route !== 'wallet-install') {
    throw new Error('page can only be rendered on wallet-install stage');
  }

  const [id, meta] = useMemo(() => {
    return [page.state.id, page.state.metadata] as const;
  }, [page]);

  if (!assertExtension(meta, page.state.type)) {
    // Due to how onWalletNotInstalled is called on the WalletSelect page, we
    // should be guaranteed to not hit this error. The type guard is mostly
    // just so types work out below.
    throw new Error('page has no use when wallet type is not injected');
  }

  return (
    <div tw="p-6 flex-grow flex flex-col items-stretch">
      <h1 tw="mb-3 text-xl">{meta.name}</h1>

      {id === 'near-wallet' ? (
        <NearIcon tw="h-16 w-16 object-cover" />
      ) : (
        <img src={meta.iconUrl} alt={meta.name} tw="h-16 w-16 object-cover" />
      )}

      <p tw="flex-grow mt-6">
        {meta.name} was not detected on your browser. Click below to open their
        installation page.
      </p>

      {/* TODO: cba refactoring the button styles for now */}
      <a href={meta.downloadUrl} target="_blank" rel="noreferrer">
        <Button tw="py-3 w-full" variant="up">
          Continue
        </Button>
      </a>
    </div>
  );
};

export default WalletInstall;
