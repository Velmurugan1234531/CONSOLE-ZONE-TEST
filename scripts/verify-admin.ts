
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !anonKey) {
    console.error("Missing SUPABASE_URL or ANON_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, anonKey);

async function main() {
    console.log("Verifying via Client Login (mimicking browser)...");
    const email = "admin@consolezone.in";
    const password = "AdminPassword@123";

    // 1. Sign In
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.error("❌ Login failed:", authError.message);
        return;
    }

    if (!authData.user) {
        console.error("❌ Login succeeded but no user returned.");
        return;
    }

    console.log("✅ Login successful. User ID:", authData.user.id);

    // 2. Fetch Profile
    const { data: user, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

    if (profileError) {
        console.error("❌ Profile Fetch Failed:");
        console.error("   Code:", profileError.code);
        console.error("   Message:", profileError.message);
        console.error("   Details:", profileError.details);
        console.error("   Hint:", profileError.hint);

        if (profileError.code === 'PGRST116') {
            console.log("   (This means NO ROW found in public.users table)");
        }
    } else {
        console.log("✅ Profile Access Successful.");
        console.log("   Role:", user.role);
        console.log("   Active:", user.is_active);
    }
}

main();
