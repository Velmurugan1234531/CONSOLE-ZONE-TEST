"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    AlertTriangle,
    Bell,
    ShoppingBag,
    Clock,
    Wrench,
    ShieldAlert,
    Activity,
    Zap,
    Target
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNeuralAlert } from "@/components/providers/NeuralAlertProvider";

export function TacticalHUDAlert() {
    const { activeAlert, dismissAlert } = useNeuralAlert();
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        if (!activeAlert) return;

        // Reset progress when a new alert appears
        setProgress(100);

        const duration = activeAlert.duration || 5000;
        const interval = 50; // Smoother 50ms interval (20fps is enough for this)
        const step = (100 / (duration / interval));

        const timer = setInterval(() => {
            setProgress(prev => {
                const next = prev - step;
                if (next <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                return next;
            });
        }, interval);

        return () => clearInterval(timer);
    }, [activeAlert]); // Re-run when alert changes

    // Separate effect to handle dismissal when progress hits 0
    // This avoids the "Cannot update a component while rendering" error
    useEffect(() => {
        if (progress === 0 && activeAlert) {
            dismissAlert();
        }
    }, [progress, activeAlert, dismissAlert]);

    if (!activeAlert) return null;

    const getIcon = () => {
        switch (activeAlert.type) {
            case "order": return <ShoppingBag className="text-emerald-500" size={48} />;
            case "rental": return <Clock className="text-blue-500" size={48} />;
            case "buyback": return <Zap className="text-orange-500" size={48} />;
            case "service": return <Wrench className="text-[#8B5CF6]" size={48} />;
            case "error": return <AlertTriangle className="text-red-500" size={48} />;
            default: return <Bell className="text-blue-400" size={48} />;
        }
    };

    const getTypeLabel = () => {
        switch (activeAlert.type) {
            case "order": return "COMMERCE_UPLINK";
            case "rental": return "RENTAL_DEPLOYMENT";
            case "buyback": return "STRATEGIC_PURCHASE";
            case "service": return "MAINTENANCE_SIGNAL";
            default: return "PRIORITY_SIGNAL";
        }
    };

    const getGlowColor = () => {
        switch (activeAlert.type) {
            case "order": return "rgba(16, 185, 129, 0.2)";
            case "rental": return "rgba(59, 130, 246, 0.2)";
            case "buyback": return "rgba(249, 115, 22, 0.2)";
            case "service": return "rgba(139, 92, 246, 0.2)";
            case "error": return "rgba(239, 68, 68, 0.2)";
            default: return "rgba(59, 130, 246, 0.2)";
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center p-6 bg-black/40 backdrop-blur-[2px]">
                {/* Visual Scanning Effect */}
                <motion.div
                    initial={{ y: "-100%" }}
                    animate={{ y: "100%" }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-px bg-[#8B5CF6]/50 z-0 shadow-[0_0_20px_#8B5CF6]"
                />

                <motion.div
                    initial={{ scale: 0.8, opacity: 0, rotateX: 45 }}
                    animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                    exit={{ scale: 0.8, opacity: 0, rotateX: -45 }}
                    className="relative w-full max-w-2xl bg-[#0a0a0a] border-y-4 border-[#8B5CF6] p-10 overflow-hidden pointer-events-auto shadow-[0_0_100px_rgba(139,92,246,0.3)]"
                    style={{
                        boxShadow: `0 0 80px ${getGlowColor()}`,
                        perspective: "1000px"
                    }}
                >
                    {/* Background Grid Accent */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(#8B5CF6 1px, transparent 1px), linear-gradient(90deg, #8B5CF6 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

                    {/* Scanlines Effect */}
                    <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,118,0.06))] z-10 bg-[length:100%_2px,3px_100%]" />

                    <div className="relative z-20">
                        {/* Header Stats */}
                        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                            <div className="flex items-center gap-3">
                                <ShieldAlert className="text-red-500 animate-pulse" size={16} />
                                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#8B5CF6]">Mission Critical</span>
                            </div>
                            <div className="flex items-center gap-4 text-gray-500 font-mono text-[10px]">
                                <span>ID: {activeAlert.id.toUpperCase()}</span>
                                <span>{new Date().toLocaleTimeString()}</span>
                            </div>
                        </div>

                        <div className="flex items-start gap-8">
                            <motion.div
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 4 }}
                                className="w-24 h-24 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center relative group"
                            >
                                <div className="absolute inset-0 bg-[#8B5CF6]/10 opacity-0 group-hover:opacity-100 transition-opacity blur-xl rounded-full" />
                                {getIcon()}
                            </motion.div>

                            <div className="flex-1 space-y-3">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8B5CF6] mb-1">
                                    {getTypeLabel()}
                                </h2>
                                <h3 className="text-4xl font-black uppercase italic tracking-tighter text-white leading-none">
                                    {activeAlert.title}
                                </h3>
                                <p className="text-lg text-gray-400 font-medium italic">
                                    {activeAlert.message}
                                </p>
                            </div>
                        </div>

                        {/* Footer / Timer */}
                        <div className="mt-12 space-y-4">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                                <div className="flex items-center gap-2">
                                    <Activity size={12} className="text-emerald-500" />
                                    <span>Signal Strength: Nominal</span>
                                </div>
                                <span>Dismiss in {(progress / 20).toFixed(1)}s</span>
                            </div>

                            <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-[#8B5CF6] to-blue-500 shadow-[0_0_10px_#8B5CF6]"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            <div className="flex justify-end gap-4 pt-4">
                                <button
                                    onClick={dismissAlert}
                                    className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-white/10 hover:text-white transition-all pointer-events-auto"
                                >
                                    Acknowledge
                                </button>
                                <button className="px-6 py-2 bg-[#8B5CF6] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:bg-[#7C3AED] transition-all flex items-center gap-2 pointer-events-auto">
                                    View Intel <Target size={12} />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
