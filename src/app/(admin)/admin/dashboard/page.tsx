
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUserRole, AdminUser, adminSignOut } from "@/services/admin-auth";
import { getAdminLogs, AdminLog } from "@/services/admin-logs";
import { motion } from "framer-motion";
import {
    Shield,
    Users,
    FileText,
    Activity,
    LogOut,
    UserCheck,
    ShieldAlert,
    Clock
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboardPage() {
    const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
    const [recentLogs, setRecentLogs] = useState<AdminLog[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            const userData = await getCurrentUserRole(user.id);
            setCurrentUser(userData);

            const logs = await getAdminLogs(10);
            setRecentLogs(logs);
        } catch (error) {
            console.error("Failed to load dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await adminSignOut();
            router.push("/admin/login");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case "super_admin":
                return "bg-purple-500/20 border-purple-500/40 text-purple-500";
            case "admin":
                return "bg-blue-500/20 border-blue-500/40 text-blue-500";
            case "sub_admin":
                return "bg-cyan-500/20 border-cyan-500/40 text-cyan-500";
            case "staff":
                return "bg-green-500/20 border-green-500/40 text-green-500";
            default:
                return "bg-gray-500/20 border-gray-500/40 text-gray-500";
        }
    };

    const formatTimestamp = (timestamp: any) => {
        if (!timestamp) return "N/A";
        // Handle both ISO string and Date object
        const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
        if (date instanceof Date && !isNaN(date.getTime())) {
            return date.toLocaleString();
        }
        return "Invalid Date";
    };

    return (
        <div className="min-h-screen bg-[#050505] font-display">
            {/* Header */}
            <div className="bg-gradient-to-b from-[#0A0A0A] to-transparent border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[#A855F7]/20 border border-[#A855F7]/40 rounded-xl">
                                <Shield className="text-[#A855F7]" size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">
                                    Admin Portal
                                </h1>
                                <p className="text-gray-500 text-xs font-black uppercase tracking-[0.2em]">
                                    {currentUser?.displayName || "Loading..."}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {currentUser && (
                                <div className={`px-4 py-2 rounded-lg border font-bold text-xs uppercase tracking-wider ${getRoleBadgeColor(currentUser.role)}`}>
                                    {currentUser.role.replace("_", " ")}
                                </div>
                            )}
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-500 font-bold uppercase tracking-wider text-xs transition-all"
                            >
                                <LogOut size={16} />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <UserCheck className="text-green-500" size={32} />
                            <span className="text-green-500 font-black text-2xl">{currentUser?.isActive ? "Active" : "Inactive"}</span>
                        </div>
                        <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">Account Status</h3>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <ShieldAlert className="text-yellow-500" size={32} />
                            <span className="text-yellow-500 font-black text-2xl">{currentUser?.loginAttempts || 0}</span>
                        </div>
                        <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">Failed Logins</h3>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <Clock className="text-blue-500" size={32} />
                            <span className="text-blue-500 font-bold text-sm">{formatTimestamp(currentUser?.lastLogin).split(",")[0]}</span>
                        </div>
                        <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">Last Login</h3>
                    </motion.div>
                </div>

                {/* Quick actions */}
                <div className="mb-8">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Link href="/admin/manage-admins" className="block">
                            <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 rounded-xl p-6 hover:from-purple-500/30 hover:to-purple-500/10 transition-all group">
                                <Users className="text-purple-500 mb-3 group-hover:scale-110 transition-transform" size={32} />
                                <h3 className="text-white font-black uppercase tracking-tight mb-1">Manage Admins</h3>
                                <p className="text-gray-500 text-xs">Create and manage admin accounts</p>
                            </div>
                        </Link>

                        <Link href="/admin/logs" className="block">
                            <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 rounded-xl p-6 hover:from-blue-500/30 hover:to-blue-500/10 transition-all group">
                                <FileText className="text-blue-500 mb-3 group-hover:scale-110 transition-transform" size={32} />
                                <h3 className="text-white font-black uppercase tracking-tight mb-1">Activity Logs</h3>
                                <p className="text-gray-500 text-xs">View admin activity history</p>
                            </div>
                        </Link>

                        <Link href="/dashboard" className="block">
                            <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 rounded-xl p-6 hover:from-green-500/30 hover:to-green-500/10 transition-all group">
                                <Activity className="text-green-500 mb-3 group-hover:scale-110 transition-transform" size={32} />
                                <h3 className="text-white font-black uppercase tracking-tight mb-1">User Dashboard</h3>
                                <p className="text-gray-500 text-xs">View your personal dashboard</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Recent activity */}
                <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight mb-4">Recent Activity</h2>
                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                        {recentLogs.length === 0 ? (
                            <div className="p-8 text-center text-gray-600">
                                <Activity className="mx-auto mb-3 opacity-50" size={32} />
                                <p className="font-bold uppercase tracking-wider text-sm">No recent activity</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/10">
                                {recentLogs.map((log, index) => (
                                    <motion.div
                                        key={log.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="p-4 hover:bg-white/5 transition-all"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="text-white font-bold text-sm mb-1">{log.action.replace(/_/g, " ").toUpperCase()}</p>
                                                <p className="text-gray-500 text-xs">
                                                    By: <span className="text-gray-400">{log.adminEmail}</span>
                                                    {log.targetUserEmail && (
                                                        <> | Target: <span className="text-gray-400">{log.targetUserEmail}</span></>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-gray-600 text-xs">{formatTimestamp(log.timestamp)}</p>
                                                <p className="text-gray-700 text-xs">{log.ipAddress}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
