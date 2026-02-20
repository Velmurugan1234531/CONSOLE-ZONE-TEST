
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, anonKey);

    console.log("Checking if 'file_records' table exists...");
    const { data, error } = await supabase.from('file_records').select('count', { count: 'exact', head: true });

    if (error) {
        console.error("❌ ERROR:", error.message);
        if (error.message.includes("does not exist") || error.message.includes("not found")) {
            console.log("💡 CONFIRMED: Table 'file_records' does not exist.");
        }
    } else {
        console.log("✅ Table 'file_records' exists!");
    }
}

check();
