"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getRevenueTrend, RevenueDataPoint } from "@/services/analytics";
import { TrendingUp, Calendar } from "lucide-react";

interface RevenueTrendChartProps {
    days?: number;
}

export function RevenueTrendChart({ days = 14 }: RevenueTrendChartProps) {
    const [data, setData] = useState<RevenueDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [chartType, setChartType] = useState<'area' | 'line' | 'bar'>('area');

    useEffect(() => {
        loadTrendData();
    }, [days]);

    const loadTrendData = async () => {
        try {
            const trendData = await getRevenueTrend(days);
            setData(trendData);
        } catch (error) {
            console.error('Failed to load revenue trend:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 h-96 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#06B6D4]"></div>
                    <p className="text-gray-500 text-xs font-mono uppercase animate-pulse">Analyzing Revenue Data...</p>
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 h-96 flex items-center justify-center">
                <p className="text-gray-500 text-sm font-mono uppercase">No revenue data available</p>
            </div>
        );
    }

    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
    const avgRevenue = totalRevenue / data.length;
    const maxRevenue = Math.max(...data.map(d => d.revenue));
    const minRevenue = Math.min(...data.map(d => d.revenue));

    // Custom tooltip component
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#0a0a0a] border border-[#06B6D4]/50 rounded-xl p-3 shadow-lg shadow-[#06B6D4]/20">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-lg font-black text-[#06B6D4]">₹{payload[0].value.toLocaleString()}</p>
                </div>
            );
        }
        return null;
    };

    const renderChart = () => {
        const commonProps = {
            data,
            margin: { top: 10, right: 10, left: 0, bottom: 0 }
        };

        switch (chartType) {
            case 'line':
                return (
                    <LineChart {...commonProps}>
                        <defs>
                            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#06B6D4" stopOpacity={1} />
                                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                        <XAxis
                            dataKey="date"
                            stroke="#666"
                            style={{ fontSize: '10px', fontFamily: 'monospace' }}
                            tick={{ fill: '#666' }}
                        />
                        <YAxis
                            stroke="#666"
                            style={{ fontSize: '10px', fontFamily: 'monospace' }}
                            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                            tick={{ fill: '#666' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="url(#lineGradient)"
                            strokeWidth={3}
                            dot={{ fill: '#06B6D4', r: 4 }}
                            activeDot={{ r: 6, fill: '#06B6D4' }}
                            animationDuration={1000}
                        />
                    </LineChart>
                );
            case 'bar':
                return (
                    <BarChart {...commonProps}>
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.8} />
                                <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.3} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                        <XAxis
                            dataKey="date"
                            stroke="#666"
                            style={{ fontSize: '10px', fontFamily: 'monospace' }}
                            tick={{ fill: '#666' }}
                        />
                        <YAxis
                            stroke="#666"
                            style={{ fontSize: '10px', fontFamily: 'monospace' }}
                            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                            tick={{ fill: '#666' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                            dataKey="revenue"
                            fill="url(#barGradient)"
                            radius={[8, 8, 0, 0]}
                            animationDuration={1000}
                        />
                    </BarChart>
                );
            default: // 'area'
                return (
                    <AreaChart {...commonProps}>
                        <defs>
                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                        <XAxis
                            dataKey="date"
                            stroke="#666"
                            style={{ fontSize: '10px', fontFamily: 'monospace' }}
                            tick={{ fill: '#666' }}
                        />
                        <YAxis
                            stroke="#666"
                            style={{ fontSize: '10px', fontFamily: 'monospace' }}
                            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                            tick={{ fill: '#666' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#06B6D4"
                            strokeWidth={3}
                            fill="url(#areaGradient)"
                            animationDuration={1000}
                        />
                    </AreaChart>
                );
        }
    };

    return (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                        <TrendingUp size={20} className="text-[#06B6D4]" />
                        Revenue Trend
                    </h3>
                    <p className="text-xs text-gray-500 font-mono mt-1">Last {days} days performance analysis</p>
                </div>

                {/* Chart Type Switcher */}
                <div className="flex gap-2 bg-white/5 p-1 rounded-lg">
                    {[
                        { type: 'area' as const, label: 'Area' },
                        { type: 'line' as const, label: 'Line' },
                        { type: 'bar' as const, label: 'Bar' }
                    ].map(({ type, label }) => (
                        <button
                            key={type}
                            onClick={() => setChartType(type)}
                            className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${chartType === type
                                    ? 'bg-[#06B6D4] text-black shadow-sm'
                                    : 'text-gray-500 hover:text-white'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Total</p>
                    <p className="text-lg font-black text-emerald-500">₹{totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Average</p>
                    <p className="text-lg font-black text-[#06B6D4]">₹{avgRevenue.toFixed(0).toLocaleString()}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Peak</p>
                    <p className="text-lg font-black text-orange-500">₹{maxRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Lowest</p>
                    <p className="text-lg font-black text-gray-400">₹{minRevenue.toLocaleString()}</p>
                </div>
            </div>

            {/* Chart */}
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                </ResponsiveContainer>
            </div>

            {/* Background Effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#06B6D4]/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        </div>
    );
}
