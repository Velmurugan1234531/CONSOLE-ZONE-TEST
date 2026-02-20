// Supabase uses ISO 8601 strings for timestamps
export type Timestamp = string;


/**
 * Role Hierarchy (from highest to lowest privilege)
 */
export type UserRole =
    | "super_admin"  // Full system access, can create/modify all admins
    | "admin"        // Can manage sub_admins, staff, customers
    | "sub_admin"    // Limited admin access
    | "staff"        // Read-only admin access
    | "customer";    // Customer-facing access only

/**
 * Admin Role Union (all roles with admin panel access)
 */
export type AdminRole = "super_admin" | "admin" | "sub_admin" | "staff";

/**
 * User Security Metadata
 */
export interface UserSecurityMetadata {
    loginAttempts: number;
    lastLoginIP: string;
    lastLoginTimestamp: Timestamp | null;
    deviceInfo?: string;
    emailVerified: boolean;
    twoFactorEnabled: boolean;
    lastPasswordChange?: Timestamp;
}

/**
 * Core User Document (Firestore)
 */
export interface UserDocument {
    uid: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    lastLogin: Timestamp | null;
    loginAttempts: number;
    lastLoginIP: string;
    createdBy?: string; // UID of creator (for auditing)
    metadata: UserSecurityMetadata;
    fullName?: string;
    phone?: string;
    avatarUrl?: string;
}

/**
 * Admin Log Actions
 */
export type AdminLogAction =
    | "CREATE_ADMIN"
    | "UPDATE_ROLE"
    | "DISABLE_ADMIN"
    | "ENABLE_ADMIN"
    | "LOGIN"
    | "LOGOUT"
    | "FAILED_LOGIN"
    | "PASSWORD_RESET"
    | "ROLE_CHANGE"
    | "ACCOUNT_LOCKED";

/**
 * Admin Activity Log Entry
 */
export interface AdminLogEntry {
    id: string;
    adminId: string;
    adminEmail: string;
    action: AdminLogAction;
    targetUserId?: string;
    targetUserEmail?: string;
    timestamp: Timestamp;
    ipAddress: string;
    userAgent?: string;
    details?: Record<string, any>;
    success: boolean;
}

/**
 * Login Response
 */
export interface LoginResponse {
    success: boolean;
    user?: UserDocument;
    error?: string;
    requiresSetup?: boolean;
    accountLocked?: boolean;
}

/**
 * Role Check Result
 */
export interface RoleCheckResult {
    hasAccess: boolean;
    userRole?: UserRole;
    isActive: boolean;
    error?: string;
}

/**
 * Admin Creation Request (Cloud Function)
 */
export interface CreateAdminRequest {
    email: string;
    password: string;
    role: AdminRole;
    full_name?: string;
}

/**
 * Admin Creation Response
 */
export interface CreateAdminResponse {
    success: boolean;
    uid?: string;
    email?: string;
    error?: string;
}

/**
 * Role Update Request
 */
export interface UpdateRoleRequest {
    targetUserId: string;
    newRole: UserRole;
}

/**
 * Session Data
 */
export interface SessionData {
    uid: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    lastVerified: number; // Timestamp
}

/**
 * IP Whitelist Entry (Optional Security Feature)
 */
export interface IPWhitelistEntry {
    ip: string;
    description: string;
    addedBy: string;
    addedAt: Timestamp;
    isActive: boolean;
}

/**
 * Email Domain Restriction (Optional Security Feature)
 */
export interface EmailDomainRestriction {
    domain: string;
    allowedRoles: UserRole[];
    isActive: boolean;
}

/**
 * Auth Service Configuration
 */
export interface AuthServiceConfig {
    maxLoginAttempts: number;
    lockoutDurationMinutes: number;
    sessionTimeoutMinutes: number;
    enableIPWhitelist: boolean;
    enableEmailDomainRestriction: boolean;
    allowedDomains?: string[];
}

/**
 * Role Permission Matrix
 */
export const ROLE_PERMISSIONS = {
    super_admin: {
        canCreateAdmin: true,
        canCreateSubAdmin: true,
        canCreateStaff: true,
        canModifyRoles: true,
        canDisableAccounts: true,
        canViewLogs: true,
        canManageCustomers: true,
        canAccessAllData: true,
    },
    admin: {
        canCreateAdmin: false,
        canCreateSubAdmin: true,
        canCreateStaff: true,
        canModifyRoles: true, // Limited to sub_admin and below
        canDisableAccounts: true,
        canViewLogs: true,
        canManageCustomers: true,
        canAccessAllData: true,
    },
    sub_admin: {
        canCreateAdmin: false,
        canCreateSubAdmin: false,
        canCreateStaff: true,
        canModifyRoles: false,
        canDisableAccounts: false,
        canViewLogs: true,
        canManageCustomers: true,
        canAccessAllData: false,
    },
    staff: {
        canCreateAdmin: false,
        canCreateSubAdmin: false,
        canCreateStaff: false,
        canModifyRoles: false,
        canDisableAccounts: false,
        canViewLogs: false,
        canManageCustomers: true,
        canAccessAllData: false,
    },
    customer: {
        canCreateAdmin: false,
        canCreateSubAdmin: false,
        canCreateStaff: false,
        canModifyRoles: false,
        canDisableAccounts: false,
        canViewLogs: false,
        canManageCustomers: false,
        canAccessAllData: false,
    },
} as const;

/**
 * Check if a role is an admin role
 */
export function isAdminRole(role: UserRole): role is AdminRole {
    return ["super_admin", "admin", "sub_admin", "staff"].includes(role);
}

/**
 * Check if a role can create another role
 */
export function canCreateRole(creatorRole: UserRole, targetRole: UserRole): boolean {
    const roleHierarchy: UserRole[] = ["super_admin", "admin", "sub_admin", "staff", "customer"];
    const creatorIndex = roleHierarchy.indexOf(creatorRole);
    const targetIndex = roleHierarchy.indexOf(targetRole);

    if (creatorRole === "super_admin") return true;
    if (creatorRole === "admin" && targetIndex > 0) return true;
    if (creatorRole === "sub_admin" && targetRole === "staff") return true;

    return false;
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
    const names: Record<UserRole, string> = {
        super_admin: "Super Administrator",
        admin: "Administrator",
        sub_admin: "Sub Administrator",
        staff: "Staff Member",
        customer: "Customer",
    };
    return names[role];
}

/**
 * Get role color for UI
 */
export function getRoleColor(role: UserRole): string {
    const colors: Record<UserRole, string> = {
        super_admin: "#EF4444", // Red
        admin: "#F59E0B",       // Amber
        sub_admin: "#8B5CF6",   // Purple
        staff: "#3B82F6",       // Blue
        customer: "#10B981",    // Green
    };
    return colors[role];
}
