"use client";

import { motion } from "framer-motion";
import { NeuralSyncService, NeuralTier } from "@/services/neural-sync";
import { Zap, Shield, TrendingUp, Cpu } from "lucide-react";

interface NeuralSyncCardProps {
    xp: number;
}

export default function NeuralSyncCard({ xp }: NeuralSyncCardProps) {
    const currentTier = NeuralSyncService.getCurrentTier(xp);
    const nextTierInfo = NeuralSyncService.getNextTier(xp);

    const progress = nextTierInfo
        ? ((xp - (currentTier.minXp)) / (nextTierInfo.tier.minXp - currentTier.minXp)) * 100
        : 100;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 relative overflow-hidden group"
        >
            {/* Background Decorative Element */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] group-hover:bg-purple-600/20 transition-all duration-700" />

            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
                {/* Progress Hexagon / Circle */}
                <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="64"
                            cy="64"
                            r="58"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            className="text-white/5"
                        />
                        <motion.circle
                            cx="64"
                            cy="64"
                            r="58"
                            stroke={currentTier.color}
                            strokeWidth="4"
                            fill="transparent"
                            strokeDasharray={364.4}
                            initial={{ strokeDashoffset: 364.4 }}
                            animate={{ strokeDashoffset: 364.4 - (364.4 * progress) / 100 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="drop-shadow-[0_0_8px_var(--tier-color)]"
                            style={{ "--tier-color": currentTier.color } as any}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-white italic">{xp}</span>
                        <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">XP</span>
                    </div>
                </div>

                <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div
                            className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg"
                            style={{ backgroundColor: `${currentTier.color}20`, border: `1px solid ${currentTier.color}50`, color: currentTier.color }}
                        >
                            <Cpu size={14} />
                            Tier: {currentTier.name}
                        </div>
                        {nextTierInfo && (
                            <span className="text-xs text-white/40 font-bold">
                                Next: {nextTierInfo.tier.name} in {nextTierInfo.xpNeeded} XP
                            </span>
                        )}
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-black">Active Neural Perks</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {currentTier.perks.map((perk, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs text-white/70">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentTier.color }} />
                                    {perk}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-auto flex flex-col gap-2">
                    <button className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95">
                        <TrendingUp size={14} />
                        View Rewards
                    </button>
                    <button className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-500/30 px-6 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95">
                        <Zap size={14} />
                        Sync Data
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
