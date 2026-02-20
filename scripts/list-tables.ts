import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function listTables() {
    console.log('📋 Listing tables in public schema...');

    // Query pg_tables to see if the table exists at the database level
    const { data: tables, error } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public');

    if (error) {
        console.log('ℹ️ Note: Cannot query pg_tables directly via PostgREST without specific setup. Trying RPC...');
        // Try a common RPC or just catch error
        console.error('❌ Error listing tables:', error.message);
    } else {
        console.log('✅ Tables found:', tables);
    }

    // Alternative: Try to select from 'users' again with a short wait
    console.log('⌛ Waiting 5 seconds before retrying "users" select...');
    await new Promise(r => setTimeout(r, 5000));

    const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(1);

    if (usersError) {
        console.error('❌ Users Table final check failed:', usersError.message);
    } else {
        console.log('✅ Users Table final check succeeded!');
    }
}

listTables();
