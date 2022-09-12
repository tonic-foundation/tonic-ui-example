// copy paste from the data service

interface StatsRow {
  /**
   * Total since start of program, paid or pending.
   */
  total_payouts: number;

  /**
   * Distinct participants with reward earned on at least one day.
   */
  total_participants: number;

  /**
   * UTC start date.
   */
  start_date: Date;

  /**
   * UTC date.
   */
  reward_date: Date;

  /**
   * Total rewards earned on `reward_date`.
   */
  daily_payouts: number;

  /**
   * Total distinct participants who earned any reward on `reward_date`.
   */
  daily_participants: number;
}

export interface TotalRewardsStats {
  total_payouts: string;
  total_participants: string;
  start_date: Date;
  daily_stats: Pick<
    StatsRow,
    'reward_date' | 'daily_payouts' | 'daily_participants'
  >[];
}

interface RewardEntry {
  total: number;
  payout: number;
  points: number;
  reward_date: Date;
  paid_in_tx_id: string | null;
}

export type RewardDayEntry = Omit<RewardEntry, 'total'>;

/**
 * account's overall rewards history
 */
export interface RewardsHistory {
  total: number;
  rewards: RewardDayEntry[];
}

/**
 * basically amount of eligible maker volume today
 *
 * nb: "today" means the current UTC day
 */
export interface UnfinalizedReward {
  account_id: string;

  /**
   * this account's eligible maker volume today
   */
  account_unfinalized: number;

  /**
   * total eligible maker volume today, summed over all accounts
   */
  total_unfinalized: number;

  /**
   * overall ranking by points earned today
   */
  overall_rank: number;
}

export interface RewardsParameters {
  rewards_pool: number;
}
