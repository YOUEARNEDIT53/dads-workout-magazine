import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Supabase connection - using the pooler for direct SQL access
const connectionString = 'postgresql://postgres.hpyhglztjtnszqdqvmve:' + process.env.SUPABASE_DB_PASSWORD + '@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

async function runMigration() {
  const client = new pg.Client({ connectionString });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected!');

    // Read migration file
    const migrationPath = join(__dirname, '../packages/database/migrations/001_initial_schema.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('Running migration...');
    await client.query(sql);
    console.log('Migration completed successfully!');

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('issues', 'articles', 'subscribers', 'topics', 'monthly_challenges')
    `);
    console.log('Created tables:', result.rows.map(r => r.table_name));

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
