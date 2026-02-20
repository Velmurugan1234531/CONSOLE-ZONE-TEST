"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import AuthButton from "./AuthButton";
import NotificationBell from "./NotificationBell";
import { useCart } from "@/context/cart-context";
import { ShoppingBag, Menu, X } from "lucide-react";
import { VisualsService } from "@/services/visuals";

export default function Navbar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [visualSettings, setVisualSettings] = useState<any>(null);
    const { totalItems } = useCart();

    useEffect(() => {
        const load = async () => {
            const settings = await VisualsService.getSettings();
            setVisualSettings(settings);
        };
        load();
    }, []);

    const links = [
        { name: "Home", href: "/" },
        { name: "Rental", href: "/rental" },
        { name: "Shop", href: "/buy" },
        { name: "Sell", href: "/sell" },
        { name: "Services", href: "/services" },
    ];

    const headerStyles = {
        modern: "bg-[#050505]/80 backdrop-blur-md border-b border-white/10",
        glass: "bg-[#050505]/40 backdrop-blur-xl border-b border-white/5",
        minimal: "bg-transparent border-none"
    };

    const navClass = visualSettings?.layout?.headerStyle
        ? headerStyles[visualSettings.layout.headerStyle as keyof typeof headerStyles]
        : headerStyles.modern;

    // Hide Navbar on Admin Panel
    if (pathname?.startsWith('/admin')) return null;

    return (
        <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${navClass}`}>
            <div className="w-full max-w-none px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link href="/" className="flex items-center gap-3">
                        <img src="/images/logo.jpg" alt="Logo" className="h-10 w-auto object-contain hover:brightness-110 transition-all rounded-lg" />
                        <span className="text-xl font-bold tracking-wider hidden sm:block italic font-display">
                            <span className="text-white">{visualSettings?.branding?.siteName?.split(' ')[0] || "CONSOLE"}</span>{' '}
                            <span className="text-[#A855F7]">{visualSettings?.branding?.siteName?.split(' ')[1] || "ZONE"}</span>
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        {links.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`text-sm font-black uppercase tracking-widest transition-all relative group ${pathname === link.href ? 'text-[#A855F7]' : 'text-gray-300 hover:text-white'}`}
                            >
                                {link.name}
                                {pathname === link.href && (
                                    <motion.span
                                        layoutId="nav-underline"
                                        className="absolute -bottom-1 left-0 w-full h-[2px] bg-[#A855F7] shadow-[0_0_10px_rgba(168,85,247,0.8)]"
                                    />
                                )}
                            </Link>
                        ))}

                        <div className="flex items-center gap-2">
                            <NotificationBell />
                            <AuthButton />
                        </div>

                        {/* Cart Link */}
                        <Link
                            href="/cart"
                            className="relative p-2 text-gray-300 hover:text-[#A855F7] transition-colors group"
                        >
                            <ShoppingBag size={20} className="group-hover:scale-110 transition-transform" />
                            {totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 bg-[#A855F7] text-white text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                                    {totalItems}
                                </span>
                            )}
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-4">
                        <Link
                            href="/cart"
                            className="relative p-2 text-gray-300"
                        >
                            <ShoppingBag size={20} />
                            {totalItems > 0 && (
                                <span className="absolute top-0 right-0 bg-[#A855F7] text-white text-[8px] font-black w-3 h-3 flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                                    {totalItems}
                                </span>
                            )}
                        </Link>
                        <button onClick={() => setIsOpen(!isOpen)} className="text-white">
                            {isOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>
            </div>


            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-[#050505] border-b border-white/10 overflow-hidden"
                    >
                        <div className="px-4 pt-2 pb-4 space-y-1">
                            {links.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`block py-2 text-base font-medium transition-colors ${pathname === link.href ? 'text-[#A855F7]' : 'text-gray-300 hover:text-white'}`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <div className="pt-4 flex items-center justify-between border-t border-white/5">
                                <AuthButton />
                                <NotificationBell />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
