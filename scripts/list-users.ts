
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function list() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // We'll try with service role, but if it fails (as we know it did before), 
    // we'll try with anon but it might not have permissions.
    // Actually, lfezlkthlxdiomquwcdf seems to have an invalid service role key?
    // Let me try to see if I can query with ANON if RLS allows listing users... probably not.

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    console.log("Listing all users from 'users' table...");
    const { data, error } = await supabase.from('users').select('*');

    if (error) {
        console.error("List Error:", error.message);
        console.log("Trying with Anon Key...");
        const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        const { data: dataAnon, error: errorAnon } = await supabaseAnon.from('users').select('*');
        if (errorAnon) {
            console.error("Anon List Error:", errorAnon.message);
        } else {
            console.log("✅ Users (Anon):", dataAnon);
        }
    } else {
        console.log("✅ Users (Service):", data);
    }
}

list();
