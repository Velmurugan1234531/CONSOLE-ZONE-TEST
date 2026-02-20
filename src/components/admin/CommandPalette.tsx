"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Monitor, User, Settings, Calculator, Plus, X, Command, Zap, Activity, ArrowRight, Monitor as DeviceIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { getAllDevices } from "@/services/admin";
import { Device } from "@/types";

const COMMANDS = [
    { id: 'dashboard', title: 'Dashboard', href: '/admin', icon: <Activity size={18} />, category: 'Main' },
    { id: 'rentals', title: 'Rental Management', href: '/admin/rentals', icon: <Activity size={18} />, category: 'Commerce' },
    { id: 'buy', title: 'Trade-In / Buy', href: '/admin/buy', icon: <Plus size={18} />, category: 'Commerce' },
    { id: 'fleet', title: 'Fleet Matrix', icon: <Monitor size={18} />, path: "/admin/fleet", category: 'Management' },
    { id: "add-unit", title: "Add New Unit", icon: <Plus size={18} />, path: "/admin/fleet", category: 'Management' },
    { id: 'appearance', title: 'UX Calibration', href: '/admin/appearance', icon: <Settings size={18} />, category: 'Settings' },
];

export function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<{
        units: Device[];
        actions: any[];
    }>({ units: [], actions: [] });
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === "Escape") setIsOpen(false);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 10);
            setSelectedIndex(0);
            setQuery("");
        }
    }, [isOpen]);

    useEffect(() => {
        const fetchResults = async () => {
            if (!query.trim()) {
                setResults({ units: [], actions: COMMANDS });
                return;
            }

            const q = query.toLowerCase();
            const allDevices = await getAllDevices();
            const filteredUnits = allDevices.filter((d: Device) =>
                d.model.toLowerCase().includes(q) ||
                d.serialNumber.toLowerCase().includes(q)
            ).slice(0, 5);

            const filteredActions = COMMANDS.filter(a =>
                a.title.toLowerCase().includes(q) ||
                a.category.toLowerCase().includes(q)
            );

            setResults({ units: filteredUnits, actions: filteredActions });
            setSelectedIndex(0);
        };

        const timer = setTimeout(fetchResults, 150);
        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (item: any) => {
        if (item.href) {
            router.push(item.href);
        } else if (item.path) {
            router.push(item.path);
        } else if (item.serialNumber) {
            router.push(`/admin/fleet?search=${item.serialNumber}`);
        }
        setIsOpen(false);
        setQuery("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const totalItems = results.actions.length + results.units.length;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % totalItems);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
        } else if (e.key === "Enter") {
            const allItems = [...results.actions, ...results.units];
            if (allItems[selectedIndex]) handleSelect(allItems[selectedIndex]);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/80 backdrop-blur-xl"
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: -20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: -20 }}
                        className="relative w-full max-w-xl bg-[#0a0a0a] border border-white/10 rounded-[2rem] shadow-[0_0_50px_rgba(139,92,246,0.15)] overflow-hidden"
                    >
                        <div className="flex items-center px-6 py-5 border-b border-white/5">
                            <Search className="text-[#8B5CF6] mr-4" size={20} />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Execute command or search unit..."
                                className="flex-1 bg-transparent text-white border-none outline-none text-lg font-black uppercase tracking-widest placeholder:text-gray-800"
                            />
                            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] text-gray-500 font-black">
                                <Command size={10} />
                                <span>K</span>
                            </div>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                            {results.actions.length > 0 && (
                                <div className="space-y-1">
                                    <div className="px-4 py-2 text-[9px] font-black text-gray-600 uppercase tracking-[0.3em]">Quick Directives</div>
                                    {results.actions.map((action, idx) => (
                                        <button
                                            key={action.id}
                                            onClick={() => handleSelect(action)}
                                            onMouseEnter={() => setSelectedIndex(idx)}
                                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${selectedIndex === idx ? "bg-[#8B5CF6] text-white shadow-xl shadow-[#8B5CF6]/20" : "text-gray-400 hover:text-white hover:bg-white/5"
                                                }`}
                                        >
                                            <div className={`p-2 rounded-lg ${selectedIndex === idx ? "bg-white/20" : "bg-white/5 text-[#8B5CF6]"}`}>
                                                {action.icon}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-black uppercase tracking-wider">{action.title}</p>
                                                <p className={`text-[9px] uppercase tracking-widest font-mono opacity-60`}>{action.category}</p>
                                            </div>
                                            {selectedIndex === idx && <Zap size={14} className="ml-auto animate-pulse" />}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {results.units.length > 0 && (
                                <div className="space-y-1 mt-4">
                                    <div className="px-4 py-2 text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] border-t border-white/5 pt-4">Fleet Units</div>
                                    {results.units.map((unit, idx) => {
                                        const actualIdx = results.actions.length + idx;
                                        return (
                                            <button
                                                key={unit.id}
                                                onClick={() => handleSelect(unit)}
                                                onMouseEnter={() => setSelectedIndex(actualIdx)}
                                                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${selectedIndex === actualIdx ? "bg-[#8B5CF6] text-white shadow-xl shadow-[#8B5CF6]/20" : "text-gray-400 hover:text-white hover:bg-white/5"
                                                    }`}
                                            >
                                                <div className={`p-2 rounded-lg ${selectedIndex === actualIdx ? "bg-white/20" : "bg-white/5 text-gray-500"}`}>
                                                    <DeviceIcon size={18} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-black uppercase tracking-wider">{unit.model}</p>
                                                    <p className="text-[9px] font-mono opacity-60">{unit.serialNumber}</p>
                                                </div>
                                                <div className="ml-auto flex items-center gap-6">
                                                    <div className="text-right">
                                                        <p className="text-[8px] font-black opacity-60 uppercase mb-0.5">Integrity</p>
                                                        <p className={`text-xs font-black ${unit.health > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{unit.health}%</p>
                                                    </div>
                                                    <div className={`w-2 h-2 rounded-full ${unit.status === 'Ready' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`} />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {query && results.units.length === 0 && results.actions.length === 0 && (
                                <div className="py-20 text-center flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-gray-700">
                                        <Search size={32} />
                                    </div>
                                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">No matches found in sector</p>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 bg-black/50 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 opacity-40">
                                    <span className="px-1.5 py-1 bg-white/10 border border-white/10 rounded-md text-[8px] font-black text-white">↑↓</span>
                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Navigate</span>
                                </div>
                                <div className="flex items-center gap-2 opacity-40">
                                    <span className="px-1.5 py-1 bg-white/10 border border-white/10 rounded-md text-[8px] font-black text-white">ENTER</span>
                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Execute</span>
                                </div>
                            </div>
                            <span className="text-[8px] font-mono text-gray-700 uppercase tracking-widest italic">Tactical Search Core v2.0</span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
