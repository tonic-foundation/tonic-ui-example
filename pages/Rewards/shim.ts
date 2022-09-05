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
  total_rewards: number;
  total_participants: number;
  start_date: Date;
  daily_stats: Pick<
    StatsRow,
    'reward_date' | 'daily_rewards' | 'daily_participants'
  >[];
}

/**
 * an entry in the user's rewards history
 */
export interface RewardEntry {
  total: number;
  reward: number;
  reward_date: Date;
  paid_in_tx_id: string | null;
}

/**
 * essentially the record in db, used to represent unfinalized rewards for the
 * current UTC day
 */
export interface UnfinalizedReward {
  account_id: string;
  reward: number;
  reward_date: Date;
  paid_in_tx_id: string | null;
}
