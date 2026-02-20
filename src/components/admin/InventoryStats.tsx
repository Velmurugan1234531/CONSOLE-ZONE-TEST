import { Box, Package, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/utils/format";

interface InventoryStatsProps {
    products: any[];
}

export function InventoryStats({ products }: InventoryStatsProps) {
    const totalValue = products.reduce((acc, p) => acc + p.price * p.stock, 0);
    const lowStockCount = products.filter(p => p.stock < 3).length;
    const topMover = [...products].sort((a, b) => b.totalRents - a.totalRents)[0];
    const operationalCount = products.filter(p => p.status === 'live').length;
    const healthPercentage = Math.round((operationalCount / products.length) * 100) || 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Net Valuation */}
            <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#06B6D4]/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Total Valuation</p>
                        <h2 className="text-3xl font-black text-white font-display">{formatCurrency(totalValue)}</h2>
                    </div>
                    <div className="bg-[#06B6D4]/10 p-2 rounded-lg text-[#06B6D4]">
                        <Box size={20} />
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#10B981]">
                    <ArrowUpRight size={14} /> +15.3% vs last month
                </div>
            </div>

            {/* Stock Health */}
            <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Stock Health</p>
                        <h2 className="text-3xl font-black text-white font-display">{healthPercentage}%</h2>
                    </div>
                    <div className="bg-[#F59E0B]/10 p-2 rounded-lg text-[#F59E0B]">
                        <Package size={20} />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400">
                        <span>Operational</span>
                        <span>{lowStockCount} Low Stock</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
                        <div className="h-full bg-[#10B981] transition-all duration-1000" style={{ width: `${healthPercentage}%` }}></div>
                        <div className="h-full bg-[#F59E0B]" style={{ width: `${(lowStockCount / products.length) * 100}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Top Performer */}
            <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl relative overflow-hidden group hover:border-[#8B5CF6]/50 transition-colors">
                {topMover && (
                    <div className="flex gap-4 items-center">
                        <div className="w-16 h-16 bg-white/5 rounded-xl overflow-hidden border border-white/10">
                            <img src={topMover.image} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <p className="text-[#8B5CF6] text-xs font-bold uppercase tracking-widest mb-1">🔥 Top Mover</p>
                            <h3 className="text-lg font-bold text-white leading-tight">{topMover.name}</h3>
                            <p className="text-gray-400 text-xs mt-1 font-mono">{topMover.totalRents} RENTS TOTAL</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
