import { Device } from "@/types";
import { AlertTriangle, Clock, ShieldAlert } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface OverviewProps {
    criticalAssets: Device[];
}

export const MaintenanceOverview = ({ criticalAssets }: OverviewProps) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                    <ShieldAlert className="text-red-500" />
                    Critical Attention Required
                </h2>
                <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">{criticalAssets.length} Assets Flagged</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {criticalAssets.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-white/10 rounded-3xl opacity-50">
                        <p className="text-gray-500 font-mono uppercase tracking-widest">All Systems Operational</p>
                    </div>
                ) : (
                    criticalAssets.map(asset => (
                        <div key={asset.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between group hover:border-red-500/50 transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-2 h-12 rounded-full ${asset.maintenance_status === 'Critical' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
                                <div>
                                    <h3 className="font-bold text-white uppercase tracking-wider">{asset.model}</h3>
                                    <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">{asset.serialNumber}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <span className="text-[9px] font-black uppercase text-gray-500 block">Status</span>
                                    <span className={`text-xs font-bold uppercase tracking-wider ${asset.maintenance_status === 'Critical' ? 'text-red-500' : 'text-amber-500'}`}>
                                        {asset.maintenance_status}
                                    </span>
                                </div>

                                <div className="text-right hidden md:block">
                                    <span className="text-[9px] font-black uppercase text-gray-500 block">Last Service</span>
                                    <span className="text-xs font-mono text-gray-300">
                                        {asset.lastService ? formatDistanceToNow(new Date(asset.lastService), { addSuffix: true }) : 'Never'}
                                    </span>
                                </div>

                                <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
                                    Inspect
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
