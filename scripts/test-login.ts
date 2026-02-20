
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, anonKey);
    const email = "admin@consolezone.in";
    const password = "AdminPassword@123";

    console.log("Testing Login for:", email);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        console.error("Login Error:", error.message);
        if (error.message.includes("Email not confirmed")) {
            console.log("💡 ACTION: User must confirm their email or you must confirm them in Supabase Dashboard.");
        }
    } else {
        console.log("✅ Login Successful in Auth!");
        console.log("User ID:", data.user?.id);

        // Check if profile exists in users table
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError) {
            console.error("Profile Error:", profileError.message);
        } else {
            console.log("✅ Profile found:", profile);
        }
    }
}

check();
