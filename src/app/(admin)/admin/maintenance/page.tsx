"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Wrench, AlertTriangle, CheckCircle, Clock, Activity, Calendar, ClipboardList } from "lucide-react";
import Link from "next/link";
import { MaintenanceStats } from "@/components/admin/maintenance/Stats";
import { MaintenanceOverview } from "@/components/admin/maintenance/Overview";
import { ServicePlanner } from "@/components/admin/maintenance/Planner";
import { WorkBench } from "@/components/admin/maintenance/WorkBench";
import { getMaintenanceDashboardStats, getCriticalAssets } from "@/services/maintenance";
import { Device } from "@/types";

export default function MaintenancePage() {
    const [stats, setStats] = useState({ overdue: 0, inRepair: 0, healthScore: 0 });
    const [criticalAssets, setCriticalAssets] = useState<Device[]>([]);
    const [currentTab, setCurrentTab] = useState<'overview' | 'planner' | 'workbench'>('overview');

    const loadData = async () => {
        try {
            const statsData = await getMaintenanceDashboardStats();
            setStats(statsData);

            const assetsData = await getCriticalAssets();
            setCriticalAssets(assetsData || []);
        } catch (error) {
            console.error("MaintenancePage loadData failed:", error);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 lg:p-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <Link href="/admin" className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-3 italic">
                            Maintenance <span className="text-amber-500">Control</span>
                        </h1>
                    </div>
                    <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest ml-12">Fleet Reliability & QC Protocols</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                        <button
                            onClick={() => setCurrentTab('overview')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currentTab === 'overview' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setCurrentTab('planner')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currentTab === 'planner' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            Planner
                        </button>
                        <button
                            onClick={() => setCurrentTab('workbench')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currentTab === 'workbench' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            Workbench
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-12 gap-6">
                {/* Stats Cards */}
                <MaintenanceStats stats={stats} />

                {/* Main View */}
                <div className="col-span-12 bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 min-h-[500px]">
                    {currentTab === 'overview' && (
                        <MaintenanceOverview criticalAssets={criticalAssets} />
                    )}
                    {currentTab === 'planner' && (
                        <ServicePlanner />
                    )}
                    {currentTab === 'workbench' && (
                        <WorkBench />
                    )}
                </div>
            </div>
        </div>
    );
}
