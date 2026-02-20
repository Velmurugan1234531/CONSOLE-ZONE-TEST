import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { safeGetDoc } from "@/utils/firebase-utils";

export const AuthService = {
    /**
     * Get the current authenticated user from Firebase.
     */
    getUser: async (): Promise<any | null> => {
        return auth.currentUser;
    },

    /**
     * Fetch user role from strict database lookup.
     * Never trust frontend state.
     */
    getRole: async (userId: string): Promise<'admin' | 'super_admin' | 'customer' | 'rider' | 'support'> => {
        if (!userId) return 'customer';

        // Check for Demo Mode Bypass
        if (typeof window !== 'undefined') {
            const demoUser = localStorage.getItem('DEMO_USER_SESSION');
            if (demoUser) {
                try {
                    const parsed = JSON.parse(demoUser);
                    if (parsed.id === userId) return parsed.role || 'customer';
                } catch (e) { console.warn("Invalid demo session", e); }
            }
        }

        try {
            const userSnap = await safeGetDoc(doc(db, "users", userId));
            if (userSnap.exists()) {
                const data = userSnap.data();
                return data.role as any || 'customer';
            }
        } catch (error) {
            console.error("AuthService getRole failed:", error);
        }

        return 'customer';
    },

    /**
     * strict boolean check for admin access.
     */
    isAdmin: async (): Promise<boolean> => {
        // Check Demo Session Fallback First (faster for dev)
        if (typeof window !== 'undefined') {
            const demoUser = localStorage.getItem('DEMO_USER_SESSION');
            if (demoUser) {
                try {
                    const parsed = JSON.parse(demoUser);
                    return parsed.role === 'admin' || parsed.role === 'super_admin';
                } catch (e) { }
            }
        }

        const user = auth.currentUser;
        if (!user) return false;

        const role = await AuthService.getRole(user.uid);
        return role === 'admin' || role === 'super_admin';
    }
};
