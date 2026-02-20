"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { VisualsService } from "@/services/visuals";
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, Smartphone } from "lucide-react";

export default function Footer() {
    const [visualSettings, setVisualSettings] = useState<any>(null);

    useEffect(() => {
        const load = async () => {
            const settings = await VisualsService.getSettings();
            setVisualSettings(settings);
        };
        load();
    }, []);

    if (visualSettings && visualSettings.layout.footerEnabled === false) return null;

    const brandParts = (visualSettings?.branding?.siteName || "CONSOLE ZONE").split(' ');

    return (
        <footer className="bg-[#050505] border-t border-white/5 pt-20 pb-10 px-4 mt-20 relative">
            <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                {/* Brand & Address */}
                <div className="space-y-6">
                    <Link href="/" className="text-2xl font-black text-white tracking-tighter uppercase font-display italic">
                        {brandParts[0]} <span className="text-[#A855F7]">{brandParts.slice(1).join(' ')}</span>
                    </Link>
                    <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                        {visualSettings?.branding?.tagline || "India's most trusted gaming marketplace. Buy, sell, or rent your favorite consoles and gear with ultimate ease."}
                    </p>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 text-gray-400">
                            <MapPin className="text-[#A855F7] shrink-0" size={18} />
                            <span className="text-xs">{visualSettings?.footer?.address || "No. 1, 10th Terrace, 1st Cross Street, Indiranagar, Chennai, Tamil Nadu 600020"}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-400">
                            <Smartphone className="text-[#A855F7] shrink-0" size={18} />
                            <span className="text-xs">{visualSettings?.footer?.phone || "+91 97898 82979 (WhatsApp Only)"}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-400">
                            <Mail className="text-[#A855F7] shrink-0" size={18} />
                            <span className="text-xs">{visualSettings?.footer?.email || "support@consolezone.in"}</span>
                        </div>
                    </div>
                </div>

                {/* Categories */}
                <div>
                    <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-8">Categories</h4>
                    <ul className="space-y-4">
                        <li><Link href="/buy?category=PS5" className="text-gray-500 hover:text-[#A855F7] text-sm transition-colors">PlayStation 5</Link></li>
                        <li><Link href="/buy?category=Xbox" className="text-gray-500 hover:text-[#A855F7] text-sm transition-colors">Xbox Series X|S</Link></li>
                        <li><Link href="/buy?category=Handheld" className="text-gray-500 hover:text-[#A855F7] text-sm transition-colors">Handheld Consoles</Link></li>
                        <li><Link href="/buy?category=Game" className="text-gray-500 hover:text-[#A855F7] text-sm transition-colors">Trending Games</Link></li>
                    </ul>
                </div>

                {/* Quick Links */}
                <div>
                    <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-8">Support</h4>
                    <ul className="space-y-4">
                        <li><Link href="/sell" className="text-gray-500 hover:text-[#A855F7] text-sm transition-colors">Sell Your Gear</Link></li>
                        <li><Link href="/rental" className="text-gray-500 hover:text-[#A855F7] text-sm transition-colors">Rental Plans</Link></li>
                        <li><Link href="/policies" className="text-gray-500 hover:text-[#A855F7] text-sm transition-colors">Return & Warranty Policy</Link></li>
                        <li><Link href="/contact" className="text-gray-500 hover:text-[#A855F7] text-sm transition-colors">Contact Us</Link></li>
                    </ul>
                </div>

                {/* Social & Contact */}
                <div className="space-y-8">
                    <div>
                        <h4
                            className="text-white font-bold uppercase tracking-widest text-xs mb-8 select-none"
                        >
                            Follow Us
                        </h4>
                        <div className="flex gap-4">
                            <a href={visualSettings?.footer?.socialLinks?.facebook || "#"} className="bg-white/5 p-3 rounded-lg hover:bg-[#A855F7] hover:text-white text-gray-400 transition-all"><Facebook size={18} /></a>
                            <a href={visualSettings?.footer?.socialLinks?.twitter || "#"} className="bg-white/5 p-3 rounded-lg hover:bg-[#A855F7] hover:text-white text-gray-400 transition-all"><Twitter size={18} /></a>
                            <a href={visualSettings?.footer?.socialLinks?.instagram || "#"} className="bg-white/5 p-3 rounded-lg hover:bg-[#A855F7] hover:text-white text-gray-400 transition-all"><Instagram size={18} /></a>
                            <a href={visualSettings?.footer?.socialLinks?.youtube || "#"} className="bg-white/5 p-3 rounded-lg hover:bg-[#A855F7] hover:text-white text-gray-400 transition-all"><Youtube size={18} /></a>
                        </div>
                    </div>
                    <div className="bg-[#A855F7]/10 border border-[#A855F7]/20 p-4 rounded-2xl">
                        <div className="flex items-center gap-3 text-[#A855F7] mb-2 font-bold text-sm">
                            <Mail className="text-[#A855F7] shrink-0" size={18} />
                            <span className="text-xs">{visualSettings?.footer?.email || "support@consolezone.in"}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-tighter flex items-center gap-2">
                            Support Hours:
                            <span>{visualSettings?.footer?.supportHours || "10:30 AM - 6:30 PM"}</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 pt-10 mt-20 border-t border-white/5">
                <div className="flex items-center justify-between text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                    <p>© {new Date().getFullYear()} {visualSettings?.footer?.copyrightText || "Console Zone"}. All rights reserved. <span className="text-[9px] opacity-50 text-blue-500 font-mono ml-2">v007::NEURAL_LINK::ONLINE</span></p>
                    <div className="flex gap-6">
                        <Link href="/policies" className="text-gray-600 hover:text-white text-xs lowercase">Privacy</Link>
                        <Link href="/policies" className="text-gray-600 hover:text-white text-xs lowercase">Terms</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
