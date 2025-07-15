import { test, expect } from "@playwright/test";
import { TeradataClient } from "../src";

test.describe("Teradata Database Tests", () => {
  let connection: TeradataClient;

  test.beforeEach(async () => {
    connection = new TeradataClient({
      env: "TEST",
      username: process.env.DB_USERNAME || "testuser",
      password: process.env.DB_PASSWORD || "testpass",
      database_name: process.env.DB_NAME || "testdb",
    });
  });

  test.afterEach(async () => {
    if (connection.isConnected()) {
      await connection.disconnect();
    }
  });

  test("should connect to database", async () => {
    await connection.connect();
    expect(connection.isConnected()).toBe(true);
  });

  test("should select data from FT_SERVICE_TRANSACTION", async () => {
    await connection.connect();

    const result = await connection.select.select(
      "FT_SERVICE_TRANSACTION",
      {},
      10,
    );

    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  test("should insert data into DIM_MEMBER", async () => {
    await connection.connect();

    const testMember = {
      member_id: "TEST_001",
      first_name: "Test",
      last_name: "User",
      email: "test@example.com",
    };

    const result = await connection.insert.insert("DIM_MEMBER", testMember);

    expect(result.success).toBe(true);
    expect(result.rowsAffected).toBeGreaterThan(0);
  });
});
