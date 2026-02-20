"use client";

import { Clock, Calendar } from "lucide-react";

export function SalesHeatmap() {
    // Mock Heatmap Data (Day x Time Slot)
    // 0 = Low, 1 = Med, 2 = High
    const heatmap = [
        [0, 1, 0, 2, 1, 0, 0], // Morning
        [1, 2, 2, 3, 2, 1, 1], // Afternoon
        [0, 1, 3, 4, 3, 2, 1], // Evening
    ];

    const intensityColor = (val: number) => {
        if (val === 0) return 'bg-[#0a0a0a] border-white/5';
        if (val === 1) return 'bg-[#10B981]/20 border-[#10B981]/30';
        if (val === 2) return 'bg-[#10B981]/40 border-[#10B981]/50';
        if (val === 3) return 'bg-[#10B981]/70 border-[#10B981]/80';
        return 'bg-[#10B981] border-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.5)]';
    };

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const times = ['Morning', 'Afternoon', 'Evening'];

    return (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 h-full relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Clock size={14} className="text-[#8B5CF6]" />
                    Order Velocity Heatmap
                </h3>
                <div className="flex gap-2">
                    <span className="text-[9px] font-bold text-gray-600">LOW</span>
                    <div className="w-16 h-3 rounded-full bg-gradient-to-r from-gray-900 to-[#10B981]"></div>
                    <span className="text-[9px] font-bold text-[#10B981]">HIGH</span>
                </div>
            </div>

            <div className="grid grid-cols-[auto_1fr] gap-4">
                {/* Time Labels */}
                <div className="flex flex-col justify-around text-[10px] font-bold text-gray-500 uppercase tracking-wider py-8">
                    {times.map(t => <div key={t} className="h-8 flex items-center">{t}</div>)}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {/* Day Headers */}
                    {days.map(d => (
                        <div key={d} className="text-center text-[10px] font-bold text-gray-600 uppercase mb-2">
                            {d}
                        </div>
                    ))}

                    {/* Cells */}
                    {/* Re-mapping to render col by col or row by row? 
                        Grid is naturally row-by-row. 
                        Let's render rows (Times) and inside cols (Days).
                        Wait, CSS grid-cols-7 means 7 columns.
                        So we iterate slots.
                    */}

                    {/* Actually, let's just flattened loops for the grid */}
                    {/* Slot 1: Morning - 7 days */}
                    {heatmap[0].map((val, i) => <div key={`m-${i}`} className={`h-10 rounded-md border transition-all hover:scale-105 duration-300 ${intensityColor(val)}`}></div>)}

                    {/* Slot 2: Afternoon - 7 days */}
                    {heatmap[1].map((val, i) => <div key={`a-${i}`} className={`h-10 rounded-md border transition-all hover:scale-105 duration-300 ${intensityColor(val)}`}></div>)}

                    {/* Slot 3: Evening - 7 days */}
                    {heatmap[2].map((val, i) => <div key={`e-${i}`} className={`h-10 rounded-md border transition-all hover:scale-105 duration-300 ${intensityColor(val)}`}></div>)}
                </div>
            </div>

            <p className="text-[10px] text-gray-500 mt-4 text-center">
                *Peak Volume identified: <strong className="text-white">Wednesday Evenings</strong> (avg. 14 orders)
            </p>
        </div>
    );
}
