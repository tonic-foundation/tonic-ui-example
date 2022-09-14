import { useCallback } from 'react';
import useSWR from 'swr';
import { TONIC_DATA_API_URL } from '~/config';
import { useWalletSelector } from '~/state/WalletSelectorContainer';
import { abbreviateCryptoString } from '~/util';
import { TzDate } from '~/util/date';
import {
  RewardsHistory,
  RewardsParameters,
  TotalRewardsStats,
  UnfinalizedReward,
} from './shim';

function useAccountId() {
  const { accountId } = useWalletSelector();

  return accountId;
}

// could've actually used some sort of forceType utility type but this is easier
function forceFloat<T = number>(s: T) {
  return parseFloat(s as unknown as string);
}

function forceInt<T = number>(s: T) {
  return parseInt(s as unknown as string);
}

export function useRewardsEligibility() {
  const accountId = useAccountId();

  const fetcher = useCallback(async (url: string) => {
    const res = await fetch(url);
    return (await res.json()) as { eligible: boolean };
  }, []);

  return useSWR(
    `${TONIC_DATA_API_URL}/rewards/eligibility?account=${accountId}`,
    fetcher
  );
}

export function useRewardsHistory() {
  const accountId = useAccountId();

  const fetcher = useCallback(async (url: string): Promise<RewardsHistory> => {
    const res = await fetch(url);
    const data = (await res.json()) as RewardsHistory;
    const hydrated = {
      total: forceFloat(data.total),
      rewards: data.rewards.map((r) => {
        return {
          payout: forceFloat(r.payout),
          points: forceFloat(r.points),
          reward_date: TzDate(r.reward_date as unknown as string),
          paid_in_tx_id: r.paid_in_tx_id,
        };
      }),
    };
    return hydrated;
  }, []);

  return useSWR(
    `${TONIC_DATA_API_URL}/rewards/history?account=${accountId}`,
    fetcher
  );
}

/**
 * Unfinalized Rewards data pre-processed for use in chart.js's Doughnut chart
 */
export interface UnfinalizedRewardsChartOptions {
  myIndex: number;
  myShare: number;
  totalShares: number;
  otherTradersShare: number;
  chartOptions: {
    data: number[];
    labels: string[];
  };
}
/**
 * get top 3 accounts today by points earned + the signed in user
 *
 * if signed in user is top 3, won't be duplicated
 *
 * return values are sorted by rank ascending (that's the api order)
 */
export function useUnfinalizedRewards() {
  const accountId = useAccountId();

  const fetcher = useCallback(
    async (url: string) => {
      const res = await fetch(url);
      const raw = (await res.json()) as UnfinalizedReward[];
      const parsed = raw.map((d) => {
        return {
          account_id: d.account_id,
          overall_rank: forceInt(d.overall_rank),
          account_unfinalized: forceFloat(d.account_unfinalized),
          total_unfinalized: forceFloat(d.total_unfinalized),
        } as UnfinalizedReward;
      });

      const chartOptions = ((): UnfinalizedRewardsChartOptions => {
        if (!parsed.length) {
          // impossible if api is functioning correctly (will at least return a
          // default value for the queried account if there's no activity today)
          throw new Error('error fetching leaderboard');
        }

        // which tooltip to highlight
        const myIndex = parsed.findIndex((r) => r.account_id === accountId);

        const myShare = parsed[myIndex].account_unfinalized;

        // get how much of the pie belongs to accounts not returned in the top 3 + me
        const namedShare = parsed.reduce(
          (acc, r) => r.account_unfinalized + acc,
          0
        );
        // if there's no data, just say 100% earned by others
        const otherTradersShare =
          parsed[0].total_unfinalized > 0
            ? ((parsed[0].total_unfinalized - namedShare) /
                parsed[0].total_unfinalized) *
              100
            : 100;

        // below are chart.js options

        // data is [ rank 1, rank 2, rank 3, you, other traders ]
        // (you may be in the first 3 ranks)
        const data = parsed.map((r) => {
          if (r.total_unfinalized > 0) {
            // percentages
            return (r.account_unfinalized / r.total_unfinalized) * 100;
          } else {
            return 0;
          }
        });
        data.push(otherTradersShare);

        // labels are [ rank1.near, rank2.near, rank3.near, 'Your share', 'Other traders' ]
        const labels = [
          ...parsed.map((r) => abbreviateCryptoString(r.account_id, 16, 3)),
          'Other traders',
        ];
        labels[myIndex] = 'Your share';

        return {
          myIndex,
          totalShares: parsed[0].total_unfinalized,
          otherTradersShare,
          chartOptions: {
            data,
            labels,
          },
          myShare,
        };
      })();

      return chartOptions;
    },
    [accountId]
  );

  return useSWR(
    `${TONIC_DATA_API_URL}/rewards/unfinalized?account=${accountId}`,
    fetcher
  );
}

export function useRewardsProgramStats() {
  const fetcher = useCallback(async (url: string) => {
    const res = await fetch(url);
    return (await res.json()) as TotalRewardsStats;
  }, []);

  return useSWR(`${TONIC_DATA_API_URL}/rewards/stats`, fetcher);
}

/**
 * get today's params (mostly the rewards pool)
 *
 * technically will be stale if you load this right before UTC day changes due
 * nbd in this case, probably..
 */
export function useRewardsProgramParameters() {
  const fetcher = useCallback(async (url: string) => {
    const res = await fetch(url);
    const data = (await res.json()) as RewardsParameters;

    return {
      rewards_pool: parseInt(data.rewards_pool as unknown as string),
    } as RewardsParameters;
  }, []);

  return useSWR(`${TONIC_DATA_API_URL}/rewards/parameters`, fetcher);
}

export interface LeaderboardRanking {
  ranking: number;
  account_id: string;
  points: number;
  share: number;
  payout: number;
  /* */
  reward_date: Date;
}

/**
 * @param dateStr UTC date in the format yyyy-mm-dd
 */
export function useLeaderboard(dateStr: string) {
  const fetcher = useCallback(
    async (url: string): Promise<LeaderboardRanking[]> => {
      const res = await fetch(url);
      const data = (await res.json()) as LeaderboardRanking[];

      return data.map((r) => {
        return {
          ranking: forceInt(r.ranking),
          account_id: r.account_id,
          payout: forceFloat(r.payout),
          points: forceFloat(r.points),
          share: forceFloat(r.share),
          reward_date: TzDate(r.reward_date as unknown as string),
        };
      });
    },
    []
  );

  return useSWR(`/rewards/leaderboard?date=${dateStr}`, fetcher);
}
