import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';

import * as schema from './schema';

neonConfig.webSocketConstructor = ws;

export { schema };

export function assertDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  return process.env.DATABASE_URL;
}

function createDb() {
  const databaseUrl = assertDatabaseUrl();
  const pool = new Pool({ connectionString: databaseUrl });

  return drizzle(pool, { schema });
}

type Database = ReturnType<typeof createDb>;

let cachedDb: Database | undefined;

export function getDb() {
  cachedDb ??= createDb();

  return cachedDb;
}

export const db = new Proxy({} as Database, {
  get(_target, property, receiver) {
    return Reflect.get(getDb(), property, receiver);
  },
});
