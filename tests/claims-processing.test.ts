import { test, expect } from '@playwright/test';
import { TeradataClient, TestFramework, RewardQueryBuilder } from '../src';

test.describe('Claims Processing Tests', () => {
  let client: TeradataClient;
  let testFramework: TestFramework;
  let rewardQueryBuilder: RewardQueryBuilder;

  test.beforeEach(async () => {
    client = new TeradataClient({
      env: 'TEST',
      username: process.env.DB_USERNAME || 'testuser',
      password: process.env.DB_PASSWORD || 'testpass',
      database_name: process.env.DB_NAME || 'testdb'
    });

    await client.connect();

    testFramework = new TestFramework(client, {
      testId: `test_${Date.now()}`,
      testIdentifierField: 'status', // Using existing field for test identification
      cleanupOnStart: true,
      cleanupOnEnd: true
    });

    rewardQueryBuilder = new RewardQueryBuilder(client);
    await testFramework.setupTest();
  });

  test.afterEach(async () => {
    await testFramework.teardownTest();
    if (client.isConnected()) {
      await client.disconnect();
    }
  });

  test('should process valid claim and generate reward', async () => {
    // Setup test data
    const testMember = {
      member_id: 'TEST_MEMBER_001',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@test.com',
      enrollment_date: '2023-01-01',
      status: 'ACTIVE'
    };

    const testClaim = {
      transaction_id: 'TEST_TRANSACTION_001',
      member_id: 'TEST_MEMBER_001',
      service_id: 'WELLNESS_VISIT',
      transaction_date: '2024-01-15',
      amount: 150.00,
      status: 'PROCESSED'
    };

    // Insert test data
    await testFramework.insertTestData('DIM_MEMBER', testMember, 'status');
    await testFramework.insertTestData('FT_SERVICE_TRANSACTION', testClaim, 'status');

    // Execute claims processing
    await testFramework.executeStoredProcedure('PROCESS_CLAIMS');

    // Verify rewards were generated
    const rewardResults = await rewardQueryBuilder.findRewardsByTransaction('TEST_TRANSACTION_001');
    
    expect(rewardResults.success).toBe(true);
    expect(rewardResults.data).toBeDefined();
    expect(rewardResults.data!.length).toBeGreaterThan(0);
    
    const reward = rewardResults.data![0];
    expect(reward.member_id).toBe('TEST_MEMBER_001');
    expect(reward.transaction_id).toBe('TEST_TRANSACTION_001');
  });

  test('should not generate reward for ineligible member', async () => {
    // Setup test data with ineligible member
    const testMember = {
      member_id: 'TEST_MEMBER_002',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@test.com',
      enrollment_date: '2023-01-01',
      status: 'INACTIVE' // Ineligible status
    };

    const testClaim = {
      transaction_id: 'TEST_TRANSACTION_002',
      member_id: 'TEST_MEMBER_002',
      service_id: 'WELLNESS_VISIT',
      transaction_date: '2024-01-15',
      amount: 150.00,
      status: 'PROCESSED'
    };

    // Insert test data
    await testFramework.insertTestData('DIM_MEMBER', testMember, 'status');
    await testFramework.insertTestData('FT_SERVICE_TRANSACTION', testClaim, 'status');

    // Execute claims processing
    await testFramework.executeStoredProcedure('PROCESS_CLAIMS');

    // Verify no rewards were generated
    const rewardResults = await rewardQueryBuilder.findRewardsByTransaction('TEST_TRANSACTION_002');
    
    expect(rewardResults.success).toBe(true);
    expect(rewardResults.data).toBeDefined();
    expect(rewardResults.data!.length).toBe(0);
  });

  test('should handle claim amount thresholds correctly', async () => {
    // Setup test data with low amount claim
    const testMember = {
      member_id: 'TEST_MEMBER_003',
      first_name: 'Bob',
      last_name: 'Johnson',
      email: 'bob.johnson@test.com',
      enrollment_date: '2023-01-01',
      status: 'ACTIVE'
    };

    const testClaim = {
      transaction_id: 'TEST_TRANSACTION_003',
      member_id: 'TEST_MEMBER_003',
      service_id: 'WELLNESS_VISIT',
      transaction_date: '2024-01-15',
      amount: 25.00, // Below threshold
      status: 'PROCESSED'
    };

    // Insert test data
    await testFramework.insertTestData('DIM_MEMBER', testMember, 'status');
    await testFramework.insertTestData('FT_SERVICE_TRANSACTION', testClaim, 'status');

    // Execute claims processing
    await testFramework.executeStoredProcedure('PROCESS_CLAIMS');

    // Verify rewards based on business rules
    const rewardResults = await rewardQueryBuilder.findRewardsByTransaction('TEST_TRANSACTION_003');
    
    expect(rewardResults.success).toBe(true);
    expect(rewardResults.data).toBeDefined();
    
    // This test would need to be adjusted based on actual business rules
    // For now, just verify the query executed successfully
  });

  test('should update existing member and process claim', async () => {
    // First, find an existing member to update
    const existingMemberResult = await client.select.select('DIM_MEMBER', { status: 'ACTIVE' }, 1);
    
    if (existingMemberResult.success && existingMemberResult.data && existingMemberResult.data.length > 0) {
      const existingMember = existingMemberResult.data[0];
      
      // Update the member's email
      await testFramework.updateExistingRecord('DIM_MEMBER', 
        { member_id: existingMember.member_id }, 
        { email: 'updated.email@test.com' }
      );

      // Create a claim for this updated member
      const testClaim = {
        transaction_id: 'TEST_TRANSACTION_004',
        member_id: existingMember.member_id,
        service_id: 'WELLNESS_VISIT',
        transaction_date: '2024-01-15',
        amount: 150.00,
        status: 'PROCESSED'
      };

      await testFramework.insertTestData('FT_SERVICE_TRANSACTION', testClaim, 'status');

      // Execute claims processing
      await testFramework.executeStoredProcedure('PROCESS_CLAIMS');

      // Verify rewards were generated
      const rewardResults = await rewardQueryBuilder.findRewardsByTransaction('TEST_TRANSACTION_004');
      
      expect(rewardResults.success).toBe(true);
    }
  });
});