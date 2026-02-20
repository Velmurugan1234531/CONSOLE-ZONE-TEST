"use client";

import { useState, useEffect } from "react";
import {
    ShieldCheck,
    Users,
    Clock,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    ShieldAlert,
    Activity,
    ChevronRight,
    Search,
    Fingerprint
} from "lucide-react";
import { motion } from "framer-motion";
import { getKYCStats, getPendingKYCRequests } from "@/services/admin";
import { format } from "date-fns";
import { CommandNexusCard } from "../CommandNexusCard";

export function KYCCommandNexus() {
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, approvalRate: 0 });
    const [recentRequests, setRecentRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [kycStats, pendingReqs] = await Promise.all([
                    getKYCStats(),
                    getPendingKYCRequests()
                ]);
                setStats(kycStats);
                setRecentRequests(pendingReqs.slice(0, 5));
            } catch (error) {
                console.error("Failed to load KYC Nexus data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    return (
        <div className="space-y-12">
            {/* Mission Critical Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard
                    label="Citizens in Queue"
                    value={stats.pending.toString()}
                    icon={Clock}
                    color="orange"
                    trend="AWAITING REVIEW"
                />
                <MetricCard
                    label="Verified Operatives"
                    value={stats.approved.toString()}
                    icon={ShieldCheck}
                    color="emerald"
                    trend={`${stats.approvalRate}% RATE`}
                />
                <MetricCard
                    label="Security Rejections"
                    value={stats.rejected.toString()}
                    icon={ShieldAlert}
                    color="red"
                    trend="FAILURES"
                />
                <MetricCard
                    label="Trust Index"
                    value="LEVEL 4"
                    icon={Activity}
                    color="blue"
                    trend="SYSTEM NOMINAL"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Deployment Feed */}
                <div className="lg:col-span-2">
                    <CommandNexusCard title="Identity Transmission Feed" subtitle="Real-time uplink of citizen verification requests" icon={Fingerprint} statusColor="purple">
                        <div className="bg-black/40 border border-white/5 rounded-3xl overflow-hidden mt-6">
                            <div className="p-1 bg-white/5 border-b border-white/10 flex items-center justify-between px-6 py-3">
                                <span className="text-[9px] font-black text-gray-500 uppercase">Latest Submissions</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-mono text-purple-400 animate-pulse uppercase">Live Uplink Active</span>
                                </div>
                            </div>

                            <div className="divide-y divide-white/5 min-h-[300px]">
                                {isLoading ? (
                                    <div className="p-12 flex items-center justify-center h-full">
                                        <div className="w-8 h-8 border-2 border-[#A855F7] border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : recentRequests.length === 0 ? (
                                    <div className="p-20 text-center text-gray-600">
                                        <ShieldCheck size={40} className="mx-auto mb-4 opacity-10" />
                                        <p className="text-[10px] uppercase font-black tracking-widest italic">All Identities Verified. Sector Secure.</p>
                                    </div>
                                ) : (
                                    recentRequests.map((req, i) => (
                                        <div key={req.id} className="p-4 px-6 hover:bg-white/5 transition-colors flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-[#A855F7]/10 flex items-center justify-center text-[#A855F7] border border-[#A855F7]/20 group-hover:scale-110 transition-transform">
                                                    <Users size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-bold text-white uppercase">{req.full_name}</span>
                                                    <span className="text-[9px] text-gray-500 font-mono italic">UID: {req.id.slice(0, 8)}...</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right hidden sm:flex flex-col">
                                                    <span className="text-[9px] text-emerald-500 font-black uppercase">Pending Uplink</span>
                                                    <span className="text-[8px] text-gray-500">{req.kyc_submitted_at ? format(new Date(req.kyc_submitted_at), 'HH:mm:ss') : '--:--:--'}</span>
                                                </div>
                                                <button
                                                    onClick={() => window.location.href = '/admin/kyc'}
                                                    className="p-2 bg-white/5 rounded-lg border border-white/10 hover:border-[#A855F7] hover:text-[#A855F7] transition-all"
                                                >
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </CommandNexusCard>
                </div>

                {/* Command Protocols */}
                <div className="space-y-6">
                    <CommandNexusCard title="Verification Protocols" subtitle="Define automated matching constraints" icon={ShieldAlert} statusColor="red">
                        <div className="space-y-3 mt-6">
                            <ProtocolCard
                                title="STRICT MODE"
                                description="Enforce high-res selfie matching & precise geolocation."
                                active={true}
                                color="purple"
                            />
                            <ProtocolCard
                                title="AUTO-REJECT"
                                description="Instantly decline low-quality blurry transmissions."
                                active={false}
                                color="red"
                            />
                            <ProtocolCard
                                title="GUEST BYPASS"
                                description="Allow temporary rentals for unverified guests."
                                active={true}
                                color="blue"
                            />
                        </div>

                        <div className="mt-8 p-6 bg-gradient-to-br from-[#A855F7]/10 to-transparent border border-[#A855F7]/20 rounded-3xl relative overflow-hidden group">
                            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                <ShieldCheck size={120} />
                            </div>
                            <h4 className="text-[10px] font-black text-[#A855F7] uppercase tracking-[0.2em] mb-2">Global Trust Level</h4>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-black text-white italic">84.2</span>
                                <span className="text-xs font-bold text-emerald-500 mb-1">+2.4%</span>
                            </div>
                            <p className="text-[9px] text-gray-500 mt-4 uppercase font-bold tracking-widest leading-relaxed">
                                System is currently processing identity transmissions at peak efficiency. No breaches detected.
                            </p>
                        </div>
                    </CommandNexusCard>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ label, value, icon: Icon, color, trend }: any) {
    const colors: any = {
        emerald: 'from-emerald-500/10 to-transparent border-emerald-500/20 text-emerald-500',
        orange: 'from-orange-500/10 to-transparent border-orange-500/20 text-orange-500',
        red: 'from-red-500/10 to-transparent border-red-500/20 text-red-500',
        blue: 'from-blue-500/10 to-transparent border-blue-500/20 text-blue-500',
        purple: 'from-[#A855F7]/10 to-transparent border-[#A855F7]/20 text-[#A855F7]'
    };

    return (
        <div className={`bg-gradient-to-br ${colors[color]} border rounded-[2rem] p-6 relative group overflow-hidden`}>
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                <Icon size={48} />
            </div>
            <div className="relative z-10 flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 text-current">{label}</span>
                <span className="text-3xl font-black text-white italic">{value}</span>
                <span className="text-[8px] font-bold mt-2 text-current tracking-widest">{trend}</span>
            </div>
        </div>
    );
}

function ProtocolCard({ title, description, active, color }: any) {
    const colors: any = {
        purple: active ? 'bg-[#A855F7] border-[#A855F7]' : 'bg-white/5 border-white/10',
        red: active ? 'bg-red-500 border-red-500' : 'bg-white/5 border-white/10',
        blue: active ? 'bg-blue-500 border-blue-500' : 'bg-white/5 border-white/10',
    };

    return (
        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl group hover:border-white/20 transition-all">
            <div className="flex flex-col gap-1 pr-4">
                <span className="text-[10px] font-black text-white uppercase tracking-tighter">{title}</span>
                <p className="text-[8px] text-gray-500 uppercase font-bold tracking-widest leading-[1.4]">{description}</p>
            </div>
            <div className={`w-8 h-4 rounded-full p-0.5 border transition-all ${active ? (color === 'purple' ? 'bg-[#A855F7] border-[#A855F7]' : color === 'red' ? 'bg-red-500 border-red-500' : 'bg-blue-500 border-blue-500') : 'bg-gray-800 border-white/10'}`}>
                <div className={`w-2.5 h-2.5 rounded-full bg-white transition-transform ${active ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
        </div>
    );
}
