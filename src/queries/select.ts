import { DatabaseConnection } from "../connection";
import { QueryResult, TableName, TableRecord } from "../types";
import dayjs from "dayjs";

export class SelectQuery {
  constructor(private db: DatabaseConnection) {}

  async select<T extends TableName>(
    tableName: T,
    conditions?: Record<string, any>,
    limit?: number,
  ): Promise<QueryResult<TableRecord<T>>> {
    try {
      const connection = this.db.getConnection();
      const cursor = connection.cursor();
      const query = this.buildSelectQuery(tableName, conditions, limit);

      cursor.execute(query);
      const rows = cursor.fetchall();

      const results: TableRecord<T>[] = [];

      for await (const row of rows) {
        results.push(this.parseRow(row));
      }

      return {
        success: true,
        data: results,
        rowCount: results.length,
      };
    } catch (error) {
      return {
        success: false,
        error: `Select query failed: ${error}`,
      };
    }
  }

  async selectOne<T extends TableName>(
    tableName: T,
    conditions: Record<string, any>,
  ): Promise<QueryResult<TableRecord<T>>> {
    const result = await this.select(tableName, conditions, 1);
    return {
      ...result,
      data: result.data ? result.data.slice(0, 1) : [],
    };
  }

  private buildSelectQuery(
    tableName: string,
    conditions?: Record<string, any>,
    limit?: number,
  ): string {
    let query = `SELECT * FROM ${tableName}`;

    if (conditions && Object.keys(conditions).length > 0) {
      const whereClause = this.buildWhereClause(conditions);
      query += ` WHERE ${whereClause}`;
    }

    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    return query;
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

  private parseRow(row: any): any {
    const parsed: any = {};

    for (const [key, value] of Object.entries(row)) {
      if (value === null || value === undefined) {
        parsed[key] = null;
      } else if (value instanceof Date) {
        parsed[key] = dayjs(value).format("YYYY-MM-DD HH:mm:ss");
      } else {
        parsed[key] = value;
      }
    }

    return parsed;
  }
}

