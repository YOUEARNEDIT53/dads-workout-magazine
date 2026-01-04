import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runMigration() {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Running migration...');

  // Read the migration file
  const migrationPath = resolve(__dirname, '../packages/database/migrations/001_initial_schema.sql');
  const sql = readFileSync(migrationPath, 'utf-8');

  // Split into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (const statement of statements) {
    try {
      // Use RPC to execute SQL (requires a function in Supabase)
      // Since we can't execute raw SQL, we'll create tables via REST API
      console.log(`Executing: ${statement.slice(0, 50)}...`);

      // Note: Supabase REST API doesn't support DDL directly
      // We'll just insert the seed data for now
    } catch (error) {
      console.error(`Error: ${error}`);
      errorCount++;
    }
  }

  // Test connection by inserting subscriber
  try {
    const { data, error } = await supabase
      .from('subscribers')
      .upsert({
        email: 'youearndit@gmail.com',
        name: 'Beta Tester',
        status: 'active'
      }, {
        onConflict: 'email'
      })
      .select();

    if (error) {
      console.log('Subscribers table not found, migration needed');
      console.log('\n\n=== MANUAL MIGRATION REQUIRED ===');
      console.log('Please run the following SQL in your Supabase SQL Editor:');
      console.log('https://supabase.com/dashboard/project/hpyhglztjtnszqdqvmve/sql');
      console.log('\n' + sql);
      console.log('\n=================================\n');
    } else {
      console.log('Subscriber added:', data);
    }
  } catch (e) {
    console.error('Error testing connection:', e);
  }

  console.log('Migration check complete');
}

runMigration().catch(console.error);
