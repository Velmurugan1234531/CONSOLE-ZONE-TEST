import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function checkAudit() {
    console.log('🔍 Checking for "audit_logs" table...');
    const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ audit_logs Error:', error.message);
    } else {
        console.log('✅ audit_logs Table is accessible!');
    }
}

checkAudit();
