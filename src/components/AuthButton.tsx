"use client";

import { createClient } from "@/lib/supabase/client";
import { Loader2, LogIn, User, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AuthButton() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
            } else {
                setUser(null);
            }
            setLoading(false);
        };

        fetchUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser(session.user);
            } else {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        router.refresh();
        // Redirect to login page
        window.location.href = '/login';
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium">
                <Loader2 size={16} className="animate-spin text-[#A855F7]" />
            </div>
        );
    }

    if (user) {
        return (
            <div className="flex items-center gap-4">
                <Link
                    href="/profile"
                    className="w-10 h-10 rounded-full border border-white/10 bg-white/5 overflow-hidden relative group hover:border-[#A855F7] transition-all flex items-center justify-center"
                    title="Client Profile"
                >
                    {user.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <User size={18} className="text-gray-400 group-hover:text-[#A855F7] transition-colors" />
                    )}
                </Link>
                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 text-white"
                    title="Sign Out"
                >
                    <LogOut size={16} className="text-[#A855F7]" />
                    <span className="hidden sm:inline">Logout</span>
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Link
                href="/login"
                className="flex items-center gap-2 px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 text-white"
            >
                <LogIn size={16} className="text-[#A855F7]" />
                Login
            </Link>
        </div>
    );
}
