"use client";

import { useEffect, useState } from "react";
import {
    Search, Plus, ArrowLeft, TrendingUp, Save, Trash2,
    AlertCircle, CheckCircle2, Loader2, Sparkles, Filter,
    RefreshCw, Edit3, X, ChevronRight, DollarSign, Wallet
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    getAllSellPricing,
    updateSellPricing,
    createSellPricing,
    deleteSellPricing,
    calculateCreditPrice,
    SellPricing
} from "@/services/sell-pricing";
import { formatCurrency } from "@/utils/format";

export default function SellPricingPage() {
    const [pricing, setPricing] = useState<SellPricing[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<SellPricing>>({});
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getAllSellPricing();
            setPricing(data);
        } catch (err) {
            console.error("Failed to load sell pricing:", err);
            showToast("Failed to load pricing data", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const handleEdit = (item: SellPricing) => {
        setEditingId(item.product_id);
        setEditForm({ ...item });
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleSave = async () => {
        if (!editForm.product_id) return;

        try {
            await updateSellPricing(
                editForm.product_id,
                editForm.cash_price || 0,
                editForm.credit_price
            );
            showToast(`Pricing updated for ${editForm.product_name}`);
            setEditingId(null);
            loadData();
        } catch (err) {
            showToast("Failed to update pricing", "error");
        }
    };

    const handleDelete = async (productId: string) => {
        if (!confirm("Are you sure you want to deactivate this pricing?")) return;

        try {
            await deleteSellPricing(productId);
            showToast("Pricing deactivated successfully");
            loadData();
        } catch (err) {
            showToast("Failed to deactivate pricing", "error");
        }
    };

    const filteredPricing = pricing.filter(p =>
        p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.product_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                                Value <span className="text-[#A855F7]">Matrix</span>
                            </h1>
                            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-[#A855F7]/10 border border-[#A855F7]/20 rounded-full">
                                <Sparkles size={10} className="text-[#A855F7]" />
                                <span className="text-[9px] font-mono font-black text-[#A855F7] tracking-widest uppercase italic">
                                    Sell Pricing Engine Active
                                </span>
                            </div>
                        </div>
                        <p className="text-gray-500 text-[11px] font-black uppercase tracking-widest mt-1">
                            Configure Trade-In & Buyback Valuations
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-[#A855F7] text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center gap-2 hover:bg-[#9333EA] transition-all shadow-lg active:scale-95"
                    >
                        <Plus size={18} />
                        Add Product
                    </button>
                    <button
                        onClick={loadData}
                        className="bg-white/5 border border-white/10 hover:bg-white/10 p-3 rounded-2xl transition-all"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Matrix Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-3xl relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total Configured</span>
                        <div className="p-2 bg-white/5 rounded-xl text-[#A855F7]"><TrendingUp size={16} /></div>
                    </div>
                    <div className="text-2xl font-black italic tracking-tight">{pricing.length} Products</div>
                    <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mt-2">Active in Value Matrix</div>
                </div>
                <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-3xl relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Bonus Multiplier</span>
                        <div className="p-2 bg-white/5 rounded-xl text-green-500"><Sparkles size={16} /></div>
                    </div>
                    <div className="text-2xl font-black italic tracking-tight">+15%</div>
                    <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mt-2">Standard Credit Premium</div>
                </div>
                <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-3xl relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Last Synced</span>
                        <div className="p-2 bg-white/5 rounded-xl text-blue-500"><RefreshCw size={16} /></div>
                    </div>
                    <div className="text-2xl font-black italic tracking-tight">Real-Time</div>
                    <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mt-2">Database Integrity: 100%</div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative group max-w-2xl">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#A855F7] to-[#3B82F6] rounded-2xl blur opacity-10 group-focus-within:opacity-30 transition-opacity" />
                <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl flex items-center p-2 shadow-2xl">
                    <Search className="ml-4 text-gray-600" size={20} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search products in matrix..."
                        className="flex-1 bg-transparent border-none outline-none p-4 text-sm font-medium placeholder:text-gray-600"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-black/50 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] border-b border-white/5">
                            <tr>
                                <th className="p-6">Product Item</th>
                                <th className="p-6">Product ID</th>
                                <th className="p-6">Cash Value</th>
                                <th className="p-6">Store Credit (+15%)</th>
                                <th className="p-6">Last Updated</th>
                                <th className="p-6 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center">
                                        <Loader2 className="animate-spin text-[#A855F7] mx-auto" size={32} />
                                        <p className="mt-4 text-gray-500 font-black uppercase tracking-widest text-[10px]">Accessing Database...</p>
                                    </td>
                                </tr>
                            ) : filteredPricing.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center text-gray-500 font-bold italic">
                                        No matching items found in the matrix.
                                    </td>
                                </tr>
                            ) : filteredPricing.map((item) => (
                                <tr key={item.product_id} className="hover:bg-white/[0.02] transition-all group">
                                    <td className="p-6">
                                        {editingId === item.product_id ? (
                                            <input
                                                type="text"
                                                value={editForm.product_name || ""}
                                                onChange={(e) => setEditForm({ ...editForm, product_name: e.target.value })}
                                                className="bg-black/40 border border-[#A855F7]/30 rounded-lg px-3 py-2 text-xs w-full focus:border-[#A855F7] outline-none"
                                            />
                                        ) : (
                                            <div className="font-bold text-gray-200 uppercase tracking-tight">{item.product_name}</div>
                                        )}
                                    </td>
                                    <td className="p-6 font-mono text-[10px] text-gray-500">{item.product_id}</td>
                                    <td className="p-6">
                                        {editingId === item.product_id ? (
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₹</span>
                                                <input
                                                    type="number"
                                                    value={editForm.cash_price || 0}
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value);
                                                        setEditForm({
                                                            ...editForm,
                                                            cash_price: val,
                                                            credit_price: calculateCreditPrice(val)
                                                        });
                                                    }}
                                                    className="bg-black/40 border border-[#A855F7]/30 rounded-lg pl-6 pr-3 py-2 text-xs w-32 focus:border-[#A855F7] outline-none font-mono"
                                                />
                                            </div>
                                        ) : (
                                            <div className="font-black italic text-gray-400">{formatCurrency(item.cash_price)}</div>
                                        )}
                                    </td>
                                    <td className="p-6">
                                        {editingId === item.product_id ? (
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₹</span>
                                                <input
                                                    type="number"
                                                    value={editForm.credit_price || 0}
                                                    onChange={(e) => setEditForm({ ...editForm, credit_price: Number(e.target.value) })}
                                                    className="bg-black/40 border border-[#A855F7]/30 rounded-lg pl-6 pr-3 py-2 text-xs w-32 focus:border-[#A855F7] outline-none font-mono text-[#A855F7]"
                                                />
                                            </div>
                                        ) : (
                                            <div className="font-black italic text-[#A855F7] flex items-center gap-1.5">
                                                <Wallet size={14} />
                                                {formatCurrency(item.credit_price)}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-6 text-[10px] font-mono text-gray-600">
                                        {new Date(item.updated_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-6 text-center">
                                        <div className="flex justify-center gap-2">
                                            {editingId === item.product_id ? (
                                                <>
                                                    <button
                                                        onClick={handleSave}
                                                        className="p-3 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all shadow-lg shadow-green-500/10"
                                                    >
                                                        <Save size={16} />
                                                    </button>
                                                    <button
                                                        onClick={handleCancel}
                                                        className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="p-3 bg-white/5 text-gray-400 rounded-xl hover:bg-[#A855F7] hover:text-white transition-all"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.product_id)}
                                                        className="p-3 bg-white/5 text-gray-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-8"
                        >
                            <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-6 flex items-center gap-3">
                                <Plus className="text-[#A855F7]" />
                                New Matrix <span className="text-[#A855F7]">Input</span>
                            </h2>

                            <CreatePricingForm
                                onSuccess={() => {
                                    setIsCreateModalOpen(false);
                                    loadData();
                                    showToast("New pricing configuration added");
                                }}
                                onCancel={() => setIsCreateModalOpen(false)}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Toast Notification */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100]"
                    >
                        <div className={`px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md flex items-center gap-3 ${toast.type === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-red-500/20 border-red-500/30 text-red-400'}`}>
                            {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                            <p className="text-sm font-bold uppercase tracking-wider">{toast.message}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function CreatePricingForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
    const [id, setId] = useState("");
    const [name, setName] = useState("");
    const [cash, setCash] = useState(0);
    const [credit, setCredit] = useState(0);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !name || cash <= 0) return;

        setLoading(true);
        try {
            await createSellPricing(id, name, cash, credit || undefined);
            onSuccess();
        } catch (err) {
            console.error(err);
            alert("Failed to create pricing. Check console.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-1">Product ID</label>
                <input
                    type="text"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder="e.g., ps5-disc-new"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#A855F7] outline-none transition-all font-mono"
                    required
                />
            </div>
            <div className="space-y-1.5">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-1">Display Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Sony PS5 Disc Edition"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#A855F7] outline-none transition-all"
                    required
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-1">Cash Price</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                        <input
                            type="number"
                            value={cash}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setCash(val);
                                setCredit(calculateCreditPrice(val));
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:border-[#A855F7] outline-none transition-all font-mono"
                            required
                        />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-1">Credit Price</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                        <input
                            type="number"
                            value={credit}
                            onChange={(e) => setCredit(Number(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-[#A855F7] focus:border-[#A855F7] outline-none transition-all font-mono"
                            required
                        />
                    </div>
                </div>
            </div>

            <div className="flex gap-4 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-3 px-4 border border-white/10 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all"
                >
                    Abort
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-4 bg-[#A855F7] text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-[#9333EA] transition-all flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Deploy</>}
                </button>
            </div>
        </form>
    );
}
