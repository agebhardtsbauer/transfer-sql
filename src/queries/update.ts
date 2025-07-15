import { DatabaseConnection } from "../connection";
import { OperationResult, TableName, TableRecord } from "../types";

export class UpdateQuery {
  constructor(private db: DatabaseConnection) {}

  async update<T extends TableName>(
    tableName: T,
    data: Partial<TableRecord<T>>,
    conditions: Record<string, any>,
  ): Promise<OperationResult> {
    try {
      const connection = this.db.getConnection();
      const cursor = connection.cursor();
      const query = this.buildUpdateQuery(tableName, data, conditions);

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
        error: `Update query failed: ${error}`,
      };
    }
  }

  private buildUpdateQuery(
    tableName: string,
    data: Record<string, any>,
    conditions: Record<string, any>,
  ): string {
    const setClause = this.buildSetClause(data);
    const whereClause = this.buildWhereClause(conditions);

    return `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`;
  }

  private buildSetClause(data: Record<string, any>): string {
    return Object.entries(data)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key} = ${this.formatValue(value)}`)
      .join(", ");
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
