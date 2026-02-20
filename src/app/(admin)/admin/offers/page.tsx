"use client";

import { useState, useEffect } from "react";
import { Tag, Plus, RefreshCw, Percent, DollarSign, Calendar, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { getAllOffers, getActiveOffers, updateOffer, deleteOffer, PromotionalOffer } from "@/services/offers";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function OffersPage() {
    const [offers, setOffers] = useState<PromotionalOffer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showActive, setShowActive] = useState(false);

    useEffect(() => {
        loadOffers();
    }, [showActive]);

    const loadOffers = async () => {
        try {
            setLoading(true);
            const data = showActive ? await getActiveOffers() : await getAllOffers();
            setOffers(data);
        } catch (error) {
            console.error("Failed to load offers:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleOfferStatus = async (id: string, currentStatus: boolean) => {
        try {
            await updateOffer(id, { is_active: !currentStatus });
            await loadOffers();
        } catch (error) {
            console.error("Failed to toggle offer:", error);
            alert("Error updating offer status");
        }
    };

    const handleDeleteOffer = async (id: string, code: string) => {
        if (!confirm(`Delete offer "${code}"? This action cannot be undone.`)) return;

        try {
            await deleteOffer(id);
            await loadOffers();
        } catch (error) {
            console.error("Failed to delete offer:", error);
            alert("Error deleting offer");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="text-white">Loading offers...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-wider text-white mb-2">
                            Promotional Offers
                        </h1>
                        <p className="text-sm text-gray-400">
                            Manage discount codes and promotional campaigns
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowActive(!showActive)}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-xl transition-all ${showActive
                                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-500'
                                    : 'bg-white/5 border-white/10 text-gray-400'
                                }`}
                        >
                            <span className="text-sm font-bold">{showActive ? 'Active Only' : 'All Offers'}</span>
                        </button>
                        <button
                            onClick={loadOffers}
                            className="flex items-center gap-2 px-4 py-2 bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 rounded-xl text-[#8B5CF6] transition-all"
                        >
                            <RefreshCw size={16} />
                            <span className="text-sm font-bold">Refresh</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Offers Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {offers.map((offer) => (
                        <motion.div
                            key={offer.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 space-y-4 relative overflow-hidden"
                        >
                            {/* Background Glow */}
                            <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] -z-10 ${offer.is_active ? 'bg-emerald-500/10' : 'bg-gray-500/10'
                                }`}></div>

                            {/* Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Tag size={16} className="text-[#8B5CF6]" />
                                        <h3 className="text-lg font-black uppercase tracking-wide text-white">
                                            {offer.code}
                                        </h3>
                                    </div>
                                    <p className="text-sm font-bold text-gray-300">{offer.title}</p>
                                    {offer.description && (
                                        <p className="text-xs text-gray-500 mt-1">{offer.description}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => toggleOfferStatus(offer.id, offer.is_active)}
                                    className="transition-transform hover:scale-110"
                                >
                                    {offer.is_active ? (
                                        <ToggleRight size={32} className="text-emerald-500" />
                                    ) : (
                                        <ToggleLeft size={32} className="text-gray-600" />
                                    )}
                                </button>
                            </div>

                            {/* Discount Info */}
                            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                                {offer.discount_type === 'percentage' ? (
                                    <div className="flex items-center gap-2">
                                        <Percent size={20} className="text-amber-500" />
                                        <span className="text-2xl font-black text-white">{offer.discount_value}%</span>
                                        <span className="text-xs text-gray-500">OFF</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <DollarSign size={20} className="text-emerald-500" />
                                        <span className="text-2xl font-black text-white">₹{offer.discount_value}</span>
                                        <span className="text-xs text-gray-500">OFF</span>
                                    </div>
                                )}
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-white/5 rounded-lg">
                                    <div className="text-[8px] font-black uppercase text-gray-500 mb-1">Min Days</div>
                                    <div className="text-sm font-bold text-white">{offer.min_rental_days}</div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg">
                                    <div className="text-[8px] font-black uppercase text-gray-500 mb-1">Usage</div>
                                    <div className="text-sm font-bold text-white">
                                        {offer.current_uses}{offer.max_uses ? `/${offer.max_uses}` : ''}
                                    </div>
                                </div>
                            </div>

                            {/* Validity */}
                            <div className="p-3 bg-white/5 rounded-lg">
                                <div className="flex items-center gap-2 text-[8px] font-black uppercase text-gray-500 mb-2">
                                    <Calendar size={12} />
                                    <span>Validity Period</span>
                                </div>
                                <div className="text-xs text-white">
                                    {format(new Date(offer.valid_from), 'MMM d, yyyy')} - {' '}
                                    {offer.valid_until ? format(new Date(offer.valid_until), 'MMM d, yyyy') : 'No Expiry'}
                                </div>
                            </div>

                            {/* Categories */}
                            {offer.applicable_categories && (
                                <div className="flex flex-wrap gap-2">
                                    {offer.applicable_categories.map((cat) => (
                                        <span
                                            key={cat}
                                            className="px-2 py-1 bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 rounded-lg text-[9px] font-black uppercase text-[#8B5CF6]"
                                        >
                                            {cat}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Actions */}
                            <button
                                onClick={() => handleDeleteOffer(offer.id, offer.code)}
                                className="w-full flex items-center justify-center gap-2 p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-500 transition-all"
                            >
                                <Trash2 size={14} />
                                <span className="text-xs font-bold">Delete Offer</span>
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Add New Offer Card */}
                <motion.div
                    layout
                    className="bg-[#0a0a0a] border-2 border-dashed border-white/20 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 hover:border-[#8B5CF6]/50 transition-all cursor-pointer group"
                >
                    <div className="w-16 h-16 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 flex items-center justify-center group-hover:bg-[#8B5CF6]/20 transition-all">
                        <Plus size={32} className="text-[#8B5CF6]" />
                    </div>
                    <div className="text-center">
                        <div className="text-sm font-black uppercase text-white mb-1">Create New Offer</div>
                        <div className="text-xs text-gray-500">Add promotional discount code</div>
                    </div>
                </motion.div>
            </div>

            {/* Empty State */}
            {offers.length === 0 && (
                <div className="max-w-7xl mx-auto text-center py-20">
                    <Tag size={48} className="text-gray-700 mx-auto mb-4" />
                    <h3 className="text-xl font-black uppercase text-gray-600 mb-2">
                        {showActive ? 'No Active Offers' : 'No Offers Found'}
                    </h3>
                    <p className="text-sm text-gray-500">
                        {showActive ? 'Create a new offer to get started' : 'All offers have been deleted'}
                    </p>
                </div>
            )}
        </div>
    );
}
