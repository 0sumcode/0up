import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

type DbClient = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  __db?: DbClient;
  __pool?: Pool;
};

function createClient(): DbClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  const pool = globalForDb.__pool ?? new Pool({ connectionString: url });
  globalForDb.__pool = pool;
  return drizzle(pool, { schema });
}

export const db: DbClient = new Proxy({} as DbClient, {
  get(_target, prop) {
    if (!globalForDb.__db) {
      globalForDb.__db = createClient();
    }
    return Reflect.get(globalForDb.__db, prop);
  },
});

export { schema };
