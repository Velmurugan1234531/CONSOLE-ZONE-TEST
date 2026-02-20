"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Mail } from "lucide-react";

interface VerificationScreenProps {
    email: string;
    onLoginClick?: () => void;
}

export default function VerificationScreen({ email, onLoginClick }: VerificationScreenProps) {
    return (
        <div className="min-h-screen bg-[#050505] relative overflow-hidden font-display flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md mx-auto bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 text-center shadow-2xl"
            >
                <div className="w-20 h-20 bg-[#A855F7]/20 border border-[#A855F7]/40 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Mail className="text-[#A855F7]" size={32} />
                </div>

                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-4">
                    Email Verification
                </h2>

                <p className="text-gray-400 text-sm leading-relaxed mb-8 font-medium">
                    We have sent you a verification email to{" "}
                    <span className="text-white font-bold">{email}</span>.{" "}
                    Please verify it and log in.
                </p>

                {onLoginClick ? (
                    <button
                        onClick={onLoginClick}
                        className="w-full py-5 bg-[#A855F7] text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-[0_10px_30px_rgba(168,85,247,0.3)] hover:shadow-[0_10px_40px_rgba(168,85,247,0.4)] hover:bg-[#9333EA]"
                    >
                        Login
                    </button>
                ) : (
                    <Link href="/login">
                        <button className="w-full py-5 bg-[#A855F7] text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-[0_10px_30px_rgba(168,85,247,0.3)] hover:shadow-[0_10px_40px_rgba(168,85,247,0.4)] hover:bg-[#9333EA]">
                            Login
                        </button>
                    </Link>
                )}
            </motion.div>
        </div>
    );
}
