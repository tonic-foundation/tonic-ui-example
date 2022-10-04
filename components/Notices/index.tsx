import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { atom, useRecoilState, useSetRecoilState } from 'recoil';
import tw, { css } from 'twin.macro';
import { animation } from '~/styles';
import { sleep } from '~/util';
import Card from '../common/Card';
import CloseButton from '../common/CloseButton';
import IconButton from '../common/IconButton';
import { LogoIcon } from '../common/Logo';
import Shape from '../common/Shape';
import UsnShower from '../rewards/UsnShower';
import FakeOrderbook from './FakeOrderbook';

type NoticePage = 'usn-rewards' | 'zero-fees';

const noticesOpenState = atom({
  key: 'notices-open-state',
  default: true,
});

const noticesPageState = atom<NoticePage>({
  key: 'notices-page-state',
  default: 'zero-fees',
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

const ZeroFeesNotice = () => {
  return (
    <a
      href="https://twitter.com/DcntrlBank/status/1576873944333701120"
      target="_blank"
      rel="noreferrer"
    >
      <div
        tw="
          hover:opacity-90 transition
          relative font-mono
          bg-gradient-to-tr
          from-fuchsia-400 to-amber-300
        text-black
          h-full w-full
        "
      >
        <div tw="absolute top-1/2 -translate-y-1/2 -left-36 skew-x-[24deg]">
          <LogoIcon tw="w-96 h-96" css={animation.spin(12)} />
        </div>

        <div tw="absolute inset-0 text-black flex flex-col items-center gap-2 justify-center z-20">
          <div tw="px-3 py-1.5 rounded bg-white bg-opacity-80">
            <p tw="text-xl">Zero Trading Fees</p>
            <p tw="mt-2.5 text-sm flex items-center gap-2">
              <Shape.CdotBase tw="bg-black" /> <span>All fees rebated</span>
            </p>
            <p tw="text-sm flex items-center gap-2">
              <Shape.CdotBase tw="bg-black" />
              <span>October 2022</span>
            </p>
          </div>
        </div>
      </div>
    </a>
  );
};

const PAGES: NoticePage[] = ['zero-fees', 'usn-rewards'];

const Notices: React.FC = ({ ...props }) => {
  const [currentPage, setCurrentPage] = useRecoilState(noticesPageState);
  const [isOpen, _setOpen] = useRecoilState(noticesOpenState);
  const [exiting, setExiting] = useState(false);

  // we can do this in a nicer way once we have more notices to show...
  useEffect(() => {
    const id = setInterval(() => {
      setCurrentPage((p) => {
        if (p === 'zero-fees') {
          return 'usn-rewards';
        } else {
          return 'zero-fees';
        }
      });
    }, 30_000);

    return () => clearInterval(id);
    // basing it on currentPage resets counter if user clicks if the user
    // manually clicks
  }, [setCurrentPage, currentPage]);

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
        border-0 shadow-lg
        transition
      "
      css={exiting ? tw`opacity-0` : tw`opacity-100`}
      {...props}
    >
      {currentPage === 'usn-rewards' ? (
        <UsnRewardsNotice />
      ) : (
        <ZeroFeesNotice />
      )}

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
      <div tw="z-20 absolute bottom-2 right-4 flex items-center gap-1">
        {PAGES.map((p) => (
          <IconButton.Base
            key={p}
            icon={<Shape.Cdot tw="opacity-100" />}
            css={
              currentPage === p &&
              tw`
                animate-pulse
                dark:(bg-white bg-opacity-20)
                light:(bg-white bg-opacity-20)
              `
            }
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentPage(p);
            }}
            tw="
              opacity-100
              dark:hover:(bg-white bg-opacity-20)
              light:hover:(bg-white bg-opacity-20)
            "
          />
        ))}
      </div>
    </Card>
  );
};

export default Notices;
