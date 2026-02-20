"use client";

import { useState, useEffect } from "react";
import { getAllServiceBookings, updateBookingStatus } from "@/services/admin-bookings";
import { ServiceBooking } from "@/types";
import { format } from "date-fns";
import {
    Cpu, Calendar, MoreVertical, CheckCircle, Clock, XCircle,
    AlertTriangle, Search, Filter, RefreshCw, Wrench, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ServiceRequestsTable() {
    const [bookings, setBookings] = useState<ServiceBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");

    const fetchBookings = async () => {
        setLoading(true);
        const data = await getAllServiceBookings();
        setBookings(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleStatusChange = async (id: string, newStatus: string) => {
        // Optimistic update
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus as any } : b));
        await updateBookingStatus(id, newStatus);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'Confirmed': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            case 'In-Progress': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
            case 'Completed': return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'Cancelled': return 'text-red-400 bg-red-400/10 border-red-400/20';
            default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
        }
    };

    const filteredBookings = bookings.filter(b => {
        const matchesSearch =
            b.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
            b.device_model.toLowerCase().includes(search.toLowerCase()) ||
            (b as any).service_name?.toLowerCase().includes(search.toLowerCase()) ||
            b.id.toLowerCase().includes(search.toLowerCase());

        const matchesFilter = filterStatus === "All" || b.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#0a0a0a] p-4 rounded-2xl border border-white/5">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search requests..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-[#8B5CF6] outline-none text-white transition-all placeholder:text-gray-600"
                    />
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-400 outline-none focus:border-[#8B5CF6]"
                    >
                        <option value="All">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="In-Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>

                    <button
                        onClick={fetchBookings}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white transition-all"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-[#8B5CF6]" size={40} />
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-[#0a0a0a] rounded-3xl border border-white/5 border-dashed">
                    <Wrench size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No service requests found.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    <AnimatePresence>
                        {filteredBookings.map((booking) => (
                            <motion.div
                                key={booking.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 hover:border-[#8B5CF6]/30 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="text-[10px] text-gray-600 font-mono">{booking.id}</div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">

                                    {/* Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest border ${getStatusColor(booking.status)}`}>
                                                {booking.status}
                                            </span>
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Calendar size={12} />
                                                {booking.created_at ? format(new Date(booking.created_at), 'PPP') : 'Unknown Date'}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-bold text-white mb-1">
                                            {booking.device_model} <span className="text-gray-500 font-normal">| {(booking as any).service_name}</span>
                                        </h3>

                                        <div className="text-sm text-gray-400 mb-4 line-clamp-1">
                                            Issues: {booking.issue_description}
                                        </div>

                                        <div className="flex items-center gap-6 text-xs text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                                                    {(booking.contact_name?.[0] || 'U').toUpperCase()}
                                                </div>
                                                <span className="text-white font-medium">{booking.contact_name || 'Guest User'}</span>
                                            </div>
                                            <div>{booking.contact_phone}</div>
                                            <div>{booking.contact_email}</div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={booking.status}
                                            onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                                            className="bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#8B5CF6] cursor-pointer hover:bg-white/5"
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Confirmed">Confirmed</option>
                                            <option value="In-Progress">In Progress</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
