
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function reset() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // We KNOW service role key failed before. 
    // Let's try to see if it's because of spaces or something.
    console.log("Service Key Length:", serviceRoleKey.length);

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const email = "admin@consolezone.in";
    const newPassword = "Admin123!";

    console.log("Attempting to find user...");
    const { data: users, error: listError } = await supabase.from('users').select('id').eq('email', email).single();

    if (listError) {
        console.error("User find error:", listError.message);
        return;
    }

    console.log("User found with ID:", users.id);
    console.log("Attempting to reset password via Auth Admin API...");

    const { data, error } = await supabase.auth.admin.updateUserById(
        users.id,
        { password: newPassword }
    );

    if (error) {
        console.error("Reset Error:", error.message);
    } else {
        console.log("✅ PASSWORD RESET SUCCESSFUL!");
        console.log("New Password:", newPassword);
    }
}

reset();
