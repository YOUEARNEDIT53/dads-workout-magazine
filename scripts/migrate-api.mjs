import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PROJECT_REF = 'hpyhglztjtnszqdqvmve';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_xyQ9taACESV1qSVbnso2tg_SnzVKAQo';

async function runMigration() {
  // Read migration file
  const migrationPath = join(__dirname, '../packages/database/migrations/001_initial_schema.sql');
  const sql = readFileSync(migrationPath, 'utf-8');

  // Split into individual statements and filter out comments
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${statements.length} SQL statements to execute`);

  // Try using Supabase PostgREST RPC endpoint with raw SQL
  // This requires creating a function first, which is a chicken-and-egg problem

  // Alternative: Use the direct database connection via pooler
  // Connection string format: postgresql://postgres.[project-ref]:[password]@[region].pooler.supabase.com:6543/postgres

  // Let's try creating tables one by one using the REST API
  // First, let's check if we can access the database at all

  const baseUrl = `https://${PROJECT_REF}.supabase.co`;

  // Test connection
  const testResponse = await fetch(`${baseUrl}/rest/v1/`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    }
  });

  if (!testResponse.ok) {
    console.error('Failed to connect to Supabase');
    process.exit(1);
  }

  console.log('Connected to Supabase REST API');
  console.log('Note: Cannot run DDL via REST API. Please run the migration SQL manually.');
  console.log('\nMigration SQL location:');
  console.log(migrationPath);
  console.log('\nOr run this command with database password:');
  console.log(`SUPABASE_DB_PASSWORD=your_password node scripts/migrate.mjs`);

  // Output the SQL for manual execution
  console.log('\n=== SQL TO RUN IN SUPABASE DASHBOARD ===\n');
  console.log(sql);
}

runMigration().catch(console.error);
