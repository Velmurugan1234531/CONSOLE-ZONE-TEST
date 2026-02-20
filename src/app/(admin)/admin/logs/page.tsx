
"use client";

import { useState, useEffect } from "react";
import { getAdminLogs, AdminLog } from "@/services/admin-logs";
import { motion } from "framer-motion";
import { FileText, Search, Filter, Loader2, Calendar, User, Target } from "lucide-react";

export default function AdminLogsPage() {
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<AdminLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [actionFilter, setActionFilter] = useState("all");

    useEffect(() => {
        loadLogs();
    }, []);

    useEffect(() => {
        filterLogs();
    }, [searchTerm, actionFilter, logs]);

    const loadLogs = async () => {
        try {
            const allLogs = await getAdminLogs(200);
            setLogs(allLogs);
            setFilteredLogs(allLogs);
        } catch (error) {
            console.error("Failed to load logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterLogs = () => {
        let filtered = logs;

        // Filter by action type
        if (actionFilter !== "all") {
            filtered = filtered.filter(log => log.action === actionFilter);
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(log =>
                log.adminEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (log.targetUserEmail && log.targetUserEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
                log.action.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredLogs(filtered);
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

    const getActionColor = (action: string) => {
        if (action.includes("create")) return "text-green-500 bg-green-500/10 border-green-500/30";
        if (action.includes("delete") || action.includes("disable")) return "text-red-500 bg-red-500/10 border-red-500/30";
        if (action.includes("update") || action.includes("change")) return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
        return "text-blue-500 bg-blue-500/10 border-blue-500/30";
    };

    const uniqueActions = Array.from(new Set(logs.map(log => log.action)));

    return (
        <div className="min-h-screen bg-[#050505] font-display">
            {/* Header */}
            <div className="bg-gradient-to-b from-[#0A0A0A] to-transparent border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 border border-blue-500/40 rounded-xl">
                            <FileText className="text-blue-500" size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">
                                Activity Logs
                            </h1>
                            <p className="text-gray-500 text-xs font-black uppercase tracking-[0.2em]">
                                Admin Action Audit Trail
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by email or action..."
                            className="
                  w-full bg-white/5 border border-white/10 rounded-xl
                  py-3 pl-12 pr-4 text-white placeholder:text-gray-600
                  focus:outline-none focus:border-[#A855F7]/50
                  transition-all
                "
                        />
                    </div>

                    {/* Action filter */}
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={20} />
                        <select
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                            className="
                  w-full bg-white/5 border border-white/10 rounded-xl
                  py-3 pl-12 pr-4 text-white
                  focus:outline-none focus:border-[#A855F7]/50
                  transition-all appearance-none cursor-pointer
                "
                        >
                            <option value="all">All Actions</option>
                            {uniqueActions.map(action => (
                                <option key={action} value={action}>{action.replace(/_/g, " ").toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total Logs</p>
                        <p className="text-white font-black text-2xl">{logs.length}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Filtered Results</p>
                        <p className="text-white font-black text-2xl">{filteredLogs.length}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Unique Actions</p>
                        <p className="text-white font-black text-2xl">{uniqueActions.length}</p>
                    </div>
                </div>

                {/* Logs list */}
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <Loader2 className="animate-spin text-[#A855F7] mx-auto mb-3" size={32} />
                            <p className="text-gray-500 font-bold uppercase tracking-wider text-sm">Loading logs...</p>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="p-12 text-center">
                            <FileText className="text-gray-600 mx-auto mb-3" size={48} />
                            <p className="text-gray-500 font-bold uppercase tracking-wider text-sm">No logs found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/10 max-h-[600px] overflow-y-auto">
                            {filteredLogs.map((log, index) => (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="p-5 hover:bg-white/5 transition-all"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className={`px-3 py-1 rounded-lg border text-xs font-bold uppercase tracking-wider ${getActionColor(log.action)}`}>
                                                    {log.action.replace(/_/g, " ")}
                                                </span>
                                                <span className="text-gray-600 text-xs">{formatTimestamp(log.timestamp)}</span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div className="flex items-center gap-2">
                                                    <User className="text-gray-600" size={16} />
                                                    <div>
                                                        <p className="text-gray-500 text-xs">Admin</p>
                                                        <p className="text-white text-sm font-medium">{log.adminEmail}</p>
                                                    </div>
                                                </div>

                                                {log.targetUserEmail && (
                                                    <div className="flex items-center gap-2">
                                                        <Target className="text-gray-600" size={16} />
                                                        <div>
                                                            <p className="text-gray-500 text-xs">Target</p>
                                                            <p className="text-white text-sm font-medium">{log.targetUserEmail}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-2">
                                                    <Calendar className="text-gray-600" size={16} />
                                                    <div>
                                                        <p className="text-gray-500 text-xs">IP Address</p>
                                                        <p className="text-white text-sm font-medium font-mono">{log.ipAddress}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {log.details && (
                                                <div className="mt-3 p-3 bg-white/5 rounded-lg">
                                                    <p className="text-gray-500 text-xs mb-1 font-bold uppercase tracking-wider">Details</p>
                                                    <pre className="text-gray-400 text-xs overflow-x-auto">
                                                        {JSON.stringify(log.details, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
