
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const service = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, service);

async function testConnection() {
    console.log('📡 Testing connection with Service Role Key...');
    try {
        // Try to list buckets (requires service role or specific RLS)
        const { data, error } = await supabase.storage.listBuckets();
        if (error) {
            console.log('❌ STORAGE ERROR:', JSON.stringify(error, null, 2));
        } else {
            console.log('✅ STORAGE SUCCESS: Found', data.length, 'buckets');
        }

        // Try a simple query on a table
        console.log('📡 Testing query on "users" table...');
        const res = await supabase.from('users').select('count', { count: 'exact', head: true });
        if (res.error) {
            console.log('❌ DB ERROR:', JSON.stringify(res.error, null, 2));
        } else {
            console.log('✅ DB SUCCESS: Table accessible.');
        }

    } catch (err) {
        console.error('💥 UNEXPECTED ERROR:', err);
    }
}

testConnection().then(() => console.log('--- END DIAGNOSTIC ---'));
