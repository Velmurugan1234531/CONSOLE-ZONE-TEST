"use client";

import { useEffect, useState } from "react";
import { TrendingUp, DollarSign, Activity, Users, ArrowUp, ArrowDown } from "lucide-react";
import { getRevenueStats, getUtilizationStats, RevenueStats, UtilizationStats } from "@/services/analytics";

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color: 'cyan' | 'purple' | 'green' | 'orange';
}

function StatCard({ icon, label, value, trend, color }: StatCardProps) {
    const colorClasses = {
        cyan: 'bg-[#06B6D4]/10 border-[#06B6D4]/20 text-[#06B6D4]',
        purple: 'bg-[#8B5CF6]/10 border-[#8B5CF6]/20 text-[#8B5CF6]',
        green: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
        orange: 'bg-orange-500/10 border-orange-500/20 text-orange-500'
    };

    return (
        <div className={`${colorClasses[color]} border rounded-2xl p-6 relative overflow-hidden group hover:scale-105 transition-transform duration-300`}>
            {/* Background Glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-current to-transparent opacity-10 blur-3xl`}></div>
            </div>

            <div className="relative z-10">
                {/* Icon */}
                <div className="mb-4">
                    {icon}
                </div>

                {/* Label */}
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
                    {label}
                </p>

                {/* Value */}
                <div className="flex items-end justify-between">
                    <h3 className="text-3xl font-black text-white">
                        {value}
                    </h3>

                    {/* Trend */}
                    {trend && (
                        <div className={`flex items-center gap-1 text-xs font-bold ${trend.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                            {trend.isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                            {trend.value}%
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function QuickStatsCards() {
    const [revenue, setRevenue] = useState<RevenueStats>({ today: 0, week: 0, month: 0, total: 0 });
    const [utilization, setUtilization] = useState<UtilizationStats>({ activeRentals: 0, totalConsoles: 0, utilizationRate: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const [revenueData, utilizationData] = await Promise.all([
                getRevenueStats(),
                getUtilizationStats()
            ]);
            setRevenue(revenueData);
            setUtilization(utilizationData);
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-40 bg-white/5 rounded-2xl border border-white/10"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                icon={<DollarSign size={32} />}
                label="Today's Revenue"
                value={`₹${revenue.today.toLocaleString()}`}
                trend={{ value: 12, isPositive: true }}
                color="cyan"
            />

            <StatCard
                icon={<TrendingUp size={32} />}
                label="This Week"
                value={`₹${revenue.week.toLocaleString()}`}
                trend={{ value: 8, isPositive: true }}
                color="purple"
            />

            <StatCard
                icon={<Activity size={32} />}
                label="Utilization Rate"
                value={`${utilization.utilizationRate}%`}
                trend={{ value: 5, isPositive: true }}
                color="green"
            />

            <StatCard
                icon={<Users size={32} />}
                label="Active Rentals"
                value={utilization.activeRentals.toString()}
                color="orange"
            />
        </div>
    );
}
