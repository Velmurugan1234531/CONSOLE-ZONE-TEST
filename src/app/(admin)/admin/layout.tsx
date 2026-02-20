"use client";
// Rebuild trigger: 2

import Link from "next/link";
import { LayoutDashboard, Users, Box, QrCode, FileCheck, FileText, LogOut, TrendingUp, Monitor, Gamepad2, Image, ShoppingBag, Tag, Wrench, History as HistoryIcon, Settings, Zap, Bell, DollarSign, Percent, Cpu, ShieldCheck, ClipboardList, Clock, Globe } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { TopNav } from "@/components/admin/TopNav";
import { ChevronRight, ChevronLeft, Menu } from "lucide-react";
import { CommandPalette } from "@/components/admin/CommandPalette";

import { NeuralAlertProvider } from "@/components/providers/NeuralAlertProvider";
import { TacticalHUDAlert } from "@/components/admin/alerts/TacticalHUDAlert";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isAppearancePage = pathname === "/admin/appearance";
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Sync sidebar state from localStorage or default
    useEffect(() => {
        const saved = localStorage.getItem("adminSidebarCollapsed");
        if (saved && saved === "true") {
            setIsCollapsed(true);
        }

        // Force body overflow hidden to prevent double scrollbars
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem("adminSidebarCollapsed", String(newState));
    };

    if (pathname === "/admin/login") {
        return <NeuralAlertProvider>{children}</NeuralAlertProvider>;
    }

    return (
        <div className="flex min-h-screen bg-[#050505]">
            <NeuralAlertProvider>
                {/* Sidebar */}
                {!isAppearancePage && (
                    <>
                        {/* Mobile Toggle */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-[#8B5CF6] text-white rounded-full shadow-2xl transition-transform active:scale-95"
                        >
                            <Menu size={24} />
                        </button>

                        <aside className={`fixed h-full z-40 bg-[#0a0a0a]/80 backdrop-blur-xl border-r border-white/10 flex flex-col transition-all duration-500 ease-in-out ${isCollapsed ? 'w-[70px]' : 'w-64'} ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                            <div className="h-20 flex items-center justify-between px-6 border-b border-white/5 relative">
                                {(!isCollapsed || isMobileMenuOpen) && (
                                    <span className="text-xl font-black bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#D8B4FE] bg-clip-text text-transparent italic tracking-tighter animate-pulse">
                                        MISSION<span className="text-white">CTRL</span>
                                    </span>
                                )}
                                {isCollapsed && !isMobileMenuOpen && (
                                    <Zap className="text-[#8B5CF6] animate-pulse" size={24} />
                                )}

                                <button
                                    onClick={toggleSidebar}
                                    className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#8B5CF6] rounded-full items-center justify-center text-white border-2 border-[#0a0a0a] hover:scale-110 transition-transform shadow-lg z-50"
                                >
                                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                                </button>
                            </div>

                            <nav className="flex-1 p-3 space-y-8 overflow-y-auto custom-scrollbar">
                                {/* COMMERCE */}
                                <div className="space-y-2">
                                    {(!isCollapsed || isMobileMenuOpen) && (
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 px-4 mb-2">Commerce</h4>
                                    )}
                                    <div className="space-y-1">
                                        {[
                                            { href: "/admin/rentals", icon: <FileCheck size={20} />, label: "Controls" },
                                            { href: "/admin/invoices", icon: <FileText size={20} />, label: "Invoices" },
                                            { href: "/admin/buy", icon: <Tag size={20} />, label: "Trade-In" },
                                            {
                                                label: "COMMERCE NEXUS",
                                                href: "/admin/commerce",
                                                icon: <Globe size={18} />,
                                                category: "COMMERCE"
                                            },
                                            {
                                                label: "SELL MATRIX",
                                                href: "/admin/sell-pricing",
                                                icon: <Tag size={18} />,
                                                category: "COMMERCE"
                                            },
                                            { href: "/admin/selling", icon: <ShoppingBag size={20} />, label: "Sell" },
                                            { href: "/admin/services", icon: <Wrench size={20} />, label: "Services" },
                                        ].map((item) => (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all relative group ${pathname === item.href ? "bg-[#8B5CF6] text-white shadow-[0_4px_20px_rgba(139,92,246,0.3)]" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
                                            >
                                                <div className={`${pathname === item.href ? "scale-110" : "group-hover:scale-110"} transition-transform`}>
                                                    {item.icon}
                                                </div>
                                                {(!isCollapsed || isMobileMenuOpen) && (
                                                    <span className={`text-sm font-bold tracking-tight ${pathname === item.href ? "translate-x-1" : "group-hover:translate-x-1"} transition-transform`}>{item.label}</span>
                                                )}
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                {/* MANAGEMENT */}
                                <div className="space-y-2">
                                    {(!isCollapsed || isMobileMenuOpen) && (
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 px-4 mb-2">Management</h4>
                                    )}
                                    <div className="space-y-1">
                                        {[
                                            { href: "/admin/users", icon: <Users size={20} />, label: "Users" },
                                            { href: "/admin/kyc", icon: <ShieldCheck size={20} />, label: "KYC VERIFICATION" },
                                            { href: "/admin/maintenance", icon: <Wrench size={20} />, label: "Maintenance & QC" },
                                            { href: "/admin/qr", icon: <QrCode size={20} />, label: "Scanner" },
                                            { href: "/admin/notifications", icon: <Bell size={20} />, label: "Comms Hub" },
                                            { href: "/admin/appearance", icon: <Image size={20} />, label: "Appearance" },
                                            { href: "/admin/master", icon: <Cpu size={20} />, label: "MASTER CTRL" },
                                        ].map((item) => (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all relative group ${pathname === item.href ? "bg-[#8B5CF6] text-white shadow-[0_4px_20px_rgba(139,92,246,0.3)]" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
                                            >
                                                <div className={`${pathname === item.href ? "scale-110" : "group-hover:scale-110"} transition-transform`}>
                                                    {item.icon}
                                                </div>
                                                {(!isCollapsed || isMobileMenuOpen) && (
                                                    <span className={`text-sm font-bold tracking-tight ${pathname === item.href ? "translate-x-1" : "group-hover:translate-x-1"} transition-transform`}>{item.label}</span>
                                                )}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </nav>

                            <div className="p-4 border-t border-white/5 space-y-2">
                                <Link
                                    href="/"
                                    className={`flex items-center gap-4 px-4 py-3 rounded-2xl text-red-400/80 hover:bg-red-500/10 hover:text-red-500 transition-all group overflow-hidden`}
                                >
                                    <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                                    {(!isCollapsed || isMobileMenuOpen) && <span className="text-sm font-black uppercase tracking-widest italic">Terminate</span>}
                                </Link>

                                {(!isCollapsed || isMobileMenuOpen) && (
                                    <div className="px-4 py-3 mt-2 bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-white/5 rounded-2xl">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
                                            <p className="text-[9px] font-black italic text-blue-400 uppercase tracking-widest">System Hybrid</p>
                                        </div>
                                        <p className="text-[8px] text-white/30 uppercase font-mono tracking-tighter leading-tight">V4.0.2 • STABLE_CORE</p>
                                    </div>
                                )}
                            </div>
                        </aside>
                    </>
                )}


                {/* Main Content */}
                <main className={`flex-1 ${isAppearancePage ? 'ml-0' : isCollapsed ? 'ml-[70px]' : 'ml-64'} flex flex-col h-screen overflow-hidden transition-all duration-500 ease-in-out`}>
                    {!isAppearancePage && <TopNav />}
                    <div className={`flex-1 ${isAppearancePage ? 'p-0' : 'p-4 md:p-8'} overflow-y-auto custom-scrollbar`}>
                        <div className={`${isAppearancePage ? 'max-w-none' : 'max-w-none w-full mx-auto'}`}>
                            {children}
                        </div>
                    </div>
                </main>
                <TacticalHUDAlert />
                <CommandPalette />
            </NeuralAlertProvider>
        </div>
    );
}
