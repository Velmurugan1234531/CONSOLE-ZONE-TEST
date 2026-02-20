"use client";

import { motion } from "framer-motion";

interface ShowroomControlsProps {
    preset: string;
    setPreset: (preset: string) => void;
    finish: string;
    setFinish: (finish: string) => void;
}

export default function ShowroomControls({
    preset,
    setPreset,
    finish,
    setFinish
}: ShowroomControlsProps) {
    const presets = [
        { id: "studio", label: "Studio", icon: "✨" },
        { id: "cyberpunk", label: "Cyber", icon: "Neon" },
        { id: "minimal", label: "Clean", icon: "⚪" },
    ];

    const finishes = [
        { id: "original", label: "Original", color: "#ffffff" },
        { id: "stealth", label: "Stealth", color: "#111111" },
        { id: "chrome", label: "Chrome", color: "#e5e7eb" },
    ];

    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 w-full max-w-xl px-4">
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-black/40 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl shadow-2xl flex flex-col md:flex-row gap-8 items-center justify-between"
            >
                {/* Lighting Presets */}
                <div className="flex flex-col gap-3 w-full md:w-auto">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold px-1">Environment</span>
                    <div className="flex gap-2">
                        {presets.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setPreset(p.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${preset === p.id
                                        ? "bg-white text-black shadow-lg shadow-white/10"
                                        : "bg-white/5 text-white/60 hover:bg-white/10"
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="w-px h-12 bg-white/10 hidden md:block" />

                {/* Finish Selection */}
                <div className="flex flex-col gap-3 w-full md:w-auto">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold px-1">Texture Finish</span>
                    <div className="flex gap-3">
                        {finishes.map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setFinish(f.id)}
                                title={f.label}
                                className={`w-10 h-10 rounded-full border-2 transition-all p-1 ${finish === f.id ? "border-purple-500 scale-110" : "border-transparent hover:border-white/20"
                                    }`}
                            >
                                <div
                                    className="w-full h-full rounded-full shadow-inner"
                                    style={{ backgroundColor: f.color }}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="w-px h-12 bg-white/10 hidden md:block" />

                {/* Call to Action */}
                <button className="w-full md:w-auto bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-purple-600/20 transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
                    Book Now
                </button>
            </motion.div>
        </div>
    );
}
