"use client";

import React, { useEffect, useState } from "react";
import {
    FileText, Search, Download, Eye, ArrowLeft, Printer,
    Zap, Sparkles, Plus, TrendingUp, AlertCircle,
    CheckCircle2, Loader2, Send, Calendar, Activity
} from "lucide-react";
import Link from "next/link";
import { getAllTransactions, Transaction, createInvoice, generateRecurringInvoices, getRevenueAnalytics, RevenueDataPoint } from "@/services/admin";
import { format, subDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import CreateInvoiceModal from "@/components/admin/CreateInvoiceModal";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

export default function InvoicesPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [command, setCommand] = useState("");
    const [isCommandLoading, setIsCommandLoading] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [mounted, setMounted] = useState(false);
    const [analytics, setAnalytics] = useState<{ total: number; growth: number; data: RevenueDataPoint[] }>({ total: 0, growth: 0, data: [] });
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [expandedTx, setExpandedTx] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [txData, revData] = await Promise.all([
                getAllTransactions(),
                getRevenueAnalytics(7)
            ]);
            setTransactions(txData);
            setAnalytics(revData);
        } catch (err) {
            console.error("InvoicesPage loadData failed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCommand = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!command.trim()) return;

        setIsCommandLoading(true);
        const cmd = command.toLowerCase();

        try {
            if (cmd.includes("create") || cmd.includes("invoice") || cmd.includes("new")) {
                setIsCreateModalOpen(true);
            } else if (cmd.includes("recurring") || cmd.includes("generate")) {
                await generateRecurringInvoices();
                alert("Recurring invoices generated successfully (Mock)");
            } else if (cmd.includes("export")) {
                alert("Starting CSV export...");
            } else if (cmd.includes("demo") || cmd.includes("simulation")) {
                setIsDemoMode(!isDemoMode);
                loadData();
            } else {
                alert("Command not recognized. Try 'Create invoice' or 'Export ledger'");
            }
        } finally {
            setIsCommandLoading(false);
            setCommand("");
        }
    };

    const suggestions = [
        { label: "Export Ledger", cmd: "Export invoices to CSV" },
        { label: "Generate Recurring", cmd: "Generate recurring invoices" },
        { label: isDemoMode ? "Disable Demo Mode" : "Enable Simulation", cmd: "Toggle demo mode" }
    ];

    const handleSaveInvoice = async (invoiceData: any) => {
        try {
            await createInvoice(invoiceData);
            await loadData();
            // Show success toast here if needed
        } catch (error) {
            console.error("Failed to create invoice:", error);
            alert("Error creating invoice.");
        }
    };

    const stats = {
        total: transactions.reduce((sum, t) => sum + t.amount, 0),
        pending: transactions.filter(t => t.status === 'Pending').reduce((sum, t) => sum + t.amount, 0),
        overdue: transactions.filter(t => t.status === 'Overdue').reduce((sum, t) => sum + t.amount, 0),
        paidCount: transactions.filter(t => t.status === 'Paid').length
    };

    const filtered = transactions.filter(t => {
        const matchesSearch = t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "all" || t.status.toLowerCase() === filterStatus.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500 min-h-screen text-white pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <ArrowLeft size={20} className="text-gray-400" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black italic tracking-tighter uppercase whitespace-nowrap">
                                Mission <span className="text-[#8B5CF6]">Ledger</span>
                            </h1>
                            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-full">
                                <Activity size={10} className="text-[#8B5CF6] animate-pulse" />
                                <span className="text-[9px] font-mono font-black text-[#8B5CF6] tracking-widest uppercase italic">
                                    Live Tracking: {mounted ? format(currentTime, 'HH:mm:ss') : '--:--:--'}
                                </span>
                            </div>
                        </div>
                        <p className="text-gray-500 text-[11px] font-black uppercase tracking-widest mt-1">
                            Enterprise Billing & Revenue Oversight
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl mr-2">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${isDemoMode ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                        <span className="text-[10px] font-black uppercase tracking-tighter text-gray-400">
                            {isDemoMode ? 'Simulation Active' : 'Live Node'}
                        </span>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-[#8B5CF6] text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center gap-2 hover:bg-[#7C3AED] transition-all shadow-lg active:scale-95"
                    >
                        <Plus size={18} />
                        New Invoice
                    </button>
                    <button className="bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-3 rounded-2xl flex items-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all">
                        <Download size={16} />
                        Export
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Revenue', value: `₹${stats.total.toLocaleString()}`, icon: <TrendingUp className="text-emerald-500" />, sub: `${stats.paidCount} Paid Invoices` },
                    { label: 'Pending Payment', value: `₹${stats.pending.toLocaleString()}`, icon: <Calendar className="text-amber-500" />, sub: 'Awaiting Settlement' },
                    { label: 'Overdue Dues', value: `₹${stats.overdue.toLocaleString()}`, icon: <AlertCircle className="text-red-500" />, sub: 'Immediate Action' },
                    { label: 'System Health', value: '100%', icon: <Zap className="text-blue-500" />, sub: 'Automation Active' },
                ].map((stat, i) => (
                    <div key={i} className="bg-[#0a0a0a] border border-white/5 p-5 rounded-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{stat.label}</span>
                            <div className="p-2 bg-white/5 rounded-xl">{stat.icon}</div>
                        </div>
                        <div className="text-2xl font-black italic tracking-tight">{stat.value}</div>
                        <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mt-2">{stat.sub}</div>
                    </div>
                ))}
            </div>

            {/* Mission Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp size={120} />
                    </div>
                    <div className="relative z-10 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-black italic tracking-tighter uppercase">Revenue Flow Diagnostics</h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">7-Day Transaction Propagation</p>
                            </div>
                            <div className="flex bg-black/40 border border-white/5 rounded-xl p-1">
                                <button className="px-3 py-1 bg-[#8B5CF6] text-[9px] font-bold rounded-lg uppercase tracking-widest">Revenue</button>
                                <button className="px-3 py-1 text-gray-500 text-[9px] font-bold rounded-lg uppercase tracking-widest hover:text-white transition-colors">Volume</button>
                            </div>
                        </div>
                        <div className="flex-1 min-h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analytics.data}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis
                                        dataKey="formattedDate"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#666', fontSize: 10, fontWeight: 'bold' }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#666', fontSize: 10, fontWeight: 'bold' }}
                                        tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '10px' }}
                                        itemStyle={{ fontWeight: 'black', textTransform: 'uppercase' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="amount"
                                        stroke="#8B5CF6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="bg-[#8B5CF6] rounded-[2rem] p-8 text-black relative overflow-hidden group">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 group-hover:scale-110 transition-transform">
                        <Sparkles size={240} />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <div className="w-12 h-12 bg-black text-[#8B5CF6] rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                                <Zap size={24} fill="currentColor" />
                            </div>
                            <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none mb-2">Neural Balance</h3>
                            <p className="text-[11px] font-bold uppercase tracking-widest opacity-80">Projected Monthly Growth</p>
                        </div>
                        <div className="mt-12">
                            <div className="text-5xl font-black tracking-tighter italic mb-4">+{analytics.growth}%</div>
                            <div className="w-full bg-black/20 rounded-full h-2 mb-4 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${analytics.growth * 2}%` }}
                                    className="h-full bg-black"
                                />
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                                Target Velocity: 25% Increase per Cycle
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Command Bar (Prompt UI) */}
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-[2rem] blur opacity-20 group-focus-within:opacity-40 transition-opacity" />
                <form onSubmit={handleCommand} className="relative bg-[#0a0a0a] border border-white/10 rounded-[2rem] flex flex-col shadow-2xl overflow-hidden">
                    <div className="flex items-center p-2">
                        <div className="p-4 bg-white/5 rounded-full mr-2">
                            {isCommandLoading ? <Loader2 className="animate-spin text-[#8B5CF6]" size={20} /> : <Sparkles className="text-[#8B5CF6]" size={20} />}
                        </div>
                        <input
                            type="text"
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            placeholder="Master Command... (e.g., 'Generate recurring invoices' or 'Toggle demo mode')"
                            className="flex-1 bg-transparent border-none outline-none text-sm font-medium placeholder:text-gray-600 text-white"
                        />
                        <button type="submit" className="p-4 px-8 bg-white text-black font-black uppercase tracking-tighter rounded-full text-xs hover:bg-[#8B5CF6] hover:text-white transition-all active:scale-95">
                            Execute
                        </button>
                    </div>

                    <div className="px-6 pb-4 flex items-center gap-4">
                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Neural Suggestions:</span>
                        <div className="flex gap-2">
                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => {
                                        setCommand(s.cmd);
                                        // Auto-execute if needed or let user press execute
                                    }}
                                    className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </form>
            </div>

            {/* Main List */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/[0.01]">
                    <div className="flex bg-black/40 border border-white/5 rounded-2xl p-1 w-fit">
                        {['all', 'paid', 'pending', 'overdue'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === status ? 'bg-[#8B5CF6] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    <div className="relative flex-1 md:max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                        <input
                            type="text"
                            placeholder="Identify customer or ledger record..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white w-full outline-none focus:border-[#8B5CF6]/50 transition-all"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 flex justify-center">
                        <Loader2 className="animate-spin text-[#8B5CF6]" size={40} />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-black/50 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] border-b border-white/5">
                                <tr>
                                    <th className="p-6">ID Node</th>
                                    <th className="p-6">Entity (Customer)</th>
                                    <th className="p-6">Timestamp</th>
                                    <th className="p-6">Type</th>
                                    <th className="p-6 text-right">Credits</th>
                                    <th className="p-6">Status</th>
                                    <th className="p-6 text-center">Protocol</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-gray-500 font-bold italic">No records retrieved from node.</td>
                                    </tr>
                                ) : filtered.map((tx) => (
                                    <React.Fragment key={tx.id}>
                                        <tr
                                            onClick={() => setExpandedTx(expandedTx === tx.id ? null : tx.id)}
                                            className="hover:bg-white/[0.02] transition-all group cursor-pointer"
                                        >
                                            <td className="p-6 font-mono text-[10px] text-[#8B5CF6]">
                                                {tx.id.slice(0, 8).toUpperCase()}
                                            </td>
                                            <td className="p-6">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-gray-200 uppercase tracking-tighter">{tx.customerName}</span>
                                                    <span className="text-[10px] text-gray-600 font-mono italic">{tx.customerEmail}</span>
                                                </div>
                                            </td>
                                            <td className="p-6 text-[10px] font-black text-gray-500 uppercase">
                                                {format(new Date(tx.date), 'dd MMM yyyy')}
                                            </td>
                                            <td className="p-6">
                                                <span className={`text-[9px] font-black px-2.5 py-1 rounded border uppercase tracking-widest ${tx.type === 'RENTAL'
                                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                    : tx.type === 'BUYBACK'
                                                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                        : 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20'
                                                    }`}>
                                                    {tx.type}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right font-black italic tracking-tighter text-lg">
                                                ₹{tx.amount.toLocaleString()}
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${tx.status === 'Paid' || tx.status === 'Completed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : tx.status === 'Overdue' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">
                                                        {tx.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <div className="flex justify-center gap-2" onClick={e => e.stopPropagation()}>
                                                    <Link
                                                        href={`/admin/invoices/${tx.id}`}
                                                        className="p-3 bg-white/5 text-gray-400 rounded-xl hover:bg-white hover:text-black transition-all"
                                                    >
                                                        <Printer size={16} />
                                                    </Link>
                                                    <button className="p-3 bg-white/5 text-gray-400 rounded-xl hover:bg-[#8B5CF6] hover:text-white transition-all">
                                                        <Send size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        <AnimatePresence>
                                            {expandedTx === tx.id && (
                                                <tr>
                                                    <td colSpan={7} className="p-0 border-none bg-white/[0.01]">
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12 border-l-4 border-[#8B5CF6] bg-gradient-to-r from-[#8B5CF6]/5 to-transparent">
                                                                <div>
                                                                    <div className="text-[10px] font-black uppercase tracking-widest text-[#8B5CF6] mb-4">Transaction Payload Details</div>
                                                                    <div className="space-y-4">
                                                                        {tx.items.map((item, i) => (
                                                                            <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                                                                                <div>
                                                                                    <div className="text-xs font-black uppercase tracking-tight">{item.name}</div>
                                                                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Qty: {item.quantity}</div>
                                                                                </div>
                                                                                <div className="font-mono text-sm font-black italic">₹{item.price.toLocaleString()}</div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col justify-between">
                                                                    <div className="bg-black/40 border border-white/10 p-6 rounded-2xl relative">
                                                                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Accounting Summary</div>
                                                                        <div className="space-y-2">
                                                                            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                                                <span>Subtotal</span>
                                                                                <span>₹{Math.round(tx.amount / 1.18).toLocaleString()}</span>
                                                                            </div>
                                                                            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                                                <span>Tax (GST 18%)</span>
                                                                                <span>₹{Math.round(tx.amount - (tx.amount / 1.18)).toLocaleString()}</span>
                                                                            </div>
                                                                            <div className="h-px bg-white/10 my-3" />
                                                                            <div className="flex justify-between text-lg font-black italic tracking-tighter text-white uppercase">
                                                                                <span>Ledger Total</span>
                                                                                <span className="text-[#8B5CF6]">₹{tx.amount.toLocaleString()}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-6 flex gap-3">
                                                                        <button className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                                                            Download JSON
                                                                        </button>
                                                                        <button className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                                                            Re-verify TXN
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    </td>
                                                </tr>
                                            )}
                                        </AnimatePresence>
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <CreateInvoiceModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleSaveInvoice}
            />
        </div>
    );
}
