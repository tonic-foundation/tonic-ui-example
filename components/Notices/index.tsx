import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from 'recoil';
import tw from 'twin.macro';
import usePathMatches from '~/hooks/usePathMatches';
import { animation } from '~/styles';
import { sleep } from '~/util';
import Card from '../common/Card';
import CloseButton from '../common/CloseButton';
import { LogoIcon } from '../common/Logo';
import Shape from '../common/Shape';

const PAGES = ['zero-fees'] as const;

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

export const NoticeContent = { UsnUsdcLp, ZeroFees } as const;

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
      <Link to="/incentives" onClick={close}>
        <NoticeContent.ZeroFees css={styles.hoverNotice} />
      </Link>

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
