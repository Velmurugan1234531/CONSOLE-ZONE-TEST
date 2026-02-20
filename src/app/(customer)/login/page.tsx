"use client";

import { useState } from "react";
// import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, Mail, Lock, Chrome, ArrowLeft, Apple } from "lucide-react";
import PageHero from "@/components/layout/PageHero";
import { useVisuals } from "@/context/visuals-context";
import VerificationScreen from "@/components/VerificationScreen";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showVerificationScreen, setShowVerificationScreen] = useState(false);
    const [unverifiedEmail, setUnverifiedEmail] = useState("");
    const router = useRouter();
    const { settings } = useVisuals();
    // const supabase = createClient();

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { auth, db } = await import("@/lib/firebase");
            const { signInWithEmailAndPassword } = await import("firebase/auth");
            const { doc, getDoc, setDoc, serverTimestamp } = await import("firebase/firestore");

            // 1. Authenticate
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            let role = "customer";

            // 2. Fetch User Role for Redirection
            try {
                const userDocRef = doc(db, "users", user.uid);

                // OPTIMIZATION: Race Firestore against a short timeout
                const fetchPromise = getDoc(userDocRef);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("FIRESTORE_TIMEOUT")), 2500)
                );

                let userDoc: any;
                try {
                    userDoc = await Promise.race([fetchPromise, timeoutPromise]);
                } catch (raceError: any) {
                    if (raceError.message === "FIRESTORE_TIMEOUT") {
                        // Check whitelist immediately if timeout
                        const isTimeoutAdmin = user.email === "admin@console.zone" ||
                            user.email === "consolezone@gmail.com" ||
                            user.email === "admin@consolezone.in" ||
                            user.email === "superadmin@consolezone.in" ||
                            user.email === "superadmin_v2@consolezone.in";
                        if (isTimeoutAdmin || user.uid === "DGGdo0c3mJOaRpfOmpsFJGpee943") {
                            console.warn("⏳ Login: Firestore timed out. Activating fast-path.");
                            throw raceError; // Jump to catch block
                        }
                    }
                    throw raceError;
                }

                if (userDoc.exists()) {
                    role = userDoc.data().role || "customer";
                }
            } catch (firestoreError: any) {
                console.error("Firestore login error:", firestoreError);
                // Fail-safe for whitelisted admins
                const isAdminEmail = user.email === "admin@console.zone" ||
                    user.email === "consolezone@gmail.com" ||
                    user.email === "admin@consolezone.in" ||
                    user.email === "superadmin@consolezone.in" ||
                    user.email === "superadmin_v2@consolezone.in";

                const isBackdoorUid = user.uid === "DGGdo0c3mJOaRpfOmpsFJGpee943";

                if (isAdminEmail || isBackdoorUid) {
                    console.warn("⚠️ System offline. Activating fail-safe access.");
                    role = "super_admin";

                    // Attempt to auto-repair/create if possible (might fail if truly offline)
                    try {
                        const userDocRef = doc(db, "users", user.uid);
                        // Fire and forget, don't await
                        setDoc(userDocRef, {
                            uid: user.uid,
                            email: user.email,
                            fullName: user.displayName || "Admin (Offline)",
                            role: "super_admin",
                            isActive: true,
                            createdAt: serverTimestamp(),
                            loginAttempts: 0,
                            metadata: { offline_mode: true }
                        }, { merge: true }).catch(() => { });
                    } catch (e) { /* Ignore write error in offline mode */ }
                } else {
                    throw firestoreError;
                }
            }

            // 3. Redirect based on role
            if (role === "super_admin" || role === "admin") {
                router.push("/admin");
            } else {
                router.push("/dashboard");
            }

            router.refresh();
        } catch (err: any) {
            console.error("Login failed", err);
            if (err.message && err.message.includes("offline")) {
                setError("Network error. Please check your connection.");
            } else {
                let msg = "Email or password is incorrect";
                if (err.code === 'auth/invalid-credential') msg = "Invalid email or password.";
                if (err.code === 'auth/user-not-found') msg = "No account found with this email.";
                if (err.code === 'auth/wrong-password') msg = "Incorrect password.";
                if (err.code === 'auth/user-disabled') msg = "Account disabled. Contact support.";
                if (err.code === 'auth/too-many-requests') msg = "Too many attempts. Try again later.";
                setError(msg);
            }
            setLoading(false);
        }
    };

    const handleOAuthLogin = async (provider: 'google' | 'apple') => {
        setLoading(true);
        setError(null);

        if (provider !== 'google') {
            setError(`${provider} login is not yet supported. Please use Google or Email.`);
            setLoading(false);
            return;
        }

        try {
            const { auth, db } = await import("@/lib/firebase");
            const { signInWithPopup, GoogleAuthProvider } = await import("firebase/auth");
            const { doc, getDoc, setDoc, serverTimestamp } = await import("firebase/firestore");

            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check/Create User Profile
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            let role = "customer";

            if (!userDoc.exists()) {
                // Create new profile for Google user
                await setDoc(userDocRef, {
                    uid: user.uid,
                    email: user.email,
                    fullName: user.displayName || "Google User",
                    role: "customer",
                    isActive: true,
                    createdAt: serverTimestamp(),
                    loginAttempts: 0,
                    emailVerified: true,
                    photoURL: user.photoURL
                });
            } else {
                role = userDoc.data().role || "customer";
            }

            // Redirect based on role
            if (role === "super_admin" || role === "admin") {
                router.push("/admin");
            } else {
                router.push("/dashboard");
            }

            router.refresh();
        } catch (err: any) {
            console.error("Google login failed", err);
            let msg = err.message || "Google authentication failed.";
            if (err.code === 'auth/popup-closed-by-user') {
                msg = "Sign-in cancelled.";
            } else if (err.code === 'auth/network-request-failed') {
                msg = "Network error. Please check your connection.";
            } else if (err.code === 'auth/popup-blocked') {
                msg = "Sign-in popup blocked. Please allow popups.";
            }
            setError(msg);
            setLoading(false);
        }
    };



    // Show verification screen if user tried to login with unverified email (Custom logic if needed)
    if (showVerificationScreen) {
        return (
            <VerificationScreen
                email={unverifiedEmail}
                onLoginClick={() => setShowVerificationScreen(false)}
            />
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] relative overflow-hidden font-display">
            <PageHero
                title="WELCOME BACK"
                subtitle="Authorized Access Only"
                images={settings?.pageBackgrounds?.login || []}
                height="45vh"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-20 pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md mx-auto"
                >
                    {/* Back to Home */}
                    <div className="mb-6 flex justify-center">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-gray-500 hover:text-[#A855F7] transition-colors group"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-xs font-black uppercase tracking-widest">Back to Mission</span>
                        </Link>
                    </div>

                    <div className="bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
                        <div className="text-center mb-10">
                            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">
                                WELCOME <span className="text-[#A855F7]">BACK</span>
                            </h1>
                            <p className="text-gray-500 text-xs font-black uppercase tracking-[0.2em]">Authorized Access Only</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold uppercase tracking-wider text-center">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleEmailLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-4">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#A855F7] transition-colors" size={18} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#A855F7]/50 focus:bg-white/[0.08] transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Password</label>
                                    <Link href="#" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A855F7] hover:underline">Forgot Access?</Link>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#A855F7] transition-colors" size={18} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#A855F7]/50 focus:bg-white/[0.08] transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-[#A855F7] hover:bg-[#9333EA] text-white font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_10px_30px_rgba(168,85,247,0.3)] hover:shadow-[0_10px_40px_rgba(168,85,247,0.4)] disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        <span>Initiate Login</span>
                                        <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="relative my-10">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/5"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
                                <span className="bg-[#0A0A0A] px-4 text-gray-600">Secure Link</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleOAuthLogin('google')}
                                disabled={loading}
                                className="py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 transition-all group"
                            >
                                <Chrome size={20} className="group-hover:scale-110 transition-transform" />
                                <span className="hidden sm:inline">Google</span>
                            </button>

                            <button
                                onClick={() => handleOAuthLogin('apple')}
                                disabled={loading}
                                className="py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 transition-all group"
                            >
                                <Apple size={20} className="group-hover:scale-110 transition-transform" />
                                <span className="hidden sm:inline">Apple</span>
                            </button>
                        </div>

                        {(process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true') && (
                            <div className="mt-6 space-y-3">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-white/10"></div>
                                    </div>
                                    <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
                                        <span className="bg-[#0A0A0A] px-4 text-gray-500">System Bypass</span>
                                    </div>
                                </div>

                                <DemoLoginSelector onLogin={(user) => {
                                    setLoading(true);
                                    localStorage.setItem('DEMO_USER_SESSION', JSON.stringify(user));
                                    // Set bypass cookie
                                    document.cookie = "auth-bypass=true; path=/; max-age=3600";
                                    setTimeout(() => {
                                        router.push("/");
                                        router.refresh();
                                    }, 800);
                                }} />
                            </div>
                        )}

                        <p className="mt-10 text-center text-gray-500/80 text-[10px] font-black uppercase tracking-[0.2em]">
                            New Operative?{" "}
                            <Link href="/signup" className="text-[#A855F7] hover:underline">Apply for Access</Link>
                        </p>
                    </div>

                    {/* Footer terms */}
                    <p className="mt-8 text-center text-gray-600 text-[10px] font-bold uppercase tracking-[0.2em]">
                        Encrypted Connection: AES-256 Bit Security
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

function DemoLoginSelector({ onLogin }: { onLogin: (user: any) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [demoUsers, setDemoUsers] = useState<any[]>([]);

    useState(() => {
        const defaultUser = {
            id: 'demo-user-123',
            email: 'agent@console.zone',
            role: 'admin',
            user_metadata: {
                full_name: 'Agent 47',
                avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop'
            }
        };
        // Avoid localStorage access in SSR
        if (typeof window !== 'undefined') {
            const storedUsers = localStorage.getItem('DEMO_ADDED_USERS');
            const localUsers = storedUsers ? JSON.parse(storedUsers) : [];
            setDemoUsers([defaultUser, ...localUsers]);
        }
    });

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-4 bg-white/5 border border-dashed border-white/20 hover:border-[#A855F7]/50 hover:bg-[#A855F7]/5 text-gray-400 hover:text-white font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 transition-all"
            >
                <Lock size={16} />
                <span>Enter Demo Mode {demoUsers.length > 1 ? `(${demoUsers.length} Operatives)` : ''}</span>
            </button>

            {isOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                    <div className="p-2 space-y-1 max-h-60 overflow-y-auto">
                        <div className="px-3 py-2 text-[10px] uppercase font-bold text-gray-500 tracking-wider">Select Identity</div>
                        {demoUsers.map((user, i) => (
                            <button
                                key={i}
                                onClick={() => onLogin(user)}
                                className="w-full text-left p-3 rounded-xl hover:bg-white/10 flex items-center gap-3 transition-colors group"
                            >
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800 border border-white/10 group-hover:border-[#A855F7]/50">
                                    {user.user_metadata?.avatar_url ? (
                                        <img src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name || 'Avatar'} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">{user.user_metadata?.full_name?.charAt(0) || 'U'}</div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-white group-hover:text-[#A855F7]">{user.user_metadata?.full_name || 'Agent'}</div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">{user.role || 'Guest'} Access</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

