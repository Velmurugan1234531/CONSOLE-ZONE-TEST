"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    TrendingUp, TrendingDown, Target, Zap,
    BarChart3, PieChart, Activity, Globe,
    ArrowUpRight, ArrowDownRight, RefreshCw,
    AlertCircle, DollarSign, ShoppingCart, Clock,
    Monitor, ChevronRight, LayoutDashboard, Database,
    Search, Filter, Sliders, Play, Pause, ExternalLink
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCommerceIntelligence, getLiveTransactionTicker } from "@/services/admin";
import { getMarketplaceSettings, saveMarketplaceSettings, syncMarketplaceSettings, type MarketplaceSettings } from "@/services/marketplace-settings";
import dynamic from 'next/dynamic';

const DashboardRevenueChart = dynamic(() => import("@/components/admin/AnalyticsCharts").then(mod => mod.DashboardRevenueChart), { ssr: false });

export default function CommerceNexusPage() {
    const [mounted, setMounted] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [settings, setSettings] = useState<MarketplaceSettings>(getMarketplaceSettings());
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const { data: intelligence } = useQuery({
        queryKey: ['commerceIntelligence'],
        queryFn: getCommerceIntelligence,
        refetchInterval: 30000
    });

    const { data: tickerData = [] } = useQuery({
        queryKey: ['transactionTicker'],
        queryFn: getLiveTransactionTicker,
        refetchInterval: 5000
    });

    const handleMultiplierChange = async (type: keyof MarketplaceSettings['multipliers'], val: number) => {
        const newSettings = {
            ...settings,
            multipliers: {
                ...settings.multipliers,
                [type]: val
            }
        };
        setSettings(newSettings);
        await saveMarketplaceSettings(newSettings);
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const synced = await syncMarketplaceSettings();
            setSettings(synced);
        } catch (e) {
            console.error("Sync failed", e);
        } finally {
            setTimeout(() => setIsSyncing(false), 1000);
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8 space-y-8 animate-in fade-in duration-700">
            {/* Header Hub */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.2)]">
                            <Globe className="text-[#8B5CF6] animate-pulse" size={28} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none">Commerce <span className="text-[#8B5CF6]">Nexus</span></h1>
                            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.4em] mt-1">Global Strategic Intelligence Node</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-6 py-3 backdrop-blur-md">
                    <div className="text-right">
                        <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">System Time</p>
                        <p className="text-xl font-mono font-black text-[#8B5CF6] leading-none">{currentTime.toLocaleTimeString()}</p>
                    </div>
                    <div className="h-8 w-px bg-white/10"></div>
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className={`p-2 rounded-xl transition-all ${isSyncing ? 'bg-[#8B5CF6] text-black animate-spin' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* Live Ticker */}
            <div className="bg-[#0a0a0a] border-y border-white/5 py-4 overflow-hidden relative group">
                <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#050505] to-transparent z-10"></div>
                <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#050505] to-transparent z-10"></div>

                <div className="flex animate-marquee whitespace-nowrap gap-12 items-center">
                    {tickerData.map((t, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${t.type === 'SALE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'} uppercase tracking-widest`}>
                                {t.type}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-gray-400">{t.customer}</span>
                            <span className="text-[10px] font-black text-white">₹{t.amount.toLocaleString()}</span>
                            <span className="text-[9px] text-gray-600 italic">{t.time}</span>
                            <div className="w-1 h-1 rounded-full bg-white/10 mx-2"></div>
                        </div>
                    ))}
                    {/* Repeat for seamlessness */}
                    {tickerData.map((t, i) => (
                        <div key={`dup-${i}`} className="flex items-center gap-3">
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${t.type === 'SALE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'} uppercase tracking-widest`}>
                                {t.type}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-gray-400">{t.customer}</span>
                            <span className="text-[10px] font-black text-white">₹{t.amount.toLocaleString()}</span>
                            <span className="text-[9px] text-gray-600 italic">{t.time}</span>
                            <div className="w-1 h-1 rounded-full bg-white/10 mx-2"></div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Intelligence & Trends */}
                <div className="lg:col-span-2 space-y-8">
                    {/* ROI Grid */}
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-8 space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#8B5CF6]/5 blur-[80px] -z-10"></div>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black uppercase italic tracking-tight">ROI Intelligence</h3>
                                <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">Profitability Across Asset Classes</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <PieChart size={18} className="text-[#8B5CF6]" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {intelligence?.roiData.map((roi, i) => (
                                <div key={i} className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl hover:border-white/10 transition-all group">
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">{roi.category}</p>
                                    <p className="text-2xl font-black text-white italic">₹{(roi.profit / 1000).toFixed(1)}k</p>
                                    <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000"
                                            style={{
                                                width: `${(roi.profit / 160000) * 100}%`,
                                                backgroundColor: roi.color,
                                                boxShadow: `0 0 10px ${roi.color}40`
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Market Trends */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-8 space-y-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-[#8B5CF6]">Market Demand Waves</h3>
                            <div className="space-y-4">
                                {intelligence?.marketDemand.map((trend, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${trend.trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {trend.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                            </div>
                                            <span className="text-[11px] font-bold text-gray-300 uppercase tracking-tight">{trend.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-white/20" style={{ width: `${trend.value}%` }} />
                                            </div>
                                            <span className="text-[10px] font-mono text-white">{trend.value}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-8 space-y-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-[#8B5CF6]">Performance Matrix</h3>
                            <div className="space-y-1">
                                {intelligence?.categoryPerformance.map((item, i) => (
                                    <div key={i} className="grid grid-cols-4 gap-2 items-center p-3 hover:bg-white/5 rounded-xl transition-all group">
                                        <span className="text-[10px] font-black text-white uppercase">{item.category}</span>
                                        <div className="text-right">
                                            <p className="text-[8px] text-gray-500 uppercase font-black">Rentals</p>
                                            <p className="text-xs font-bold text-blue-400">{item.rentals}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] text-gray-500 uppercase font-black">Sales</p>
                                            <p className="text-xs font-bold text-emerald-400">{item.sales}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] text-gray-500 uppercase font-black">Growth</p>
                                            <p className="text-xs font-bold text-white">+{item.growth}%</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Global Multipliers */}
                <div className="space-y-8">
                    <div className="bg-gradient-to-br from-[#8B5CF6]/10 to-transparent border border-[#8B5CF6]/20 rounded-[3rem] p-8 space-y-8 sticky top-8">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[#8B5CF6]">
                                <Sliders size={20} />
                                <span className="text-xs font-black uppercase tracking-[0.4em]">Global Protocol</span>
                            </div>
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Market Multipliers</h3>
                            <p className="text-[10px] text-gray-500 font-mono leading-relaxed">
                                Real-time site-wide price scaling. Adjust during peak demands or promotional phases.
                            </p>
                        </div>

                        <div className="space-y-8">
                            <MultiplierSlider
                                label="Rental Yield"
                                value={settings.multipliers.rental}
                                onChange={(v) => handleMultiplierChange('rental', v)}
                                color="text-blue-500"
                            />
                            <MultiplierSlider
                                label="Retail Markup"
                                value={settings.multipliers.retail}
                                onChange={(v) => handleMultiplierChange('retail', v)}
                                color="text-emerald-500"
                            />
                            <MultiplierSlider
                                label="Buyback Scale"
                                value={settings.multipliers.buyback}
                                onChange={(v) => handleMultiplierChange('buyback', v)}
                                color="text-orange-500"
                            />
                        </div>

                        <div className="pt-4 border-t border-white/5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Live Calibration</span>
                                </div>
                                <span className="text-[10px] font-mono text-gray-500">v{settings.multipliers.rental.toFixed(2)}:REF</span>
                            </div>
                            <button className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-[#8B5CF6] hover:text-white transition-all shadow-[0_10px_30px_rgba(255,255,255,0.05)]">
                                Broadcast Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
}

function MultiplierSlider({ label, value, onChange, color }: { label: string, value: number, onChange: (val: number) => void, color: string }) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-end">
                <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</p>
                    <p className={`text-2xl font-black italic ${color}`}>x{value.toFixed(2)}</p>
                </div>
                <div className="flex gap-1 mb-1">
                    {[0.8, 1.0, 1.25, 1.5].map((preset) => (
                        <button
                            key={preset}
                            onClick={() => onChange(preset)}
                            className={`px-2 py-1 rounded text-[8px] font-black transition-all ${value === preset ? 'bg-white text-black' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                        >
                            {preset}x
                        </button>
                    ))}
                </div>
            </div>
            <div className="relative h-2 bg-white/5 rounded-full px-1 flex items-center group">
                <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.05"
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className="w-full appearance-none bg-transparent cursor-pointer relative z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,255,255,0.5)] [&::-webkit-slider-thumb]:transition-all group-hover:[&::-webkit-slider-thumb]:scale-125"
                />
                <div
                    className="absolute left-1 h-1 rounded-full bg-gradient-to-r from-[#8B5CF6]/50 to-[#8B5CF6] transition-all"
                    style={{ width: `${((value - 0.5) / 2.5) * 98}%` }}
                />
            </div>
        </div>
    );
}
