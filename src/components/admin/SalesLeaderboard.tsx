"use client";

import { Trophy, TrendingUp, Package } from "lucide-react";
import { formatCurrency } from "@/utils/format";

interface SalesLeaderboardProps {
    data: any[];
}

export function SalesLeaderboard({ data }: SalesLeaderboardProps) {
    // Mock data if empty
    const products = data.length > 0 ? data : [
        { name: "PS5 DualSense Controller", sold: 142, revenue: 921000 },
        { name: "FIFA 24 (PS5)", sold: 89, revenue: 356000 },
        { name: "Xbox Series X", sold: 45, revenue: 2245000 },
        { name: "Nintendo Switch OLED", sold: 34, revenue: 1020000 },
        { name: "Meta Quest 3", sold: 28, revenue: 1400000 },
    ];

    return (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 h-full">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                <Trophy size={14} className="text-[#F59E0B]" />
                Top Performers
            </h3>

            <div className="space-y-4">
                {products.map((product, i) => (
                    <div key={i} className="flex items-center gap-4 group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border ${i === 0 ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/30' :
                            i === 1 ? 'bg-gray-400/20 text-gray-300 border-gray-400/30' :
                                i === 2 ? 'bg-[#B45309]/20 text-[#B45309] border-[#B45309]/30' :
                                    'bg-white/5 text-gray-500 border-white/10'
                            }`}>
                            {i + 1}
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-bold text-white truncate">{product.name}</div>
                            <div className="text-[10px] text-gray-500 flex items-center gap-2">
                                <span className="flex items-center gap-1"><Package size={10} /> {product.sold} sold</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-mono font-bold text-[#10B981]">{formatCurrency(product.revenue)}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
