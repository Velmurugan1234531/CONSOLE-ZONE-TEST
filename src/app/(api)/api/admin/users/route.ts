
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin Client (Service Role)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password, fullName, role } = body;

        // Basic validation
        if (!email || !password || !fullName) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        // 1. Create Auth User
        const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                full_name: fullName
                // role: role || 'customer' // Storing role in metadata is good practice for Auth, but we also use 'users' table
            }
        });

        if (createError) {
            console.error("Supabase Admin: Create User Error:", createError);
            return NextResponse.json({ success: false, error: createError.message }, { status: 400 });
        }

        const user = userData.user;

        // 2. Create Profile Entry in 'users' table
        // This mirrors the 'users' collection logic
        try {
            const { error: profileError } = await supabaseAdmin
                .from('users')
                .insert({
                    id: user.id,
                    email: email,
                    full_name: fullName,
                    role: role || 'customer',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    is_active: true,
                    login_attempts: 0,
                    metadata: { // Keeping metadata consistent
                        source: 'admin_api'
                    }
                });

            if (profileError) {
                console.error("Profile creation warning:", profileError);
                // If profile creation fails but auth user created, we have a sync issue.
                // In production, we might want to rollback (info: Supabase doesn't have cross-service tx for Auth+DB yet in JS client easily).
                // For now, warn.
                return NextResponse.json({ success: false, error: "User created but profile failed: " + profileError.message }, { status: 500 });
            }

        } catch (profileError: any) {
            console.error("Profile creation warning:", profileError);
        }

        return NextResponse.json({ success: true, user: user });

    } catch (error: any) {
        console.error("User creation failed:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
