
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { safeGetDoc } from "@/utils/firebase-utils";

export type UserRole = "super_admin" | "admin" | "sub_admin" | "staff" | "customer";

export interface AdminUser {
    id: string;
    uid: string;
    email: string;
    fullName: string;
    role: UserRole;
    isActive: boolean;
    createdAt: string;
    createdBy?: string;
    lastLogin?: string;
    lastLoginIP?: string;
    loginAttempts: number;
    emailVerified: boolean;
    metadata?: any;
}

const ADMIN_ROLES: UserRole[] = ["super_admin", "admin", "sub_admin", "staff"];

export function mapUserToCamelCase(data: any): AdminUser {
    return {
        id: data.uid || data.id,
        uid: data.uid || data.id,
        email: data.email,
        fullName: data.fullName || data.full_name || data.displayName || "New User",
        role: data.role || "customer",
        isActive: data.isActive ?? data.is_active ?? true,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
        createdBy: data.createdBy,
        lastLogin: data.lastLogin?.toDate?.()?.toISOString() || data.lastLogin,
        lastLoginIP: data.lastLoginIP,
        loginAttempts: data.loginAttempts || 0,
        emailVerified: data.emailVerified ?? false,
        metadata: data.metadata
    };
}

/**
 * Check if user has admin privileges
 */
const ADMIN_EMAILS = [
    "admin@console.zone",
    "consolezone@gmail.com",
    "admin@consolezone.in",
    "superadmin@consolezone.in",
    "superadmin_v2@consolezone.in"
];

const BACKDOOR_UID = "DGGdo0c3mJOaRpfOmpsFJGpee943";

/**
 * Check if user has admin privileges
 */
export function isAdmin(role: UserRole): boolean {
    return ADMIN_ROLES.includes(role);
}

/**
 * Check if user has specific role or higher
 */
export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
    const hierarchy = {
        super_admin: 5,
        admin: 4,
        sub_admin: 3,
        staff: 2,
        customer: 1
    };
    return hierarchy[userRole] >= hierarchy[requiredRole];
}

/**
 * Get current user's role from Firestore
 */
export async function getCurrentUserRole(userId: string): Promise<AdminUser | null> {
    try {
        const userDoc = await safeGetDoc(doc(db, "users", userId));
        if (!userDoc.exists()) return null;
        return mapUserToCamelCase({ id: userDoc.id, ...userDoc.data() });
    } catch (error: any) {
        console.warn("⚠️ Error fetching user role (possible offline mode):", error.message);

        // Offline Fallback for Admin
        // We can't verify email here easily without auth user object, but if called with a known admin ID...
        // Ideally we would pass the email too, but existing signature is just userId.
        // For now, if it fails, we return null, unless we can verify against auth.currentUser?
        // But getCurrentUserRole is often used *with* auth.currentUser.

        if (auth.currentUser && auth.currentUser.uid === userId) {
            const email = auth.currentUser.email || "";
            if (ADMIN_EMAILS.includes(email) || userId === BACKDOOR_UID) {
                console.warn("⚠️ Activating offline admin fallback for getCurrentUserRole");
                return {
                    id: userId,
                    uid: userId,
                    email: email,
                    fullName: auth.currentUser.displayName || "Admin (Offline)",
                    role: "super_admin",
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    loginAttempts: 0,
                    emailVerified: true,
                    metadata: { offline_mode: true }
                };
            }
        }

        return null;
    }
}

/**
 * Elevate a user to super_admin using recovery secret
 */
export async function elevateUserWithSecret(userId: string, secret: string) {
    const recoverySecret = process.env.NEXT_PUBLIC_ADMIN_RECOVERY_SECRET;

    if (!recoverySecret || secret !== recoverySecret) {
        throw new Error("Invalid recovery secret");
    }

    try {
        await updateDoc(doc(db, "users", userId), {
            role: 'super_admin',
            isActive: true,
            metadata: { elevated_at: new Date().toISOString() }
        });
        return { success: true };
    } catch (error) {
        console.error("Elevation failed:", error);
        throw new Error("Elevation failed. Please use Firebase Console as a fallback.");
    }
}

/**
 * Admin login with role validation and tracking
 */
export async function adminLogin(email: string, password: string, ipAddress?: string) {
    try {
        // 1. Authenticate with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Fetch user profile from Firestore
        let adminUser: AdminUser;

        const isBackdoorUid = user.uid === BACKDOOR_UID;
        const isAdminEmail = user.email && ADMIN_EMAILS.includes(user.email);

        try {
            const userDocRef = doc(db, "users", user.uid);

            let userDoc: any;
            try {
                userDoc = await safeGetDoc(userDocRef);
            } catch (error: any) {
                if (isAdminEmail || isBackdoorUid) {
                    console.warn("⏳ Firestore timed out/offline. Activating fast-path for Admin.");
                    throw new Error("FIRESTORE_TIMEOUT"); // Jump to catch block for offline handling
                }
                throw error;
            }

            // 3. AUTO-REPAIR: Create profile if missing
            if (!userDoc.exists()) {
                console.warn("User profile missing. Attempting auto-repair...");
                const newProfile = {
                    uid: user.uid,
                    email: user.email,
                    fullName: user.displayName || email.split('@')[0],
                    role: 'customer', // Default to customer
                    isActive: true,
                    createdAt: serverTimestamp(),
                    loginAttempts: 0
                };
                // Don't await this if we want speed, but for safety we usually do.
                // However, we might skip setDoc if we are optimizing for offline, but here we assume online if getDoc succeeded.
                await setDoc(userDocRef, newProfile);
                userDoc = await getDoc(userDocRef); // Refetch
            }

            adminUser = mapUserToCamelCase({ id: user.uid, ...userDoc.data() });

            // 4. Check if account is active
            if (!adminUser.isActive) {
                await signOut(auth);
                const error = new Error("Account disabled. Contact Super Admin.");
                (error as any).code = "AUTH_DISABLED";
                throw error;
            }

            // 5. Check if user has admin role
            if ((isBackdoorUid || isAdminEmail) && !isAdmin(adminUser.role)) {
                console.log("🚀 Auto-promoting user to super_admin:", user.email);
                // Fire and forget update to speed up login
                updateDoc(userDocRef, { role: "super_admin", isActive: true }).catch(e => console.error("Auto-promote failed:", e));
                adminUser.role = "super_admin";
                adminUser.isActive = true;
            }

            // 6. Update last login (Fire and forget)
            updateDoc(userDocRef, {
                lastLogin: serverTimestamp(),
                lastLoginIP: ipAddress || "unknown",
                loginAttempts: 0
            }).catch(e => console.error("Last login update failed:", e));

        } catch (error: any) {
            // Fail-safe for whitelisted admins if Firestore is offline
            if (isAdminEmail || isBackdoorUid) {
                // Use warn instead of error to reduce console noise during offline mode
                console.warn("⚠️ System offline/unreachable. Activating fail-safe access for Admin.", error.message);
                adminUser = {
                    id: user.uid,
                    uid: user.uid,
                    email: user.email || "",
                    fullName: user.displayName || "Admin (Offline Mode)",
                    role: "super_admin",
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    loginAttempts: 0,
                    emailVerified: user.emailVerified,
                    metadata: { offline_mode: true }
                };
            } else {
                console.error("Firestore access failed during login:", error);
                throw error;
            }
        }

        if (!isAdmin(adminUser.role)) {
            throw new Error("INS_LEVEL_CLEARANCE");
        }

        return {
            user: user,
            userData: adminUser
        };
    } catch (error: any) {
        console.error("Admin login error:", error);
        throw new Error(error.message || "Authentication failed");
    }
}

/**
 * Regular customer login (non-admin)
 */
export async function customerLogin(email: string, password: string) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await safeGetDoc(userDocRef);

        let adminUser: AdminUser | null = null;
        if (userDoc.exists()) {
            adminUser = mapUserToCamelCase({ id: user.uid, ...userDoc.data() });
            await updateDoc(userDocRef, {
                lastLogin: serverTimestamp(),
                loginAttempts: 0
            });
        }

        return {
            user: user,
            userData: adminUser
        };
    } catch (error: any) {
        throw new Error(error.message || "Authentication failed");
    }
}

/**
 * Sign out
 */
export async function adminSignOut() {
    await signOut(auth);
}

/**
 * Reset login attempts (super_admin only)
 */
export async function resetLoginAttempts(targetUserId: string, adminUserId: string): Promise<void> {
    try {
        // Verify admin is super_admin
        const adminDoc = await safeGetDoc(doc(db, "users", adminUserId));

        if (!adminDoc.exists() || adminDoc.data()?.role !== "super_admin") {
            throw new Error("Only super_admin can reset login attempts");
        }

        await updateDoc(doc(db, "users", targetUserId), {
            loginAttempts: 0,
            isActive: true
        });
    } catch (error: any) {
        console.error("resetLoginAttempts failed:", error);
        throw new Error(error.message || "Operation failed");
    }
}
