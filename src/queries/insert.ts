import { DatabaseConnection } from "../connection";
import { OperationResult, TableName, TableRecord } from "../types";

export class InsertQuery {
  constructor(private db: DatabaseConnection) {}

  async insert<T extends TableName>(
    tableName: T,
    data: Partial<TableRecord<T>>,
  ): Promise<OperationResult> {
    try {
      const connection = this.db.getConnection();
      const cursor = connection.cursor();
      const query = this.buildInsertQuery(tableName, data);

      cursor.execute(query);
      const rowCountBigInt: bigint = cursor.rowcount;
      const count: number = Number(rowCountBigInt);

      return {
        success: true,
        rowsAffected: count || 0,
      };
    } catch (error) {
      return {
        success: false,
        error: `Insert query failed: ${error}`,
      };
    }
  }

  async insertMany<T extends TableName>(
    tableName: T,
    dataArray: Partial<TableRecord<T>>[],
  ): Promise<OperationResult> {
    try {
      const connection = this.db.getConnection();
      const cursor = connection.cursor();
      let totalRowsAffected = 0;

      for (const data of dataArray) {
        const query = this.buildInsertQuery(tableName, data);

        console.log(`Executing query: ${query}`);
        cursor.execute(query);
        const rowCountBigInt: bigint = cursor.rowcount;
        const count: number = Number(rowCountBigInt);
        totalRowsAffected += count || 0;
      }

      return {
        success: true,
        rowsAffected: totalRowsAffected,
      };
    } catch (error) {
      return {
        success: false,
        error: `Bulk insert query failed: ${error}`,
      };
    }
  }

  private buildInsertQuery(
    tableName: string,
    data: Record<string, any>,
  ): string {
    const columns = Object.keys(data).filter((key) => data[key] !== undefined);
    const values = columns.map((key) => this.formatValue(data[key]));

    return `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${values.join(", ")})`;
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return "NULL";
    }
    if (typeof value === "string") {
      return `'${value.replace(/'/g, "''")}'`;
    }
    return String(value);
  }
}
