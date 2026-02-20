"use client";

import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { Loader2, LogIn, User, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AuthButton() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            setUser(null);
            router.refresh();
            // Redirect to login page
            window.location.href = '/login';
        } catch (error) {
            console.error("Sign out error:", error);
        }
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
                    {user.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
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
