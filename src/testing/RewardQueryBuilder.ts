import { TeradataClient } from '../index';
import { 
  RewardQueryCriteria, 
  ClaimsTestData, 
  QueryResult, 
  MEMBER_REWARDS,
  ClaimsTable,
  MemberTable,
  TableRecord
} from '../types';

export class RewardQueryBuilder {
  private client: TeradataClient;

  constructor(client: TeradataClient) {
    this.client = client;
  }

  async buildRewardQuery(
    claimsData: ClaimsTestData,
    criteria: RewardQueryCriteria
  ): Promise<QueryResult<MEMBER_REWARDS>> {
    const conditions = this.buildConditions(criteria);
    return await this.client.select.select('MEMBER_REWARDS', conditions);
  }

  async findRewardsByTransaction(
    transactionId: string,
    additionalCriteria?: Partial<RewardQueryCriteria>
  ): Promise<QueryResult<MEMBER_REWARDS>> {
    const conditions: Record<string, any> = {
      transaction_id: transactionId
    };

    if (additionalCriteria) {
      Object.assign(conditions, this.buildConditions(additionalCriteria));
    }

    return await this.client.select.select('MEMBER_REWARDS', conditions);
  }

  async findRewardsByMember(
    memberId: string,
    additionalCriteria?: Partial<RewardQueryCriteria>
  ): Promise<QueryResult<MEMBER_REWARDS>> {
    const conditions: Record<string, any> = {
      member_id: memberId
    };

    if (additionalCriteria) {
      Object.assign(conditions, this.buildConditions(additionalCriteria));
    }

    return await this.client.select.select('MEMBER_REWARDS', conditions);
  }

  async findRewardsByClaimData(
    claimsData: ClaimsTestData,
    rewardType?: string
  ): Promise<QueryResult<MEMBER_REWARDS>> {
    const conditions: Record<string, any> = {};

    if (claimsData.claims.length > 0) {
      const transactionIds = claimsData.claims
        .map(claim => claim.transaction_id)
        .filter(id => id !== undefined);
      
      if (transactionIds.length === 1) {
        conditions.transaction_id = transactionIds[0];
      }
    }

    if (claimsData.members.length > 0) {
      const memberIds = claimsData.members
        .map(member => member.member_id)
        .filter(id => id !== undefined);
      
      if (memberIds.length === 1) {
        conditions.member_id = memberIds[0];
      }
    }

    if (rewardType) {
      conditions.reward_type = rewardType;
    }

    return await this.client.select.select('MEMBER_REWARDS', conditions);
  }

  async findRewardsByDateRange(
    startDate: string,
    endDate: string,
    additionalCriteria?: Partial<RewardQueryCriteria>
  ): Promise<QueryResult<MEMBER_REWARDS>> {
    const connection = this.client['db'].getConnection();
    const cursor = connection.cursor();
    
    let baseQuery = `
      SELECT * FROM MEMBER_REWARDS 
      WHERE reward_date >= '${startDate}' 
      AND reward_date <= '${endDate}'
    `;

    if (additionalCriteria) {
      const additionalConditions = this.buildWhereClause(this.buildConditions(additionalCriteria));
      if (additionalConditions) {
        baseQuery += ` AND ${additionalConditions}`;
      }
    }

    try {
      cursor.execute(baseQuery);
      const rows = cursor.fetchall();
      const columnNames = cursor.description.map((desc: any) => desc[0]);
      
      const results: MEMBER_REWARDS[] = [];
      
      for (const row of rows) {
        results.push(this.parseRow(row, columnNames));
      }

      return {
        success: true,
        data: results,
        rowCount: results.length
      };
    } catch (error) {
      return {
        success: false,
        error: `Date range query failed: ${error}`
      };
    }
  }

  async validateExpectedRewards(
    claimsData: ClaimsTestData,
    actualRewards: MEMBER_REWARDS[]
  ): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    if (!claimsData.expectedRewards) {
      return { isValid: true, issues: [] };
    }

    const { shouldGenerate, rewardType, rewardAmount } = claimsData.expectedRewards;

    if (shouldGenerate && actualRewards.length === 0) {
      issues.push('Expected rewards to be generated but none were found');
    }

    if (!shouldGenerate && actualRewards.length > 0) {
      issues.push(`Expected no rewards but found ${actualRewards.length} rewards`);
    }

    if (shouldGenerate && actualRewards.length > 0) {
      if (rewardType) {
        const matchingType = actualRewards.find(reward => reward.reward_type === rewardType);
        if (!matchingType) {
          issues.push(`Expected reward type '${rewardType}' but not found`);
        }
      }

      if (rewardAmount !== undefined) {
        const matchingAmount = actualRewards.find(reward => reward.reward_amount === rewardAmount);
        if (!matchingAmount) {
          issues.push(`Expected reward amount ${rewardAmount} but not found`);
        }
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  private buildConditions(criteria: RewardQueryCriteria): Record<string, any> {
    const conditions: Record<string, any> = {};

    if (criteria.memberId) {
      conditions.member_id = criteria.memberId;
    }

    if (criteria.transactionId) {
      conditions.transaction_id = criteria.transactionId;
    }

    if (criteria.rewardType) {
      conditions.reward_type = criteria.rewardType;
    }

    if (criteria.planId) {
      conditions.plan_id = criteria.planId;
    }

    return conditions;
  }

  private buildWhereClause(conditions: Record<string, any>): string {
    return Object.entries(conditions)
      .map(([key, value]) => {
        if (value === null) return `${key} IS NULL`;
        if (typeof value === 'string') return `${key} = '${value}'`;
        return `${key} = ${value}`;
      })
      .join(' AND ');
  }

  private parseRow(row: any[], columnNames: string[]): MEMBER_REWARDS {
    const parsed: Record<string, any> = {};

    for (let i = 0; i < columnNames.length; i++) {
      const columnName = columnNames[i];
      const value = row[i];

      if (value === null || value === undefined) {
        parsed[columnName] = null;
      } else if (value instanceof Date) {
        parsed[columnName] = value.toISOString().split('T')[0];
      } else if (typeof value === 'number') {
        parsed[columnName] = value;
      } else if (typeof value === 'string') {
        parsed[columnName] = value;
      } else if (typeof value === 'bigint') {
        parsed[columnName] = Number(value);
      } else {
        parsed[columnName] = String(value);
      }
    }

    return parsed as MEMBER_REWARDS;
  }
}