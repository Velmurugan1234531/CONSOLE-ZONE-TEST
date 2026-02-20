"use client";

import { useState, useEffect } from "react";
import { getRepairTickets, updateRepairStatus, createRepairTicket, RepairTicket, RepairStatus, RepairPriority } from "@/services/repairs";
import { getProfiles } from "@/services/admin";
import { Profile } from "@/types";
import {
    Wrench, Search, Filter, Plus, Clock, User, Phone,
    Monitor, AlertCircle, CheckCircle2, ChevronRight,
    MoreVertical, ArrowUpRight, ShieldCheck, Activity,
    ClipboardList, PenTool, CheckCircle, X, Save
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function RepairsAdmin() {
    const [tickets, setTickets] = useState<RepairTicket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState<RepairStatus | 'all'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [formData, setFormData] = useState<Partial<RepairTicket>>({
        customer_name: "",
        customer_phone: "",
        device_name: "",
        issue_description: "",
        status: "pending",
        priority: "medium",
        estimated_cost: 0,
        user_id: ""
    });

    const loadTickets = async () => {
        setIsLoading(true);
        try {
            const data = await getRepairTickets();
            setTickets(data);
        } catch (error) {
            console.error("Failed to load tickets", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadTickets();
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        try {
            const data = await getProfiles();
            setProfiles(data || []);
        } catch (error) {
            console.error("Failed to load profiles", error);
        }
    };

    const filteredTickets = tickets.filter(t => {
        const matchesSearch = t.customer_name.toLowerCase().includes(search.toLowerCase()) ||
            t.device_name.toLowerCase().includes(search.toLowerCase()) ||
            t.id.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = activeFilter === 'all' || t.status === activeFilter;
        return matchesSearch && matchesFilter;
    });

    const getStatusColor = (status: RepairStatus) => {
        switch (status) {
            case 'pending': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'diagnosing': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            case 'repairing': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
            case 'ready': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'completed': return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
            default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
        }
    };

    const handleCreateTicket = async () => {
        try {
            await createRepairTicket(formData);
            await loadTickets();
            setIsModalOpen(false);
            setFormData({
                customer_name: "",
                customer_phone: "",
                device_name: "",
                issue_description: "",
                status: "pending",
                priority: "medium",
                estimated_cost: 0,
                user_id: ""
            });
        } catch (error) {
            console.error("Failed to create ticket", error);
        }
    };

    const getPriorityColor = (priority: RepairPriority) => {
        switch (priority) {
            case 'urgent': return 'text-red-500';
            case 'high': return 'text-orange-500';
            case 'medium': return 'text-blue-500';
            default: return 'text-gray-500';
        }
    };

    if (isLoading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white font-black uppercase tracking-widest italic">Initializing Service Desk...</div>;

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#A855F7] selection:text-white">
            {/* Header */}
            <header className="h-20 border-b border-white/10 bg-[#0A0A0A] flex items-center justify-between px-8 sticky top-0 z-50">
                <div className="flex items-center gap-8">
                    <h1 className="text-xl font-black uppercase tracking-tight italic flex items-center gap-2">
                        SERVICE <span className="text-[#8B5CF6]">DESK</span>
                    </h1>

                    <div className="flex items-center bg-white/5 rounded-full p-1.5 border border-white/5">
                        <button
                            onClick={() => setActiveFilter('all')}
                            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'all' ? 'bg-[#8B5CF6] text-white shadow-lg shadow-purple-600/20' : 'text-gray-500 hover:text-white'}`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveFilter('repairing')}
                            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'repairing' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-gray-500 hover:text-white'}`}
                        >
                            Active
                        </button>
                    </div>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg hover:scale-105 active:scale-95 bg-[#8B5CF6] text-white shadow-purple-600/20"
                >
                    <Plus size={16} /> New Ticket
                </button>
            </header>

            <div className="p-8 space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: "Active Repairs", value: tickets.filter(t => t.status === 'repairing').length, icon: <Activity className="text-purple-500" />, color: "purple" },
                        { label: "Pending Intake", value: tickets.filter(t => t.status === 'pending').length, icon: <ClipboardList className="text-yellow-500" />, color: "yellow" },
                        { label: "Ready for Pickup", value: tickets.filter(t => t.status === 'ready').length, icon: <CheckCircle className="text-emerald-500" />, color: "emerald" },
                        { label: "Urgent Priority", value: tickets.filter(t => t.priority === 'urgent').length, icon: <AlertCircle className="text-red-500" />, color: "red" },
                    ].map((stat, i) => (
                        <div key={i} className="bg-[#0A0A0A] border border-white/5 p-6 rounded-[2rem] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                {stat.icon}
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">{stat.label}</p>
                            <h3 className="text-4xl font-black italic tracking-tighter">{stat.value}</h3>
                            <div className={`absolute bottom-0 left-0 h-1 bg-${stat.color}-500 w-full opacity-20`} />
                        </div>
                    ))}
                </div>

                {/* Main Content Split */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Ticket List */}
                    <div className="xl:col-span-2 space-y-6">
                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                type="text"
                                placeholder="Search by customer, device or ticket ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-[#0A0A0A] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-700 outline-none focus:border-[#8B5CF6] transition-all"
                            />
                        </div>

                        <div className="space-y-4">
                            {filteredTickets.map((ticket) => (
                                <motion.div
                                    layout
                                    key={ticket.id}
                                    className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-6 hover:border-purple-500/30 transition-all group"
                                >
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-purple-400 border border-white/5">
                                                <Monitor size={24} />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black uppercase italic tracking-tighter">{ticket.device_name}</h4>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">ID: {ticket.id}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(ticket.status)}`}>
                                                {ticket.status.replace('_', ' ')}
                                            </div>
                                            <span className={`text-[10px] font-black uppercase italic ${getPriorityColor(ticket.priority)}`}>
                                                {ticket.priority} Priority
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-y border-white/5">
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Customer</p>
                                            <div className="flex items-center gap-2 text-sm font-bold">
                                                <User size={14} className="text-blue-400" /> {ticket.customer_name}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                                                <Phone size={12} /> {ticket.customer_phone}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Diagnosis</p>
                                            <p className="text-xs text-gray-400 font-medium line-clamp-2">"{ticket.issue_description}"</p>
                                        </div>
                                        <div className="space-y-2 text-right">
                                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Technician</p>
                                            <div className="flex items-center gap-2 text-sm font-bold justify-end">
                                                <PenTool size={14} className="text-emerald-400" /> {ticket.technician_name || "Unassigned"}
                                            </div>
                                            <div className="text-lg font-black text-white mt-1">₹{ticket.estimated_cost.toLocaleString()}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-6">
                                        <div className="flex items-center gap-2 text-[10px] text-gray-600 uppercase font-black">
                                            <Clock size={12} /> Intake: {new Date(ticket.created_at).toLocaleDateString()}
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="px-5 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all">
                                                Log Update
                                            </button>
                                            <button className="px-5 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-600/20 transition-all">
                                                Finalize
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions / Tech Matrix */}
                    <div className="space-y-8">
                        <div className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-8">
                            <h3 className="text-sm font-black uppercase tracking-widest text-white mb-6 flex items-center gap-2">
                                <ShieldCheck size={18} className="text-emerald-400" /> ACTIVE TECHNICIANS
                            </h3>
                            <div className="space-y-6">
                                {[
                                    { name: "Vikram S.", load: 4, status: "Available" },
                                    { name: "Suresh K.", load: 2, status: "Busy" },
                                    { name: "Rajesh M.", load: 0, status: "Off-duty" },
                                ].map((tech, i) => (
                                    <div key={i} className="flex items-center justify-between group cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-[10px] font-black">
                                                {tech.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">{tech.name}</p>
                                                <p className="text-[9px] text-gray-500 font-black uppercase">{tech.load} Tickets Active</p>
                                            </div>
                                        </div>
                                        <div className={`w-2 h-2 rounded-full ${tech.status === 'Available' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : tech.status === 'Busy' ? 'bg-yellow-500' : 'bg-gray-700'}`} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
                            <Activity className="absolute -right-4 -top-4 w-32 h-32 text-white/5 group-hover:text-white/10 transition-all rotate-12" />
                            <h3 className="text-sm font-black uppercase tracking-widest text-[#A78BFA] mb-2">INTELLIGENT DIAGNOSIS</h3>
                            <p className="text-xs text-gray-400 leading-relaxed mb-6">AI models are ready to assist with hardware failure patterns across 42,000 global repair logs.</p>
                            <button className="w-full py-3 bg-[#8B5CF6] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-purple-600/40 group-hover:scale-105 transition-all">
                                Launch Analyizer
                            </button>
                        </div>
                    </div>
                </div>
                {/* New Ticket Modal */}
                <AnimatePresence>
                    {isModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-[#0a0a0a] border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                            >
                                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                                    <h3 className="text-xl font-black uppercase tracking-tight italic">OPEN NEW <span className="text-[#8B5CF6]">TICKET</span></h3>
                                    <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
                                </div>

                                <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2 col-span-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Link Customer Account (Optional)</label>
                                            <select
                                                value={formData.user_id}
                                                onChange={(e) => {
                                                    const userId = e.target.value;
                                                    const profile = profiles.find(p => p.id === userId);
                                                    setFormData({
                                                        ...formData,
                                                        user_id: userId,
                                                        customer_name: profile?.full_name || formData.customer_name,
                                                        customer_phone: profile?.phone || formData.customer_phone
                                                    });
                                                }}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#8B5CF6] outline-none"
                                            >
                                                <option value="">Guest / Walk-in</option>
                                                {profiles.map(p => (
                                                    <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Customer Name</label>
                                            <input
                                                type="text"
                                                value={formData.customer_name}
                                                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#8B5CF6] outline-none"
                                                placeholder="Enter customer name"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Contact Number</label>
                                            <input
                                                type="text"
                                                value={formData.customer_phone}
                                                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#8B5CF6] outline-none"
                                                placeholder="+91 XXXXX XXXXX"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Device Model</label>
                                            <input
                                                type="text"
                                                value={formData.device_name}
                                                onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#8B5CF6] outline-none"
                                                placeholder="e.g. PS5, DualSense"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Estimated Cost (₹)</label>
                                            <input
                                                type="number"
                                                value={formData.estimated_cost}
                                                onChange={(e) => setFormData({ ...formData, estimated_cost: Number(e.target.value) })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#8B5CF6] outline-none"
                                            />
                                        </div>

                                        <div className="space-y-2 col-span-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Issue Description</label>
                                            <textarea
                                                value={formData.issue_description}
                                                onChange={(e) => setFormData({ ...formData, issue_description: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#8B5CF6] outline-none h-24 resize-none"
                                                placeholder="Describe the hardware problem..."
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Ticket Priority</label>
                                            <select
                                                value={formData.priority}
                                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as RepairPriority })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#8B5CF6] outline-none"
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                                <option value="urgent">Urgent</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                                    <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl text-gray-500 font-black uppercase text-[10px] hover:text-white transition-all">Cancel</button>
                                    <button
                                        onClick={handleCreateTicket}
                                        className="px-8 py-3 rounded-xl bg-[#8B5CF6] text-white font-black uppercase text-[10px] shadow-lg shadow-purple-600/20 hover:scale-105 transition-all flex items-center gap-2"
                                    >
                                        <Save size={16} /> Deploy Ticket
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
