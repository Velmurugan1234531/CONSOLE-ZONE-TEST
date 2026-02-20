import { DollarSign, Clock, Activity, Percent, AlertTriangle, Layers } from "lucide-react";
import { formatCurrency } from "@/utils/format";

interface RentalStatsProps {
    rentals: any[];
}

export function RentalStats({ rentals }: RentalStatsProps) {
    const activeRentals = rentals.filter(r => r.status === 'active');
    const overdueRentals = rentals.filter(r => r.status === 'overdue');
    // const totalInventory = 50; // hardcoded for now or fetch
    // Use active + available count logic properly in real app.
    // Let's assume for this "Utilization" metric, we just look at active vs total rentals historically or just a proxy.
    // Better proxy: Active Count.

    const overdueValue = overdueRentals.reduce((sum, r) => sum + Number(r.total_price), 0);
    const potentialRevenue = activeRentals.reduce((sum, r) => sum + Number(r.total_price), 0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/10">
                        <Layers size={24} className="text-blue-500" />
                    </div>
                </div>
                <h3 className="text-3xl font-black text-white mb-1">{activeRentals.length}</h3>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Active Deployments</p>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/10">
                        <DollarSign size={24} className="text-green-500" />
                    </div>
                </div>
                <h3 className="text-3xl font-black text-white mb-1">{formatCurrency(potentialRevenue)}</h3>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">In-Flight Revenue</p>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <AlertTriangle size={64} />
                </div>
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/10">
                        <AlertTriangle size={24} className="text-red-500" />
                    </div>
                    {overdueRentals.length > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">
                            CRITICAL
                        </span>
                    )}
                </div>
                <h3 className="text-3xl font-black text-white mb-1">{formatCurrency(overdueValue)}</h3>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Risk Value ({overdueRentals.length} Items)</p>
            </div>
        </div>
    );
}
