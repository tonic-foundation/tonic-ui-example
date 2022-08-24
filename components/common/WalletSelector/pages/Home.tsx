import { useCallback } from 'react';
import tw from 'twin.macro';
import { NEAR_HREF } from '~/config';
import Button from '../../Button';
import { LogoIcon } from '../../Logo';
import { NearIcon } from '../../NearLogo';
import { useWalletPickerPage } from '../state';

const CDot = tw.div`h-1.5 w-1.5 dark:(bg-white opacity-50) light:(bg-black opacity-30)`;
const CDots = () => {
  return (
    <div tw="flex items-center gap-3">
      <CDot />
      <CDot />
      <CDot />
    </div>
  );
};

const Home: React.FC = (props) => {
  const [, setPage] = useWalletPickerPage();

  const handleClickContinue = useCallback(() => {
    setPage({
      route: 'wallet-select',
    });
  }, [setPage]);

  return (
    <div tw="flex-grow flex flex-col p-6 items-stretch">
      <div tw="flex items-center justify-center gap-6">
        <NearIcon tw="h-7 w-7" />
        <CDots />
        <LogoIcon tw="h-9 w-9" />
      </div>
      <h1 tw="mt-6 text-center text-xl px-6">
        To use Tonic, you need to connect a NEAR wallet.
      </h1>

      <div tw="flex-grow flex flex-col items-stretch justify-end gap-6 my-12">
        <div tw="flex items-start gap-3">
          <div tw="pt-2.5">
            <CDot />
          </div>
          <div>
            <p tw="text-base font-bold">You control your crypto</p>
            <p tw="mt-1.5 text-xs opacity-80">
              Using a non-custodial wallet enables you to control your crypto
              without having to trust third parties.
            </p>
          </div>
        </div>
        <div tw="flex items-start gap-3">
          <div tw="pt-2.5">
            <CDot />
          </div>
          <div>
            <p tw="text-base font-bold">Transact quickly and cheaply</p>
            <p tw="mt-1.5 text-xs opacity-80">
              One second block times and fast transaction finality, all on NEAR
              L1.
            </p>
          </div>
        </div>
      </div>

      <Button variant="up" tw="py-3" onClick={handleClickContinue}>
        Continue
      </Button>
      <p tw="text-center text-sm mt-3 opacity-80 hover:opacity-100">
        First time using NEAR?{' '}
        <a
          tw="inline underline"
          href={NEAR_HREF}
          target="_blank"
          rel="noreferrer"
        >
          Learn more
        </a>
      </p>
    </div>
  );
};

export default Home;
