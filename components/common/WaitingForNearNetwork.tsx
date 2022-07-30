// TODO: refactor into the fallback component
import Fallback from './Fallback';

const WaitingForNearNetwork = () => {
  return (
    <div tw="flex-grow relative">
      <div tw="absolute inset-0 top-16 flex flex-col items-center justify-center gap-6">
        <Fallback tw="text-7xl" />
        <p tw="text-neutral-500 light:text-black">
          Waiting for NEAR network...
        </p>
      </div>
    </div>
  );
};

export default WaitingForNearNetwork;
