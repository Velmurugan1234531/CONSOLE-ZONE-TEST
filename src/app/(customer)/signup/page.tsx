"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, Mail, Lock, Chrome, ArrowLeft, User, Apple } from "lucide-react";
import PageHero from "@/components/layout/PageHero";
import { useVisuals } from "@/context/visuals-context";
import VerificationScreen from "@/components/VerificationScreen";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const { settings } = useVisuals();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Create Authentication User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await updateProfile(user, { displayName: fullName });

            // 2. Create User Profile in Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                fullName: fullName,
                role: 'customer', // Default role
                isActive: true,
                createdAt: serverTimestamp(),
                loginAttempts: 0,
                emailVerified: false
            });

            setSuccess(true);
            setLoading(false);
        } catch (err: any) {
            let msg = "Registration failed. Please try again.";
            if (err.code === 'auth/email-already-in-use') {
                msg = "This email is already registered. Please log in instead.";
            } else if (err.code === 'auth/weak-password') {
                msg = "Password should be at least 6 characters.";
            } else if (err.code === 'auth/invalid-email') {
                msg = "Please enter a valid email address.";
            } else {
                // Only log unexpected errors
                console.error("Signup failed:", err.code, err.message);
            }
            setError(msg);
            setLoading(false);
        }
    };

    const handleOAuthLogin = async (providerName: 'google' | 'apple') => {
        setLoading(true);
        setError(null);

        if (providerName !== 'google') {
            setError(`${providerName} signup is not yet supported. Please use Google or Email.`);
            setLoading(false);
            return;
        }

        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check/Create User Profile
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
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
            }

            setSuccess(true);
            setLoading(false);
        } catch (err: any) {
            console.error("Google signup failed", err);
            let msg = err.message || "Google registration failed.";
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

    if (success) {
        return <VerificationScreen email={email} />;
    }

    return (
        <div className="min-h-screen bg-[#050505] relative overflow-hidden font-display">
            <PageHero
                title="JOIN THE ZONE"
                subtitle="New Operative Enlistment"
                images={settings?.pageBackgrounds?.signup || []}
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
                            <span className="text-xs font-black uppercase tracking-widest">Back to Hub</span>
                        </Link>
                    </div>

                    <div className="bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
                        <div className="text-center mb-10">
                            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">
                                JOIN THE <span className="text-[#A855F7]">ZONE</span>
                            </h1>
                            <p className="text-gray-500 text-xs font-black uppercase tracking-[0.2em]">New Operative Enlistment</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold uppercase tracking-wider text-center">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSignup} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-4">Full Name</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#A855F7] transition-colors" size={18} />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Enter your name"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#A855F7]/50 focus:bg-white/[0.08] transition-all"
                                        required
                                    />
                                </div>
                            </div>

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
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-4">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#A855F7] transition-colors" size={18} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Minimum 6 characters"
                                        minLength={6}
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
                                        <span>Complete Enlistment</span>
                                        <UserPlus size={20} className="group-hover:translate-x-1 transition-transform" />
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

                        <p className="mt-10 text-center text-gray-500/80 text-[10px] font-black uppercase tracking-[0.2em]">
                            Already enroled?{" "}
                            <Link href="/login" className="text-[#A855F7] hover:underline">Return to Mission</Link>
                        </p>
                    </div>

                    {/* Footer terms */}
                    <p className="mt-8 text-center text-gray-600 text-[10px] font-bold uppercase tracking-[0.2em]">
                        By joining, you agree to our Terms of Engagement
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
