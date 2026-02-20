"use client";

import { useState, useEffect } from "react";
import { getRentalRequests, approveRental, rejectRental } from "@/services/admin-rentals";
import { format } from "date-fns";
import {
    Calendar, CheckCircle, XCircle, Search, RefreshCw,
    Gamepad2, Loader2, User, Clock, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function RentalRequestsTable() {
    const [rentals, setRentals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false);

    const fetchRequests = async () => {
        setLoading(true);
        const data = await getRentalRequests(showAll);
        setRentals(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchRequests();
    }, [showAll]);

    const handleApprove = async (id: string) => {
        setProcessingId(id);
        try {
            await approveRental(id);
            // Optimistic Removal
            setRentals(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error(error);
            alert("Failed to approve rental");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm("Are you sure you want to reject this request?")) return;
        setProcessingId(id);
        try {
            await rejectRental(id);
            setRentals(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error(error);
            alert("Failed to reject rental");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#0a0a0a] p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                    <div className="bg-[#8B5CF6]/10 p-2 rounded-lg text-[#8B5CF6]">
                        <Clock size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Pending Approvals</h3>
                        <p className="text-[10px] text-gray-500 font-mono">
                            {rentals.length} REQUESTS AWAITING ACTION
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className={`text-xs font-bold px-3 py-1 rounded-lg border transition-all ${showAll ? 'bg-[#8B5CF6] text-white border-[#8B5CF6]' : 'bg-transparent text-gray-500 border-white/10 hover:text-white'}`}
                    >
                        {showAll ? 'SHOWING ALL' : 'SHOWING PENDING'}
                    </button>
                    <button
                        onClick={fetchRequests}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white transition-all"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-[#8B5CF6]" size={40} />
                </div>
            ) : rentals.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-[#0a0a0a] rounded-3xl border border-white/5 border-dashed">
                    <CheckCircle size={48} className="mx-auto mb-4 opacity-20 text-green-500" />
                    <p className="uppercase tracking-widest text-xs">All caught up! No pending requests.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    <AnimatePresence>
                        {rentals.map((rental) => (
                            <motion.div
                                key={rental.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 hover:border-[#8B5CF6]/30 transition-all group relative overflow-hidden"
                            >
                                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">

                                    {/* Product & User */}
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="w-16 h-16 bg-black rounded-lg border border-white/10 shrink-0 overflow-hidden">
                                            {rental.product?.images?.[0] ? (
                                                <img src={rental.product.images[0]} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-700"><Gamepad2 /></div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white mb-1">
                                                {rental.product?.name || "Unknown Product"}
                                                <span className="text-[#8B5CF6] ml-2 font-mono text-xs">{rental.duration_plan || 'Custom'}</span>
                                            </h3>
                                            <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                                                <div className="flex items-center gap-1.5">
                                                    <User size={12} />
                                                    <span className="text-white">{rental.user?.full_name || 'Guest'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={12} />
                                                    <span>{format(new Date(rental.start_date || new Date()), 'MMM d')} - {format(new Date(rental.end_date || new Date()), 'MMM d')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Financials */}
                                    <div className="text-right px-4 border-l border-white/5 hidden md:block">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Total Value</p>
                                        <p className="text-lg font-black text-green-400">₹{rental.total_price?.toLocaleString() || 0}</p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                                        <button
                                            onClick={() => handleReject(rental.id)}
                                            disabled={processingId === rental.id}
                                            className="flex-1 md:flex-none px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-bold uppercase tracking-widest border border-red-500/20 transition-all disabled:opacity-50"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleApprove(rental.id)}
                                            disabled={processingId === rental.id}
                                            className="flex-1 md:flex-none px-6 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {processingId === rental.id ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />}
                                            Approve
                                        </button>
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
