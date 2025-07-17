// Claims Tables
export interface FT_SERVICE_TRANSACTION {
  transaction_id?: string | null;
  service_id?: string | null;
  member_id?: string | null;
  transaction_date?: string | null;
  amount?: number | null;
  status?: string | null;
  created_date?: string | null;
  updated_date?: string | null;
}

// Member Tables
export interface DIM_MEMBER {
  member_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  enrollment_date?: string | null;
  status?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  created_date?: string | null;
  updated_date?: string | null;
}

export interface DIM_MEMBER_ELIGIBILITY {
  eligibility_id?: string | null;
  member_id?: string | null;
  plan_id?: string | null;
  effective_date?: string | null;
  termination_date?: string | null;
  eligibility_status?: string | null;
  coverage_type?: string | null;
  premium_amount?: number | null;
  deductible_amount?: number | null;
  created_date?: string | null;
  updated_date?: string | null;
}

export interface ELIG_CURR {
  eligibility_id?: string | null;
  member_id?: string | null;
  plan_id?: string | null;
  effective_date?: string | null;
  termination_date?: string | null;
  current_status?: string | null;
  created_date?: string | null;
  updated_date?: string | null;
}

// Member Rewards Table
export interface MEMBER_REWARDS {
  reward_id?: string | null;
  member_id?: string | null;
  transaction_id?: string | null;
  reward_type?: string | null;
  reward_amount?: number | null;
  reward_date?: string | null;
  rule_id?: string | null;
  plan_id?: string | null;
  status?: string | null;
  created_date?: string | null;
  updated_date?: string | null;
}

// Reward Support Tables
export interface REWARD {
  reward_id?: string | null;
  reward_name?: string | null;
  reward_type?: string | null;
  reward_amount?: number | null;
  description?: string | null;
  active?: string | null;
  created_date?: string | null;
  updated_date?: string | null;
}

export interface SUB_RULES {
  rule_id?: string | null;
  rule_name?: string | null;
  rule_type?: string | null;
  criteria?: string | null;
  reward_id?: string | null;
  plan_id?: string | null;
  active?: string | null;
  created_date?: string | null;
  updated_date?: string | null;
}

export interface HRA_PLAN {
  plan_id?: string | null;
  plan_name?: string | null;
  plan_type?: string | null;
  max_reward_amount?: number | null;
  effective_date?: string | null;
  termination_date?: string | null;
  active?: string | null;
  created_date?: string | null;
  updated_date?: string | null;
}

export type TableName =
  | "FT_SERVICE_TRANSACTION"
  | "DIM_MEMBER"
  | "DIM_MEMBER_ELIGIBILITY"
  | "ELIG_CURR"
  | "MEMBER_REWARDS"
  | "REWARD"
  | "SUB_RULES"
  | "HRA_PLAN";

export type ClaimsTable = "FT_SERVICE_TRANSACTION";
export type MemberTable = "DIM_MEMBER" | "DIM_MEMBER_ELIGIBILITY" | "ELIG_CURR";
export type RewardsTable = "MEMBER_REWARDS";
export type SupportTable = "REWARD" | "SUB_RULES" | "HRA_PLAN";

export type TableRecord<T extends TableName> =
  T extends "FT_SERVICE_TRANSACTION"
    ? FT_SERVICE_TRANSACTION
    : T extends "DIM_MEMBER"
      ? DIM_MEMBER
      : T extends "DIM_MEMBER_ELIGIBILITY"
        ? DIM_MEMBER_ELIGIBILITY
        : T extends "ELIG_CURR"
          ? ELIG_CURR
          : T extends "MEMBER_REWARDS"
            ? MEMBER_REWARDS
            : T extends "REWARD"
              ? REWARD
              : T extends "SUB_RULES"
                ? SUB_RULES
                : T extends "HRA_PLAN"
                  ? HRA_PLAN
                  : never;

