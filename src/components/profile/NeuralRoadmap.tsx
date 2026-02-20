"use client";

import { motion } from "framer-motion";
import { NEURAL_TIERS, NeuralSyncService } from "@/services/neural-sync";
import { Zap, Shield, CheckCircle2, Lock, ArrowRight, Star } from "lucide-react";

interface NeuralRoadmapProps {
    xp: number;
}

export default function NeuralRoadmap({ xp }: NeuralRoadmapProps) {
    const currentTier = NeuralSyncService.getCurrentTier(xp);
    const nextTierInfo = NeuralSyncService.getNextTier(xp);

    return (
        <div className="space-y-12 py-8">
            {/* Roadmap Container */}
            <div className="relative">
                {/* Connection Line */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 -translate-y-1/2 hidden md:block" />
                <div
                    className="absolute top-1/2 left-0 h-1 bg-[#A855F7] -translate-y-1/2 transition-all duration-1000 hidden md:block shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                    style={{ width: `${Math.min(100, (xp / NEURAL_TIERS[NEURAL_TIERS.length - 1].minXp) * 100)}%` }}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                    {NEURAL_TIERS.map((tier, idx) => {
                        const isUnlocked = xp >= tier.minXp;
                        const isCurrent = currentTier.name === tier.name;
                        const isNext = nextTierInfo?.tier.name === tier.name;

                        return (
                            <motion.div
                                key={tier.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.2 }}
                                className={`relative p-6 rounded-3xl border transition-all duration-500 ${isCurrent
                                    ? 'bg-[#A855F7]/10 border-[#A855F7] shadow-[0_0_30px_rgba(168,85,247,0.15)] ring-1 ring-[#A855F7]/50'
                                    : isUnlocked
                                        ? 'bg-emerald-500/5 border-emerald-500/20'
                                        : 'bg-white/[0.02] border-white/5'
                                    }`}
                            >
                                {/* Status Indicator (on the line) */}
                                <div className={`absolute -top-10 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-4 hidden md:flex items-center justify-center transition-colors duration-500 ${isUnlocked ? 'bg-emerald-500 border-black' : 'bg-[#0a0a0a] border-white/10'
                                    }`}>
                                    {isUnlocked && <CheckCircle2 size={12} className="text-white" />}
                                </div>

                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isUnlocked ? 'text-emerald-500' : 'text-gray-500'
                                                }`}>
                                                {isUnlocked ? 'Protocol Unlocked' : 'Protocol Locked'}
                                            </span>
                                            {isCurrent && (
                                                <motion.div
                                                    animate={{ opacity: [0, 1, 0] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className="w-1.5 h-1.5 rounded-full bg-[#A855F7]"
                                                />
                                            )}
                                        </div>
                                        <h3 className={`text-xl font-black italic uppercase tracking-tighter ${isUnlocked ? 'text-white' : 'text-gray-600'
                                            }`}>
                                            {tier.name}
                                        </h3>
                                    </div>
                                    <div className={`p-2 rounded-xl ${isUnlocked ? 'bg-white/5 text-white' : 'bg-white/5 text-gray-700'
                                        }`}>
                                        {isUnlocked ? <Zap size={18} /> : <Lock size={18} />}
                                    </div>
                                </div>

                                {/* Perk List */}
                                <div className="space-y-3 mt-6">
                                    {tier.perks.map((perk, pIdx) => (
                                        <div key={pIdx} className="flex gap-2 items-start">
                                            <Star size={10} className={`mt-0.5 shrink-0 ${isUnlocked ? 'text-[#A855F7]' : 'text-gray-800'}`} />
                                            <span className={`text-[10px] font-bold uppercase tracking-wide leading-tight ${isUnlocked ? 'text-gray-300' : 'text-gray-700'
                                                }`}>
                                                {perk}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {isNext && (
                                    <div className="mt-8 pt-4 border-t border-[#A855F7]/20">
                                        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#A855F7]">
                                            Distance to Node: {nextTierInfo.xpNeeded} XP
                                        </p>
                                        <div className="mt-2 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(xp / tier.minXp) * 100}%` }}
                                                className="h-full bg-[#A855F7]"
                                            />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Summary Footer */}
            <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#A855F7]">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h4 className="text-white font-black uppercase italic tracking-widest text-sm">Security Clearance: {currentTier.name}</h4>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">Operational ID: {xp} SYNC_UNITS</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all">
                        Manual Sync
                    </button>
                    <button className="px-6 py-2 bg-[#A855F7] hover:bg-[#9333EA] border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                        Claim Mission Rewards
                    </button>
                </div>
            </div>
        </div>
    );
}
