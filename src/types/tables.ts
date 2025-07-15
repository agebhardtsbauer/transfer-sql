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

export type TableName =
  | "FT_SERVICE_TRANSACTION"
  | "DIM_MEMBER"
  | "DIM_MEMBER_ELIGIBILITY";

export type TableRecord<T extends TableName> =
  T extends "FT_SERVICE_TRANSACTION"
    ? FT_SERVICE_TRANSACTION
    : T extends "DIM_MEMBER"
      ? DIM_MEMBER
      : T extends "DIM_MEMBER_ELIGIBILITY"
        ? DIM_MEMBER_ELIGIBILITY
        : never;

