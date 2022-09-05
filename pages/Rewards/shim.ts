// copy paste from the data service

interface StatsRow {
  /**
   * Total since start of program, paid or pending.
   */
  total_rewards: number;

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
  daily_rewards: number;

  /**
   * Total distinct participants who earned any reward on `reward_date`.
   */
  daily_participants: number;
}

export interface TotalRewardsStats {
  total_rewards: string;
  total_participants: string;
  start_date: Date;
  daily_stats: Pick<
    StatsRow,
    'reward_date' | 'daily_rewards' | 'daily_participants'
  >[];
}

interface RewardEntry {
  total: number;
  reward: number;
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
   * the UTC date
   */
  reward_date: Date;
}
