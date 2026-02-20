"use client";

import React from "react";
import { MapPin, ShieldAlert, Navigation, Settings, X, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LocationModalProps {
    onEnable: () => void;
    status: "idle" | "requesting" | "denied" | "granted";
    error?: string;
}

export default function LocationModal({ onEnable, status, error }: LocationModalProps) {
    // Development bypass: Skip location requirement in dev mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (status === "granted" || isDevelopment) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden">
            {/* Blurred Background */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-md pointer-events-none"
            />

            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="relative w-full max-w-[320px] mx-4 bg-[#1F1F1F] rounded-xl shadow-2xl overflow-hidden text-white border border-white/5"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm font-medium text-gray-200 truncate">
                        mission.console.zone wants to
                    </span>
                    <button
                        onClick={() => window.location.href = 'https://google.com'}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={16} className="text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-5 pb-6 space-y-5">
                    <div className="flex items-center gap-3 py-2">
                        <div className="p-1.5 bg-transparent border border-gray-600 rounded-full shadow-sm">
                            <MapPin size={18} className="text-gray-300 fill-gray-300/20" />
                        </div>
                        <span className="text-lg font-medium text-white tracking-tight">
                            Know your location
                        </span>
                    </div>

                    {status === "denied" && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                        >
                            <p className="text-[10px] text-red-400 font-bold uppercase mb-1">Access Blocked</p>
                            <p className="text-[11px] text-gray-300 leading-tight">
                                Location is mandatory for this app. Please enable it in your browser settings.
                            </p>
                        </motion.div>
                    )}

                    <div className="flex flex-col gap-2.5">
                        <button
                            onClick={onEnable}
                            disabled={status === "requesting"}
                            className="w-full py-3 bg-[#1A73E8] hover:bg-[#1967D2] text-white text-sm font-semibold rounded-full transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status === "requesting" ? "Locating..." : "Allow while visiting the site"}
                        </button>

                        <button
                            onClick={onEnable}
                            disabled={status === "requesting"}
                            className="w-full py-3 bg-[#1A73E8] hover:bg-[#1967D2] text-white text-sm font-semibold rounded-full transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Allow this time
                        </button>

                        <button
                            onClick={() => window.location.href = 'https://google.com'}
                            className="w-full py-3 bg-[#1A73E8] hover:bg-[#1967D2] text-white text-sm font-semibold rounded-full transition-all active:scale-[0.98]"
                        >
                            Never allow
                        </button>
                    </div>
                </div>

                {/* Subtle Scanline Effect */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
            </motion.div>
        </div>
    );
}
