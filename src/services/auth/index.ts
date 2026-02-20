
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export const AuthService = {
    /**
     * Get the current authenticated user from Supabase.
     */
    getUser: async (): Promise<User | null> => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        return user;
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

        const supabase = createClient();

        try {
            const { data, error } = await supabase
                .from("users")
                .select("role")
                .eq("id", userId)
                .single();

            if (data && !error) {
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

        const user = await AuthService.getUser();
        if (!user) return false;

        const role = await AuthService.getRole(user.id);
        return role === 'admin' || role === 'super_admin';
    }
};
