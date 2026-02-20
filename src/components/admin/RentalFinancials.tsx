"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, Wallet, AlertCircle, Briefcase, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/utils/format";

export function RentalFinancials({ variant = 'sidebar', onNavigate }: { variant?: 'sidebar' | 'topbar', onNavigate?: () => void }) {
    const [timeRange, setTimeRange] = useState<'WEEK' | 'MONTH'>('MONTH');

    // Mock Data for Charts (could be moved to a shared hook/service)
    const data = [
        { date: 'Jan 1', amount: 12000 },
        { date: 'Jan 5', amount: 15500 },
        { date: 'Jan 10', amount: 11000 },
        { date: 'Jan 15', amount: 18000 },
        { date: 'Jan 20', amount: 22000 },
        { date: 'Jan 25', amount: 19500 },
        { date: 'Jan 30', amount: 25000 },
    ];

    const maxVal = Math.max(...data.map(d => d.amount)) * 1.2;
    const height = 100;
    const getX = (i: number) => (i / (data.length - 1)) * 100;
    const getY = (v: number) => height - (v / maxVal) * height;
    const points = data.map((d, i) => `${getX(i)},${getY(d.amount)}`).join(" ");

    if (variant === 'topbar') {
        return (
            <div
                className="flex gap-4 items-center cursor-pointer hover:bg-white/5 rounded-xl transition-colors p-1 pr-4"
                onClick={onNavigate}
                role="button"
                title="Open Financial Ledger"
            >
                {/* 1. Realized Revenue */}
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2 pointer-events-none">
                    <div className="p-1.5 bg-[#8B5CF6]/10 rounded-lg">
                        <DollarSign size={14} className="text-[#8B5CF6]" />
                    </div>
                    <div>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider leading-none">Revenue</p>
                        <p className="text-sm font-black text-white">{formatCurrency(124500)}</p>
                    </div>
                </div>

                {/* 2. Active Portfolio */}
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2 pointer-events-none">
                    <div className="p-1.5 bg-[#06B6D4]/10 rounded-lg">
                        <Briefcase size={14} className="text-[#06B6D4]" />
                    </div>
                    <div>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider leading-none">Portfolio</p>
                        <p className="text-sm font-black text-white">{formatCurrency(85200)}</p>
                    </div>
                </div>

                {/* 3. Fines */}
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2 pointer-events-none">
                    <div className="p-1.5 bg-[#F59E0B]/10 rounded-lg">
                        <AlertTriangle size={14} className="text-[#F59E0B]" />
                    </div>
                    <div>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider leading-none">Fines</p>
                        <p className="text-sm font-black text-white">{formatCurrency(4500)}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* ... existing sidebar code ... */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                    <DollarSign size={48} className="text-[#8B5CF6]" />
                </div>
                <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Realized Revenue</h3>
                <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-2xl font-black text-white">{formatCurrency(124500)}</span>
                    <span className="text-[9px] font-bold text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                        <TrendingUp size={8} /> +12%
                    </span>
                </div>
                <div className="h-12 w-full opacity-30">
                    <svg viewBox={`0 0 100 ${height}`} className="w-full h-full overflow-visible">
                        <path d={`M${points}`} fill="none" stroke="#8B5CF6" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                        <path d={`M${points} L100,${height} L0,${height} Z`} fill="#8B5CF6" fillOpacity="0.1" />
                    </svg>
                </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Wallet size={48} className="text-[#06B6D4]" />
                </div>
                <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Active Portfolio</h3>
                <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-2xl font-black text-white">{formatCurrency(85200)}</span>
                </div>
                <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-gray-500 font-medium">
                        <span>Utilization</span>
                        <span className="text-white">78%</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#06B6D4] w-[78%] rounded-full shadow-[0_0_8px_rgba(6,182,212,0.4)]"></div>
                    </div>
                </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                    <AlertCircle size={48} className="text-[#F59E0B]" />
                </div>
                <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Overdue Fines</h3>
                <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-2xl font-black text-white">{formatCurrency(4500)}</span>
                    <span className="text-[9px] font-bold text-[#F59E0B] bg-[#F59E0B]/10 px-1.5 py-0.5 rounded-full">Pending</span>
                </div>
                <div className="text-[10px] text-gray-500 space-y-0.5">
                    <p>3 Active Overdue Rentals</p>
                    <p>Avg. Delay: <span className="text-white font-bold">2.4 Days</span></p>
                </div>
            </div>
        </div>
    );
}
