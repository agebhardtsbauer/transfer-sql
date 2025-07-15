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
      //@ts-ignore
      const columnNames = cursor.description.map((desc: any) => desc[0]);

      const results: TableRecord<T>[] = [];

      for (const row of rows) {
        results.push(this.parseRow(row, columnNames));
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
    let limitString: string = " ";
    if (limit && limit > 0) {
      limitString = ` TOP ${limit} `;
    }

    let query = `SELECT${limitString}* FROM ${tableName}`;

    if (conditions && Object.keys(conditions).length > 0) {
      const whereClause = this.buildWhereClause(conditions);
      query += ` WHERE ${whereClause}`;
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

  private parseRow<T extends TableName>(
    row: any[],
    columnNames: string[],
  ): TableRecord<T> {
    const parsed: Record<string, any> = {};

    for (let i = 0; i < columnNames.length; i++) {
      const columnName = columnNames[i];
      const value = row[i];

      if (value === null || value === undefined) {
        parsed[columnName] = null;
      } else if (value instanceof Date) {
        parsed[columnName] = dayjs(value).format("YYYY-MM-DD HH:mm:ss");
      } else if (typeof value === "number") {
        parsed[columnName] = value;
      } else if (typeof value === "string") {
        parsed[columnName] = value;
      } else if (typeof value === "bigint") {
        parsed[columnName] = Number(value);
      } else {
        parsed[columnName] = String(value);
      }
    }

    return parsed as TableRecord<T>;
  }
}
