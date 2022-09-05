// TODO: finish the hover/click for today
// TODO: finish the hover/click for previous days
// TODO: don't show rewards if the user isn't eligible (maybe just don't show them the rewards page at all, or pop a modal saying they're not eligible this time but to pay attention for the news)
import React, { useEffect, useMemo, useRef } from 'react';
import tw, { css, styled, theme } from 'twin.macro';
import { Chart } from 'chart.js';

import BaseCard from '~/components/common/Card';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/common/Icons';
import AppLayout from '~/layouts/AppLayout';
import { useWalletSelector } from '~/state/WalletSelectorContainer';
import { range } from '~/util';
import {
  useRewardsHistory,
  useRewardsProgramStats,
  useUnfinalizedRewards,
} from './helper';
import { RewardDayEntry, RewardsHistory } from './shim';
import {
  addWeeks,
  eachDayOfInterval,
  isFuture,
  isSameDay,
  isToday,
  isWithinInterval,
  subDays,
} from 'date-fns';
import UsnIcon from '~/components/rewards/UsnIcon';
import { eachWeekOfInterval } from 'date-fns/esm';
import {
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from 'recoil';
import Modal, { ModalBody, ModalHeader } from '~/components/common/Modal';
import Button from '~/components/common/Button';
import AuthButton from '~/components/common/AuthButton';
import useTheme from '~/hooks/useTheme';

const startEndState = atom<{ start: Date; end: Date }>({
  key: 'rewards-start-end-state',
  default: {
    start: new Date('2022-08-01'),
    end: new Date('2022-09-12'),
  },
});

const hoveredRewardDayState = atom<RewardDayEntry | null>({
  key: 'rewards-hovered-reward-day-state',
  default: null,
});

const hoveredRewardDayIdSelector = selector({
  key: 'rewards-hovered-reward-day-id-state',
  get: ({ get }) => {
    const day = get(hoveredRewardDayState);
    if (day) {
      return day.reward_date.toString();
    }
    return null;
  },
});

/**
 * entry to show in a modal
 */
const rewardDayEntryModalState = atom<RewardDayEntry | null>({
  key: 'rewards-hovered-reward-day-modal-state',
  default: null,
});

const ANNOUNCEMENT_HREF =
  'https://tonicdex.medium.com/announcing-tonics-usn-liquidity-program-d5087a9abeb7';

const USN_MARKET_ID = 'J5mggeEGCyXVUibvYTe9ydVBrELECRUu23VRk2TwC2is';

const Card = styled(BaseCard)(
  tw`
    p-6 flex-shrink-0
    light:(bg-white border-transparent shadow-lg)
  `
);
const Wrapper = tw.main`flex-grow w-full overflow-auto space-y-6 py-12`;
const Section = tw.section`max-w-lg mx-auto px-3 sm:px-0`;

const animateBubbleInfinite = css`
  animation: bubble 20s linear infinite;

  @keyframes bubble {
    0%,
    100% {
      transform: translate(0%, 100%);
      opacity: 1;
    }
    50% {
      transform: translate(0, -800%);
      opacity: 0;
    }
  }
`;

const animateSpinSlow = css`
  animation: spin 3s linear infinite;
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const YourCutChart: React.FC<{ percentage: number }> = ({
  percentage,
  ...props
}) => {
  const containerRef = useRef<HTMLCanvasElement>(null);
  const { theme: uiTheme } = useTheme();

  const myBg = useMemo(() => {
    return uiTheme === 'dark' ? theme`colors.up.dark` : theme`colors.up`;
  }, [uiTheme]);

  const othersBg = useMemo(() => {
    return uiTheme === 'dark'
      ? theme`colors.neutral.800`
      : theme`colors.neutral.300`;
  }, [uiTheme]);

  const borderColor = useMemo(() => {
    return uiTheme === 'dark'
      ? theme`colors.neutral.900` // effectively no border
      : theme`colors.neutral.300`;
  }, [uiTheme]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const data = percentage > 0 ? [percentage, 100 - percentage] : [100];
    const labels =
      percentage > 0 ? ['Your share', 'Other traders'] : ['Other traders'];
    const backgroundColor = percentage > 0 ? [myBg, othersBg] : [othersBg];
    const chart = new Chart(containerRef.current, {
      options: {
        borderColor,
      },
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor,
          },
        ],
      },
    });

    return () => chart.destroy();
  }, [borderColor, myBg, othersBg, percentage]);

  return (
    <div tw="relative flex flex-col items-stretch justify-center" {...props}>
      <canvas tw="relative z-10" ref={containerRef}></canvas>
      {/* show the total percentage in the center */}
      <div tw="absolute inset-0 flex items-center justify-center">
        <span tw="text-xl">{percentage.toFixed()}%</span>
      </div>
    </div>
  );
};

const Week: React.FC<{
  entries: RewardDayEntry[];
}> = ({ entries }) => {
  const hoveredDayId = useRecoilValue(hoveredRewardDayIdSelector);
  const setHovered = useSetRecoilState(hoveredRewardDayState);
  const setRewardModal = useSetRecoilState(rewardDayEntryModalState);
  const { start, end } = useRecoilValue(startEndState);

  return (
    <React.Fragment>
      {entries.map((r) => {
        const isEligibleDate = isWithinInterval(r.reward_date, {
          start,
          end,
        });

        if (!isEligibleDate) {
          return <span key={r.reward_date.toString()}></span>;
        }

        const isFutureReward = isFuture(r.reward_date);
        const isTodayReward = isToday(r.reward_date);

        return (
          <div
            key={r.reward_date.toString()}
            onMouseEnter={() => {
              // TODO: refactor this, can go in hook
              if (!isFutureReward) {
                setHovered(r);
              } else {
                setHovered(null);
              }
            }}
            onClick={(e) => {
              e.preventDefault();
              if (!isFutureReward && r.reward > 0) {
                setRewardModal(r);
              }
            }}
            tw="
              h-12 w-full rounded flex items-start justify-end pt-0.5 pr-1.5
              border border-transparent
            "
            css={[
              isFutureReward
                ? tw`bg-neutral-100 dark:(bg-black bg-opacity-[15%])`
                : isTodayReward
                ? tw`border-neutral-900 dark:(bg-neutral-800 border-white)`
                : r.reward > 0
                ? tw`bg-up-dark cursor-pointer` // clickable
                : tw`bg-neutral-300 dark:bg-neutral-800`,
              hoveredDayId &&
                (hoveredDayId === r.reward_date.toString()
                  ? tw`opacity-100 light:(border-neutral-300 shadow-md)`
                  : tw`opacity-50`),
            ]}
          >
            <span tw="cursor-default">{r.reward_date.getDate()}</span>
          </div>
        );
      })}
    </React.Fragment>
  );
};

const RewardsCalendar: React.FC<{
  history: RewardsHistory;
}> = ({ history, ...props }) => {
  const [, setHovered] = useRecoilState(hoveredRewardDayState);
  // XXX: pretty sure there's a timezone bug here, might be assuming UTC date
  // because in pacific time the range starts from the day before
  // TODO: API!
  const { start, end } = useRecoilValue(startEndState);
  const weeks = useMemo(() => eachWeekOfInterval({ start, end }), [start, end]);

  const rewardWeeks = useMemo(() => {
    // const maxReward = Math.max(...history.rewards.map((r) => r.reward));

    return weeks.map((weekStart) => {
      return eachDayOfInterval({
        start: weekStart,
        end: subDays(addWeeks(weekStart, 1), 1), // some shit with timezones maybe idk
      }).map((d) => {
        // TODO: refactor to atom?
        const r = history.rewards.find((r) =>
          isSameDay(new Date(r.reward_date), d)
        );
        if (r) {
          return {
            reward: r.reward,
            reward_date: r.reward_date,
            paid_in_tx_id: r.paid_in_tx_id,
          } as RewardDayEntry;
        } else {
          return {
            paid_in_tx_id: null,
            reward: 0,
            reward_date: d,
          } as RewardDayEntry;
        }
      });
    });
  }, [history, weeks]);

  return (
    <div
      tw="grid grid-cols-7 gap-1.5"
      onMouseLeave={() => setHovered(null)}
      {...props}
    >
      {rewardWeeks.map((weekEntries, i) => {
        return <Week key={i} entries={weekEntries} />;
      })}
    </div>
  );
};

type RewardWithRunningTotal = RewardDayEntry & {
  /**
   * cumulative rewards up to this reward date
   */
  runningTotal: number;
};

const RewardsGraph: React.FC<{
  history: RewardsHistory;
}> = ({ history, ...props }) => {
  const [hovered, setHovered] = useRecoilState(hoveredRewardDayState);

  // XXX: pretty sure there's a timezone bug here, might be assuming UTC date
  // because in pacific time the range starts from the day before
  const { start, end } = useRecoilValue(startEndState);

  const rewardsWithRunningTotal = useMemo(() => {
    // const maxReward = Math.max(...history.rewards.map((r) => r.reward));
    let runningTotal = 0;
    return eachDayOfInterval({ start, end }).map((d) => {
      const r = history.rewards.find((r) =>
        isSameDay(new Date(r.reward_date), d)
      );
      if (r) {
        runningTotal += r.reward;
        return {
          reward: r.reward,
          reward_date: r.reward_date,
          runningTotal,
          paid_in_tx_id: r.paid_in_tx_id,
        } as RewardWithRunningTotal;
      } else {
        return {
          paid_in_tx_id: null,
          reward: 0,
          reward_date: d,
          runningTotal,
        } as RewardWithRunningTotal;
      }
    });
  }, [history, end, start]);

  return (
    <div
      tw="
        flex items-stretch h-40 relative
        light:(border-b border-neutral-200)
      "
      onMouseLeave={() => setHovered(null)}
      {...props}
    >
      {hovered && (
        <div tw="absolute z-10 top-1.5 left-0 p-2 rounded light:(bg-white shadow)">
          <p tw="text-sm">{hovered.reward.toFixed(3)} USN</p>
          <p tw="text-sm">{hovered.reward_date.toLocaleDateString()}</p>
        </div>
      )}

      {/* TODO: make the hover based on the selected ID, same as in week */}
      {rewardsWithRunningTotal.map((r, i) => {
        // can still show if it's in the future, but it shouldn't be interactive
        const isFutureReward = isFuture(r.reward_date);

        // always at least 1%
        const rewardHeight =
          history.total > 0
            ? `${Math.max((r.reward / history.total) * 100, 1)}%`
            : '1%';
        const cumulativeHeight =
          history.total > 0
            ? `${Math.max((r.runningTotal / history.total) * 100, 1)}%`
            : '1%';

        // this is really messy with the futureReward stuff but whatever
        return (
          <div
            key={i}
            onMouseEnter={() => {
              if (!isFutureReward) {
                setHovered(r);
              } else {
                setHovered(null);
              }
            }}
            css={[
              tw`flex-grow relative`,
              !isFutureReward &&
                tw`
                light:hover:bg-neutral-100
                dark:hover:bg-neutral-700
              `,
            ]}
          >
            {!isFutureReward && (
              <React.Fragment>
                <div
                  tw="absolute w-full bottom-0 left-0 right-0 bg-up-dark opacity-30"
                  style={{ height: cumulativeHeight }}
                ></div>
                <div
                  tw="absolute w-full bottom-0 left-0 right-0 bg-up-dark"
                  style={{ height: rewardHeight }}
                ></div>
              </React.Fragment>
            )}
          </div>
        );
      })}
    </div>
  );
};

const AccountRewardsToday: React.FC = (props) => {
  return (
    <Card tw="light:bg-white" {...props}>
      <h1 tw="text-xl">Your activity today</h1>
      <AccountUnfinalizedRewards tw="mt-3" />
    </Card>
  );
};

const AccountRewardsHistory: React.FC = (props) => {
  const [rewardsHistory, historyLoading] = useRewardsHistory();

  return (
    <Card tw="light:bg-white" {...props}>
      <h1 tw="text-xl">Your payout history</h1>
      <p tw="mt-1.5">Total: {rewardsHistory.total} USN</p>
      {!historyLoading && <RewardsGraph tw="mt-3" history={rewardsHistory} />}
      {!historyLoading && (
        <RewardsCalendar tw="mt-3" history={rewardsHistory} />
      )}
    </Card>
  );
};

const PayoutsToDate: React.FC = (props) => {
  const [stats, statsLoading] = useRewardsProgramStats();

  // idc
  const total = Math.round(parseFloat(stats.total_rewards) * 100) / 100;
  const totalStr = statsLoading ? '--' : total.toLocaleString();
  const width = `${(total / 50_000) * 100}%`;
  return (
    <BaseCard
      tw="
          mt-1.5 relative flex items-center justify-center
          light:(border-transparent bg-neutral-900 text-white)
        "
      {...props}
    >
      {/* the bar itself */}
      <div
        style={{ width }}
        tw="absolute top-0 left-0 bottom-0 h-full bg-up-dark"
      ></div>
      {/* some fun little things flying around... */}
      <div
        css={animateBubbleInfinite}
        tw="rotate-45 absolute inset-0 w-full h-full grid grid-cols-7 gap-8 px-12"
      >
        {range(48).map((i) => (
          <React.Fragment key={i}>
            <span></span>
            <UsnIcon tw="block h-4 w-4 opacity-70" css={animateSpinSlow} />
          </React.Fragment>
        ))}
      </div>
      <p tw="text-lg py-1 relative">
        {totalStr} / {(50000.0).toLocaleString()} USN
      </p>
    </BaseCard>
  );
};

const LineItem = {
  Container: tw.div`flex items-center justify-between`,
  Left: tw.p``,
  Right: tw.p``,
};

const AccountUnfinalizedRewards: React.FC = (props) => {
  const [unfinalized, unfinalizedLoading] = useUnfinalizedRewards();
  const mine = Math.round(unfinalized.account_unfinalized * 100) / 100;

  if (unfinalizedLoading) {
    return (
      <div
        // pt is a hack to make the spacing look right when loading
        tw="
        grid grid-cols-2 gap-6 pt-3
          animate-pulse
          h-40
        "
        {...props}
      >
        <BaseCard tw="light:(border-transparent bg-neutral-900) dark:(bg-neutral-700)" />
        <BaseCard tw="light:(border-transparent bg-neutral-900) dark:(bg-neutral-700)" />
      </div>
    );
  }

  return (
    <div tw="grid grid-cols-1 sm:grid-cols-2 gap-6" {...props}>
      <div tw="flex flex-col items-stretch justify-center gap-3">
        <LineItem.Container>
          <LineItem.Left>Maker rebates</LineItem.Left>
          <LineItem.Right>todo</LineItem.Right>
        </LineItem.Container>
        <LineItem.Container>
          <LineItem.Left>Multiplier</LineItem.Left>
          <LineItem.Right>todo</LineItem.Right>
        </LineItem.Container>
        <LineItem.Container>
          <LineItem.Left>Rewards available</LineItem.Left>
          <LineItem.Right>Jones</LineItem.Right>
        </LineItem.Container>
        <hr tw="light:border-black" />
        <LineItem.Container>
          <LineItem.Left>Your rewards&dagger;</LineItem.Left>
          <LineItem.Right>Jones</LineItem.Right>
        </LineItem.Container>

        <p tw="text-xs">
          &dagger; Your reward for today are estimated based on the percentage
          of total maker rebates that you earned today and is not final. It may
          decrease if you stop trading.
        </p>
      </div>
      <YourCutChart percentage={mine} />
    </div>
  );
};

const Content = () => {
  const { isSignedIn } = useWalletSelector();

  return (
    <Wrapper>
      <Section>
        <Card tw="dark:(bg-gradient-to-tr from-fuchsia-400 to-teal-400)">
          <header tw="flex items-center justify-between">
            <h1 tw="text-xl">USN/USDC Liquidity Rewards</h1>
          </header>
          <div tw="mt-3 space-y-3">
            <p>
              Provide liquidity in the{' '}
              <a tw="underline" href={`/#/advanced/${USN_MARKET_ID}`}>
                USN/USDC market
              </a>{' '}
              starting September 12, 2022 to earn USN rewards.
            </p>
            <p>
              Rewards are paid daily in USN based on the formula in the
              <a
                href={ANNOUNCEMENT_HREF}
                target="_blank"
                tw="underline inline-flex items-center gap-0.5"
                rel="noreferrer"
              >
                <span>announcement post</span>
                <Icon.Link tw="text-base" />
              </a>
            </p>
          </div>
          <p tw="mt-6 text-xl">Program payouts to date</p>
          <PayoutsToDate tw="mt-3" />
        </Card>
      </Section>

      {isSignedIn ? (
        <React.Fragment>
          <Section>
            <AccountRewardsToday />
          </Section>
          <Section>
            <AccountRewardsHistory />
          </Section>
        </React.Fragment>
      ) : (
        <Section>
          <Card>
            <p tw="text-center">
              Connect your wallet to start earning rewards.
            </p>
            <div tw="mt-6">
              <AuthButton tw="mx-auto" />
            </div>
          </Card>
        </Section>
      )}
    </Wrapper>
  );
};

/**
 * Modal for a single reward
 */
const RewardModal = () => {
  const [selected, setSelected] = useRecoilState(rewardDayEntryModalState);

  return (
    <Modal
      drawerOnMobile
      onClose={() => setSelected(null)}
      visible={!!selected}
      render={({ closeModal }) => {
        if (!selected) {
          // can't happen
          return;
        }
        return (
          <React.Fragment>
            <ModalHeader>
              <h1 tw="text-lg">
                Rewards on {selected.reward_date.toLocaleDateString()}
              </h1>
            </ModalHeader>
            <ModalBody tw="w-screen md:max-w-sm">
              <p>
                Tonic Swap allows you to trade on Tonic without creating an
                account.
              </p>
              <p tw="mt-3">
                Enjoy low slippage and low fees with the ease of use of a
                traditional DEX.
              </p>
              <Button tw="mt-3" onClick={closeModal} variant="up">
                Got it!
              </Button>
            </ModalBody>
          </React.Fragment>
        );
      }}
    />
  );
};

const Page = () => {
  return (
    <ErrorBoundary fallbackLabel="There was an error loading rewards.">
      {/* Allow flowing off the screen on this page. Looks better this way.  */}
      <AppLayout
        hasFooter={false}
        tw="
          min-h-screen h-full md:(min-h-screen h-full)
          light:(bg-gradient-to-t from-fuchsia-300 to-teal-400)
        "
      >
        <Content />
        <RewardModal />
      </AppLayout>
    </ErrorBoundary>
  );
};

export default Page;
