"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface CommandNexusCardProps {
    title: string;
    subtitle?: string;
    icon: LucideIcon;
    children: React.ReactNode;
    className?: string;
    statusColor?: 'blue' | 'purple' | 'emerald' | 'red' | 'orange';
    delay?: number;
}

export function CommandNexusCard({
    title,
    subtitle,
    icon: Icon,
    children,
    className = "",
    statusColor = 'blue',
    delay = 0
}: CommandNexusCardProps) {
    const glowColors = {
        blue: 'group-hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] group-hover:border-blue-500/30',
        purple: 'group-hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] group-hover:border-purple-500/30',
        emerald: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] group-hover:border-emerald-500/30',
        red: 'group-hover:shadow-[0_0_30px_rgba(239,68,68,0.15)] group-hover:border-red-500/30',
        orange: 'group-hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] group-hover:border-orange-500/30',
    };

    const iconColors = {
        blue: 'text-blue-400',
        purple: 'text-purple-400',
        emerald: 'text-emerald-400',
        red: 'text-red-400',
        orange: 'text-orange-400',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5, ease: "easeOut" }}
            className={`group relative bg-black/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 overflow-hidden transition-all duration-500 ${glowColors[statusColor]} ${className}`}
        >
            {/* Ambient Background Gradient */}
            <div className={`absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-l from-current opacity-[0.03] pointer-events-none group-hover:opacity-[0.07] transition-opacity duration-700 ${iconColors[statusColor]}`} />

            {/* Header */}
            <div className="relative z-10 flex items-start justify-between mb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 bg-white/5 rounded-2xl border border-white/5 transition-transform duration-500 group-hover:scale-110 ${iconColors[statusColor]}`}>
                            <Icon size={20} />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tighter italic text-white/90 group-hover:text-white transition-colors">
                            {title}
                        </h3>
                    </div>
                    {subtitle && (
                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest pl-13">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Status Indicator Dot */}
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-sm ${statusColor === 'emerald' ? 'bg-emerald-500' :
                            statusColor === 'red' ? 'bg-red-500' :
                                statusColor === 'blue' ? 'bg-blue-500' :
                                    statusColor === 'orange' ? 'bg-orange-500' : 'bg-purple-500'
                        }`} />
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Live</span>
                </div>
            </div>

            {/* Content Container */}
            <div className="relative z-10">
                {children}
            </div>

            {/* Corner Decorative Element */}
            <div className="absolute bottom-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <div className="w-12 h-1 border-r border-b border-white/20 rounded-br-lg" />
            </div>

            {/* Scanline Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%)] bg-[length:100%_4px] opacity-10" />
        </motion.div>
    );
}
