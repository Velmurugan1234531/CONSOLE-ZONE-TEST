"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RevenueDataPoint } from "@/services/admin";
import { formatCurrency } from "@/utils/format";

interface RevenueChartProps {
    data: RevenueDataPoint[];
    total: number;
    growth: number;
    timeRange: string;
    onRangeChange: (range: string) => void;
}

export function RevenueChart({ data, total, growth, timeRange, onRangeChange }: RevenueChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // Calculate dimensions
    const height = 200;
    const width = 100; // Percent
    const maxVal = Math.max(...data.map(d => d.amount), 100) * 1.2;

    // Generate Path
    const getX = (index: number) => (index / (data.length - 1)) * 100;
    const getY = (val: number) => height - (val / maxVal) * height;

    const points = data.map((d, i) => `${getX(i)},${getY(d.amount)}`).join(" ");
    const areaPath = `${points} 100,${height} 0,${height}`;

    return (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 relative overflow-visible group">

            {/* Header */}
            <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Revenue</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white">{formatCurrency(total)}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${growth >= 0 ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-red-500/10 text-red-500'}`}>
                            {growth >= 0 ? '+' : ''}{growth}%
                        </span>
                    </div>
                </div>

                <div className="flex bg-white/5 p-1 rounded-lg">
                    {['WEEK', 'MONTH'].map((t) => (
                        <button
                            key={t}
                            onClick={() => onRangeChange(t)}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${timeRange === t
                                ? 'bg-white/10 text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart Container */}
            <div className="h-[200px] w-full relative group cursor-crosshair">
                <svg
                    viewBox={`0 0 100 ${height}`}
                    preserveAspectRatio="none"
                    className="w-full h-full overflow-visible"
                >
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
                        <line
                            key={tick}
                            x1="0"
                            y1={height * tick}
                            x2="100"
                            y2={height * tick}
                            stroke="white"
                            strokeOpacity="0.05"
                            strokeDasharray="2"
                        />
                    ))}

                    {/* Area Fill */}
                    <motion.path
                        initial={{ opacity: 0, d: `0,${height} 100,${height} 100,${height} 0,${height}` }}
                        animate={{ opacity: 1, d: `M${points} L100,${height} L0,${height} Z` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        fill="url(#chartGradient)"
                    />

                    {/* Line Stroke */}
                    <motion.polyline
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2"
                        points={points}
                        vectorEffect="non-scaling-stroke"
                    />

                    {/* Interactive Points */}
                    {data.map((d, i) => (
                        <g key={i}>
                            {/* Invisible trigger zone */}
                            <rect
                                x={getX(i) - 2} // Approximate width for trigger
                                y="0"
                                width="4"
                                height={height}
                                fill="transparent"
                                onMouseEnter={() => setHoveredIndex(i)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            />
                            {/* Dot on hover */}
                            {hoveredIndex === i && (
                                <circle
                                    cx={getX(i)}
                                    cy={getY(d.amount)}
                                    r="4"
                                    fill="#10B981"
                                    stroke="white"
                                    strokeWidth="2"
                                    vectorEffect="non-scaling-stroke"
                                />
                            )}
                        </g>
                    ))}
                </svg>

                {/* Hover Tooltip */}
                <AnimatePresence>
                    {hoveredIndex !== null && data[hoveredIndex] && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute top-0 pointer-events-none bg-[#0a0a0a] border border-[#10B981] p-3 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] z-20"
                            style={{
                                left: `${(hoveredIndex / (data.length - 1)) * 100}%`,
                                transform: 'translate(-50%, -100%)',
                                marginTop: '-10px'
                            }}
                        >
                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{data[hoveredIndex].formattedDate}</div>
                            <div className="text-xl font-black text-white">{formatCurrency(data[hoveredIndex].amount)}</div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between mt-4 text-[10px] text-gray-600 font-mono font-bold uppercase">
                {data.map((d, i) => (
                    // Show only some labels to avoid crowding
                    (i % 2 === 0 || i === data.length - 1) && (
                        <span key={i}>{d.formattedDate}</span>
                    )
                ))}
            </div>

        </div>
    );
}
