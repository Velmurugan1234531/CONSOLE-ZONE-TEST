import { useMemo } from "react";
import { Device } from "@/types";
import { motion } from "framer-motion";
import { Layers, ChevronRight, AlertCircle, CheckCircle2, Gamepad2, Wrench, Settings } from "lucide-react";

interface FleetMergedViewProps {
    devices: Device[];
    onSelectModel: (model: string) => void;
    onEditCategory: (category: string) => void;
}

export function FleetMergedView({ devices, onSelectModel, onEditCategory }: FleetMergedViewProps) {
    const groupedModels = useMemo(() => {
        const groups: Record<string, {
            model: string;
            category: string;
            total: number;
            ready: number;
            rented: number;
            maintenance: number;
            repair: number;
            healthAvg: number;
            devices: Device[];
        }> = {};

        devices.forEach(d => {
            const modelKey = d.model || 'Unknown Model';
            const categoryKey = d.category || 'Uncategorized';

            if (!groups[modelKey]) {
                groups[modelKey] = {
                    model: modelKey,
                    category: categoryKey,
                    total: 0,
                    ready: 0,
                    rented: 0,
                    maintenance: 0,
                    repair: 0,
                    healthAvg: 0,
                    devices: []
                };
            }
            const g = groups[modelKey];
            g.total++;
            g.devices.push(d);
            g.healthAvg += d.health || 0;

            if (d.status === 'Ready') g.ready++;
            else if (d.status === 'Rented') g.rented++;
            else if (d.status === 'Maintenance') g.maintenance++;
            else if (d.status === 'Under-Repair') g.repair++;
        });

        return Object.values(groups).map(g => ({
            ...g,
            healthAvg: g.total > 0 ? Math.round(g.healthAvg / g.total) : 0
        })).sort((a, b) => b.total - a.total);
    }, [devices]);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4 p-4 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 border-b border-white/5 mx-2">
                <div className="col-span-4">Model Identity</div>
                <div className="col-span-2 text-center">Availability</div>
                <div className="col-span-4">Status Breakdown</div>
                <div className="col-span-2 text-right">Actions</div>
            </div>

            <div className="space-y-3">
                {groupedModels.map((group) => (
                    <motion.div
                        key={group.model}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-12 gap-4 p-5 items-center bg-[#0a0a0a] border border-white/5 rounded-2xl hover:border-[#8B5CF6]/30 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#8B5CF6] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        {/* Identity */}
                        <div className="col-span-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-[#8B5CF6]/10 group-hover:text-[#8B5CF6] transition-colors">
                                <Gamepad2 size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-tight">{group.model}</h3>
                                <span className="text-[9px] font-black text-[#8B5CF6] uppercase tracking-widest bg-[#8B5CF6]/5 px-2 py-0.5 rounded border border-[#8B5CF6]/10">{group.category}</span>
                            </div>
                        </div>

                        {/* Availability Bar */}
                        <div className="col-span-2 flex flex-col items-center justify-center gap-1.5">
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg font-black text-white leading-none">{group.ready}</span>
                                <span className="text-[9px] font-bold text-gray-500 uppercase">/ {group.total} Ready</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden flex">
                                <div className="h-full bg-emerald-500" style={{ width: `${(group.ready / group.total) * 100}%` }} />
                                <div className="h-full bg-blue-500" style={{ width: `${(group.rented / group.total) * 100}%` }} />
                                <div className="h-full bg-amber-500" style={{ width: `${(group.maintenance / group.total) * 100}%` }} />
                            </div>
                        </div>

                        {/* Status Breakdown */}
                        <div className="col-span-4 flex items-center gap-4 px-4">
                            <div className="flex items-center gap-2" title="Rented">
                                <div className="p-1.5 rounded-full bg-blue-500/10 text-blue-500"><Layers size={10} /></div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-bold text-gray-500 uppercase">Rent</span>
                                    <span className="text-xs font-black text-white leading-none">{group.rented}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2" title="Maintenance">
                                <div className="p-1.5 rounded-full bg-amber-500/10 text-amber-500"><Wrench size={10} /></div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-bold text-gray-500 uppercase">Maint</span>
                                    <span className="text-xs font-black text-white leading-none">{group.maintenance}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2" title="Repair">
                                <div className="p-1.5 rounded-full bg-red-500/10 text-red-500"><AlertCircle size={10} /></div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-bold text-gray-500 uppercase">Repair</span>
                                    <span className="text-xs font-black text-white leading-none">{group.repair}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 ml-auto" title="Avg Health">
                                <div className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-500"><CheckCircle2 size={10} /></div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-bold text-gray-500 uppercase">Health</span>
                                    <span className="text-xs font-black text-white leading-none">{group.healthAvg}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="col-span-2 flex justify-end gap-2">
                            <button
                                onClick={() => onSelectModel(group.model)}
                                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest text-gray-300 hover:text-white transition-all group-hover:border-[#8B5CF6]/20 border border-transparent"
                            >
                                View Units <ChevronRight size={10} />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEditCategory(group.category);
                                }}
                                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 text-[9px] font-black uppercase tracking-widest text-[#8B5CF6] hover:text-white transition-all border border-[#8B5CF6]/20"
                            >
                                <Settings size={10} /> Config
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
