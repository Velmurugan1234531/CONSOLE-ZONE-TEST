"use client";

import { useEffect, useState } from "react";
import {
    Search, ShoppingBag, ArrowLeft, Package, CheckCircle2,
    Clock, Truck, AlertCircle, Eye, MoreVertical, Loader2,
    Check, X, RefreshCw, User, Phone, Mail, MapPin,
    CreditCard, Wallet, Banknote, ChevronRight, MessageSquare
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    getAllSellOrders,
    updateSellOrderStatus,
    SellOrder,
    SellOrderStatus,
    PaymentStatus
} from "@/services/tradeins";
import { formatCurrency } from "@/utils/format";
import { formatDistanceToNow } from "date-fns";

export default function SellOrdersHub() {
    const [orders, setOrders] = useState<SellOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<SellOrderStatus | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<SellOrder | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const data = await getAllSellOrders();
            setOrders(data);
        } catch (err) {
            console.error("Failed to load sell orders:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const handleStatusUpdate = async (orderId: string, status: SellOrderStatus, paymentStatus?: PaymentStatus) => {
        setIsUpdating(true);
        try {
            await updateSellOrderStatus(orderId, status, paymentStatus);
            await loadOrders(); // Refresh list
            if (selectedOrder && selectedOrder.id === orderId) {
                // Update selected order view
                const updated = await getAllSellOrders();
                const found = updated.find(o => o.id === orderId);
                if (found) setSelectedOrder(found);
            }
        } catch (err) {
            alert("Failed to update status");
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredOrders = orders.filter(o => {
        const matchesFilter = filter === 'all' || o.status === filter;
        const matchesSearch =
            o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.user_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.user_email || "").toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getStatusColor = (status: SellOrderStatus) => {
        switch (status) {
            case 'pending': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            case 'in-transit': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case 'verified': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'completed': return 'text-[#A855F7] bg-[#A855F7]/10 border-[#A855F7]/20';
            case 'cancelled': return 'text-red-400 bg-red-500/10 border-red-500/20';
            default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
        }
    };

    const getStatusIcon = (status: SellOrderStatus) => {
        switch (status) {
            case 'pending': return <Clock size={14} />;
            case 'in-transit': return <Truck size={14} />;
            case 'verified': return <CheckCircle2 size={14} />;
            case 'completed': return <Package size={14} />;
            case 'cancelled': return <X size={14} />;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 min-h-screen text-white pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <ArrowLeft size={20} className="text-gray-400" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black italic tracking-tighter uppercase">
                            Sell <span className="text-[#A855F7]">Orders Hub</span>
                        </h1>
                        <p className="text-gray-500 text-[11px] font-black uppercase tracking-[0.2em] mt-1">
                            Mission Log: Incoming Trade-Ins & Verifications
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
                    {(['all', 'pending', 'in-transit', 'verified', 'completed'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === s ? 'bg-[#A855F7] text-white shadow-lg shadow-[#A855F7]/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Matrix Filter & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative group flex-1">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#A855F7] to-[#3B82F6] rounded-2xl blur opacity-10 group-focus-within:opacity-30 transition-opacity" />
                    <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl flex items-center p-1 shadow-2xl">
                        <Search className="ml-4 text-gray-600" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search orders, users, emails..."
                            className="flex-1 bg-transparent border-none outline-none p-4 text-sm font-medium placeholder:text-gray-600"
                        />
                    </div>
                </div>
                <button
                    onClick={loadOrders}
                    className="bg-white/5 border border-white/10 hover:bg-white/10 p-4 rounded-2xl transition-all"
                >
                    <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Product Grid / List */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="p-20 text-center">
                        <Loader2 className="animate-spin text-[#A855F7] mx-auto" size={40} />
                        <p className="mt-4 text-gray-500 font-black uppercase tracking-widest text-[11px] italic">Accessing Order Repository...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="p-20 text-center border border-white/5 rounded-[3rem] bg-[#0a0a0a]">
                        <Package className="mx-auto text-gray-700 mb-4" size={48} />
                        <p className="text-gray-500 font-bold italic">No orders found matching the current criteria.</p>
                    </div>
                ) : (
                    filteredOrders.map((order) => (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-6 hover:border-white/20 transition-all group overflow-hidden relative"
                        >
                            {/* Accent line based on status */}
                            <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${order.status === 'pending' ? 'bg-amber-500' :
                                    order.status === 'in-transit' ? 'bg-blue-500' :
                                        order.status === 'verified' ? 'bg-emerald-500' :
                                            order.status === 'completed' ? 'bg-[#A855F7]' : 'bg-red-500'
                                }`} />

                            <div className="flex flex-col lg:flex-row gap-8 items-start">
                                {/* Order Basic Info */}
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-mono text-gray-600 bg-white/5 px-2 py-1 rounded">#{order.id.slice(-8).toUpperCase()}</span>
                                            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border ${getStatusColor(order.status)}`}>
                                                {getStatusIcon(order.status)}
                                                {order.status}
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-mono text-gray-500 whitespace-nowrap">
                                            {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                                        </span>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black italic tracking-tighter uppercase leading-none">
                                            {order.user_name || "Unknown Operative"}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-medium">
                                            <span className="flex items-center gap-1.5"><Mail size={12} /> {order.user_email}</span>
                                            {order.pincode && <span className="flex items-center gap-1.5"><MapPin size={12} /> {order.pincode}</span>}
                                        </div>
                                    </div>

                                    {/* Items Preview */}
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-3 flex shrink-0 items-center gap-3 min-w-[200px]">
                                                {item.image && (
                                                    <img src={item.image} alt={item.product_name} className="w-10 h-10 rounded-lg object-contain bg-black/40 p-1" />
                                                )}
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-tight text-white line-clamp-1">{item.product_name}</p>
                                                    <p className="text-[9px] font-mono text-gray-500">Qty: {item.quantity} • {formatCurrency(order.payment_method === 'credits' ? item.credit_price : item.cash_price)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Payout & Actions */}
                                <div className="shrink-0 space-y-4 lg:w-64">
                                    <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 space-y-3">
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                                            <span>Payout Method</span>
                                            <div className="flex items-center gap-1.5 text-white">
                                                {order.payment_method === 'credits' ? <Wallet size={12} className="text-[#A855F7]" /> : <Banknote size={12} className="text-emerald-500" />}
                                                {order.payment_method.toUpperCase()}
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-white/5">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Total Valuation</div>
                                            <div className={`text-2xl font-black tracking-tighter italic ${order.payment_method === 'credits' ? 'text-[#A855F7]' : 'text-white'}`}>
                                                {formatCurrency(order.payment_method === 'credits' ? order.total_credit_value : order.total_cash_value)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
                                        >
                                            <Eye size={16} /> Details
                                        </button>
                                        <div className="relative group">
                                            <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                                                Status <MoreVertical size={16} />
                                            </button>
                                            {/* Quick Status Dropdown */}
                                            <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#0f0f0f] border border-white/10 rounded-2xl p-2 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                                {(['pending', 'in-transit', 'verified', 'completed', 'cancelled'] as const).map((s) => (
                                                    <button
                                                        key={s}
                                                        onClick={() => handleStatusUpdate(order.id, s)}
                                                        className="w-full text-left px-4 py-2 hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white flex items-center gap-2"
                                                    >
                                                        {getStatusIcon(s)}
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {order.status === 'verified' && (
                                        <button
                                            disabled={isUpdating}
                                            onClick={() => handleStatusUpdate(order.id, 'completed', 'completed')}
                                            className="w-full bg-[#A855F7] text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-[#9333EA] transition-all shadow-[0_4px_20px_rgba(139,92,246,0.2)] hover:scale-[1.02] active:scale-95 group"
                                        >
                                            {isUpdating ? <Loader2 className="animate-spin" size={18} /> : (
                                                <>
                                                    <DollarSign size={18} className="group-hover:rotate-12 transition-transform" />
                                                    Process Payout
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Order Detail Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedOrder(null)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 30 }}
                            className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl"
                        >
                            {/* Modal Header */}
                            <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-[#A855F7]/10 text-[#A855F7] flex items-center justify-center border border-[#A855F7]/20">
                                        <ShoppingBag size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Order Detail</h2>
                                            <span className="text-xs font-mono text-[#A855F7] bg-[#A855F7]/10 px-3 py-1 rounded-full border border-[#A855F7]/20">#{selectedOrder.id}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">Transaction Identity Verified</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedOrder(null)} className="p-4 rounded-full hover:bg-white/10 border border-white/5 group transition-all">
                                    <X size={20} className="text-gray-500 group-hover:text-white" />
                                </button>
                            </div>

                            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    {/* Left: Customer & Logistics */}
                                    <div className="space-y-8">
                                        <section className="space-y-4">
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#A855F7] flex items-center gap-2">
                                                <User size={14} /> Operative Intelligence
                                            </h4>
                                            <div className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-black text-gray-600 uppercase">Mission Name</p>
                                                        <p className="text-sm font-bold text-gray-200">{selectedOrder.user_name || "Unknown"}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-black text-gray-600 uppercase">Comm Contact</p>
                                                        <p className="text-sm font-bold text-gray-200">{selectedOrder.user_phone || "Not Provided"}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-gray-600 uppercase">Satellite Signal / Email</p>
                                                    <p className="text-sm font-bold text-gray-200">{selectedOrder.user_email}</p>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="space-y-4">
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-400 flex items-center gap-2">
                                                <Truck size={14} /> Logistics Matrix
                                            </h4>
                                            <div className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-gray-600 uppercase">Protocol</span>
                                                    <span className="text-xs font-bold text-white uppercase italic tracking-wider">{selectedOrder.shipping_method.replace('_', ' ')}</span>
                                                </div>
                                                <div className="space-y-1 pt-1">
                                                    <p className="text-[9px] font-black text-gray-600 uppercase">Extraction Point (Address)</p>
                                                    <p className="text-sm font-bold text-gray-200 leading-relaxed">{selectedOrder.address || "Pincode: " + selectedOrder.pincode}</p>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <p className="text-[9px] font-black text-gray-600 uppercase">Admin Logs</p>
                                                    <textarea
                                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-gray-300 resize-none h-24 focus:border-[#A855F7] outline-none transition-all placeholder:text-gray-700 font-mono"
                                                        placeholder="Append mission notes here..."
                                                        defaultValue={selectedOrder.admin_notes}
                                                    />
                                                </div>
                                            </div>
                                        </section>
                                    </div>

                                    {/* Right: Payload (Items) */}
                                    <div className="space-y-6">
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-400 flex items-center gap-2">
                                            <Package size={14} /> Mission Payload
                                        </h4>
                                        <div className="space-y-3">
                                            {selectedOrder.items.map((item, idx) => (
                                                <div key={idx} className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 flex items-center gap-4 hover:bg-white/5 transition-colors">
                                                    <div className="w-16 h-16 bg-black/40 rounded-2xl flex items-center justify-center p-2 border border-white/5 shrink-0">
                                                        <img src={item.image} alt="" className="object-contain" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-black uppercase italic tracking-tighter text-white">{item.product_name}</p>
                                                        <div className="flex items-center justify-between mt-2">
                                                            <p className="text-[10px] font-mono font-bold text-gray-400">Qty: {item.quantity}</p>
                                                            <p className="text-sm font-black italic text-[#A855F7]">{formatCurrency(selectedOrder.payment_method === 'credits' ? item.credit_price : item.cash_price)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-8 bg-gradient-to-br from-[#A855F7]/10 to-transparent p-8 rounded-[2.5rem] border border-[#A855F7]/20">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Payout Strategy</span>
                                                <span className="text-xs font-bold text-[#A855F7] bg-[#A855F7]/10 px-3 py-1 rounded-full uppercase italic tracking-widest">{selectedOrder.payment_method}</span>
                                            </div>
                                            <div className="flex items-end justify-between">
                                                <div>
                                                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Total Reward</p>
                                                    <div className="text-4xl font-black italic tracking-tighter text-white">
                                                        {formatCurrency(selectedOrder.payment_method === 'credits' ? selectedOrder.total_credit_value : selectedOrder.total_cash_value)}
                                                    </div>
                                                </div>
                                                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${selectedOrder.payment_status === 'completed' ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/10' : 'border-amber-500/20 text-amber-500 bg-amber-500/10'}`}>
                                                    {selectedOrder.payment_status}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-8 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Awaiting Verification</span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleStatusUpdate(selectedOrder.id, 'cancelled')}
                                        className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-colors"
                                    >
                                        Abort Mission
                                    </button>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleStatusUpdate(selectedOrder.id, 'in-transit')}
                                            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                                        >
                                            Mark In-Transit
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(selectedOrder.id, 'verified')}
                                            className="px-8 py-3 bg-[#A855F7] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#9333EA] transition-all shadow-[0_4px_20px_rgba(139,92,246,0.3)] flex items-center gap-2"
                                        >
                                            <ShieldCheck size={16} /> Verify Payload
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function DollarSign({ size, className }: { size: number; className?: string }) {
    return <Banknote size={size} className={className} />;
}

function ShieldCheck({ size, className }: { size: number; className?: string }) {
    return <CheckCircle2 size={size} className={className} />;
}
