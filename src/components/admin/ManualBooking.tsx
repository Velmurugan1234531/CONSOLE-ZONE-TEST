"use client";

import { useState, useEffect } from "react";
import { Search, User, Calendar, Gamepad2, CreditCard, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";
import { getUsers } from "@/services/admin";
import { getProducts } from "@/services/products";
import { createRental } from "@/services/rentals";
import { format, addDays } from "date-fns";

export function ManualBooking({ onSuccess }: { onSuccess: () => void }) {
    const [users, setUsers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState(format(addDays(new Date(), 3), "yyyy-MM-dd"));
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [userData, productData] = await Promise.all([
                getUsers(),
                getProducts()
            ]);
            setUsers(userData);
            setProducts(productData.filter((p: any) => p.type === 'rent'));
        } catch (e) {
            console.error("ManualBooking loadData failed:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBooking = async () => {
        if (!selectedUser || !selectedProduct) return alert("Select User and Product");

        setSubmitting(true);
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const totalPrice = diffDays * selectedProduct.price;

            await createRental({
                user_id: selectedUser.id,
                product_id: selectedProduct.id,
                start_date: startDate,
                end_date: endDate,
                total_price: totalPrice,
                status: 'active',
                payment_status: 'paid', // Admin usually collects immediately
                payment_method: paymentMethod
            });

            alert("Booking Created Successfully!");
            onSuccess();
        } catch (e) {
            console.error(e);
            alert("Failed to create booking");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-[#06B6D4]" /></div>;

    return (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-[#8B5CF6]/10 to-transparent">
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Manual Booking Terminal</h2>
                <p className="text-gray-500 text-xs font-mono">Create on-spot rental reservations</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* 1. SELECT USER */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#8B5CF6]">
                        <User size={18} />
                        <h3 className="text-sm font-black uppercase tracking-widest">Select Customer</h3>
                    </div>
                    {selectedUser ? (
                        <div className="flex items-center justify-between p-4 bg-white/5 border border-[#8B5CF6]/50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <img src={selectedUser.avatar_url || "https://via.placeholder.com/40"} className="w-10 h-10 rounded-full" />
                                <div>
                                    <p className="text-white font-bold">{selectedUser.full_name}</p>
                                    <p className="text-gray-500 text-xs">{selectedUser.email}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="text-xs text-red-500 hover:underline">Change</button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                <input
                                    placeholder="Search user by name or email..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm outline-none focus:border-[#8B5CF6]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="max-h-48 overflow-y-auto rounded-xl border border-white/5 divide-y divide-white/5">
                                {users.filter(u => u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => setSelectedUser(u)}
                                        className="w-full p-3 text-left hover:bg-white/5 flex justify-between items-center group"
                                    >
                                        <span className="text-sm text-gray-300 group-hover:text-white">{u.full_name}</span>
                                        <ChevronRight size={14} className="text-gray-600" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. SELECT PRODUCT */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#06B6D4]">
                        <Gamepad2 size={18} />
                        <h3 className="text-sm font-black uppercase tracking-widest">Select Item</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {products.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setSelectedProduct(p)}
                                className={`p-3 rounded-xl border text-left transition-all ${selectedProduct?.id === p.id
                                    ? 'bg-[#06B6D4]/10 border-[#06B6D4] text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'}`}
                            >
                                <p className="text-xs font-bold truncate">{p.name}</p>
                                <p className="text-[10px] mt-1 text-[#06B6D4] font-mono">₹{p.price}/day</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. DATES */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#10B981]">
                        <Calendar size={18} />
                        <h3 className="text-sm font-black uppercase tracking-widest">Rental Period</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-500 uppercase font-bold">Start Date</label>
                            <input
                                type="date"
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white text-sm outline-none"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-500 uppercase font-bold">End Date</label>
                            <input
                                type="date"
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white text-sm outline-none"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* 4. PAYMENT */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-orange-400">
                        <CreditCard size={18} />
                        <h3 className="text-sm font-black uppercase tracking-widest">Payment Method</h3>
                    </div>
                    <div className="flex gap-2">
                        {['cash', 'card', 'upi'].map(m => (
                            <button
                                key={m}
                                onClick={() => setPaymentMethod(m as any)}
                                className={`flex-1 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${paymentMethod === m
                                    ? 'bg-orange-400 text-black border-orange-400'
                                    : 'bg-white/5 border-white/10 text-gray-500'}`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-6 bg-white/5 border-t border-white/10">
                <button
                    disabled={submitting}
                    onClick={handleCreateBooking}
                    className="w-full bg-[#8B5CF6] text-white font-black py-4 rounded-xl hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all uppercase tracking-widest text-sm disabled:opacity-50"
                >
                    {submitting ? <Loader2 className="animate-spin mx-auto" /> : "Confirm Manual Booking"}
                </button>
            </div>
        </div>
    );
}
