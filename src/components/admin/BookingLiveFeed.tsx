import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Bell, Zap, Radio, Terminal, ShoppingBag } from 'lucide-react';
import { useBookings } from '@/hooks/rental/useBookings';

export const BookingLiveFeed = () => {
    const { bookings, loading } = useBookings(15);

    return (
        <div className="bg-[#050505] border border-white/5 rounded-2xl p-6 h-[400px] flex flex-col relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Radio size={14} className="text-[#06B6D4] animate-pulse" />
                        <div className="absolute inset-0 bg-[#06B6D4] blur-md opacity-20" />
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Live Strategic Feed</h3>
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-full border border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-pulse" />
                    <span className="text-[8px] font-black text-[#06B6D4] uppercase">Firestore Uplink</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/5">
                <AnimatePresence initial={false}>
                    {bookings.map((booking) => (
                        <motion.div
                            key={booking.bookingId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white/[0.02] border border-white/5 hover:border-[#06B6D4]/30 rounded-xl p-3 transition-all group/item"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors
                                        ${booking.bookingStatus === 'APPROVED' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                                            booking.bookingStatus === 'BOOKING_PENDING' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                                'bg-[#06B6D4]/10 border-[#06B6D4]/20 text-[#06B6D4]'}`}
                                    >
                                        <ShoppingBag size={10} />
                                    </div>
                                    <span className="text-[9px] font-bold text-gray-400 group-hover/item:text-white transition-colors">
                                        {booking.bookingId.substring(0, 8)}
                                    </span>
                                </div>
                                <span className="text-[8px] font-medium text-gray-600 font-mono">
                                    {booking.createdAt?.toDate().toLocaleTimeString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-tight leading-relaxed">
                                    {booking.bookingStatus.replace('_', ' ')}
                                </p>
                                <span className="text-[9px] font-mono text-white">₹{booking.totalAmount}</span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {bookings.length === 0 && !loading && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-20">
                        <Activity size={32} className="mb-4 text-gray-500" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">No Active Data Stream</p>
                    </div>
                )}
            </div>

            {/* Decorative Corner */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#06B6D4]/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
};
