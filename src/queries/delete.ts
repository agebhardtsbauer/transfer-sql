import { DatabaseConnection } from "../connection";
import { OperationResult, TableName } from "../types";
import { TeradataCursor } from "teradatasql";

export class DeleteQuery {
  constructor(private db: DatabaseConnection) {}

  async delete<T extends TableName>(
    tableName: T,
    conditions: Record<string, string | number>,
  ): Promise<OperationResult> {
    try {
      const connection = this.db.getConnection();
      const cursor: TeradataCursor = connection.cursor();
      const query = this.buildDeleteQuery(tableName, conditions);

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
        error: `Delete query failed: ${error}`,
      };
    }
  }

  async deleteAll<T extends TableName>(tableName: T): Promise<OperationResult> {
    try {
      const connection = this.db.getConnection();
      const cursor: TeradataCursor = connection.cursor();
      const query = `DELETE FROM ${tableName}`;

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
        error: `Delete all query failed: ${error}`,
      };
    }
  }

  private buildDeleteQuery(
    tableName: string,
    conditions: Record<string, any>,
  ): string {
    const whereClause = this.buildWhereClause(conditions);
    return `DELETE FROM ${tableName} WHERE ${whereClause}`;
  }

  private buildWhereClause(conditions: Record<string, any>): string {
    return Object.entries(conditions)
      .map(([key, value]) => {
        if (value === null) return `${key} IS NULL`;
        if (typeof value === "string") return `${key} = '${value}'`;
        return `${key} = ${value}`;
      })
      .join(" AND ");
  }
}

