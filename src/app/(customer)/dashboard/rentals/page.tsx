"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Clock, MapPin, FileText, Plus } from 'lucide-react';
import { BookingStatusTracker } from '@/components/booking/BookingStatusTracker';
import { BookingPersistence } from '@/services/booking-persistence';
import { Booking } from '@/types/booking';
import Link from 'next/link';

export default function RentalDashboard() {
    const [bookings, setBookings] = useState<Booking[]>([]);

    useEffect(() => {
        // Load bookings from persistence (demo + local)
        const all = BookingPersistence.getBookings();
        setBookings(all);
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8 space-y-12">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter">
                            Active <span className="text-[#06B6D4]">Deployments</span>
                        </h1>
                        <p className="text-gray-500 font-mono text-xs uppercase tracking-widest mt-2">
                            Tracking {bookings.length} active hardware signals
                        </p>
                    </div>
                    <Link href="/rentals" className="flex items-center gap-2 px-6 py-3 bg-[#06B6D4] text-black font-black uppercase text-xs tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all">
                        <Plus size={16} /> New Deployment
                    </Link>
                </div>

                {/* Bookings Grid */}
                <div className="grid grid-cols-1 gap-8">
                    {bookings.map((booking) => (
                        <motion.div
                            key={booking.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-8 space-y-8"
                        >
                            <div className="flex flex-col md:flex-row gap-8">
                                {/* Left: Product Info */}
                                <div className="md:w-1/3 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-[#06B6D4]">
                                            <Gamepad2 size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black uppercase tracking-tight">Gaming Rig #{booking.booking_id}</h2>
                                            <p className="text-[10px] text-gray-500 font-mono">ID: {booking.id}</p>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 rounded-2xl p-4 space-y-3">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                                            <span>Rental Cycle</span>
                                            <span className="text-white">Active</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xl font-black">
                                            <Clock size={18} className="text-[#06B6D4]" />
                                            <span>{new Date(booking.rental_end).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-[9px] text-gray-600 font-mono uppercase">Deployment ends in 4 days</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button className="flex items-center justify-center gap-2 py-3 bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                            <FileText size={14} /> Invoice
                                        </button>
                                        <button className="flex items-center justify-center gap-2 py-3 bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-[#06B6D4]">
                                            <Plus size={14} /> Extend
                                        </button>
                                    </div>
                                </div>

                                {/* Right: Lifecycle Tracker */}
                                <div className="flex-1">
                                    <BookingStatusTracker currentStatus={booking.booking_status} />

                                    <div className="mt-8 flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <MapPin size={18} className="text-emerald-500" />
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Rider Location Active</p>
                                                <p className="text-[10px] text-gray-400">Tactical tracking signal detected...</p>
                                            </div>
                                        </div>
                                        <button className="px-4 py-2 border border-emerald-500/30 rounded-lg text-[9px] font-black uppercase text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all">
                                            Open Map
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {bookings.length === 0 && (
                        <div className="py-24 flex flex-col items-center justify-center text-center opacity-30 space-y-4">
                            <Radio size={48} className="text-gray-500 animate-pulse" />
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter text-gray-400">No active signals</h3>
                                <p className="text-xs text-gray-600 font-mono uppercase tracking-widest">Awaiting deployment command</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const Radio = (props: any) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" /><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.4" /><circle cx="12" cy="12" r="2" /><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.4" /><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" />
    </svg>
);
