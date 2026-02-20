"use client";

import { useState } from "react";
import { Shield, Check, Star, Zap } from "lucide-react";
import { PROTECTION_PLANS, ProtectionPlanType, calculateProtectionCost } from "@/services/protection";
import { motion } from "framer-motion";

interface ProtectionPlanSelectorProps {
    rentalDays: number;
    selectedPlan: ProtectionPlanType;
    onSelectPlan: (planId: ProtectionPlanType) => void;
}

export function ProtectionPlanSelector({
    rentalDays,
    selectedPlan,
    onSelectPlan
}: ProtectionPlanSelectorProps) {

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                        <Shield size={20} className="text-[#A855F7]" />
                        Protection Plans
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Optional damage & theft coverage</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {PROTECTION_PLANS.map((plan) => {
                    const totalCost = calculateProtectionCost(plan.id, rentalDays);
                    const isSelected = selectedPlan === plan.id;
                    const isRecommended = plan.badge === 'Most Popular';

                    return (
                        <motion.div
                            key={plan.id}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => onSelectPlan(plan.id)}
                            className={`
                                relative p-4 rounded-xl border cursor-pointer transition-all
                                ${isSelected
                                    ? 'bg-[#A855F7]/10 border-[#A855F7] ring-2 ring-[#A855F7]/50'
                                    : 'bg-[#0a0a0a] border-white/10 hover:border-[#A855F7]/50'
                                }
                            `}
                        >
                            {/* Badge */}
                            {plan.badge && (
                                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-[#A855F7] to-[#8B5CF6] text-white text-[8px] font-black uppercase px-2 py-1 rounded-full shadow-lg">
                                    {plan.badge}
                                </div>
                            )}

                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                    {/* Plan Header */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`
                                            w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                                            ${isSelected
                                                ? 'bg-[#A855F7] border-[#A855F7]'
                                                : 'border-white/20 bg-white/5'
                                            }
                                        `}>
                                            {isSelected && <Check size={12} className="text-black" />}
                                        </div>
                                        <h4 className="font-bold text-white uppercase tracking-tight">{plan.name}</h4>
                                    </div>

                                    {/* Description */}
                                    <p className="text-xs text-gray-400 mb-3">{plan.description}</p>

                                    {/* Features */}
                                    <div className="space-y-1.5">
                                        {plan.features.slice(0, 3).map((feature, idx) => (
                                            <div key={idx} className="flex items-start gap-2">
                                                <Check size={12} className={`mt-0.5 ${isSelected ? 'text-[#A855F7]' : 'text-gray-600'}`} />
                                                <span className="text-[10px] text-gray-400">{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className="text-right">
                                    {plan.dailyRate > 0 ? (
                                        <>
                                            <div className="text-2xl font-black text-white">
                                                +₹{plan.dailyRate}
                                            </div>
                                            <div className="text-[9px] text-gray-500 font-mono">/day</div>
                                            {rentalDays > 1 && (
                                                <div className="mt-1 text-xs text-gray-400">
                                                    ₹{totalCost} total
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-lg font-black text-gray-600">
                                            FREE
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Coverage Badge */}
                            {plan.coveragePercentage > 0 && (
                                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[9px] text-gray-500 uppercase tracking-widest">Coverage</span>
                                    <span className={`text-xs font-black ${isSelected ? 'text-[#A855F7]' : 'text-emerald-500'}`}>
                                        {plan.coveragePercentage}% up to ₹{plan.maxCoverage.toLocaleString()}
                                    </span>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Info Footer */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-3">
                <div className="bg-blue-500/20 p-2 rounded-lg text-blue-500 flex-shrink-0">
                    <Shield size={16} />
                </div>
                <div>
                    <h5 className="text-xs font-bold text-white mb-1">Why choose protection?</h5>
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                        Accidents happen. Protect yourself from unexpected damage costs with our comprehensive coverage plans. Claims are processed within 24 hours.
                    </p>
                </div>
            </div>
        </div>
    );
}
