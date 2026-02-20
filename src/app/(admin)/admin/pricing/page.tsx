"use client";

import { useState, useEffect } from "react";
import { DollarSign, Save, RefreshCw, TrendingUp, Edit2, Activity, Zap, Shield, Plus, Gamepad2 } from "lucide-react";
import { getCatalogSettings, updateCatalogSettings, CatalogSettings } from "@/services/catalog";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORY_FEATURES: Record<string, string[]> = {
    "default": ["Premium Experience", "Latest Titles", "24/7 Support", "Clean & Sanitized"]
};

export default function PricingManagerPage() {
    const [settings, setSettings] = useState<CatalogSettings[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<{ category: string; field: string } | null>(null);
    const [editValue, setEditValue] = useState("");

    const [editFeatures, setEditFeatures] = useState<string[]>([]);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await getCatalogSettings();
            setSettings(data);
        } catch (error) {
            console.error("Failed to load pricing:", error);
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (category: string, field: string, currentValue: any) => {
        setEditing({ category, field });
        if (field === 'features') {
            setEditFeatures(Array.isArray(currentValue) ? [...currentValue] : []);
            setEditValue("");
        } else {
            setEditValue(currentValue?.toString() || "");
        }
    };

    const saveEdit = async () => {
        if (!editing) return;

        try {
            const updates: any = {};
            if (editing.field === 'features') {
                updates.features = editFeatures;
            } else {
                updates[editing.field] = Number(editValue);
            }

            await updateCatalogSettings(editing.category, updates);
            await loadSettings();
            setEditing(null);
        } catch (error) {
            console.error("Failed to update pricing/features:", error);
            alert("Error updating settings");
        }
    };

    const handleAddFeature = () => {
        if (editValue.trim()) {
            setEditFeatures([...editFeatures, editValue.trim()]);
            setEditValue("");
        }
    };

    const handleRemoveFeature = (index: number) => {
        setEditFeatures(editFeatures.filter((_, i) => i !== index));
    };

    const cancelEdit = () => {
        setEditing(null);
        setEditValue("");
        setEditFeatures([]);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#8B5CF6]/20 border-t-[#8B5CF6] rounded-full animate-spin" />
                    <div className="text-white font-black uppercase tracking-widest text-xs">Calibrating Engines...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] p-8 pb-20">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-12">
                <div className="flex items-end justify-between border-b border-white/5 pb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-2 h-8 bg-amber-500 rounded-full" />
                            <h1 className="text-4xl font-black uppercase tracking-[0.2em] text-white">
                                Engine Parameters
                            </h1>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 flex items-center gap-2">
                            <Activity size={12} className="text-amber-500" />
                            System-wide performance & economy management
                        </p>
                    </div>
                    <button
                        onClick={loadSettings}
                        className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white transition-all group active:scale-95"
                    >
                        <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500 text-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Recheck Fleet</span>
                    </button>
                </div>
            </div>

            {/* Dashboard Sections */}
            <div className="max-w-7xl mx-auto space-y-20">
                {settings.map((setting) => (
                    <div key={setting.id} className="space-y-8">
                        {/* Section Header */}
                        <div className="flex items-center gap-4">
                            <div className="w-2.5 h-2.5 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-3">
                                {setting.device_category} Engine Params
                                {!setting.is_enabled && (
                                    <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20">Offline</span>
                                )}
                            </h2>
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                        </div>

                        {/* Parameter Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* DAILY RATE CARD */}
                            <div className="relative group overflow-hidden bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 hover:border-white/10 transition-all hover:translate-y-[-4px]">
                                <div className="absolute top-0 right-0 w-1 h-full bg-[#8B5CF6] opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Daily Rate</span>
                                        <Zap size={14} className="text-[#8B5CF6]" />
                                    </div>
                                    <div className="flex items-baseline justify-between">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xs font-bold text-gray-500">₹</span>
                                            <span className="text-3xl font-black text-white">{setting.daily_rate}</span>
                                        </div>
                                        <button
                                            onClick={() => startEdit(setting.device_category, 'daily_rate', setting.daily_rate)}
                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-500 hover:text-white transition-all shadow-inner"
                                        >
                                            <Edit2 size={12} />
                                        </button>
                                    </div>
                                    <div className="space-y-2 pt-4 border-t border-white/5 relative">
                                        <button
                                            onClick={() => startEdit(setting.device_category, 'features', setting.features || [])}
                                            className="absolute -top-3 right-0 p-1.5 bg-[#8B5CF6]/10 text-[#8B5CF6] rounded-lg hover:bg-[#8B5CF6]/20 transition-all opacity-0 group-hover:opacity-100"
                                            title="Edit Features"
                                        >
                                            <Plus size={10} />
                                        </button>
                                        {(setting.features || ["Premium Experience", "Latest Titles", "24/7 Support", "Clean & Sanitized"]).map((feat, i) => (
                                            <div key={i} className="text-[10px] text-gray-500 font-medium flex items-center gap-2">
                                                <div className="w-1 h-1 bg-gray-700 rounded-full" />
                                                {feat}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* WEEKLY RATE CARD */}
                            <div className="relative group overflow-hidden bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 hover:border-white/10 transition-all hover:translate-y-[-4px]">
                                <div className="absolute top-1/4 right-0 w-1 h-1/2 bg-[#8B5CF6] transition-all group-hover:h-full group-hover:top-0" />
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Weekly Rate</span>
                                        <Shield size={14} className="text-[#8B5CF6]" />
                                    </div>
                                    <div className="flex items-baseline justify-between">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xs font-bold text-gray-500">₹</span>
                                            <span className="text-3xl font-black text-white">{setting.weekly_rate}</span>
                                        </div>
                                        <button
                                            onClick={() => startEdit(setting.device_category, 'weekly_rate', setting.weekly_rate)}
                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-500 hover:text-white transition-all"
                                        >
                                            <Edit2 size={12} />
                                        </button>
                                    </div>
                                    <div className="space-y-2 pt-4 border-t border-white/5">
                                        <div className="text-[10px] text-gray-500 font-medium flex items-center gap-2">
                                            <div className="w-1 h-1 bg-gray-700 rounded-full" />
                                            7 Days Extension
                                        </div>
                                        <div className="text-[10px] text-gray-500 font-medium flex items-center gap-2">
                                            <div className="w-1 h-1 bg-gray-700 rounded-full" />
                                            Priority Maintenance
                                        </div>
                                        <div className="text-[10px] text-gray-500 font-medium flex items-center gap-2">
                                            <div className="w-1 h-1 bg-gray-700 rounded-full" />
                                            Free Swap if faulty
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* MONTHLY RATE CARD */}
                            <div className="relative group overflow-hidden bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 hover:border-[#8B5CF6]/30 transition-all hover:translate-y-[-4px]">
                                <div className="absolute top-0 right-0 w-1 h-full bg-[#8B5CF6] opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Monthly Rate</span>
                                        <TrendingUp size={14} className="text-[#8B5CF6]" />
                                    </div>
                                    <div className="flex items-baseline justify-between">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xs font-bold text-gray-500">₹</span>
                                            <span className="text-3xl font-black text-white">{setting.monthly_rate}</span>
                                        </div>
                                        <button
                                            onClick={() => startEdit(setting.device_category, 'monthly_rate', setting.monthly_rate)}
                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-500 hover:text-white transition-all"
                                        >
                                            <Edit2 size={12} />
                                        </button>
                                    </div>
                                    <div className="space-y-2 pt-4 border-t border-white/5">
                                        <div className="text-[10px] text-gray-500 font-medium flex items-center gap-2">
                                            <div className="w-1 h-1 bg-gray-700 rounded-full" />
                                            Highest Priority Access
                                        </div>
                                        <div className="text-[10px] text-gray-500 font-medium flex items-center gap-2">
                                            <div className="w-1 h-1 bg-gray-700 rounded-full" />
                                            Free Home Delivery
                                        </div>
                                        <div className="text-[10px] text-gray-500 font-medium flex items-center gap-2">
                                            <div className="w-1 h-1 bg-gray-700 rounded-full" />
                                            Unlimited Swaps
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CONTROLLER PARAMETERS */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <Gamepad2 size={14} className="text-gray-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Addon Controller Modules</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* CONTROLLER DAILY */}
                                <div className="bg-black/40 border border-white/5 rounded-[1.5rem] p-6 space-y-4 hover:border-white/10 transition-all">
                                    <div className="flex items-center justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                        Extra Daily
                                        <button
                                            onClick={() => startEdit(setting.device_category, 'controller_daily_rate', setting.controller_daily_rate)}
                                            className="text-[#8B5CF6] hover:scale-110 transition-transform"
                                        >
                                            <Edit2 size={10} />
                                        </button>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-[10px] font-bold text-gray-600">₹</span>
                                        <span className="text-xl font-black text-white">{setting.controller_daily_rate}</span>
                                    </div>
                                </div>

                                {/* CONTROLLER WEEKLY */}
                                <div className="bg-black/40 border border-white/5 rounded-[1.5rem] p-6 space-y-4 hover:border-white/10 transition-all">
                                    <div className="flex items-center justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                        Extra Weekly
                                        <button
                                            onClick={() => startEdit(setting.device_category, 'controller_weekly_rate', setting.controller_weekly_rate)}
                                            className="text-[#8B5CF6] hover:scale-110 transition-transform"
                                        >
                                            <Edit2 size={10} />
                                        </button>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-[10px] font-bold text-gray-600">₹</span>
                                        <span className="text-xl font-black text-white">{setting.controller_weekly_rate}</span>
                                    </div>
                                </div>

                                {/* CONTROLLER MONTHLY */}
                                <div className="bg-black/40 border border-white/5 rounded-[1.5rem] p-6 space-y-4 hover:border-white/10 transition-all">
                                    <div className="flex items-center justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                        Extra Monthly
                                        <button
                                            onClick={() => startEdit(setting.device_category, 'controller_monthly_rate', setting.controller_monthly_rate)}
                                            className="text-[#8B5CF6] hover:scale-110 transition-transform"
                                        >
                                            <Edit2 size={10} />
                                        </button>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-[10px] font-bold text-gray-600">₹</span>
                                        <span className="text-xl font-black text-white">{setting.controller_monthly_rate}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* EDIT MODAL Overlay */}
            <AnimatePresence>
                {editing && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={cancelEdit}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative z-10 w-full max-w-sm bg-[#0D0D0D] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8B5CF6] to-amber-500" />
                            <div className="space-y-8 text-center">
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-[0.2em] text-white underline decoration-[#8B5CF6] underline-offset-8">
                                        Tune Param
                                    </h3>
                                    <p className="mt-4 text-[10px] font-black uppercase text-gray-500 tracking-widest leading-relaxed">
                                        Adjusting <span className="text-white">{editing.field.replace('_', ' ')}</span> for <span className="text-[#8B5CF6]">{editing.category}</span>
                                    </p>
                                </div>

                                {editing.field === 'features' ? (
                                    <div className="space-y-4">
                                        <div className="space-y-2 max-h-48 overflow-y-auto px-2 custom-scrollbar">
                                            {editFeatures.map((feat, i) => (
                                                <div key={i} className="flex items-center justify-between gap-3 bg-white/5 p-3 rounded-xl border border-white/10 transition-all hover:bg-white/10">
                                                    <span className="text-xs text-gray-300 font-bold truncate">{feat}</span>
                                                    <button
                                                        onClick={() => handleRemoveFeature(i)}
                                                        className="p-1.5 hover:bg-red-500/20 text-gray-500 hover:text-red-500 rounded-lg transition-all"
                                                    >
                                                        <Plus size={14} className="rotate-45" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="relative group flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="New feature..."
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddFeature()}
                                                className="flex-1 bg-black border border-white/10 rounded-xl p-4 text-xs font-bold text-white focus:outline-none focus:border-[#8B5CF6]/50 transition-colors"
                                            />
                                            <button
                                                onClick={handleAddFeature}
                                                className="p-4 bg-[#8B5CF6]/20 text-[#8B5CF6] rounded-xl hover:bg-[#8B5CF6]/30 transition-all border border-[#8B5CF6]/30"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-[#8B5CF6]/50 to-amber-500/50 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition-all" />
                                        <input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="relative w-full bg-black border border-white/10 rounded-xl p-5 text-2xl font-black text-center text-white focus:outline-none focus:border-[#8B5CF6]/50 transition-colors"
                                            autoFocus
                                        />
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                                    </div>
                                )}

                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={cancelEdit}
                                        className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-all rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        onClick={saveEdit}
                                        className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white bg-[#8B5CF6] hover:bg-[#7C3AED] transition-all rounded-xl shadow-[0_4px_20px_rgba(139,92,246,0.3)]"
                                    >
                                        Execute update
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
