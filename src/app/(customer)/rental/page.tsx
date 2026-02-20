"use client";

import Link from "next/link";
import { Gamepad2, Check, Star, Monitor, ChevronDown, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/utils/format";
import { CONSOLE_IMAGES } from "@/constants/images";
import { getCatalogSettings, CatalogSettings } from "@/services/catalog";
import { VisualsService, VisualSettings } from "@/services/visuals";
import { useEffect, useState } from "react";
import { BuilderRenderer } from "@/components/Builder/BuilderRenderer";
import { usePageSEO } from "@/hooks/use-seo";

import { StockService } from "@/services/stock";

import PageHero from "@/components/layout/PageHero";


export default function RentalPage() {
    usePageSEO('rentals');
    const stock = StockService.useStock();
    const [catalogSettings, setCatalogSettings] = useState<CatalogSettings[]>([]);
    const [activeTab, setActiveTab] = useState<string>('ps5');
    const [visualSettings, setVisualSettings] = useState<VisualSettings | null>(null);
    const [filterCategory, setFilterCategory] = useState('All');
    const [sortBy, setSortBy] = useState<'name' | 'available' | 'price'>('name');

    // Sync activeTab with first available stock item
    useEffect(() => {
        if (stock.length > 0 && !activeTab) {
            // Find first enabled category in stock
            const firstEnabled = stock.find(item => {
                const config = catalogSettings.find(s => s.device_category === item.label);
                return config ? config.is_enabled : true;
            });
            if (firstEnabled) setActiveTab(firstEnabled.id);
        }
    }, [stock, activeTab, catalogSettings]);

    useEffect(() => {
        const load = async () => {
            const [vSettings, cSettings] = await Promise.all([
                VisualsService.getSettings(),
                getCatalogSettings()
            ]);
            setVisualSettings(vSettings);
            setCatalogSettings(cSettings);
        };
        load();
    }, []);

    // Derive Categories
    const categories = Array.from(new Set(stock.map(s => {
        if (s.id.includes('ps')) return 'PlayStation';
        if (s.id.includes('xbox')) return 'Xbox';
        if (s.id.includes('vr') || s.id.includes('quest')) return 'VR';
        return 'Other';
    })));

    const filteredStock = stock
        .filter(item => {
            // 1. Catalog Enable Check
            if (catalogSettings.length > 0) {
                // Match by normalizing both sides (case-insensitive comparison)
                const config = catalogSettings.find(s =>
                    s.device_category.toLowerCase().replace(/\s+/g, '') ===
                    (item.label || item.name || '').toLowerCase().replace(/\s+/g, '')
                );
                // If we found a config, check if it's enabled. If no config found, show the item (default enabled)
                if (config && !config.is_enabled) return false;
            }

            // 2. Category Filter
            if (filterCategory === 'All') return true;
            if (filterCategory === 'PlayStation') return item.id.includes('ps');
            if (filterCategory === 'Xbox') return item.id.includes('xbox');
            if (filterCategory === 'VR') return item.id.includes('vr') || item.id.includes('quest');
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'available') return b.available - a.available;
            if (sortBy === 'price') {
                const configA = catalogSettings.find(s => s.device_category === a.label);
                const configB = catalogSettings.find(s => s.device_category === b.label);
                const priceA = configA?.daily_rate || 0;
                const priceB = configB?.daily_rate || 0;
                return priceA - priceB;
            }
            return 0;
        });

    const activeConsoleBgs = (visualSettings?.consoleBackgrounds?.[activeTab] || []);
    const backgrounds = activeConsoleBgs.length > 0
        ? activeConsoleBgs
        : [activeTab === 'ps5' ? CONSOLE_IMAGES.ps5.hero : activeTab === 'ps4' ? CONSOLE_IMAGES.ps4.hero : activeTab === 'xbox' ? CONSOLE_IMAGES.xbox.hero : CONSOLE_IMAGES.default.hero];


    // Compute dynamic plans based on stock and catalog
    const dynamicPlans = stock.reduce((acc: any, item) => {
        // Try to find exact config match first
        let config = catalogSettings.find(s => s.device_category.toLowerCase() === (item.label || '').toLowerCase());

        // Fallback: Try to match by "base" category if exact match fails (e.g. "PS5 Pro" -> use "PS5" pricing)
        if (!config) {
            const baseCategory = item.id.includes('ps5') ? 'PS5' : item.id.includes('ps4') ? 'PS4' : item.id.includes('xbox') ? 'Xbox' : null;
            if (baseCategory) {
                config = catalogSettings.find(s => s.device_category.toLowerCase() === baseCategory.toLowerCase());
            }
        }

        if (!config) {
            acc[item.id] = [
                { duration: "Day", price: "₹500", features: ["Standard Equipment"], extraController: "₹299", color: "bg-[#1a1a1a]", recommended: false },
                { duration: "Week", price: "₹3000", features: ["Standard Equipment"], extraController: "₹799", color: "bg-[#A855F7]", recommended: true },
                { duration: "Month", price: "₹8000", features: ["Standard Equipment"], extraController: "₹1499", color: "bg-[#1a1a1a]", recommended: false }
            ];
            return acc;
        }

        acc[item.id] = [
            {
                duration: "Day",
                price: formatCurrency(config.daily_rate),
                features: ["4K 120Hz Gaming", "100+ Games Free", "24 Hours Access", "Self Pickup Available"],
                extraController: formatCurrency(config.controller_daily_rate),
                color: "bg-[#1a1a1a]",
                recommended: false
            },
            {
                duration: "Week",
                price: formatCurrency(config.weekly_rate),
                features: ["4K 120Hz Gaming", "100+ Games Free", "7 Days Access", "Free Delivery", "Priority Support"],
                extraController: formatCurrency(config.controller_weekly_rate),
                color: "bg-[#A855F7]",
                recommended: true
            },
            {
                duration: "Month",
                price: formatCurrency(config.monthly_rate),
                features: ["4K 120H Gaming", "100+ Games Free", "30 Days Access", "Free Delivery", "Game Pass Included"],
                extraController: formatCurrency(config.controller_weekly_rate * 4),
                color: "bg-[#1a1a1a]",
                recommended: false
            }
        ];
        return acc;
    }, {});

    const gamesList = [
        "GTA V", "Red Dead Redemption 2", "PUBG: Battlegrounds", "Tomb Raider Collection", "Uncharted 4",
        "Uncharted Lost Legacy", "God of War", "God of War Ragnarok", "God of War 3", "Spider-Man Miles Morales",
        "Marvel's Spider-Man 2", "Mortal Kombat 11", "Tekken 6", "It Takes Two", "A Way Out", "WWE 2K23", "WWE 2K24",
        "FIFA 23", "FIFA 24", "Assassin's Creed Collection", "Batman Arkham Knight", "Days Gone", "Devil May Cry 5",
        "The Evil Within", "Resident Evil 4", "Resident Evil Village", "The Last of Us Remastered Part 1", "Death Stranding",
        "Detroit: Become Human", "F1 22", "F1 23", "Far Cry 3,4,5,6", "Ghost of Tsushima", "Horizon Zero Dawn",
        "Infamous Second Son", "Just Cause 4", "Kena: Bridge of Spirits", "Marvel's Guardians of the Galaxy",
        "Need for Speed Payback", "Watch Dogs 1 & 2", "Watch Dogs Legion", "Call of Duty: Black Ops Cold War",
        "Ratchet & Clank: Rift Apart", "Need for Speed Unbound", "Batman Gotham Knights", "Outlast 2", "Dead Island 2",
        "The Callisto Protocol"
    ];

    return (
        <div className="min-h-screen bg-[#050505]">
            <PageHero
                title={visualSettings?.pageContent?.rental_title || "RENTAL STORE"}
                subtitle={visualSettings?.pageContent?.rental_subtitle || "Select from our elite fleet of current-gen and classic consoles"}
                images={backgrounds}
                height="100vh"
            >
                <div className="w-full max-w-7xl mx-auto px-4 flex flex-col gap-6">
                    <div className="inline-flex bg-black/40 backdrop-blur-md p-1 rounded-2xl border border-white/10 overflow-x-auto max-w-full self-center">
                        {filteredStock.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`px-10 py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all whitespace-nowrap ${activeTab === item.id ? 'bg-[#A855F7] text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {item.label || item.name}
                            </button>
                        ))}
                    </div>
                </div>
            </PageHero>

            <div className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 w-full max-w-none mx-auto">
                {/* Builder Engine Canvas */}
                {(visualSettings?.layouts?.rental?.layers?.length || 0) > 0 && (
                    <BuilderRenderer
                        elements={visualSettings!.layouts.rental.layers}
                        globalDesign={visualSettings!.globalDesign}
                    />
                )}
                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                    <AnimatePresence mode="wait">
                        {activeTab && dynamicPlans[activeTab]?.map((plan: any, index: number) => (
                            <motion.div
                                key={plan.duration}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`group relative bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden hover:border-[#A855F7]/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(168,85,247,0.15)] flex flex-col ${plan.recommended ? 'ring-2 ring-[#A855F7] shadow-[0_0_40px_rgba(168,85,247,0.2)]' : ''}`}
                            >
                                {plan.recommended && (
                                    <div className="absolute top-0 inset-x-0 h-1.5 bg-[#A855F7] shadow-[0_0_15px_rgba(168,85,247,0.8)] z-20" />
                                )}

                                <div className={`p-10 ${plan.color} text-white text-center relative overflow-hidden`}>
                                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
                                    {/* Blob removed */}

                                    <h3 className="font-display text-2xl font-black uppercase tracking-widest relative z-10">{plan.duration}</h3>
                                    <div className="mt-4 relative z-10 flex flex-col items-center justify-center gap-1">
                                        <span className="text-5xl font-black tracking-tighter">{plan.price}</span>
                                        {/* Availability Badge */}
                                        {(() => {
                                            const currentStock = stock.find(s => s.id === activeTab);
                                            const isAvailable = (currentStock?.available || 0) > 0;
                                            return (
                                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${isAvailable ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                    {isAvailable ? `${currentStock?.available} Units Available` : 'Out of Stock'}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                    {plan.recommended && (
                                        <span className="absolute top-4 right-4 bg-white text-black text-[10px] font-black px-3 py-1 rounded-full uppercase z-10 shadow-lg">Best Value</span>
                                    )}
                                </div>

                                <div className="p-8 flex-1 flex flex-col bg-gradient-to-b from-[#0a0a0a] to-[#050505]">
                                    <ul className="space-y-4 mb-10 flex-1">
                                        {plan.features.map((feature: string, i: number) => (
                                            <li key={i} className="flex items-start gap-3 text-gray-300 group/item">
                                                <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.recommended ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'bg-[#8B5CF6]/10 text-[#8B5CF6]'}`}>
                                                    <Check size={12} strokeWidth={4} />
                                                </div>
                                                <span className="text-sm font-medium group-hover/item:text-white transition-colors">{feature}</span>
                                            </li>
                                        ))}
                                        <li className="flex items-center gap-3 text-gray-500 pt-6 border-t border-white/5">
                                            <GameController size={18} className="shrink-0 opacity-50" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Extra Controller: <span className="text-white">{plan.extraController}</span></span>
                                        </li>
                                    </ul>

                                    <div className="space-y-4 pt-4">
                                        <Link
                                            href={(stock.find(s => s.id === activeTab)?.available || 0) > 0 ? `/rent/${activeTab}?plan=${plan.duration === 'Day' ? 'DAILY' : plan.duration === 'Week' ? 'WEEKLY' : plan.duration === 'Month' ? 'MONTHLY' : 'DAILY'}` : '#'}
                                            className={`group/btn relative overflow-hidden block w-full text-center py-5 rounded-2xl font-black text-lg transition-all ${(stock.find(s => s.id === activeTab)?.available || 0) > 0
                                                ? (plan.recommended ? 'bg-[#A855F7] text-white shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)]' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-[#A855F7]/50')
                                                : 'bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed grayscale'
                                                }`}>
                                            <span className="relative z-10 flex items-center justify-center gap-2 tracking-widest uppercase">
                                                {(stock.find(s => s.id === activeTab)?.available || 0) > 0 ? (
                                                    <>RENT NOW <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" /></>
                                                ) : <span className="flex items-center gap-2"><ArrowRight size={20} className="rotate-45" /> SOLD OUT</span>}
                                            </span>
                                        </Link>

                                        {/* Dev Mode / Admin Link */}
                                        {process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true' && (
                                            <Link
                                                href={`/admin/rentals?view=fleet&search=${activeTab}`}
                                                target="_blank"
                                                className="block w-full text-center py-2 text-[10px] font-mono text-gray-500 hover:text-[#8B5CF6] uppercase tracking-widest transition-colors opacity-50 hover:opacity-100"
                                            >
                                                Manage in Matrix
                                            </Link>
                                        )}


                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Games List */}
                <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-white mb-4">INCLUDED GAMES LIBRARY</h2>
                        <p className="text-gray-400">All rentals come with access to our massive library of top-tier titles.</p>
                    </div>

                    <div className="bg-[#0a0a0a] border border-[#8B5CF6]/30 rounded-3xl p-8 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[#8B5CF6]/5 rounded-3xl" />
                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
                            {gamesList.map((game, i) => (
                                <div key={i} className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
                                    <span className="text-sm font-medium">{game}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 text-center">
                            <span className="inline-block px-4 py-1 rounded-full bg-white/10 text-xs text-gray-400 uppercase tracking-widest">And many more...</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function GameController({ size, className }: { size?: number, className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size || 24}
            height={size || 24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <line x1="6" x2="10" y1="12" y2="12" />
            <line x1="8" x2="8" y1="10" y2="14" />
            <line x1="15" x2="15.01" y1="13" y2="13" />
            <line x1="18" x2="18.01" y1="11" y2="11" />
            <rect x="2" y="6" width="20" height="12" rx="2" />
        </svg>
    );
}
