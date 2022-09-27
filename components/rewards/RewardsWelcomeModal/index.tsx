import { useCallback, useEffect, useState } from 'react';
import { MdClose } from 'react-icons/md';
import tw, { styled } from 'twin.macro';
import Button from '~/components/common/Button';
import Shape from '~/components/common/Shape';
import { LogoIcon } from '~/components/common/Logo';
import Modal from '~/components/common/Modal';
import usePersistentState from '~/hooks/usePersistentState';
import { useWalletSelector } from '~/state/WalletSelectorContainer';
import UsnIcon from '../UsnIcon';
import UsnShower from '../UsnShower';

const Wrapper = tw.div`
  overflow-hidden flex flex-col items-stretch
  w-screen min-h-[65vh] sm:max-w-sm
  bg-gradient-to-tr
  from-teal-400 to-fuchsia-300
  text-black
  relative
`;

const Cdot = styled(Shape.Cdot)(
  tw`dark:(bg-neutral-900) light:(bg-neutral-900)`
);

const ConfirmButton = styled(Button)(
  tw`py-3 dark:(bg-neutral-900 text-white) light:(bg-neutral-900 text-white)`
);

export function useRewardsModalVisible() {
  const { isSignedIn } = useWalletSelector();

  const [_visible, _setVisible] = usePersistentState(
    'usn-rewards-sep-2022-visible',
    true
  );
  const [visible, setVisible] = useState(isSignedIn ? !!_visible : true);

  // localstorage is async so must handle transition from undefined -> boolean
  useEffect(() => {
    if (_visible) {
      setVisible(true);
    }
  }, [_visible]);

  // Permanently close the modal if the user has signed in, otherwise no point
  const handleClose = useCallback(() => {
    if (isSignedIn) {
      _setVisible(false);
      setVisible(false);
    } else {
      setVisible(false);
    }
  }, [_setVisible, isSignedIn]);

  return [visible, handleClose, setVisible] as const;
}

export const RewardsWelcomeModal = () => {
  const [visible, handleClose, setVisibleRaw] = useRewardsModalVisible();

  return (
    <Modal
      shouldHandleClose={false}
      hasBorder={false}
      drawerOnMobile
      visible={visible}
      // do the close logic a little different here, because it's conditional on
      // which button gets pressed and some other state
      /* onClose={handleClose} */
      render={() => {
        return (
          <Wrapper>
            <UsnShower count={16} tw="absolute top-0 bottom-0 left-8 right-8" />
            <div tw="relative z-10 flex-grow flex flex-col p-6 items-stretch">
              <div tw="mt-6 flex items-center justify-center gap-6">
                <LogoIcon tw="h-9 w-9" />
                <MdClose />
                <UsnIcon tw="h-10 w-10" />
              </div>
              <h1 tw="mt-6 text-center text-3xl">
                {(50000).toLocaleString()} USN
              </h1>
              <h1 tw="text-center">Liquidity Rewards</h1>
              <h1 tw="text-center">Sept 12&ndash;Sept 30</h1>

              <div tw="flex-grow flex flex-col items-stretch justify-end gap-6 my-12">
                <div tw="flex items-start gap-3">
                  <div tw="pt-2.5">
                    <Cdot />
                  </div>
                  <div>
                    <p tw="text-base font-bold">How to participate</p>
                    <p tw="mt-1.5 text-sm opacity-80">
                      Provide liquidity in the USN/USDC market starting
                      September 12, 2022 to earn rewards paid in USN.
                    </p>
                  </div>
                </div>
                <div tw="flex items-start gap-3">
                  <div tw="pt-2.5">
                    <Cdot />
                  </div>
                  <div>
                    <p tw="text-base font-bold">Eligibility</p>
                    <p tw="mt-1.5 text-sm opacity-80">
                      Participants must hold at least one Tonic Greedy Goblin
                      NFT to earn rewards.
                    </p>
                  </div>
                </div>
              </div>

              <ConfirmButton
                onClick={() => {
                  handleClose();
                  window.location.href = '/#/rewards';
                }}
              >
                Learn more
              </ConfirmButton>
              <a
                // "maybe later": don't hide it permanently
                onClick={() => setVisibleRaw(false)}
                tw="mt-3 underline cursor-pointer opacity-80 hover:opacity-100 text-sm text-center"
              >
                Maybe later
              </a>
            </div>
          </Wrapper>
        );
      }}
    />
  );
};

export default RewardsWelcomeModal;
