import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password, fullName, role } = body;

        // Basic validation
        if (!email || !password || !fullName) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        // 1. Create Auth User in Firebase
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: fullName,
            emailVerified: true,
        });

        // 2. Create Profile Entry in 'users' collection (Firestore)
        // This mirrors the 'users' collection logic
        try {
            const userRef = adminDb.collection('users').doc(userRecord.uid);
            await userRef.set({
                uid: userRecord.uid,
                email: email,
                role: role || 'customer',
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastLogin: null,
                loginAttempts: 0,
                lastLoginIP: "0.0.0.0",
                fullName: fullName,
                metadata: {
                    source: 'admin_api',
                    loginAttempts: 0,
                    lastLoginIP: "0.0.0.0",
                    lastLoginTimestamp: null,
                    emailVerified: true,
                    twoFactorEnabled: false
                }
            });

        } catch (profileError: any) {
            console.error("Profile creation warning (Firestore):", profileError);
            return NextResponse.json({ success: false, error: "User created in Auth but profile failed: " + profileError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, user: { uid: userRecord.uid, email: userRecord.email } });

    } catch (error: any) {
        console.error("Firebase Admin: User creation failed:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
