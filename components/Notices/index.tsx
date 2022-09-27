import React, { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { atom, useRecoilState, useSetRecoilState } from 'recoil';
import tw, { css } from 'twin.macro';
import usePathMatches from '~/hooks/usePathMatches';
import { sleep } from '~/util';
import Card from '../common/Card';
import CloseButton from '../common/CloseButton';
import UsnShower from '../rewards/UsnShower';
import FakeOrderbook from './FakeOrderbook';

const noticesOpenState = atom({
  key: 'notices-open-state',
  default: true,
});

// copypaste of tw animate-pulse but less extreme
const animatePulseLess = css`
  animation: pulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.75;
    }
  }
`;

const UsnRewardsNotice = () => {
  const setNoticesOpen = useSetRecoilState(noticesOpenState);

  return (
    <Link to="/rewards" onClick={() => setNoticesOpen(false)}>
      <div
        tw="
          hover:opacity-90 transition
          relative font-mono
          bg-gradient-to-t
          from-slate-800 to-slate-700
        text-black
          h-full w-full
        "
      >
        <UsnShower count={18} tw="absolute top-0 bottom-1/2 left-8 right-8" />

        <div tw="absolute inset-0 pt-9 text-white flex flex-col items-center z-20">
          <p tw="text-base">Liquidity Incentive</p>
          <p tw="text-xl">{(50000).toLocaleString()} $USN</p>
          <p
            tw="mt-2.5 text-base px-2 py-0.5 rounded bg-white bg-opacity-20"
            css={animatePulseLess}
          >
            Live now
          </p>
        </div>

        <div tw="relative z-10">
          <FakeOrderbook />
        </div>
      </div>
    </Link>
  );
};

const Notices: React.FC = ({ ...props }) => {
  const [tab] = useState<'rewards' | 'rebates'>('rewards');
  const [_open, _setOpen] = useRecoilState(noticesOpenState);
  const [exiting, setExiting] = useState(false);

  const onRewardsPage = usePathMatches('/rewards');

  const isOpen = useMemo(() => {
    if (onRewardsPage) {
      // if on the rewards page, no point showing the notice
      return _open && tab !== 'rewards';
    }
    return _open;
  }, [_open, onRewardsPage, tab]);

  const close = useCallback(async () => {
    setExiting(true);
    await sleep(150);
    _setOpen(false);
    setExiting(false);
  }, [_setOpen]);

  if (!isOpen) {
    return <React.Fragment />; // just don't show it, too hard to make the placement work with our ui
  }

  return (
    <Card
      tw="
        relative h-[200px] w-[300px]
        border-0 shadow-xl
        transition
      "
      css={exiting ? tw`opacity-0` : tw`opacity-100`}
      {...props}
    >
      <UsnRewardsNotice />
      <CloseButton
        tw="
          absolute z-20 top-4 right-4
          text-white
          dark:hover:(bg-white bg-opacity-20)
          light:hover:(bg-white bg-opacity-20)
        "
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          close();
        }}
      />
    </Card>
  );
};

export default Notices;
