import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Truck, ShieldCheck, Gamepad2, PackageCheck } from 'lucide-react';
import { BookingStatus } from '@/types/booking';

interface StatusStep {
    status: BookingStatus;
    label: string;
    icon: React.ReactNode;
}

const STEPS: StatusStep[] = [
    { status: 'BOOKING_PENDING', label: 'Requested', icon: <Clock size={16} /> },
    { status: 'PAYMENT_SUCCESS', label: 'Paid', icon: <CheckCircle size={16} /> },
    { status: 'UNDER_REVIEW', label: 'Reviewing', icon: <ShieldCheck size={16} /> },
    { status: 'APPROVED', label: 'Approved', icon: <PackageCheck size={16} /> },
    { status: 'OUT_FOR_DELIVERY', label: 'In Transit', icon: <Truck size={16} /> },
    { status: 'RENTAL_ACTIVE', label: 'Playing', icon: <Gamepad2 size={16} /> },
    { status: 'COMPLETED', label: 'Complete', icon: <CheckCircle size={16} /> },
];

export const BookingStatusTracker = ({ currentStatus }: { currentStatus: BookingStatus }) => {
    // Determine the current step index
    const activeIndex = STEPS.findIndex(s => s.status === currentStatus);
    const progress = activeIndex === -1 ? 0 : (activeIndex / (STEPS.length - 1)) * 100;

    return (
        <div className="w-full bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#06B6D4] via-[#3B82F6] to-transparent opacity-10" />

            <div className="relative z-10">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Mission Status Lifecycle</h3>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse" />
                        <span className="text-[10px] font-black uppercase text-[#06B6D4]">{currentStatus.replace('_', ' ')}</span>
                    </div>
                </div>

                <div className="relative">
                    {/* Progress Line */}
                    <div className="absolute top-4 left-0 w-full h-[2px] bg-white/5" />
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="absolute top-4 left-0 h-[2px] bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                    />

                    {/* Step Icons */}
                    <div className="flex justify-between relative z-20">
                        {STEPS.map((step, idx) => {
                            const isCompleted = idx < activeIndex;
                            const isActive = idx === activeIndex;

                            return (
                                <div key={step.status} className="flex flex-col items-center gap-4">
                                    <motion.div
                                        initial={false}
                                        animate={{
                                            scale: isActive ? 1.2 : 1,
                                            backgroundColor: isCompleted || isActive ? '#06B6D4' : '#1A1A1A',
                                            color: isCompleted || isActive ? '#000' : '#444'
                                        }}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center border ${isCompleted || isActive ? 'border-[#06B6D4]' : 'border-white/10'
                                            } shadow-xl backdrop-blur-md`}
                                    >
                                        {step.icon}
                                    </motion.div>
                                    <span className={`text-[8px] font-bold uppercase tracking-widest ${isActive ? 'text-[#06B6D4]' : isCompleted ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Scanline Effect overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.01),rgba(0,255,0,0.005),rgba(0,0,255,0.01))] bg-[length:100%_2px,3px_100%] z-50 opacity-20" />
        </div>
    );
};
