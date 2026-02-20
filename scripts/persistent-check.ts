import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function persistentCheck() {
    console.log('🔄 Starting persistent verify...');

    for (let i = 1; i <= 3; i++) {
        console.log(`📡 Attempt ${i}/3...`);
        const { data, error } = await supabase
            .from('users')
            .select('email, role')
            .eq('email', 'lovevelmurugan708@gmail.com')
            .single();

        if (error) {
            console.error(`❌ Attempt ${i} Failed:`, error.message);
            if (i < 3) {
                console.log('⌛ Waiting 10 seconds...');
                await new Promise(r => setTimeout(r, 10000));
            }
        } else {
            console.log('✅ SUCCESS! User Role Info:');
            console.log(JSON.stringify(data, null, 2));
            return;
        }
    }
    console.error('💥 All attempts failed. The schema cache might be permanently stuck.');
}

persistentCheck();
