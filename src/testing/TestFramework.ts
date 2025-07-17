import { TeradataClient } from '../index';
import { 
  TestConfig, 
  TestDataManager, 
  DataBackup, 
  ClaimsTestData,
  TableName,
  ClaimsTable,
  MemberTable,
  TableRecord
} from '../types';

export class TestFramework {
  private client: TeradataClient;
  private dataManager: TestDataManager;
  private config: TestConfig;

  constructor(client: TeradataClient, config: TestConfig) {
    this.client = client;
    this.config = config;
    this.dataManager = {
      testId: config.testId,
      backups: [],
      insertedRecords: []
    };
  }

  async setupTest(): Promise<void> {
    if (this.config.cleanupOnStart) {
      await this.cleanupTestData();
    }
  }

  async teardownTest(): Promise<void> {
    if (this.config.cleanupOnEnd) {
      await this.cleanupTestData();
    }
    await this.restoreBackups();
  }

  async insertTestData<T extends ClaimsTable | MemberTable>(
    tableName: T,
    data: Partial<TableRecord<T>>,
    identifierField: string
  ): Promise<void> {
    const testIdentifier = `AUTO-${this.config.testId}`;
    const dataWithIdentifier = {
      ...data,
      [identifierField]: testIdentifier
    };

    const result = await this.client.insert.insert(tableName, dataWithIdentifier);
    
    if (!result.success) {
      throw new Error(`Failed to insert test data: ${result.error}`);
    }

    this.dataManager.insertedRecords.push({
      tableName,
      identifierField,
      identifierValue: testIdentifier
    });
  }

  async cloneAndModifyRecord<T extends ClaimsTable | MemberTable>(
    tableName: T,
    originalConditions: Record<string, any>,
    modifications: Partial<TableRecord<T>>,
    identifierField: string
  ): Promise<void> {
    const originalResult = await this.client.select.selectOne(tableName, originalConditions);
    
    if (!originalResult.success || !originalResult.data || originalResult.data.length === 0) {
      throw new Error(`Failed to find original record to clone: ${originalResult.error}`);
    }

    const originalRecord = originalResult.data[0];
    const testIdentifier = `AUTO-${this.config.testId}`;
    
    const clonedRecord = {
      ...originalRecord,
      ...modifications,
      [identifierField]: testIdentifier
    };

    delete (clonedRecord as any)[this.getPrimaryKeyField(tableName)];

    await this.insertTestData(tableName, clonedRecord, identifierField);
  }

  async updateExistingRecord<T extends ClaimsTable | MemberTable>(
    tableName: T,
    conditions: Record<string, any>,
    updates: Partial<TableRecord<T>>
  ): Promise<void> {
    const originalResult = await this.client.select.selectOne(tableName, conditions);
    
    if (!originalResult.success || !originalResult.data || originalResult.data.length === 0) {
      throw new Error(`Failed to find record to update: ${originalResult.error}`);
    }

    const originalRecord = originalResult.data[0];
    const backupId = `${tableName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.dataManager.backups.push({
      tableName,
      originalData: originalRecord,
      backupId
    });

    const result = await this.client.update.update(tableName, updates, conditions);
    
    if (!result.success) {
      throw new Error(`Failed to update record: ${result.error}`);
    }
  }

  async executeStoredProcedure(procedureName: string, parameters: any[] = []): Promise<void> {
    const connection = this.client['db'].getConnection();
    const cursor = connection.cursor();
    
    const paramPlaceholders = parameters.map(() => '?').join(', ');
    const query = `CALL ${procedureName}(${paramPlaceholders})`;
    
    try {
      cursor.execute(query, parameters);
    } catch (error) {
      throw new Error(`Failed to execute stored procedure ${procedureName}: ${error}`);
    }
  }

  async cleanupTestData(): Promise<void> {
    for (const record of this.dataManager.insertedRecords) {
      await this.client.delete.delete(
        record.tableName,
        { [record.identifierField]: record.identifierValue }
      );
    }
    this.dataManager.insertedRecords = [];
  }

  async restoreBackups(): Promise<void> {
    for (const backup of this.dataManager.backups) {
      const primaryKey = this.getPrimaryKeyField(backup.tableName);
      const primaryKeyValue = (backup.originalData as any)[primaryKey];
      
      if (primaryKeyValue) {
        await this.client.update.update(
          backup.tableName,
          backup.originalData,
          { [primaryKey]: primaryKeyValue }
        );
      }
    }
    this.dataManager.backups = [];
  }

  private getPrimaryKeyField(tableName: TableName): string {
    const primaryKeyMap: Record<TableName, string> = {
      'FT_SERVICE_TRANSACTION': 'transaction_id',
      'DIM_MEMBER': 'member_id',
      'DIM_MEMBER_ELIGIBILITY': 'eligibility_id',
      'ELIG_CURR': 'eligibility_id',
      'MEMBER_REWARDS': 'reward_id',
      'REWARD': 'reward_id',
      'SUB_RULES': 'rule_id',
      'HRA_PLAN': 'plan_id'
    };
    
    return primaryKeyMap[tableName];
  }
}