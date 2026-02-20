"use client";

export const dynamic = "force-dynamic";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { adminLogin, elevateUserWithSecret } from "@/services/admin-auth";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Mail, Lock, Loader2, AlertCircle, ShieldCheck, Terminal, Key, UserPlus, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

function AdminLoginContent() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showRecovery, setShowRecovery] = useState(false);
    const [recoverySecret, setRecoverySecret] = useState("");
    const [recoveryLoading, setRecoveryLoading] = useState(false);

    // Unused but kept for structure
    // const [tempUserId, setTempUserId] = useState<string | null>(null);

    const router = useRouter();
    const searchParams = useSearchParams();
    const { refreshUserProfile, error: contextError } = useAuth();

    const redirectUrl = searchParams?.get("redirect") || "/admin";
    const urlError = searchParams?.get("error");

    // Combine local and context errors
    const displayError = error || (contextError ? contextError.message : null) || urlError;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setShowRecovery(false);

        try {
            const ipAddress = "client-ip";
            const response = await adminLogin(email, password, ipAddress);
            await refreshUserProfile();

            // Role-based redirection logic
            const role = response.userData.role;
            if (role === "super_admin") {
                router.push("/admin"); // Represents super-admin-dashboard
            } else if (role === "admin") {
                router.push("/admin"); // Represents admin-dashboard
            } else if (role === "customer") {
                router.push("/dashboard"); // Customer dashboard
            } else {
                router.push("/"); // Default fallback
            }
        } catch (err: any) {
            console.error("Admin login failed:", err);

            if (err.message === "INS_LEVEL_CLEARANCE") {
                setError("Account identified, but lacks administrative clearance.");
                setShowRecovery(true);
                // Keep track of the user ID for elevation
            } else if (err.message.includes("disabled")) {
                setError("Your account has been disabled. Contact super admin.");
            } else if (err.message.includes("not found") || err.message.includes("Invalid login credentials")) {
                setError("Invalid email or password");
            } else if (err.message.includes("Initialization failed")) {
                setError("Database synchronization error. Please try again.");
            } else {
                setError(err.message || "Authentication failed");
            }
            setLoading(false);
        }
    };

    const handleRecoveryElevation = async (e: React.FormEvent) => {
        e.preventDefault();
        setRecoveryLoading(true);
        setError(null);

        try {
            const { auth } = await import("@/lib/firebase");
            const user = auth.currentUser;

            if (!user) {
                throw new Error("Please login again before attempting recovery.");
            }

            await elevateUserWithSecret(user.uid, recoverySecret);

            setError(null);
            setShowRecovery(false);
            router.push(redirectUrl);
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Recovery elevation failed");
        } finally {
            setRecoveryLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] relative overflow-hidden font-display flex items-center justify-center">
            {/* Background effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-md px-4"
            >
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-block p-4 bg-[#A855F7]/20 border-2 border-[#A855F7]/40 rounded-2xl mb-4">
                        <Shield className="text-[#A855F7]" size={48} />
                    </div>
                    <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">
                        Admin Portal
                    </h1>
                    <p className="text-gray-500 text-xs font-black uppercase tracking-[0.2em]">
                        Authorized Access Only
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {!showRecovery ? (
                        <motion.div
                            key="login-form"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl"
                        >
                            <form onSubmit={handleLogin} className="space-y-6">
                                <div>
                                    <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={20} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#A855F7]/50 focus:bg-white/10 transition-all font-medium"
                                            placeholder="admin@example.com"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={20} />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#A855F7]/50 focus:bg-white/10 transition-all font-medium"
                                            placeholder="••••••••"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                {/* Error Message */}
                                {displayError && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                                        <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={16} />
                                        <div className="space-y-1">
                                            <p className="text-red-500 text-xs font-bold uppercase tracking-wider">
                                                Authentication Error
                                            </p>
                                            <p className="text-red-400/80 text-[10px] leading-relaxed">
                                                {displayError}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-gradient-to-r from-[#A855F7] to-[#9333EA] hover:from-[#9333EA] hover:to-[#7E22CE] text-white font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-[0_10px_30px_rgba(168,85,247,0.3)] hover:shadow-[0_10px_40px_rgba(168,85,247,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Authenticating...
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck size={20} />
                                            Secure Login
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="recovery-form"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-[#0A0A0A]/90 backdrop-blur-2xl border border-red-500/20 rounded-[2rem] p-8 shadow-2xl"
                        >
                            <div className="text-center mb-6">
                                <div className="inline-block p-3 bg-red-500/10 rounded-full mb-4">
                                    <Terminal className="text-red-500" size={32} />
                                </div>
                                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Emergency Bypass</h2>
                                <p className="text-gray-500 text-[10px] font-bold uppercase mt-1">Access recovery terminal detected</p>
                            </div>

                            <form onSubmit={handleRecoveryElevation} className="space-y-6">
                                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl text-xs text-red-200/60 leading-relaxed italic">
                                    Account authenticated but lacks [ADMIN_CLEARANCE]. Use emergency recovery secret to elevate this identifier to Super Admin status.
                                </div>

                                <div>
                                    <label className="block text-red-500/50 text-[10px] font-black uppercase tracking-widest mb-2">
                                        Recovery Secret
                                    </label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500/30" size={18} />
                                        <input
                                            type="password"
                                            value={recoverySecret}
                                            onChange={(e) => setRecoverySecret(e.target.value)}
                                            required
                                            className="w-full bg-red-500/5 border border-red-500/20 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-red-500/20 focus:outline-none focus:border-red-500/50 focus:bg-red-500/10 transition-all font-mono text-sm"
                                            placeholder="ENTER_NEXUS_KEY"
                                            disabled={recoveryLoading}
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                        <p className="text-red-500 text-[10px] font-black uppercase flex items-center gap-2">
                                            <AlertCircle size={14} />
                                            {error}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowRecovery(false)}
                                        className="py-3 bg-white/5 hover:bg-white/10 text-gray-400 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={recoveryLoading}
                                        className="py-3 bg-red-600 hover:bg-red-500 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {recoveryLoading ? (
                                            <Loader2 className="animate-spin" size={14} />
                                        ) : (
                                            <>
                                                <UserPlus size={14} />
                                                Elevate
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Back to customer site */}
                <div className="mt-6 pt-6 text-center">
                    <Link
                        href="/"
                        className="text-gray-500 hover:text-[#A855F7] text-sm font-bold uppercase tracking-wider transition-colors"
                    >
                        ← Back to Main Site
                    </Link>
                </div>

                {/* Security notice */}
                <p className="text-center text-gray-600 text-[10px] font-bold uppercase tracking-tighter mt-8 opacity-40">
                    🔒 Neural Link Secured • [AES-256-GCM] • Node: 0xCZ-SYS
                </p>
            </motion.div>
        </div>
    );
}

export default function AdminLoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <AdminLoginContent />
        </Suspense>
    );
}
