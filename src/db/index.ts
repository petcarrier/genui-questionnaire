import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const db = drizzle({ client: pool });

console.log('Database connected successfully to PostgreSQL');

export { pool };

export * from './schema';
export * from './model-analytics';
export * from './trap-analytics';
export * from './dimensions-analytics'; 