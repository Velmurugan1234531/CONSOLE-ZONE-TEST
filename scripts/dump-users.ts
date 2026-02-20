import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function dumpUsers() {
    console.log('📖 Dumping all users from public.users...');
    const { data, error } = await supabase
        .from('users')
        .select('*');

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log(`✅ Found ${data?.length || 0} users:`);
        console.log(JSON.stringify(data, null, 2));
    }
}

dumpUsers();
