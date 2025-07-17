export * from './tables';
export * from './testing';

export type Environment = 'DEV' | 'TEST';

export interface DatabaseConfig {
  env: Environment;
  username: string;
  password: string;
  database_name: string;
}

export interface QueryResult<T = any> {
  success: boolean;
  data?: T[];
  error?: string;
  rowCount?: number;
}

export interface OperationResult {
  success: boolean;
  rowsAffected?: number;
  error?: string;
}