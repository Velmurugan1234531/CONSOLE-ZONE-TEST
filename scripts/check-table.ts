
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    console.log("Checking service_bookings table...");
    try {
        const { data, error } = await supabase.from('service_bookings').select('count', { count: 'exact', head: true });

        if (error) {
            console.error("Error accessing table:", error);
        } else {
            console.log("Table accessible. Count:", data);
        }
    } catch (err) {
        console.error("Unexpected error:", err);
    }
}

checkTable();
