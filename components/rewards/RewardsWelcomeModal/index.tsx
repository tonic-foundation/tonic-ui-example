import React from 'react';
import { MdClose } from 'react-icons/md';
import tw, { css, styled } from 'twin.macro';
import Button from '~/components/common/Button';
import BaseCDot from '~/components/common/Cdot';
import { LogoIcon } from '~/components/common/Logo';
import Modal from '~/components/common/Modal';
import usePersistentState from '~/hooks/usePersistentState';
import { range } from '~/util';
import UsnIcon from '../UsnIcon';

const Wrapper = tw.div`
  overflow-hidden flex flex-col items-stretch
  w-screen min-h-[65vh] sm:max-w-sm
  bg-gradient-to-tr
  from-teal-400 to-fuchsia-300
  text-black
  relative
`;

const CDot = styled(BaseCDot)(tw`dark:(bg-neutral-900) light:(bg-neutral-900)`);

const animateFall = css`
  animation: fall 3s linear infinite;

  @keyframes fall {
    0% {
      transform: translate(0%, 0%);
      opacity: 0.5;
    }
    100% {
      transform: translate(0%, 40vh);
      opacity: 0;
    }
  }
`;

const Rain: React.FC = (props) => {
  const limit = 16;

  return (
    <div {...props}>
      <div tw="absolute inset-0">
        {range(limit).map((i) => {
          return (
            <div
              key={i}
              style={{ left: `${(i / 8) * 100}%` }}
              // negative top to hide while waiting for animation to start
              tw="absolute -top-20"
              css={[
                animateFall,
                css`
                  animation-delay: ${Math.random() * 6}s;
                `,
              ]}
            >
              <UsnIcon tw="animate-spin w-4 h-4" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const RewardsWelcomeModal = () => {
  const [visible, setVisible] = usePersistentState(
    'usn-rewards-sep-2022-visible',
    true
  );

  return (
    <Modal
      shouldHandleClose={false}
      hasBorder={false}
      drawerOnMobile
      visible={visible}
      onClose={() => setVisible(false)}
      render={({ closeModal }) => {
        return (
          <Wrapper>
            <Rain tw="absolute top-0 bottom-0 left-8 right-8" />
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
                    <CDot />
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
                    <CDot />
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

              <Button
                tw="py-3 dark:(bg-neutral-900 text-white) light:(bg-neutral-900 text-white)"
                onClick={() => {
                  closeModal();
                  window.location.href = '/#/rewards';
                }}
              >
                Learn more
              </Button>
              <a
                onClick={closeModal}
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
