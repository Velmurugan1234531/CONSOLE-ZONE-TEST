"use client";

import { motion } from "framer-motion";

interface ScanningOverlayProps {
    isVisible: boolean;
    status: string;
}

export default function ScanningOverlay({ isVisible, status }: ScanningOverlayProps) {
    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl overflow-hidden"
        >
            {/* Decorative Grid */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #A855F7 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

            {/* Glowing Scanline */}
            <motion.div
                animate={{ translateY: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-x-0 h-40 bg-gradient-to-b from-transparent via-[#A855F7]/30 to-transparent z-10"
            />

            {/* Center Target */}
            <div className="relative z-20 flex flex-col items-center">
                <div className="w-24 h-24 border-2 border-[#A855F7] rounded-3xl mb-6 relative">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute inset-0 border-4 border-[#A855F7] rounded-3xl blur-md"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-1 h-1 bg-[#A855F7] rounded-full animate-ping" />
                    </div>
                </div>

                <h3 className="text-xl font-black text-white italic tracking-tighter uppercase mb-2">
                    {status}
                </h3>

                <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                        <motion.div
                            key={i}
                            animate={{ opacity: [0.2, 1, 0.2] }}
                            transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                            className="w-1 h-1 bg-[#A855F7] rounded-full"
                        />
                    ))}
                </div>
            </div>

            {/* Data Stream Simulation */}
            <div className="absolute bottom-8 left-8 right-8 font-mono text-[8px] text-[#A855F7]/50 overflow-hidden h-12">
                <motion.div
                    animate={{ y: [0, -100] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                >
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i}>
                            0x{Math.random().toString(16).slice(2, 10).toUpperCase()} {" >> "} ANALYZING_DOCUMENT_STRUCTURE_{i}...
                        </div>
                    ))}
                </motion.div>
            </div>
        </motion.div>
    );
}
