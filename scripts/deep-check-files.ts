
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, anonKey);

    console.log("Checking RLS on 'file_records'...");
    // Try to fetch one row
    const { data, error, status, statusText } = await supabase.from('file_records').select('*').limit(1);

    console.log("Status:", status, statusText);
    if (error) {
        console.error("❌ ERROR OBJECT:", JSON.stringify(error, null, 2));
    } else {
        console.log("✅ Query successful (might be empty data due to RLS):", data);
    }
}

check();
