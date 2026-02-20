/**
 * Authentication Context Provider
 * Enterprise-grade auth with RBAC and session management
 * MIGRATED TO SUPABASE
 */

"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import {
    UserRole,
    AdminRole,
    UserDocument,
    isAdminRole,
} from "@/types/auth";
import { useRouter } from "next/navigation";
import { mapUserToCamelCase } from "@/services/admin-auth";
import { safeGetDoc } from "@/utils/firebase-utils";

interface AuthContextType {
    user: User | null;
    userDocument: UserDocument | null;
    loading: boolean;
    error: Error | null;
    isAdmin: boolean;
    hasAdminAccess: boolean;
    role: UserRole | null;
    refreshUserProfile: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userDocument, setUserDocument] = useState<UserDocument | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const router = useRouter();

    // Refs for synchronization
    const isMounted = useRef(true);

    // ...
    const fetchUserProfile = async (firebaseUser: User) => {
        try {
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDocSnap = await safeGetDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = mapUserToCamelCase({ id: firebaseUser.uid, ...userDocSnap.data() });
                if (isMounted.current) {
                    setUserDocument(userData as any);
                }
            } else {
                // Fallback for whitelisted admins if doc doesn't exist
                checkAndApplyAdminPass(firebaseUser, null);
            }
        } catch (err: any) {
            console.error("Error fetching user profile:", err);
            // Fallback for whitelisted admins if Firestore fails (offline)
            checkAndApplyAdminPass(firebaseUser, err);

            if (isMounted.current && !isWhitelistedAdmin(firebaseUser.email)) {
                // Don't set global error for offline/network issues, just log it.
                // This prevents the entire app from crashing showing "OfflineError".
                if (err.message === "Network timeout or offline mode active" || err.code === "unavailable") {
                    console.warn("AuthContext: Suppressing offline error to keep UI active.");
                    // Optionally set a specialized 'offline' state if needed, but for now just don't crash.
                    // maybe set userDocument to null so they are treated as 'no profile' aka guest/customer logic might apply?
                } else {
                    setError(err);
                }
            }
        }
    };

    const isWhitelistedAdmin = (email: string | null) => {
        return email === "admin@console.zone" ||
            email === "consolezone@gmail.com" ||
            email === "admin@consolezone.in" ||
            email === "superadmin@consolezone.in" ||
            email === "superadmin_v2@consolezone.in";
    };

    const checkAndApplyAdminPass = (firebaseUser: User, error: any) => {
        if (isWhitelistedAdmin(firebaseUser.email) || firebaseUser.uid === "DGGdo0c3mJOaRpfOmpsFJGpee943") {
            console.warn("⚠️ AuthContext: Activating fail-safe access for Admin (Offline/Missing Profile).");
            const adminData = {
                id: firebaseUser.uid,
                uid: firebaseUser.uid,
                email: firebaseUser.email || "",
                fullName: firebaseUser.displayName || "Admin (System Bypass)",
                role: "super_admin",
                isActive: true,
                createdAt: new Date().toISOString(),
                loginAttempts: 0,
                emailVerified: true,
                metadata: { offline_mode: true, original_error: error?.message }
            };
            if (isMounted.current) {
                setUserDocument(adminData as any);
                setError(null); // Clear query error since we handled it
            }
        } else {
            if (isMounted.current && !error) {
                setUserDocument(null);
            }
        }
    };

    const refreshUserProfile = async () => {
        if (!user) return;
        await fetchUserProfile(user);
    };

    const signOut = async (reason?: string) => {
        try {
            await firebaseSignOut(auth);
            setUser(null);
            setUserDocument(null);
            setError(null);
            router.refresh();
            router.push(`/admin/login${reason ? `?error=${reason}` : ""}`);
        } catch (error) {
            console.error("SignOut error:", error);
        }
    };

    useEffect(() => {
        isMounted.current = true;
        console.log("🔥 AuthProvider: Initializing Firebase Auth...");

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log("🔥 Auth State Changed:", currentUser ? "Logged In" : "Logged Out");

            if (isMounted.current) {
                setUser(currentUser);
                setLoading(true);
            }

            if (currentUser) {
                await fetchUserProfile(currentUser);
            } else {
                if (isMounted.current) {
                    setUserDocument(null);
                }
            }

            if (isMounted.current) {
                setLoading(false);
            }
        });

        return () => {
            isMounted.current = false;
            unsubscribe();
        };
    }, []);

    // Real-time Profile Listener (Firestore)
    useEffect(() => {
        if (!user?.uid) return;

        console.log("📡 Listening for profile updates...");
        const userDocRef = doc(db, "users", user.uid);

        const unsubscribe = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                console.log("🔄 Profile Updated via Firestore Realtime");
                const userData = mapUserToCamelCase({ id: user.uid, ...doc.data() });
                if (isMounted.current) {
                    setUserDocument(userData as any);

                    if (!userData.isActive) {
                        signOut("account_disabled");
                    }
                }
            }
        }, (error) => {
            console.warn("⚠️ AuthContext: Realtime profile listener paused/failed:", error.message);
            // Don't set global error here to avoid UI crash on temporary disconnects
        });

        return () => unsubscribe();
    }, [user?.uid]);

    const isAdmin = userDocument ? isAdminRole(userDocument.role) : false;
    const hasAdminAccess = userDocument ? (userDocument.isActive && isAdminRole(userDocument.role)) : false;
    const role = userDocument?.role || null;

    return (
        <AuthContext.Provider
            value={{
                user,
                userDocument,
                loading,
                error,
                isAdmin,
                hasAdminAccess,
                role,
                refreshUserProfile,
                signOut
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

/**
 * Hook to require admin access
 */
export function useRequireAdmin() {
    const { hasAdminAccess, loading, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/admin/login");
            } else if (!hasAdminAccess) {
                router.push("/");
            }
        }
    }, [hasAdminAccess, loading, user, router]);

    return { hasAdminAccess, loading };
}

/**
 * Hook to require specific role
 */
export function useRequireRole(requiredRole: UserRole | UserRole[]) {
    const { role, loading, user } = useAuth();
    const router = useRouter();
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    const hasRole = role && roles.includes(role);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/admin/login");
            } else if (!hasRole) {
                router.push("/admin");
            }
        }
    }, [hasRole, loading, user, router]);

    return { hasRole, loading };
}
