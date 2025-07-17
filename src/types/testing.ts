import { TableName, ClaimsTable, MemberTable, TableRecord } from './tables';

export interface TestConfig {
  testId: string;
  testIdentifierField: string;
  cleanupOnStart?: boolean;
  cleanupOnEnd?: boolean;
}

export interface DataBackup<T extends TableName> {
  tableName: T;
  originalData: TableRecord<T>;
  backupId: string;
}

export interface TestDataManager {
  testId: string;
  backups: DataBackup<any>[];
  insertedRecords: Array<{
    tableName: TableName;
    identifierField: string;
    identifierValue: string;
  }>;
}

export interface ClaimsTestData {
  claims: Partial<TableRecord<ClaimsTable>>[];
  members: Partial<TableRecord<MemberTable>>[];
  expectedRewards?: {
    shouldGenerate: boolean;
    rewardType?: string;
    rewardAmount?: number;
  };
}

export interface RewardQueryCriteria {
  memberId?: string;
  transactionId?: string;
  rewardType?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  planId?: string;
}

export type TestStep = 
  | { type: 'setup', action: 'insert' | 'update' | 'clone' }
  | { type: 'execute', action: 'stored_procedure' }
  | { type: 'verify', action: 'check_rewards' }
  | { type: 'cleanup', action: 'restore' | 'delete' };