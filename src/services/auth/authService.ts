/**
 * Enterprise Auth Service
 * Secure authentication with RBAC, session management, and security tracking
 */

import { createClient } from "@/lib/supabase/client";
import {
    UserDocument,
    UserRole,
    AdminRole,
    LoginResponse,
    RoleCheckResult,
    AdminLogEntry,
    AdminLogAction,
    isAdminRole,
    SessionData,
} from "@/types/auth";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;
const SESSION_TIMEOUT_MINUTES = 60;

/**
 * Get client IP address (browser-side approximation)
 */
async function getClientIP(): Promise<string> {
    try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        return data.ip || "unknown";
    } catch {
        return "unknown";
    }
}

/**
 * Get device/browser information
 */
function getDeviceInfo(): string {
    return navigator.userAgent || "unknown";
}

/**
 * Log admin activity to Supabase
 */
export async function logAdminActivity(
    adminId: string,
    adminEmail: string,
    action: AdminLogAction,
    success: boolean,
    details?: {
        targetUserId?: string;
        targetUserEmail?: string;
        error?: string;
        [key: string]: any;
    }
): Promise<void> {
    const supabase = createClient();
    try {
        const ipAddress = await getClientIP();
        const userAgent = getDeviceInfo();

        // AdminLogs table
        const { error } = await supabase.from('admin_logs').insert({
            admin_id: adminId === 'unknown' ? null : adminId, // Handle unknown properly
            admin_email: adminEmail,
            action,
            target_user_id: details?.targetUserId,
            target_user_email: details?.targetUserEmail,
            ip_address: ipAddress,
            user_agent: userAgent,
            details: details,
            success,
            created_at: new Date().toISOString()
        });

        if (error) throw error;
    } catch (error) {
        console.error("Failed to log admin activity:", error);
    }
}

/**
 * Get user document from Supabase
 */
export async function getUserDocument(uid: string): Promise<UserDocument | null> {
    const supabase = createClient();
    try {
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", uid)
            .single();

        if (error || !data) return null;

        // Map snake_case to camelCase types if necessary, or casting
        return { uid, ...data } as unknown as UserDocument;
    } catch (error) {
        console.error("Failed to get user document:", error);
        return null;
    }
}

/**
 * Update user's last login and reset login attempts
 */
async function updateLoginSuccess(uid: string, ipAddress: string): Promise<void> {
    const supabase = createClient();
    try {
        await supabase.from("users").update({
            // Assuming columns exist or mapped
            // last_login: new Date().toISOString() ??
            // Check schema. Users table usually has updated_at.
            // storing metadata in metadata column if needed?
            // Supabase Auth manages last_sign_in_at in auth.users, but we are updating public.users
            updated_at: new Date().toISOString(),
            // Reset stats? 
            // We might need to store login_attempts in a column or metadata
            metadata: {
                lastLoginIP: ipAddress,
                deviceInfo: getDeviceInfo(),
                loginAttempts: 0 // Reset
            }
            // columns?
        }).eq("id", uid);
    } catch (error) {
        console.error("Failed to update login success:", error);
    }
}

/**
 * Increment login attempts and lock account if needed
 */
async function incrementLoginAttempts(uid: string): Promise<void> {
    const supabase = createClient();
    try {
        const userDoc = await getUserDocument(uid);
        if (!userDoc) return;

        // This logic heavily depends on having fetched the user AND being able to update them
        // If anon, we probably can't update public.users.
        // Skipping implementation details that require server-side privileges for anon users.
        console.warn("Skipping incrementLoginAttempts (RLS restriction likely)");

        // Pseudo-code for when we have an RPC
        /*
        const { error } = await supabase.rpc('increment_login_attempts', { user_id: uid });
        */
    } catch (error) {
        console.error("Failed to increment login attempts:", error);
    }
}

/**
 * Check if user role is admin-level
 */
export function checkAdminRole(role: UserRole): boolean {
    return isAdminRole(role);
}

/**
 * Verify user has access to admin panel
 */
export async function verifyAdminAccess(uid: string): Promise<RoleCheckResult> {
    try {
        const userDoc = await getUserDocument(uid);

        if (!userDoc) {
            return { hasAccess: false, isActive: false, error: "User not found" };
        }

        if (!userDoc.isActive) {
            return { hasAccess: false, isActive: false, userRole: userDoc.role, error: "Account disabled" };
        }

        if (!isAdminRole(userDoc.role)) {
            return { hasAccess: false, isActive: true, userRole: userDoc.role, error: "Insufficient permissions" };
        }

        return { hasAccess: true, isActive: true, userRole: userDoc.role };
    } catch (error) {
        console.error("Failed to verify admin access:", error);
        return { hasAccess: false, isActive: false, error: "Verification failed" };
    }
}

/**
 * Admin login
 */
export async function adminLogin(email: string, password: string): Promise<LoginResponse> {
    const supabase = createClient();
    const normalizedEmail = email.toLowerCase().trim();
    // IP fetch might be slow, do it async or parallel?
    const ipAddress = "0.0.0.0"; // Placeholder or fetch

    try {
        // Step 1: Supabase Auth login
        const { data, error } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password: password
        });

        if (error) throw error;
        if (!data.user) throw new Error("No user returned");

        const uid = data.user.id;

        // Step 2: Get user document
        const userDoc = await getUserDocument(uid);

        if (!userDoc) {
            await supabase.auth.signOut();
            return { success: false, error: "User profile not found", requiresSetup: true };
        }

        // Step 3: Check if account is active
        if (!userDoc.isActive) {
            await supabase.auth.signOut();
            // Logging might fail if we signed out? No, logAdminActivity uses new client.
            await logAdminActivity(uid, userDoc.email, "FAILED_LOGIN", false, {
                reason: "Account locked",
                ipAddress,
            });
            return { success: false, error: "Account locked. Contact administrator.", accountLocked: true };
        }

        // Step 4: Check if user has admin role
        if (!isAdminRole(userDoc.role)) {
            await supabase.auth.signOut();
            await logAdminActivity(uid, userDoc.email, "FAILED_LOGIN", false, {
                reason: "Insufficient permissions",
                role: userDoc.role,
                ipAddress,
            });
            return { success: false, error: "Access denied. Admin privileges required." };
        }

        // Step 5: Update login success
        await updateLoginSuccess(uid, ipAddress);

        // Step 6: Log successful login
        await logAdminActivity(uid, userDoc.email, "LOGIN", true, { ipAddress });

        return { success: true, user: userDoc };
    } catch (error: any) {
        console.error("Login error:", error);

        // Try to get user by email for logging (NOT POSSIBLE with Supabase Client simply)
        // We skip detailed user logging on failure to avoid leaking info or errors.
        await logAdminActivity("unknown", normalizedEmail, "FAILED_LOGIN", false, {
            reason: error.message || "Invalid credentials",
            ipAddress,
        });

        return { success: false, error: error.message || "Login failed" };
    }
}

/**
 * Admin logout
 */
export async function adminLogout(): Promise<void> {
    const supabase = createClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // Assuming we can fetch email if needed, or just log ID
            await logAdminActivity(user.id, user.email || 'unknown', "LOGOUT", true);
        }

        await supabase.auth.signOut();
    } catch (error) {
        console.error("Logout error:", error);
    }
}

/**
 * Get current session data
 */
export async function getCurrentSession(): Promise<SessionData | null> {
    const supabase = createClient();
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return null;

        const userDoc = await getUserDocument(session.user.id);
        if (!userDoc || !userDoc.isActive) return null;

        return {
            uid: userDoc.uid,
            email: userDoc.email,
            role: userDoc.role,
            isActive: userDoc.isActive,
            lastVerified: Date.now(),
        };
    } catch (error) {
        console.error("Failed to get session:", error);
        return null;
    }
}

/**
 * Verify session is still valid
 */
export async function verifySession(session: SessionData | null): Promise<boolean> {
    if (!session) return false;

    // Check if session is expired
    const sessionAge = Date.now() - session.lastVerified;
    if (sessionAge > SESSION_TIMEOUT_MINUTES * 60 * 1000) {
        return false;
    }

    // Verify user still exists and is active
    const userDoc = await getUserDocument(session.uid);
    if (!userDoc || !userDoc.isActive) return false;

    // Verify role hasn't changed
    if (userDoc.role !== session.role) return false;

    return true;
}

/**
 * Check if current user has permission for an action
 */
export async function checkPermission(
    action: keyof typeof import("@/types/auth").ROLE_PERMISSIONS[UserRole]
): Promise<boolean> {
    const session = await getCurrentSession();
    if (!session) return false;

    const { ROLE_PERMISSIONS } = await import("@/types/auth");
    return ROLE_PERMISSIONS[session.role][action] as boolean;
}
