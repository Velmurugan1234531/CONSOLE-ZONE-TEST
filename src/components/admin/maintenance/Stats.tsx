import { AlertTriangle, Wrench, Activity } from "lucide-react";

interface StatsProps {
    stats: {
        overdue: number;
        inRepair: number;
        healthScore: number;
    };
}

export const MaintenanceStats = ({ stats }: StatsProps) => {
    return (
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-3xl relative overflow-hidden group hover:border-amber-500/30 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[60px] -z-10 group-hover:bg-amber-500/20 transition-all"></div>
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
                        <AlertTriangle size={24} />
                    </div>
                    <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase rounded-full tracking-widest">Action Required</span>
                </div>
                <div className="space-y-1">
                    <h3 className="text-4xl font-black">{stats.overdue}</h3>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Overdue Assets</p>
                </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-3xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] -z-10 group-hover:bg-blue-500/20 transition-all"></div>
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                        <Wrench size={24} />
                    </div>
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase rounded-full tracking-widest">In Progress</span>
                </div>
                <div className="space-y-1">
                    <h3 className="text-4xl font-black">{stats.inRepair}</h3>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Active Work Orders</p>
                </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-3xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] -z-10 group-hover:bg-emerald-500/20 transition-all"></div>
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                        <Activity size={24} />
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase rounded-full tracking-widest">Fleet Health</span>
                </div>
                <div className="space-y-1">
                    <h3 className="text-4xl font-black">{stats.healthScore}%</h3>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Operational Integrity</p>
                </div>
            </div>
        </div>
    );
};
