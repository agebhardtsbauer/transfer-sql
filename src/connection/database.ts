import { ITDConnParams, TeradataConnection } from "teradatasql";
import { DatabaseConfig, Environment } from "../types";

export class DatabaseConnection {
  private connection: TeradataConnection | null = null;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      const connectionString = this.buildConnectionString();
      this.connection = new TeradataConnection();
      this.connection.connect(connectionString);
    } catch (error) {
      throw new Error(`Failed to connect to database: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
  }

  getConnection(): TeradataConnection {
    if (!this.connection) {
      throw new Error(
        "Database connection not established. Call connect() first.",
      );
    }
    return this.connection;
  }

  isConnected(): boolean {
    return this.connection !== null;
  }

  private buildConnectionString(): ITDConnParams {
    const host = this.getHostForEnvironment(this.config.env);

    return {
      host: host,
      user: this.config.username,
      password: this.config.password,
      database: this.config.database_name,
      logmech: "LDAP",
    };
  }

  private getHostForEnvironment(env: Environment): string {
    switch (env) {
      case "DEV":
        return "dev-teradata-server.company.com";
      case "TEST":
        return "test-teradata-server.company.com";
      default:
        throw new Error(`Unknown environment: ${env}`);
    }
  }
}
