import React, { useEffect, useMemo, useRef } from 'react';
import tw, { css, styled, theme } from 'twin.macro';
import { Chart } from 'chart.js';

import BaseCard from '~/components/common/Card';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/common/Icon';
import AppLayout from '~/layouts/AppLayout';
import { useWalletSelector } from '~/state/WalletSelectorContainer';
import { abbreviateCryptoString, range, truncateToLocaleString } from '~/util';
import {
  UnfinalizedRewardsChartOptions,
  useRewardsEligibility,
  useRewardsHistory,
  useRewardsProgramParameters,
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
import {
  DISCORD_TICKET_SUPPORT_HREF,
  getExplorerUrl,
  GOBLIN_HREF,
} from '~/config';
import Tooltip from '~/components/common/Tooltip';
import usePersistentState from '~/hooks/usePersistentState';
import CloseButton from '~/components/common/CloseButton';
import { TzDate } from '~/util/date';
import UsnShower from '~/components/rewards/UsnShower';

const A: React.FC<{ url: string; icon?: React.ReactNode }> = ({
  url,
  icon,
  children,
  ...props
}) => {
  return (
    <a
      tw="underline inline-flex items-center gap-1"
      href={url}
      target="_blank"
      rel="noreferrer"
      {...props}
    >
      <span>{children}</span>
      {icon}
    </a>
  );
};

// no point making this come from the API because a lot of copy containing dates
// is handwritten anyway
const startEndState = atom<{ start: Date; end: Date }>({
  key: 'rewards-start-end-state',
  default: {
    start: TzDate('2022-09-12'),
    end: TzDate('2022-10-12'),
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
 * entry to show in the modal, set when user clicks a day in the calendar
 */
const rewardDayEntryModalState = atom<RewardDayEntry | null>({
  key: 'rewards-hovered-reward-day-modal-state',
  default: null,
});

const ANNOUNCEMENT_HREF =
  'https://tonicdex.medium.com/announcing-tonics-usn-liquidity-program-d5087a9abeb7';
const SIGNUP_HREF = `https://airtable.com/shrdpa3AXGoDY4W7B`;

const USN_MARKET_ID = 'J5mggeEGCyXVUibvYTe9ydVBrELECRUu23VRk2TwC2is';

const Card = styled(BaseCard)(
  tw`
    p-6 flex-shrink-0
    light:(bg-white border-transparent shadow-lg)
  `
);
const Wrapper = tw.main`flex-grow w-full overflow-auto space-y-6 py-12`;
const Section = tw.section`max-w-xl mx-auto px-3 sm:px-0`;

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

const PulseLoad = {
  Container: tw.div`animate-pulse`,
  Item: styled(BaseCard)(
    tw`light:(border-transparent bg-neutral-900) dark:(bg-neutral-700)`
  ),
};

const LeaderboardChart: React.FC<{ data: UnfinalizedRewardsChartOptions }> = ({
  data,
  ...props
}) => {
  const containerRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const { theme: uiTheme } = useTheme();

  const myBg = useMemo(() => {
    return uiTheme === 'dark' ? theme`colors.up.dark` : theme`colors.up`;
  }, [uiTheme]);

  const othersBg = useMemo(() => {
    return uiTheme === 'dark'
      ? theme`colors.neutral.800`
      : theme`colors.neutral.700`;
  }, [uiTheme]);

  const borderColor = useMemo(() => {
    return uiTheme === 'dark'
      ? theme`colors.neutral.900` // effectively no border
      : theme`colors.white`;
  }, [uiTheme]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const { chartOptions } = data;

    // background colors are [ gold, silver, bronze, green, gray ]
    // you are here ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^
    // note: last element is guaranteed to be other traders' share
    const colors = [
      // colors for first, second, and third rank
      theme`colors.neutral.400`,
      theme`colors.neutral.500`,
      theme`colors.neutral.600`,
    ];
    const backgroundColor = range(chartOptions.data.length).map(() => othersBg);
    // logged in user is always as late as possible, but before "other traders",
    // so this loop sets colors for up to the first three ranks
    for (let i = 0; i < data.myIndex; i++) {
      backgroundColor[i] = colors[i];
    }
    // if current user is in top 3, override their color with emerald
    backgroundColor[data.myIndex] = myBg;

    const chart = new Chart(containerRef.current, {
      options: {
        borderColor,
        plugins: {
          tooltip: {},
        },
      },
      type: 'doughnut',
      data: {
        labels: chartOptions.labels,
        datasets: [
          {
            data: chartOptions.data,
            backgroundColor,
          },
        ],
      },
    });

    chartRef.current = chart;

    // highlight own slice
    chartRef.current.tooltip?.setActiveElements(
      [{ datasetIndex: 0, index: data.myIndex }],
      { x: 0, y: 0 }
    );

    return () => {
      chart.destroy();
      chartRef.current = null;
    };
  }, [borderColor, myBg, othersBg, data]);

  const percentage = data.totalShares
    ? truncateToLocaleString((data.myShare / data.totalShares) * 100, 2)
    : '0';

  return (
    <div tw="relative flex flex-col items-stretch justify-center" {...props}>
      <canvas tw="relative z-10" ref={containerRef}></canvas>
      {/* show the total percentage in the center */}
      <div tw="absolute inset-0 flex items-center justify-center">
        <span tw="text-xl">{percentage}%</span>
      </div>
    </div>
  );
};

const styles = {
  today: (entry: RewardDayEntry) =>
    entry.payout > 0
      ? tw`border-neutral-900 bg-up-dark dark:(border-white) cursor-pointer`
      : tw`border-neutral-900 dark:(bg-neutral-800 border-white)`,
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
              if (!isFutureReward && r.day_payout > 0) {
                setRewardModal(r);
              }
            }}
            tw="
              relative overflow-hidden
              h-12 w-full rounded pt-0.5 pr-1.5
              light:(border border-transparent)
            "
            css={[
              isFutureReward
                ? tw`bg-neutral-100 dark:(bg-black bg-opacity-[15%])`
                : isTodayReward
                ? styles.today(r)
                : r.day_payout > 0
                ? r.raffle
                  ? tw`bg-gradient-to-tr from-fuchsia-400 to-teal-300 light:(text-white border-none) cursor-pointer`
                  : tw`bg-up-dark cursor-pointer`
                : tw`bg-neutral-300 dark:bg-neutral-800`,
              hoveredDayId &&
                (hoveredDayId === r.reward_date.toString()
                  ? tw`opacity-100 light:(border-neutral-300 shadow-md)`
                  : tw`opacity-50`),
            ]}
          >
            {!!r.raffle && (
              <UsnShower
                tw="absolute inset-0 left-0.5 right-0.5"
                iconStyle={tw`w-2 h-2`}
                count={8}
              />
            )}
            <span tw="absolute top-1 right-2">{r.reward_date.getDate()}</span>
            {!!r.raffle && (
              <p tw="absolute bottom-1 left-0 right-0 text-center text-xs">
                WINNER
              </p>
            )}
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
  const { start, end } = useRecoilValue(startEndState);
  const weeks = useMemo(() => eachWeekOfInterval({ start, end }), [start, end]);

  const rewardWeeks = useMemo(() => {
    return weeks.map((weekStart) => {
      return eachDayOfInterval({
        start: weekStart,
        // it includes the end day, of the range, so without this sub you get
        // last day of each week duplicated
        end: subDays(addWeeks(weekStart, 1), 1),
      }).map((d) => {
        // TODO: refactor. This is the same as in the graph
        const r = history.rewards.find((r) => isSameDay(r.reward_date, d));
        if (r) {
          return {
            payout: r.payout,
            day_payout: r.day_payout,
            points: r.points,
            reward_date: r.reward_date,
            paid_in_tx_id: r.paid_in_tx_id,
            raffle: r.raffle,
          } as RewardDayEntry;
        } else {
          return {
            paid_in_tx_id: null,
            day_payout: 0,
            points: 0,
            payout: 0,
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
  const { start, end } = useRecoilValue(startEndState);

  const rewardsWithRunningTotal = useMemo(() => {
    let runningTotal = 0;
    return eachDayOfInterval({ start, end }).map((d) => {
      const r = history.rewards.find((r) => isSameDay(r.reward_date, d));
      if (r) {
        runningTotal += r.day_payout;
        return {
          day_payout: r.day_payout,
          payout: r.payout,
          points: r.points,
          reward_date: r.reward_date,
          runningTotal,
          paid_in_tx_id: r.paid_in_tx_id,
          raffle: r.raffle,
        } as RewardWithRunningTotal;
      } else {
        return {
          paid_in_tx_id: null,
          points: 0,
          day_payout: 0,
          payout: 0,
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
          <p tw="text-sm">{hovered.day_payout.toFixed(3)} USN</p>
          <p tw="text-sm">{hovered.reward_date.toLocaleDateString()}</p>
        </div>
      )}

      {/* TODO: make the hover based on the selected ID, same as in week */}
      {rewardsWithRunningTotal.map((r, i) => {
        // can still show if it's in the future, but it shouldn't be interactive
        const isFutureReward = isFuture(r.reward_date);

        // always at least 1%; this prevents past days from showing a gap in the
        // graph
        const rewardHeight =
          history.total > 0
            ? `${Math.max((r.day_payout / history.total) * 100, 1)}%`
            : '1%';
        const cumulativeHeight =
          history.total > 0
            ? `${Math.max((r.runningTotal / history.total) * 100, 1)}%`
            : '1%';

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
            {isFutureReward ? (
              // it's a future reward: just show the shadow of previous earnings
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
            ) : (
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
  const { error, data } = useUnfinalizedRewards();
  const { data: params } = useRewardsProgramParameters();

  const myEstimatedReward = useMemo(() => {
    if (!params?.rewards_pool) {
      return '0.00';
    } else if (!data?.totalShares) {
      return '0.00';
    } else {
      return truncateToLocaleString(
        (data.myShare / data.totalShares) * params.rewards_pool,
        2
      );
    }
  }, [data, params]);

  if (error) {
    return (
      <Card {...props}>
        <p>Error loading today&apos;s activity.</p>
      </Card>
    );
  }

  return (
    <Card {...props}>
      <h1 tw="text-xl">Today&apos;s rewards pool</h1>
      {!data ? (
        <PulseLoad.Container tw="grid grid-cols-2 gap-6 mt-3 h-40">
          <PulseLoad.Item />
          <PulseLoad.Item />
        </PulseLoad.Container>
      ) : (
        <div tw="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div tw="flex flex-col items-stretch justify-center gap-3">
            <LineItem.Container>
              <LineItem.Left>Rewards pool</LineItem.Left>
              <LineItem.Right>
                {params?.rewards_pool ? (
                  <span>{params.rewards_pool} USN</span>
                ) : (
                  <span tw="inline-flex items-center">
                    &nbsp;
                    <PulseLoad.Item tw="self-stretch w-16 animate-pulse" />
                  </span>
                )}
              </LineItem.Right>
            </LineItem.Container>
            <LineItem.Container>
              <LineItem.Left tw="flex items-center gap-1">
                <span>Your points</span>
                <Tooltip>
                  <div>
                    <LineItem.Container>
                      <LineItem.Left>Earned today</LineItem.Left>
                      <LineItem.Right>
                        {truncateToLocaleString(data.myPointsEarnedToday, 2)}
                      </LineItem.Right>
                    </LineItem.Container>
                    <LineItem.Container>
                      <LineItem.Left>Rollover</LineItem.Left>
                      <LineItem.Right>
                        {truncateToLocaleString(data.myRollover, 2)}
                      </LineItem.Right>
                    </LineItem.Container>
                    <hr tw="my-1 border-black" />
                    <LineItem.Container>
                      <LineItem.Left>Your total</LineItem.Left>
                      <LineItem.Right>
                        {truncateToLocaleString(data.myShare, 2)}
                      </LineItem.Right>
                    </LineItem.Container>
                    <LineItem.Container>
                      <LineItem.Left>All traders</LineItem.Left>
                      <LineItem.Right>
                        {truncateToLocaleString(data.totalShares, 2)}
                      </LineItem.Right>
                    </LineItem.Container>
                    <hr tw="my-1 border-black" />
                    <LineItem.Container>
                      <LineItem.Left>Your share</LineItem.Left>
                      <LineItem.Right>
                        {truncateToLocaleString(
                          (data.myShare / data.totalShares) * 100,
                          2
                        )}
                        %
                      </LineItem.Right>
                    </LineItem.Container>
                  </div>
                </Tooltip>
              </LineItem.Left>
              <LineItem.Right>
                {truncateToLocaleString(data.myShare, 2)}
              </LineItem.Right>
            </LineItem.Container>
            <LineItem.Container tw="light:text-emerald-600 dark:text-up-dark">
              <LineItem.Left>Your share</LineItem.Left>
              <LineItem.Right>{myEstimatedReward} USN</LineItem.Right>
            </LineItem.Container>
            <p tw="text-sm">
              Your share of the rewards is not final until the day ends. It may
              increase or decrease depending on trading activity.
            </p>
          </div>
          <LeaderboardChart data={data} />
        </div>
      )}
    </Card>
  );
};

const AccountRewardsHistory: React.FC = (props) => {
  const { data, error } = useRewardsHistory();

  if (error) {
    return (
      <Card {...props}>
        <p>Error loading your payout history.</p>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card {...props}>
        <PulseLoad.Container tw="flex items-stretch flex-col gap-6">
          <PulseLoad.Item tw="h-40" />
          <PulseLoad.Item tw="h-40" />
        </PulseLoad.Container>
      </Card>
    );
  }

  return (
    <Card {...props}>
      <h1 tw="text-xl">Your payout history</h1>
      <p tw="mt-1.5">Total: {truncateToLocaleString(data.total, 2)} USN</p>
      <RewardsGraph tw="mt-3" history={data} />
      <RewardsCalendar tw="mt-3" history={data} />
    </Card>
  );
};

/** Return a progress bar of total program payouts to date */
const PayoutsToDate: React.FC = (props) => {
  const { data, error } = useRewardsProgramStats();

  if (error) {
    return <p>Error loading program stats.</p>;
  }

  if (!data) {
    return (
      <PulseLoad.Container>
        {/* match the actual bar height */}
        <PulseLoad.Item tw="py-1 text-lg">&nbsp;</PulseLoad.Item>
      </PulseLoad.Container>
    );
  }

  const total = Math.round(parseFloat(data.total_payouts) * 100) / 100;
  const totalStr = total.toLocaleString();
  const width = `${(total / 50_000) * 100}%`;

  if (!total) {
    return <React.Fragment />;
  }

  // hack: including the heading inside the component makes it easier to hide
  // the bar on the first day when there's no data to show yet
  return (
    <React.Fragment>
      <p tw="text-xl">Program payouts to date</p>
      <BaseCard
        tw="
          mt-3.5 relative flex items-center justify-center
          light:(border-transparent bg-neutral-900 text-white)
        "
        {...props}
      >
        {/* the bar itself */}
        <div
          style={{ width }}
          tw="absolute top-0 left-0 bottom-0 h-full bg-up-dark"
        ></div>
        {/* some little usn icons flying around... */}
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
    </React.Fragment>
  );
};

const LineItem = {
  Container: tw.div`flex items-center justify-between`,
  Left: tw.div``,
  Right: tw.div``,
};

// ugly hack, fix this nesting later
// basically there's a double conditional render
// (branch 1: are you authed, branch 2: are you eligible)
// can do this in the content container but would need to refactor the hooks
const RewardsDataIfEligible = () => {
  const { data } = useRewardsEligibility();

  if (!data) return <React.Fragment></React.Fragment>;

  if (!data.eligible) {
    return (
      <Section>
        <Card>
          <p>
            If you hold a <A url={GOBLIN_HREF}>Tonic Greedy Goblin</A>, you can
            sign up for the liquidity rewards program{' '}
            <A url={SIGNUP_HREF}>here</A>.
          </p>
          <p tw="mt-3">
            After signing up, create a support ticket in{' '}
            <A url={DISCORD_TICKET_SUPPORT_HREF} icon={<Icon.Discord />}>
              #ticket-support
            </A>{' '}
            to be whitelisted.
          </p>
        </Card>
      </Section>
    );
  }

  return (
    <Section>
      <AccountRewardsHistory />
    </Section>
  );
};

const CoolModeCard = styled(Card)(
  tw`dark:(bg-gradient-to-tr from-fuchsia-400 to-teal-400)`
);

const Content = () => {
  const { isSignedIn } = useWalletSelector();
  const [rulesVisible, setRulesVisible] = usePersistentState(
    'rewards-rules',
    true
  );

  return (
    <Wrapper>
      <Section>
        {rulesVisible ? (
          <CoolModeCard>
            <header tw="flex items-center justify-between">
              <h1 tw="text-xl">USN/USDC Liquidity Rewards</h1>
              <CloseButton onClick={() => setRulesVisible(false)} />
            </header>
            <div tw="mt-3 space-y-3">
              <p>
                Liquidity provided in the{' '}
                <a tw="underline" href={`/#/advanced/${USN_MARKET_ID}`}>
                  USN/USDC market
                </a>{' '}
                earns points towards USN rewards. Orders placed closer to
                midmarket earn more points.
              </p>
              <p>
                Rewards are paid daily. Your share of rewards is proportional to
                the points you earn each day.
              </p>
              <A url={ANNOUNCEMENT_HREF}>View the announcement</A>
            </div>
          </CoolModeCard>
        ) : (
          <div tw="flex items-center justify-end">
            <button
              tw="text-sm opacity-80 hover:opacity-100"
              onClick={() => setRulesVisible(true)}
            >
              Show rules
            </button>
          </div>
        )}
      </Section>

      <Section>
        <CoolModeCard tw="dark:(from-slate-500 to-fuchsia-400)">
          <PayoutsToDate />
        </CoolModeCard>
      </Section>

      {isSignedIn ? (
        <React.Fragment>
          <Section>
            <AccountRewardsToday />
          </Section>
          <RewardsDataIfEligible />
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

const PayoutTxn: React.FC<{ txId: string | null }> = ({ txId }) => {
  if (txId) {
    return (
      <div tw="flex items-center gap-1.5">
        <span tw="mt-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
        <A url={getExplorerUrl('transaction', txId)}>
          {abbreviateCryptoString(txId, 9, 3)}
        </A>
      </div>
    );
  } else {
    return (
      <div tw="flex items-center gap-1.5">
        <span tw="mt-0.5 h-2.5 w-2.5 rounded-full bg-yellow-500"></span>
        <span>Pending</span>
      </div>
    );
  }
};

/**
 * Modal for a single reward
 */
const RewardModal = () => {
  const [selected, setSelected] = useRecoilState(rewardDayEntryModalState);

  return (
    <Modal
      hasBorder={false}
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
            <ModalBody tw="w-screen md:max-w-xs space-y-6">
              <div tw="space-y-1">
                <LineItem.Container>
                  <LineItem.Left>Points earned</LineItem.Left>
                  <LineItem.Right>
                    {truncateToLocaleString(selected.points, 2)}
                  </LineItem.Right>
                </LineItem.Container>
                <LineItem.Container>
                  <LineItem.Left>Liquidity rewards</LineItem.Left>
                  <LineItem.Right>{selected.payout} USN</LineItem.Right>
                </LineItem.Container>
                <LineItem.Container>
                  <LineItem.Left>Transaction</LineItem.Left>
                  <LineItem.Right>
                    <PayoutTxn txId={selected.paid_in_tx_id} />
                  </LineItem.Right>
                </LineItem.Container>
              </div>
              {selected.raffle && (
                <div tw="space-y-1">
                  <LineItem.Container>
                    <LineItem.Left>Raffle winnings</LineItem.Left>
                    <LineItem.Right>
                      {selected.raffle.payout} USN
                    </LineItem.Right>
                  </LineItem.Container>
                  <LineItem.Container>
                    <LineItem.Left>Transaction</LineItem.Left>
                    <LineItem.Right>
                      <PayoutTxn txId={selected.raffle.paid_in_tx_id} />
                    </LineItem.Right>
                  </LineItem.Container>
                </div>
              )}
              <Button onClick={closeModal} variant="up">
                Close
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
          light:(bg-gradient-to-t from-fuchsia-400 to-teal-400)
        "
      >
        <Content />
        <RewardModal />
      </AppLayout>
    </ErrorBoundary>
  );
};

export default Page;
