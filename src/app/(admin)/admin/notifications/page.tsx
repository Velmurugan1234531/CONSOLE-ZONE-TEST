"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send, Globe, User, Bell, Search, Trash2, CheckCircle,
    AlertTriangle, Info, Zap, X, Plus, Filter, Activity,
    Shield, Radio, Clock, Eye, Terminal, RefreshCw,
    BarChart3, Target, ShieldAlert
} from "lucide-react";
import { getNotifications, sendNotification, deleteNotification, markAsRead } from "@/services/notifications";
import { Notification, NotificationType } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { useNeuralAlert } from "@/components/providers/NeuralAlertProvider";

export default function AdminNotificationsPage() {
    const { triggerAlert } = useNeuralAlert();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
    const [viewMode, setViewMode] = useState<'all' | 'unread'>('all');

    const handleTestAlert = (type: any) => {
        const alerts = {
            order: { title: "NEW COMMERCE UPLINK", message: "Customer initiated high-value transaction cycle. Awaiting dispatch." },
            rental: { title: "RENTAL DEPLOYMENT", message: "Unit 049 deployed to Sector 7. Logistics synchronized." },
            buyback: { title: "STRATEGIC PURCHASE", message: "Asset acquisition request logged. Pricing nodes nominal." },
            service: { title: "MAINTENANCE SIGNAL", message: "Priority repair ticket opened. Technician dispatched." }
        };
        const data = (alerts as any)[type];
        triggerAlert({
            type,
            title: data.title,
            message: data.message,
            duration: 8000
        });
    };

    // Send Form State
    const [showSendModal, setShowSendModal] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newMessage, setNewMessage] = useState("");
    const [newType, setNewType] = useState<NotificationType>("info");
    const [targetUser, setTargetUser] = useState(""); // empty for global
    const [sending, setSending] = useState(false);

    // Live Feed Simulation
    const [recentEvents, setRecentEvents] = useState<any[]>([]);
    const eventTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        loadNotifications();
        simulateLiveEvents();
        return () => {
            if (eventTimer.current) clearInterval(eventTimer.current);
        };
    }, []);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const data = await getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error("AdminNotificationsPage: loadNotifications failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const simulateLiveEvents = () => {
        const initialEvents = [
            { id: 1, type: 'connection', msg: 'Uplink established with Node-7', time: 'Just now' },
            { id: 2, type: 'security', msg: 'KYC VERIFICATION: 3 KYC reviews pending', time: '2m ago' },
            { id: 3, type: 'ledger', msg: 'New buyback order verified', time: '5m ago' },
        ];
        setRecentEvents(initialEvents);

        eventTimer.current = setInterval(() => {
            const types = ['connection', 'security', 'ledger', 'broadcast'];
            const msgs = [
                'Encryption keys rotated successfully',
                'Node-12 maintenance cycle completed',
                'Satellite link latency: 45ms',
                'Global broadcast cache purged',
                'Suspicious activity blocked at Gateway-4'
            ];
            const newEvent = {
                id: Date.now(),
                type: types[Math.floor(Math.random() * types.length)],
                msg: msgs[Math.floor(Math.random() * msgs.length)],
                time: 'Just now'
            };
            setRecentEvents(prev => [newEvent, ...prev.slice(0, 4)]);
        }, 8000);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        try {
            await sendNotification({
                title: newTitle,
                message: newMessage,
                type: newType,
                user_id: targetUser || undefined
            });
            setShowSendModal(false);
            setNewTitle("");
            setNewMessage("");
            setTargetUser("");
            loadNotifications();
        } catch (error) {
            console.error(error);
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await deleteNotification(id);
            setNotifications(notifications.filter(n => n.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await markAsRead(id);
            setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error(error);
        }
    };

    const handleClearArchive = async () => {
        if (!confirm("Caution: This will purge all existing notification records. Proceed?")) return;
        try {
            // Bulk delete logic would go here, simulating for now
            setNotifications([]);
        } catch (error) {
            console.error(error);
        }
    };

    const filtered = notifications.filter(n => {
        const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.message.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || n.type === filterType;
        const matchesView = viewMode === 'all' || !n.read;
        return matchesSearch && matchesType && matchesView;
    });

    const getTypeColor = (type: NotificationType) => {
        switch (type) {
            case 'success': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'warning': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            case 'error': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
        }
    };

    const getTypeIcon = (type: NotificationType) => {
        switch (type) {
            case 'success': return <CheckCircle size={14} />;
            case 'warning': return <AlertTriangle size={14} />;
            case 'error': return <AlertTriangle size={14} />;
            default: return <Info size={14} />;
        }
    };

    return (
        <div className="relative min-h-screen bg-[#050505] text-white p-8 space-y-8 pb-32 overflow-hidden">
            {/* Mission Background Effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#8B5CF6]/50 to-transparent animate-scan" />
                <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-[#8B5CF6]/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-blue-500/10 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Terminal size={18} className="text-[#8B5CF6]" />
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter">
                            Comms <span className="text-[#8B5CF6]">Hub</span>
                        </h1>
                    </div>
                    <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.4em] flex items-center gap-2">
                        System Frequency: <span className="text-[#06B6D4]">92.4 MHz</span> • <span className="text-emerald-500 flex items-center gap-1"><Activity size={10} /> Signal Locked</span>
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => loadNotifications()}
                        className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-gray-400 hover:text-white"
                        title="Sync Data"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button
                        onClick={() => setShowSendModal(true)}
                        className="flex items-center gap-3 px-8 py-4 bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] rounded-2xl font-black uppercase tracking-widest text-xs hover:shadow-[0_0_25px_rgba(139,92,246,0.4)] transition-all group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                        <Send size={16} className="relative z-10 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        <span className="relative z-10">Initialize Broadcast</span>
                    </button>
                </div>
            </div>

            {/* Diagnostics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
                {[
                    { label: "Total Alerts", value: notifications.length, icon: <Bell className="text-[#8B5CF6]" />, trend: "Synchronized" },
                    { label: "Unread Signal", value: notifications.filter(n => !n.read).length, icon: <Radio className="text-amber-500" />, trend: "Awaiting Action" },
                    { label: "Targeted Uplinks", value: notifications.filter(n => n.user_id).length, icon: <Target className="text-blue-500" />, trend: "Selective Dispatch" },
                    { label: "System Health", value: "99.8%", icon: <Shield className="text-emerald-500" />, trend: "All Nodes Nominal" },
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="bg-[#0a0a0a] border border-white/10 p-6 rounded-[2rem] relative overflow-hidden group hover:border-[#8B5CF6]/30 transition-all"
                    >
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            {stat.icon}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{stat.label}</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-black italic">{stat.value}</h3>
                            <span className="text-[9px] font-mono text-gray-600 uppercase italic">{stat.trend}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10">
                {/* Main Feed Area */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Advanced Controls */}
                    <div className="bg-[#0a0a0a] border border-white/5 p-2 rounded-2xl flex flex-col md:flex-row items-center gap-2">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                type="text"
                                placeholder="Decrypt logs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/5 border border-transparent focus:border-[#8B5CF6]/30 rounded-xl py-3 pl-12 pr-4 text-xs outline-none transition-all font-mono"
                            />
                        </div>

                        <div className="flex items-center gap-1 w-full md:w-auto overflow-x-auto no-scrollbar py-1 md:py-0">
                            <button
                                onClick={() => setViewMode('all')}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${viewMode === 'all' ? 'bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                            >
                                All Streams
                            </button>
                            <button
                                onClick={() => setViewMode('unread')}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${viewMode === 'unread' ? 'bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                            >
                                Active Signal
                            </button>
                            <div className="h-6 w-[1px] bg-white/10 mx-1 hidden md:block" />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as any)}
                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#8B5CF6]/30 transition-all cursor-pointer text-gray-400 hover:text-white"
                            >
                                <option value="all">Frequencies: All</option>
                                <option value="info">Info</option>
                                <option value="success">Success</option>
                                <option value="warning">Warning</option>
                                <option value="error">Critical</option>
                            </select>
                        </div>

                        <button
                            onClick={handleClearArchive}
                            className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all md:aspect-square flex items-center justify-center"
                            title="Purge Archive"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>

                    {/* Enhanced Notification List */}
                    <div className="space-y-3">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                <div className="w-12 h-12 border-2 border-[#8B5CF6]/20 border-t-[#8B5CF6] rounded-full animate-spin" />
                                <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest animate-pulse">Syncing encrypted data stream...</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-12 text-center">
                                <Zap size={32} className="text-gray-800 mx-auto mb-4" />
                                <h4 className="text-sm font-black uppercase tracking-widest text-gray-500 italic">No signal detected in current frequency</h4>
                                <p className="text-[10px] text-gray-600 font-mono mt-2">Modify your filter parameters to probe other data nodes</p>
                            </div>
                        ) : (
                            filtered.map((n, i) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    key={n.id}
                                    className={`relative group bg-[#0a0a0a] border ${n.read ? 'border-white/5 opacity-70' : 'border-[#8B5CF6]/20 bg-gradient-to-r from-[#8B5CF6]/5 to-transparent shadow-[0_4px_20px_rgba(139,92,246,0.05)]'} rounded-2xl p-5 hover:border-[#8B5CF6]/40 transition-all`}
                                >
                                    {!n.read && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#8B5CF6] rounded-l-2xl animate-pulse" />
                                    )}

                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className={`p-3 rounded-xl border ${getTypeColor(n.type)}`}>
                                                {getTypeIcon(n.type)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${getTypeColor(n.type)}`}>
                                                        {n.type}
                                                    </span>
                                                    {n.user_id ? (
                                                        <span className="text-[9px] font-mono text-blue-400 bg-blue-400/5 px-2 py-0.5 rounded border border-blue-400/10 flex items-center gap-1">
                                                            <User size={8} /> {n.user_id.slice(0, 8)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] font-mono text-[#8B5CF6] bg-[#8B5CF6]/5 px-2 py-0.5 rounded border border-[#8B5CF6]/10 flex items-center gap-1">
                                                            <Globe size={8} /> Global Dispatch
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className={`text-md font-black uppercase italic tracking-tight ${n.read ? 'text-gray-400' : 'text-white'}`}>
                                                    {n.title}
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-2xl">{n.message}</p>
                                            </div>
                                        </div>

                                        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                                            <div className="flex items-center gap-1 text-[10px] font-mono text-gray-600 uppercase">
                                                <Clock size={10} /> {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!n.read && (
                                                    <button
                                                        onClick={() => handleMarkAsRead(n.id)}
                                                        className="p-2 bg-[#8B5CF6]/10 text-[#8B5CF6] hover:bg-[#8B5CF6]/20 rounded-lg transition-all"
                                                        title="Mark as Read"
                                                    >
                                                        <CheckCircle size={14} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(n.id)}
                                                    className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Sidebar: Live Feed & Analytics */}
                <div className="space-y-6">
                    {/* Live Signal Feed */}
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden">
                        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8B5CF6]">Live Signals</h4>
                            </div>
                            <Activity size={12} className="text-gray-600" />
                        </div>
                        <div className="p-4 space-y-4">
                            {recentEvents.map((event) => (
                                <motion.div
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={event.id}
                                    className="border-l-2 border-white/5 pl-4 py-1"
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#06B6D4]">{event.type}</span>
                                        <span className="text-[8px] font-mono text-gray-600">{event.time}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-medium leading-tight">{event.msg}</p>
                                </motion.div>
                            ))}
                        </div>
                        <div className="p-4 bg-white/[0.02] border-t border-white/5">
                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-400">
                                <span>Network Latency</span>
                                <span className="text-emerald-500">42ms</span>
                            </div>
                            <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-emerald-500/50"
                                    animate={{ width: ["40%", "60%", "45%"] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Block */}
                    <div className="bg-gradient-to-br from-[#1e1b4b]/40 to-[#0f172a]/40 border border-[#8B5CF6]/30 rounded-[2.5rem] p-6 relative overflow-hidden group">
                        {/* ... existing chart code ... */}
                    </div>

                    {/* Diagnostic HUD Test Tools */}
                    <div className="bg-[#0a0a0a] border border-[#8B5CF6]/20 rounded-[2.5rem] p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldAlert size={14} className="text-[#8B5CF6]" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tactical HUD Diagnostics</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handleTestAlert('order')}
                                className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-emerald-500 hover:bg-emerald-500/20 transition-all"
                            >
                                Test Order
                            </button>
                            <button
                                onClick={() => handleTestAlert('rental')}
                                className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-500/20 transition-all"
                            >
                                Test Rental
                            </button>
                            <button
                                onClick={() => handleTestAlert('buyback')}
                                className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-orange-500 hover:bg-orange-500/20 transition-all"
                            >
                                Test Buyback
                            </button>
                            <button
                                onClick={() => handleTestAlert('service')}
                                className="p-3 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-[#8B5CF6] hover:bg-[#8B5CF6]/20 transition-all"
                            >
                                Test Service
                            </button>
                        </div>
                        <p className="text-[8px] text-gray-600 font-mono italic text-center">Execute manual HUD signal overrides to verify system audio/visual integrity.</p>
                    </div>
                </div>
            </div>

            {/* Send Modal */}
            <AnimatePresence>
                {showSendModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#0a0a0a] border border-white/10 rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-[0_0_100px_rgba(139,92,246,0.1)]"
                        >
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6] shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                                        <Send size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase italic tracking-tight">Signal Dispatch</h3>
                                        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.3em] mt-1">Authorized Command Sequence</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowSendModal(false)} className="p-3 text-gray-500 hover:text-white transition-all bg-white/5 rounded-full">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSend} className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Frequency Variant</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(['info', 'success', 'warning', 'error'] as NotificationType[]).map(type => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setNewType(type)}
                                                    className={`px-4 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${newType === type ? getTypeColor(type) : 'bg-black/50 border-white/5 text-gray-600 hover:border-white/20'}`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Coded Target (Recipient ID)</label>
                                        <div className="relative">
                                            <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                                            <input
                                                type="text"
                                                placeholder="Empty for GLOBAL Uplink"
                                                value={targetUser}
                                                onChange={(e) => setTargetUser(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 pl-12 text-sm font-mono focus:border-[#8B5CF6] transition-all outline-none"
                                            />
                                        </div>
                                        <p className="text-[9px] text-gray-600 font-mono italic ml-1">System default: Broadcast to all active civilian nodes</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Uplink Header (Title)</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Headline for the transmission..."
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-2xl p-5 text-lg font-black italic tracking-tight focus:border-[#8B5CF6] transition-all outline-none placeholder:text-gray-800"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Data Payload (Message Body)</label>
                                    <textarea
                                        required
                                        rows={5}
                                        placeholder="Full details of the transmission encrypted for relay..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-[2rem] p-6 text-sm focus:border-[#8B5CF6] transition-all outline-none resize-none leading-relaxed"
                                    />
                                </div>

                                <div className="pt-4 flex flex-col md:flex-row gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowSendModal(false)}
                                        className="flex-1 py-5 border border-white/10 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.3em] text-gray-500 hover:text-white hover:bg-white/5 transition-all order-2 md:order-1"
                                    >
                                        Abort Mission
                                    </button>
                                    <button
                                        disabled={sending}
                                        type="submit"
                                        className="flex-[2] py-5 bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] rounded-[1.5rem] text-xs font-black uppercase tracking-[0.3em] text-white hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] transition-all flex items-center justify-center gap-4 disabled:opacity-50 group order-1 md:order-2"
                                    >
                                        {sending ? (
                                            <>
                                                <RefreshCw size={20} className="animate-spin" />
                                                <span>Deploying Signal...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Zap size={20} className="group-hover:animate-pulse" />
                                                <span>Execute Broadcast Dispatch</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
