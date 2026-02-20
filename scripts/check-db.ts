import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function checkTable() {
    console.log('🔍 Checking for "public.users" table...');
    const { data, error } = await supabase
        .from('users')
        .select('count', { count: 'exact', head: true });

    if (error) {
        if (error.message.includes('not found') || error.message.includes('schema cache')) {
            console.error('❌ TABLE NOT FOUND: The "users" table does not exist in your Supabase database.');
        } else {
            console.error('❌ ERROR:', error.message);
        }
    } else {
        console.log('✅ TABLE FOUND: The "users" table is ready!');
    }
}

checkTable();
