import 'twin.macro';
import Button from '../Button';
import Logo from '../Logo';
import { useNavigate } from 'react-router';
import { useTonic } from '~/state/TonicClientContainer';

const Welcome: React.FC<{ onClose: () => unknown }> = ({
  onClose,
  ...props
}) => {
  const { tonic } = useTonic();
  const navigate = useNavigate();
  const noThanks = () => {
    navigate('/simple');
  };

  return (
    <div
      tw="p-6 mx-3 sm:(mx-0 w-[400px]) pb-0 text-white light:text-black"
      {...props}
    >
      <Logo tw="text-xl" />

      <p tw="mt-6">An account is required to use advanced trading features.</p>
      <p tw="mt-3">
        Click below to get started. You&apos;ll be prompted for a 0.5 NEAR
        deposit.
      </p>

      <p tw="mt-3 text-down-dark opacity-90">
        A security audit of the core contract is in progress. Use this
        application at your own risk.
      </p>

      <Button
        tw="mt-6 w-full"
        variant="up"
        disabled={false}
        onClick={() =>
          tonic.storageDeposit({
            amount: 0.5,
          })
        }
      >
        Create account
      </Button>

      <p tw="my-3 text-center">
        <button
          tw="dark:(text-neutral-300 hover:text-white) light:(text-neutral-500 hover:text-black)"
          onClick={() => {
            onClose();
            noThanks();
          }}
        >
          No thanks
        </button>
      </p>
    </div>
  );
};

export default Welcome;
