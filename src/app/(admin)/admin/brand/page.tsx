"use client";

import { useState, useEffect } from "react";
import { VisualsService, VisualSettings } from "@/services/visuals";
import { getSiteSettings, saveSiteSettings, SiteSettings } from "@/services/site-settings";
import { Save, Globe, Type, MessageSquare, Search, LayoutTemplate } from "lucide-react";
import Link from 'next/link';

export default function BrandSEOPage() {
    const [visualSettings, setVisualSettings] = useState<VisualSettings | null>(null);
    const [seoSettings, setSeoSettings] = useState<SiteSettings | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'identity' | 'footer' | 'seo'>('identity');

    useEffect(() => {
        const load = async () => {
            const vSettings = await VisualsService.getSettings();
            setVisualSettings(vSettings);

            const sSettings = getSiteSettings();
            setSeoSettings(sSettings);
        };
        load();
    }, []);

    const handleVisualUpdate = (section: string, field: string, value: any) => {
        if (!visualSettings) return;
        const newSettings = { ...visualSettings };

        if (section === 'branding') {
            newSettings.branding = { ...newSettings.branding, [field]: value };
        } else if (section === 'footer') {
            newSettings.footer = { ...newSettings.footer, [field]: value };
        }

        setVisualSettings(newSettings);
    };

    const handleSeoUpdate = (page: string, field: string, value: string) => {
        if (!seoSettings) return;
        setSeoSettings(prev => ({
            ...prev!,
            seo: {
                ...prev!.seo,
                [page]: {
                    ...prev!.seo[page],
                    [field]: value
                }
            }
        }));
    };

    const saveAll = async () => {
        if (!visualSettings || !seoSettings) return;
        setIsSaving(true);
        try {
            await VisualsService.saveSettings(visualSettings);
            saveSiteSettings(seoSettings);
            // Simulate delay for feedback
            await new Promise(r => setTimeout(r, 800));
        } finally {
            setIsSaving(false);
        }
    };

    if (!visualSettings || !seoSettings) return <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">Loading Control Center...</div>;

    const tabs = [
        { id: 'identity', label: 'Brand Identity', icon: Globe },
        { id: 'footer', label: 'Footer & Contact', icon: LayoutTemplate },
        { id: 'seo', label: 'SEO Metadata', icon: Search },
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#A855F7] selection:text-white">
            {/* Header */}
            <header className="h-16 border-b border-white/10 bg-[#0A0A0A] flex items-center justify-between px-6 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <Link href="/admin/appearance" className="text-gray-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
                        ← Back to Editor
                    </Link>
                    <div className="h-6 w-[1px] bg-white/10" />
                    <h1 className="text-lg font-black uppercase tracking-tight italic">
                        BRAND <span className="text-[#A855F7]">CONTROL</span> CENTER
                    </h1>
                </div>
                <button
                    onClick={saveAll}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-[#A855F7] hover:bg-[#9333EA] text-white px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save size={16} />
                    {isSaving ? "Saving..." : "Save Changes"}
                </button>
            </header>

            <div className="w-full max-w-none mx-auto p-8 flex gap-12">
                {/* Sidebar Navigation */}
                <nav className="w-64 space-y-2 shrink-0">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === tab.id
                                ? 'bg-white/10 text-white border border-white/10 shadow-lg'
                                : 'text-gray-500 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <tab.icon size={18} className={activeTab === tab.id ? 'text-[#A855F7]' : ''} />
                            <span className="text-xs font-bold uppercase tracking-widest">{tab.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Content Area */}
                <div className="flex-1 space-y-8">
                    {activeTab === 'identity' && (
                        <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h2 className="text-2xl font-black uppercase italic mb-2">Global Identity</h2>
                                <p className="text-gray-500 text-sm">Define how your brand appears across the entire platform.</p>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Site Name</label>
                                    <div className="relative">
                                        <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                                        <input
                                            type="text"
                                            value={visualSettings.branding.siteName}
                                            onChange={(e) => handleVisualUpdate('branding', 'siteName', e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-700 focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7] outline-none transition-all font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tagline</label>
                                    <div className="relative">
                                        <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                                        <input
                                            type="text"
                                            value={visualSettings.branding.tagline}
                                            onChange={(e) => handleVisualUpdate('branding', 'tagline', e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-700 focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7] outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'footer' && (
                        <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h2 className="text-2xl font-black uppercase italic mb-2">Footer Configuration</h2>
                                <p className="text-gray-500 text-sm">Manage contact details and footer information.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Address</label>
                                    <textarea
                                        rows={3}
                                        value={visualSettings.footer.address}
                                        onChange={(e) => handleVisualUpdate('footer', 'address', e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-700 focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7] outline-none transition-all resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phone Number</label>
                                    <input
                                        type="text"
                                        value={visualSettings.footer.phone}
                                        onChange={(e) => handleVisualUpdate('footer', 'phone', e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-[#A855F7] outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                                    <input
                                        type="text"
                                        value={visualSettings.footer.email}
                                        onChange={(e) => handleVisualUpdate('footer', 'email', e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-[#A855F7] outline-none transition-all"
                                    />
                                </div>

                                <div className="col-span-2 space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Copyright Text</label>
                                    <input
                                        type="text"
                                        value={visualSettings.footer.copyrightText || "Console Zone"}
                                        onChange={(e) => handleVisualUpdate('footer', 'copyrightText', e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-[#A855F7] outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'seo' && (
                        <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h2 className="text-2xl font-black uppercase italic mb-2">Search Engine Optimization</h2>
                                <p className="text-gray-500 text-sm">Optimize your pages for search engines to reach more gamers.</p>
                            </div>

                            <div className="space-y-8">
                                {Object.keys(seoSettings.seo).map((pageKey) => (
                                    <div key={pageKey} className="p-6 bg-black/30 rounded-2xl border border-white/5 space-y-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="h-2 w-2 rounded-full bg-[#A855F7]" />
                                            <h3 className="text-sm font-black uppercase tracking-widest text-white">{pageKey} Page</h3>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">Meta Title</label>
                                                <input
                                                    type="text"
                                                    value={seoSettings.seo[pageKey].title}
                                                    onChange={(e) => handleSeoUpdate(pageKey, 'title', e.target.value)}
                                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#A855F7] outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">Meta Description</label>
                                                <textarea
                                                    rows={2}
                                                    value={seoSettings.seo[pageKey].description}
                                                    onChange={(e) => handleSeoUpdate(pageKey, 'description', e.target.value)}
                                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#A855F7] outline-none resize-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
