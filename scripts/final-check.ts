import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function checkFinal() {
    console.log('🔍 Final Role Check on "profiles"...');
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('email', 'lovevelmurugan708@gmail.com')
        .single();

    if (error) {
        console.error('❌ profiles Error:', error.message);
    } else {
        console.log('✅ PROFILE FOUND:', profile);
    }
}

checkFinal();
