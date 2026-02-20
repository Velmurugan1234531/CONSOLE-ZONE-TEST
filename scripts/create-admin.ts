
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    console.error("Missing SUPABASE keys");
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const supabaseAnon = createClient(supabaseUrl, anonKey);

async function main() {
    console.log("🚀 START: Admin creation process");
    const email = "admin@consolezone.in";
    const password = "AdminPassword@123";

    try {
        console.log("📡 Step 1: Attempting SignUp (Anon Key)...");
        const { data, error } = await supabaseAnon.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: "System Admin" }
            }
        });

        console.log("✅ Step 1 complete. Result:", { hasData: !!data, hasError: !!error });

        let userId = data?.user?.id;

        if (error) {
            console.log("⚠️ SignUp returned an error:", error.message);
            if (error.message.includes("already registered") || error.message.includes("taken")) {
                console.log("🔍 User already exists. Trying to get ID via SignIn...");
                const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({ email, password });

                if (signInError) {
                    console.error("❌ SignIn failed:", signInError.message);
                } else {
                    console.log("✅ SignIn successful.");
                    userId = signInData.user?.id;
                }
            } else {
                console.error("❌ Unexpected SignUp error:", error);
            }
        }

        if (userId) {
            console.log("🔑 User ID obtained:", userId);
            console.log("📡 Step 2: Promoting to Admin (Service Role)...");

            const { error: upsertError } = await supabaseAdmin.from("users").upsert({
                id: userId,
                email: email,
                role: "admin",
                is_active: true,
                updated_at: new Date().toISOString()
            });

            if (upsertError) {
                console.error("❌ Failed to promote user. Error:", upsertError.message);
            } else {
                console.log("✨ Admin privileges granted successfully!");
                console.log("---------------------------------------------------");
                console.log("EMAIL:    " + email);
                console.log("PASSWORD: " + password);
                console.log("---------------------------------------------------");
            }
        } else {
            console.error("🛑 Could not obtain User ID. Check logs above.");
        }
    } catch (err) {
        console.error("💥 CRITICAL ERROR in main():", err);
    }
}

main().catch(err => console.error("FATAL:", err));
