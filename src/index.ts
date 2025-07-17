import { DatabaseConnection } from './connection';
import { SelectQuery, InsertQuery, UpdateQuery, DeleteQuery } from './queries';
import { DatabaseConfig } from './types';

export class TeradataClient {
  private db: DatabaseConnection;
  public select: SelectQuery;
  public insert: InsertQuery;
  public update: UpdateQuery;
  public delete: DeleteQuery;

  constructor(config: DatabaseConfig) {
    this.db = new DatabaseConnection(config);
    this.select = new SelectQuery(this.db);
    this.insert = new InsertQuery(this.db);
    this.update = new UpdateQuery(this.db);
    this.delete = new DeleteQuery(this.db);
  }

  async connect(): Promise<void> {
    await this.db.connect();
  }

  async disconnect(): Promise<void> {
    await this.db.disconnect();
  }

  isConnected(): boolean {
    return this.db.isConnected();
  }
}

export * from './types';
export * from './connection';
export * from './queries';
export * from './testing';