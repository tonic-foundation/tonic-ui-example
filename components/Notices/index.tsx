import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from 'recoil';
import tw, { css } from 'twin.macro';
import usePathMatches from '~/hooks/usePathMatches';
import { animation } from '~/styles';
import { range, sleep } from '~/util';
import Card from '../common/Card';
import CloseButton from '../common/CloseButton';
import Icon from '../common/Icon';
import IconButton from '../common/IconButton';
import { LogoIcon } from '../common/Logo';
import Shape from '../common/Shape';
import UsnShower from '../rewards/UsnShower';
import FakeOrderbook from './FakeOrderbook';

const PAGES = [
  // 'usn-usdc-lp',
  'multi-market-lp',
  'zero-fees',
] as const;

const noticesOpenState = atom({
  key: 'notices-open-state',
  default: true,
});

const noticesPageIndexState = atom({
  key: 'notices-page-index-state',
  default: 0,
});

const noticesPageSelector = selector({
  key: 'notices-page-selector',
  get({ get }) {
    const idx = get(noticesPageIndexState);
    return PAGES[idx];
  },
});

// tw animate-pulse but less extreme
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

const styles = {
  hoverNotice: tw`hover:opacity-90 transition`,
};

const UsnUsdcLp: React.FC = (props) => {
  return (
    <div
      tw="
          relative font-mono
          bg-gradient-to-tr
          from-fuchsia-400 to-teal-300
        text-black
          h-full w-full
        "
      {...props}
    >
      <div tw="absolute inset-0 text-black flex flex-col items-center gap-2 justify-center z-10">
        <div tw="px-3 py-1.5 rounded bg-white bg-opacity-80">
          <p tw="text-xl">USN/USDC Incentive</p>
          <div tw="mt-2.5 text-sm flex items-center gap-2">
            <Shape.CdotBase tw="bg-black" /> <span>50k $USN Rewards Pool</span>
          </div>
          <div tw="text-sm flex items-center gap-2">
            <Shape.CdotBase tw="bg-black" />
            <span>Sep 12 - Oct 12 2022</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ZeroFees: React.FC = (props) => {
  return (
    <div
      tw="
          relative font-mono
          bg-gradient-to-tr
          from-fuchsia-400 to-amber-300
        text-black
          h-full w-full
        "
      {...props}
    >
      <div tw="absolute top-1/2 -translate-y-1/2 -left-36 skew-x-[24deg]">
        <LogoIcon tw="w-96 h-96" css={animation.spin(12)} />
      </div>
      <div tw="absolute inset-0 text-black flex flex-col items-center gap-2 justify-center z-10">
        <div tw="px-3 py-1.5 rounded bg-white bg-opacity-80">
          <p tw="text-xl">Zero Trading Fees</p>
          <div tw="mt-2.5 text-sm flex items-center gap-2">
            <Shape.CdotBase tw="bg-black" /> <span>All fees rebated</span>
          </div>
          <div tw="text-sm flex items-center gap-2">
            <Shape.CdotBase tw="bg-black" />
            <span>October 2022</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Slots = {
  Door: tw.div`
    rounded-lg border border-fuchsia-400
    bg-gradient-to-t from-slate-800 to-slate-700
    py-6 px-3
    h-24 overflow-hidden
  `,
  Item: tw.div`h-24`,
};

const RibbonChoices = [
  <Icon.Github key="gh" tw="h-12 w-full" />,
  <Icon.Discord key="dc" tw="h-12 w-full" />,
  <Icon.Telegram key="tg" tw="h-12 w-full" />,
  <Icon.Twitter key="tw" tw="h-12 w-full" />,
  <span key="shitcoin" tw="h-12 w-full">
    💩
  </span>,
];
const Ribbon: React.FC<{ count?: number; animating: boolean }> = ({
  count = 12,
  animating,
  ...props
}) => {
  return (
    <div
      {...props}
      tw="transition transform -translate-y-full duration-[3500ms]"
      css={animating && tw`translate-y-0`}
    >
      <Slots.Item>
        <Icon.Tonic tw="h-12" />
      </Slots.Item>
      {range(count - 1).map((i) => {
        return (
          <Slots.Item key={i} tw="text-white">
            {RibbonChoices[Math.floor(Math.random() * 4)]}
          </Slots.Item>
        );
      })}
    </div>
  );
};

const MultiMarketLp: React.FC = (props) => {
  // TODO: maybe make these only play once per page load (basically add recoil
  // for initial state)
  const [spinning, setSpinning] = useState(false);
  const [winning, setWinning] = useState(false);

  useEffect(() => {
    // start the
    setTimeout(() => setSpinning(true), 500);

    return () => setSpinning(false);
  }, []);

  useEffect(() => {
    // slots take ~5.5s (including max delay) to stop
    // wait additional 0.8s for anticipation
    setTimeout(() => setWinning(true), 5_300);

    return () => setWinning(false);
  }, []);

  return (
    <div
      tw="
          relative font-mono
          bg-gradient-to-t
          from-slate-800 to-slate-700
        text-black
          h-full w-full
        "
      {...props}
    >
      <div
        tw="
          absolute inset-0
          bg-gradient-to-t
          from-fuchsia-600 to-fuchsia-400
          transition duration-500 delay-1000
        "
        css={winning ? tw`opacity-0` : tw`opacity-100`}
      />
      {winning && (
        <UsnShower
          count={18}
          duration={2}
          tw="absolute top-0 bottom-1/2 left-8 right-8"
        />
      )}
      <div tw="relative z-10 h-full w-full flex items-stretch gap-6 px-6">
        <div tw="flex-1 flex flex-col items-center justify-center">
          <Slots.Door
            css={
              winning && tw`transition duration-300 opacity-0 -translate-y-8`
            }
          >
            <Ribbon animating={spinning} />
          </Slots.Door>
        </div>
        <div tw="flex-1 flex flex-col items-center justify-center">
          <Slots.Door
            css={
              winning &&
              tw`transition duration-300 opacity-0 -translate-y-8 delay-200`
            }
          >
            <Ribbon animating={spinning} tw="delay-200" />
          </Slots.Door>
        </div>
        <div tw="flex-1 flex flex-col items-center justify-center">
          <Slots.Door
            css={
              winning &&
              tw`transition duration-300 opacity-0 -translate-y-8 delay-[0.4s]`
            }
          >
            <Ribbon animating={spinning} tw="delay-500" />
          </Slots.Door>
        </div>
      </div>

      {/* this stuff doesn't show until the roulette thing finishes */}
      <div tw="absolute inset-0 z-10">
        <div
          tw="absolute inset-0 pt-12 text-white flex flex-col items-center z-20 transition duration-700 delay-[1.3s]"
          css={
            winning
              ? tw`opacity-100 translate-y-0`
              : tw`opacity-0 -translate-y-8`
          }
        >
          <p tw="text-base">Liquidity Incentive</p>
          <p tw="text-xl">{(100000).toLocaleString()} $USN</p>
          <p
            tw="mt-2.5 text-base px-2 py-0.5 rounded text-white bg-white bg-opacity-20"
            css={animatePulseLess}
          >
            Live now
          </p>
        </div>

        <FakeOrderbook
          tw="transition duration-500 delay-1000"
          css={
            winning
              ? tw`opacity-100 translate-y-0`
              : tw`opacity-0 translate-y-8`
          }
        />
      </div>
    </div>
  );
};

export const NoticeContent = { UsnUsdcLp, ZeroFees, MultiMarketLp } as const;

const Notices: React.FC = ({ ...props }) => {
  const setPageIndex = useSetRecoilState(noticesPageIndexState);
  const currentPage = useRecoilValue(noticesPageSelector);
  const [isOpen, _setOpen] = useRecoilState(noticesOpenState);
  const [exiting, setExiting] = useState(false);

  const onIncentivesPage = usePathMatches('/incentives');

  // we can do this in a nicer way once we have more notices to show...
  useEffect(() => {
    const id = setInterval(() => {
      setPageIndex((i) => {
        return (i + 1) % PAGES.length;
      });
    }, 30_000);

    return () => clearInterval(id);
    // basing it on currentPage resets counter if user clicks if the user
    // manually clicks
  }, [setPageIndex, currentPage]);

  const close = useCallback(async () => {
    setExiting(true);
    await sleep(150);
    _setOpen(false);
    setExiting(false);
  }, [_setOpen]);

  useEffect(() => {
    if (onIncentivesPage) {
      close();
    }
  }, [close, onIncentivesPage]);

  if (!isOpen) {
    return <React.Fragment />;
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
      {currentPage === 'zero-fees' ? (
        <Link to="/incentives" onClick={close}>
          <NoticeContent.ZeroFees css={styles.hoverNotice} />
        </Link>
      ) : (
        <Link to="/incentives" onClick={close}>
          <NoticeContent.MultiMarketLp css={styles.hoverNotice} />
        </Link>
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
        {PAGES.map((p, i) => (
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
              setPageIndex(i);
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
