import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../../.env') });

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const runMigrations = async () => {
  console.log('Running migrations...');

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);
  const migrationsFolder = resolve(__dirname, './migrations');
  const journalPath = resolve(migrationsFolder, 'meta', '_journal.json');

  try {
    if (!existsSync(journalPath)) {
      console.warn(
        `No migrations found at ${migrationsFolder}. Run "pnpm --filter @kadryhr/api db:generate" to create them.`
      );
      return;
    }

    await migrate(db, { migrationsFolder });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
};

runMigrations();
