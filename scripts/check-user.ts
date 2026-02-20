import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function checkUser(email: string) {
    console.log(`🔍 Checking DB profile for: ${email}...`);

    const { data: user, error: authError } = await supabase.auth.admin.listUsers();
    const authUser = user?.users.find(u => u.email === email);

    if (!authUser) {
        console.error('❌ User not found in Auth system.');
        return;
    }

    console.log(`✅ Auth user exists (ID: ${authUser.id})`);

    const { data: profile, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

    if (dbError) {
        console.error('❌ Database Error:', dbError.message);
    } else {
        console.log('✅ Database profile found:');
        console.log(JSON.stringify(profile, null, 2));
    }
}

const targetEmail = process.argv[2] || 'lovevelmurugan708@gmail.com';
checkUser(targetEmail);
