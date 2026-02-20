/**
 * Cloud Functions for Enterprise Admin Management
 * Secure admin creation, role management, and activity logging
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

// ============================================
// TYPES
// ============================================

type UserRole = "super_admin" | "admin" | "sub_admin" | "staff" | "customer";
type AdminRole = "super_admin" | "admin" | "sub_admin" | "staff";

interface CreateAdminRequest {
    email: string;
    password: string;
    role: AdminRole;
    full_name?: string;
}

interface UpdateRoleRequest {
    targetUserId: string;
    newRole: UserRole;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Verify caller is authenticated and get their role
 */
async function verifyCallerRole(context: functions.https.CallableContext): Promise<UserRole | null> {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }

    const userDoc = await db.collection("users").doc(context.auth.uid).get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError("not-found", "User profile not found");
    }

    const userData = userDoc.data();
    if (!userData || !userData.isActive) {
        throw new functions.https.HttpsError("permission-denied", "Account is disabled");
    }

    return userData.role as UserRole;
}

/**
 * Check if caller can create target role
 */
function canCreateRole(callerRole: UserRole, targetRole: UserRole): boolean {
    const roleHierarchy: UserRole[] = ["super_admin", "admin", "sub_admin", "staff", "customer"];
    const callerIndex = roleHierarchy.indexOf(callerRole);
    const targetIndex = roleHierarchy.indexOf(targetRole);

    if (callerRole === "super_admin") return true;
    if (callerRole === "admin" && targetIndex > 0) return true;
    if (callerRole === "sub_admin" && targetRole === "staff") return true;

    return false;
}

/**
 * Log admin activity
 */
async function logActivity(
    adminId: string,
    adminEmail: string,
    action: string,
    success: boolean,
    details?: any
) {
    await db.collection("adminLogs").add({
        adminId,
        adminEmail,
        action,
        success,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: details || {},
    });
}

// ============================================
// CLOUD FUNCTIONS
// ============================================

/**
 * Create Admin Account (HTTPS Callable)
 * Only super_admin can call this
 */
export const createAdmin = functions.https.onCall(async (data: CreateAdminRequest, context) => {
    try {
        // Step 1: Verify caller
        const callerRole = await verifyCallerRole(context);
        const callerEmail = context.auth!.token.email || "unknown";

        if (!callerRole) {
            throw new functions.https.HttpsError("permission-denied", "Invalid caller role");
        }

        // Step 2: Check permission
        if (!canCreateRole(callerRole, data.role)) {
            await logActivity(context.auth!.uid, callerEmail, "CREATE_ADMIN", false, {
                reason: "Insufficient permissions",
                targetRole: data.role,
            });
            throw new functions.https.HttpsError("permission-denied", "Cannot create this role");
        }

        // Step 3: Validate input
        if (!data.email || !data.password || !data.role) {
            throw new functions.https.HttpsError("invalid-argument", "Missing required fields");
        }

        const normalizedEmail = data.email.toLowerCase().trim();

        // Step 4: Create auth user
        const userRecord = await auth.createUser({
            email: normalizedEmail,
            password: data.password,
            emailVerified: false,
        });

        // Step 5: Create Firestore document
        await db.collection("users").doc(userRecord.uid).set({
            email: normalizedEmail,
            role: data.role,
            isActive: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastLogin: null,
            loginAttempts: 0,
            lastLoginIP: "",
            createdBy: context.auth!.uid,
            full_name: data.full_name || "Admin User",
            metadata: {
                loginAttempts: 0,
                lastLoginIP: "",
                lastLoginTimestamp: null,
                emailVerified: false,
                twoFactorEnabled: false,
            },
        });

        // Step 6: Log success
        await logActivity(context.auth!.uid, callerEmail, "CREATE_ADMIN", true, {
            targetUserId: userRecord.uid,
            targetUserEmail: normalizedEmail,
            targetRole: data.role,
        });

        return {
            success: true,
            uid: userRecord.uid,
            email: normalizedEmail,
        };
    } catch (error: any) {
        console.error("Create admin error:", error);

        // Log failure
        if (context.auth) {
            await logActivity(
                context.auth.uid,
                context.auth.token.email || "unknown",
                "CREATE_ADMIN",
                false,
                {
                    error: error.message,
                    targetEmail: data.email,
                }
            );
        }

        throw new functions.https.HttpsError("internal", error.message || "Failed to create admin");
    }
});

/**
 * Update User Role (HTTPS Callable)
 * Only super_admin and admin can call this
 */
export const updateAdminRole = functions.https.onCall(async (data: UpdateRoleRequest, context) => {
    try {
        // Step 1: Verify caller
        const callerRole = await verifyCallerRole(context);
        const callerEmail = context.auth!.token.email || "unknown";

        if (!callerRole) {
            throw new functions.https.HttpsError("permission-denied", "Invalid caller role");
        }

        // Step 2: Get target user
        const targetUserDoc = await db.collection("users").doc(data.targetUserId).get();
        if (!targetUserDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Target user not found");
        }

        const targetUserData = targetUserDoc.data()!;

        // Step 3: Check permission to change role
        if (!canCreateRole(callerRole, data.newRole)) {
            await logActivity(context.auth!.uid, callerEmail, "UPDATE_ROLE", false, {
                reason: "Insufficient permissions",
                targetUserId: data.targetUserId,
                newRole: data.newRole,
            });
            throw new functions.https.HttpsError("permission-denied", "Cannot assign this role");
        }

        // Step 4: Prevent self-demotion for super_admin
        if (context.auth!.uid === data.targetUserId && callerRole === "super_admin" && data.newRole !== "super_admin") {
            throw new functions.https.HttpsError("permission-denied", "Cannot demote yourself");
        }

        // Step 5: Update role
        await db.collection("users").doc(data.targetUserId).update({
            role: data.newRole,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Step 6: Log success
        await logActivity(context.auth!.uid, callerEmail, "ROLE_CHANGE", true, {
            targetUserId: data.targetUserId,
            targetUserEmail: targetUserData.email,
            oldRole: targetUserData.role,
            newRole: data.newRole,
        });

        return { success: true };
    } catch (error: any) {
        console.error("Update role error:", error);

        if (context.auth) {
            await logActivity(
                context.auth.uid,
                context.auth.token.email || "unknown",
                "UPDATE_ROLE",
                false,
                {
                    error: error.message,
                    targetUserId: data.targetUserId,
                }
            );
        }

        throw new functions.https.HttpsError("internal", error.message || "Failed to update role");
    }
});

/**
 * Disable Admin Account (HTTPS Callable)
 * Only super_admin can call this
 */
export const disableAdmin = functions.https.onCall(async (data: { targetUserId: string }, context) => {
    try {
        // Step 1: Verify caller is super_admin
        const callerRole = await verifyCallerRole(context);
        const callerEmail = context.auth!.token.email || "unknown";

        if (callerRole !== "super_admin") {
            await logActivity(context.auth!.uid, callerEmail, "DISABLE_ADMIN", false, {
                reason: "Not super_admin",
                targetUserId: data.targetUserId,
            });
            throw new functions.https.HttpsError("permission-denied", "Only super_admin can disable accounts");
        }

        // Step 2: Prevent self-disable
        if (context.auth!.uid === data.targetUserId) {
            throw new functions.https.HttpsError("permission-denied", "Cannot disable your own account");
        }

        // Step 3: Get target user
        const targetUserDoc = await db.collection("users").doc(data.targetUserId).get();
        if (!targetUserDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Target user not found");
        }

        const targetUserData = targetUserDoc.data()!;

        // Step 4: Disable account
        await db.collection("users").doc(data.targetUserId).update({
            isActive: false,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Step 5: Disable in Firebase Auth
        await auth.updateUser(data.targetUserId, { disabled: true });

        // Step 6: Log success
        await logActivity(context.auth!.uid, callerEmail, "DISABLE_ADMIN", true, {
            targetUserId: data.targetUserId,
            targetUserEmail: targetUserData.email,
        });

        return { success: true };
    } catch (error: any) {
        console.error("Disable admin error:", error);

        if (context.auth) {
            await logActivity(
                context.auth.uid,
                context.auth.token.email || "unknown",
                "DISABLE_ADMIN",
                false,
                {
                    error: error.message,
                    targetUserId: data.targetUserId,
                }
            );
        }

        throw new functions.https.HttpsError("internal", error.message || "Failed to disable admin");
    }
});

/**
 * Enable Admin Account (HTTPS Callable)
 * Only super_admin can call this
 */
export const enableAdmin = functions.https.onCall(async (data: { targetUserId: string }, context) => {
    try {
        const callerRole = await verifyCallerRole(context);
        const callerEmail = context.auth!.token.email || "unknown";

        if (callerRole !== "super_admin") {
            throw new functions.https.HttpsError("permission-denied", "Only super_admin can enable accounts");
        }

        const targetUserDoc = await db.collection("users").doc(data.targetUserId).get();
        if (!targetUserDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Target user not found");
        }

        const targetUserData = targetUserDoc.data()!;

        await db.collection("users").doc(data.targetUserId).update({
            isActive: true,
            loginAttempts: 0,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await auth.updateUser(data.targetUserId, { disabled: false });

        await logActivity(context.auth!.uid, callerEmail, "ENABLE_ADMIN", true, {
            targetUserId: data.targetUserId,
            targetUserEmail: targetUserData.email,
        });

        return { success: true };
    } catch (error: any) {
        console.error("Enable admin error:", error);
        throw new functions.https.HttpsError("internal", error.message || "Failed to enable admin");
    }
});

/**
 * Get Admin Logs (HTTPS Callable)
 * All admins can call this
 */
export const getAdminLogs = functions.https.onCall(async (data: { limit?: number }, context) => {
    try {
        const callerRole = await verifyCallerRole(context);

        if (!callerRole || !["super_admin", "admin", "sub_admin", "staff"].includes(callerRole)) {
            throw new functions.https.HttpsError("permission-denied", "Admin access required");
        }

        const limit = data.limit || 100;
        const logsSnapshot = await db
            .collection("adminLogs")
            .orderBy("timestamp", "desc")
            .limit(limit)
            .get();

        const logs = logsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return { success: true, logs };
    } catch (error: any) {
        console.error("Get admin logs error:", error);
        throw new functions.https.HttpsError("internal", error.message || "Failed to get logs");
    }
});
