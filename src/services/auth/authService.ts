/**
 * Enterprise Auth Service
 * Secure authentication with RBAC, session management, and security tracking
 */

import { auth, db } from "@/lib/firebase";
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "firebase/auth";
import {
    doc,
    getDoc,
    updateDoc,
    collection,
    addDoc,
    query,
    where,
    setDoc
} from "firebase/firestore";
import { safeGetDoc, safeGetDocs } from "@/utils/firebase-utils";
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
    if (typeof window === 'undefined') return "server";
    return navigator.userAgent || "unknown";
}

/**
 * Log admin activity to Firestore
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
    try {
        const ipAddress = await getClientIP();
        const userAgent = getDeviceInfo();

        await addDoc(collection(db, 'admin_logs'), {
            admin_id: adminId === 'unknown' ? null : adminId,
            admin_email: adminEmail,
            action,
            target_user_id: details?.targetUserId || null,
            target_user_email: details?.targetUserEmail || null,
            ip_address: ipAddress,
            user_agent: userAgent,
            details: details || null,
            success,
            created_at: new Date().toISOString()
        });
    } catch (error) {
        console.error("Failed to log admin activity (Firestore):", error);
    }
}

/**
 * Get user document from Firestore
 */
export async function getUserDocument(uid: string): Promise<UserDocument | null> {
    try {
        const userSnap = await safeGetDoc(doc(db, "users", uid));
        if (!userSnap.exists()) return null;

        const data = userSnap.data();
        return { uid, ...data } as unknown as UserDocument;
    } catch (error) {
        console.error("Failed to get user document (Firestore):", error);
        return null;
    }
}

/**
 * Update user's last login and reset login attempts
 */
async function updateLoginSuccess(uid: string, ipAddress: string): Promise<void> {
    try {
        await updateDoc(doc(db, "users", uid), {
            updated_at: new Date().toISOString(),
            metadata: {
                lastLoginIP: ipAddress,
                deviceInfo: getDeviceInfo(),
                loginAttempts: 0
            }
        });
    } catch (error) {
        console.error("Failed to update login success (Firestore):", error);
    }
}

/**
 * Increment login attempts and lock account if needed
 */
async function incrementLoginAttempts(uid: string): Promise<void> {
    try {
        const userDoc = await getUserDocument(uid);
        if (!userDoc) return;

        const currentAttempts = (userDoc.metadata as any)?.loginAttempts || 0;
        const newAttempts = currentAttempts + 1;

        const updates: any = {
            "metadata.loginAttempts": newAttempts,
            updated_at: new Date().toISOString()
        };

        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
            updates.isActive = false;
            updates.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60000).toISOString();
        }

        await updateDoc(doc(db, "users", uid), updates);
    } catch (error) {
        console.error("Failed to increment login attempts (Firestore):", error);
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
    const normalizedEmail = email.toLowerCase().trim();
    const ipAddress = await getClientIP();

    try {
        // Step 1: Firebase Auth login
        const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        const user = userCredential.user;
        const uid = user.uid;

        // Step 2: Get user document
        const userDoc = await getUserDocument(uid);

        if (!userDoc) {
            await signOut(auth);
            return { success: false, error: "User profile not found", requiresSetup: true };
        }

        // Step 3: Check if account is active
        if (!userDoc.isActive) {
            await signOut(auth);
            await logAdminActivity(uid, userDoc.email, "FAILED_LOGIN", false, {
                reason: "Account locked",
                ipAddress,
            });
            return { success: false, error: "Account locked. Contact administrator.", accountLocked: true };
        }

        // Step 4: Check if user has admin role
        if (!isAdminRole(userDoc.role)) {
            await signOut(auth);
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
        console.error("Login error (Firebase):", error);

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
    try {
        const user = auth.currentUser;
        if (user) {
            await logAdminActivity(user.uid, user.email || 'unknown', "LOGOUT", true);
        }
        await signOut(auth);
    } catch (error) {
        console.error("Logout error (Firebase):", error);
    }
}

/**
 * Get current session data
 */
export async function getCurrentSession(): Promise<SessionData | null> {
    try {
        const user = auth.currentUser;
        if (!user) return null;

        const userDoc = await getUserDocument(user.uid);
        if (!userDoc || !userDoc.isActive) return null;

        return {
            uid: userDoc.uid,
            email: userDoc.email,
            role: userDoc.role,
            isActive: userDoc.isActive,
            lastVerified: Date.now(),
        };
    } catch (error) {
        console.error("Failed to get session (Firebase):", error);
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
    return (ROLE_PERMISSIONS[session.role] as any)[action] as boolean;
}
