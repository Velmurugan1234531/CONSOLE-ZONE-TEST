"use client";

import { useState } from "react";
import { Plus, Minus, Gamepad2, AlertCircle, RefreshCw, Bell, BellOff, Trash2, Pencil, X, Save, Upload, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StockItem {
    id: string;
    name: string;
    total: number;
    rented: number;
    image: string;
    label?: string;
    lowStockAlert?: boolean;
    maxControllers?: number;
    extraControllerEnabled?: boolean;
}

import { StockService } from "@/services/stock";

export function ConsoleStockManager({ variant = 'sidebar', onNavigate }: { variant?: 'sidebar' | 'topbar', onNavigate?: () => void }) {
    // Real-time Stock Data from Service
    const stock = StockService.useStock();

    if (variant === 'topbar') {
        return (
            <div
                className="flex gap-2 items-center overflow-x-auto no-scrollbar py-1 cursor-pointer hover:bg-white/5 rounded-xl transition-colors pr-4"
                onClick={onNavigate}
                role="button"
                title="Open Fleet Manager"
            >
                {stock.map((item) => {
                    const available = item.total - item.rented;
                    const utilization = Math.round((item.rented / item.total) * 100);
                    let statusColor = "#10B981";
                    if (utilization > 50) statusColor = "#F59E0B";
                    if (utilization > 85) statusColor = "#EF4444";

                    return (
                        <div key={item.id} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-2 py-1.5 shrink-0 pointer-events-none">
                            <div className="w-6 h-6 rounded bg-black overflow-hidden border border-white/5">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <p className="text-[8px] text-gray-400 font-bold uppercase truncate max-w-[80px] leading-tight" title={item.name}>{item.name}</p>
                                <div className="flex items-center gap-1 leading-none">
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }}></span>
                                    <span className="text-[10px] font-black text-white">{Math.max(0, available)}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 relative overflow-hidden">
            {/* Header */}
            <div className="flex flex-col gap-4 mb-6 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                        <Gamepad2 size={18} className="text-[#8B5CF6]" />
                    </div>
                    <div>
                        <h3 className="text-white font-black uppercase tracking-tight text-sm">Fleet Status</h3>
                        <p className="text-gray-500 text-[9px] tracking-wide uppercase font-bold">Real-time Summary</p>
                    </div>
                </div>
            </div>

            {/* List View */}
            <div className="space-y-4 relative z-10">
                {stock.map((item) => {
                    const available = item.total - item.rented;
                    const utilization = Math.round((item.rented / item.total) * 100);

                    // Status Color Logic
                    let statusColor = "#10B981"; // Green
                    if (utilization > 50) statusColor = "#F59E0B"; // Yellow
                    if (utilization > 85) statusColor = "#EF4444"; // Red

                    return (
                        <div key={item.id} className="group relative bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-xl p-3 transition-all duration-300">
                            <div className="flex flex-col gap-3">
                                {/* 1. Identity */}
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-black overflow-hidden border border-white/10 shrink-0">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-white text-xs truncate">{item.name}</div>
                                            <div className="text-[9px] text-gray-500 flex items-center gap-1 mt-0.5">
                                                <span
                                                    className="w-1 h-1 rounded-full animate-pulse"
                                                    style={{ backgroundColor: statusColor, boxShadow: `0 0 5px ${statusColor}` }}
                                                ></span>
                                                {available} Available
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-mono font-bold text-white px-1 bg-black/40 rounded border border-white/5">
                                        {item.rented}/{item.total}
                                    </div>
                                </div>

                                {/* 2. Utilization */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-500">
                                        <span>Utilization</span>
                                        <span style={{ color: statusColor }}>{utilization}%</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: statusColor }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${utilization}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
