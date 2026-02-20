"use client";

import { FleetManager } from "@/components/admin/FleetManager";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function FleetPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 lg:p-10 space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <Link href="/admin" className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-3 italic">
                            Hardware <span className="text-[#8B5CF6]">Matrix</span>
                        </h1>
                    </div>
                    <p className="text-gray-500 text-sm font-medium ml-12 uppercase tracking-[0.2em]">Deep Inventory & Identity Protocols</p>
                </div>

                <Link
                    href="/rental"
                    target="_blank"
                    className="group flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all"
                >
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#8B5CF6]">Live View</span>
                        <span className="text-sm font-bold text-white group-hover:text-[#8B5CF6] transition-colors">Rental Store</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6] group-hover:scale-110 transition-transform">
                        <ArrowLeft size={18} className="rotate-180" />
                    </div>
                </Link>
            </div>

            <FleetManager />
        </div>
    );
}
