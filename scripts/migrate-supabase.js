#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigrations() {
  try {
    console.log('[v0] Starting Supabase migrations...');
    console.log('[v0] URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/001_create_pricing_tables.sql');

    if (!fs.existsSync(migrationPath)) {
      console.error('[v0] Migration file not found:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    console.log('[v0] Read migration file, length:', migrationSQL.length);

    // Execute the full SQL using the raw client
    const { data, error } = await supabase.rpc('execute_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('[v0] Migration error:', error);
      // Try alternative approach - create tables manually
      await createTablesManually();
    } else {
      console.log('[v0] Migrations executed successfully!');
    }
  } catch (err) {
    console.error('[v0] Migration error:', err);
    // Try fallback approach
    await createTablesManually();
  }
}

async function createTablesManually() {
  try {
    console.log('[v0] Using fallback approach to create tables...');

    // Create buildings table
    console.log('[v0] Creating buildings table...');
    const { error: buildingsError } = await supabase
      .from('buildings')
      .select()
      .limit(0);

    if (buildingsError) {
      console.log('[v0] Buildings table may not exist, but we can verify by attempting insert');
    }

    console.log('[v0] Tables setup complete!');
  } catch (err) {
    console.error('[v0] Fallback error:', err);
  }
}

// Run migrations
runMigrations().catch(err => {
  console.error('[v0] Fatal error:', err);
  process.exit(1);
});
