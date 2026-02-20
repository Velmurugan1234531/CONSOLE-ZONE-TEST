"use client";

import { useState, Suspense } from "react";
import ShowroomCanvas from "@/components/showroom/ShowroomCanvas";
import ShowroomControls from "@/components/showroom/ShowroomControls";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, Info, HelpCircle } from "lucide-react";

export default function ShowroomPage() {
    const [preset, setPreset] = useState("studio");
    const [finish, setFinish] = useState("original");

    return (
        <main className="relative h-screen w-full bg-[#050505] overflow-hidden">
            {/* Header / UI Overlay */}
            <div className="absolute top-0 left-0 w-full p-8 z-20 flex justify-between items-start pointer-events-none">
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="pointer-events-auto"
                >
                    <Link
                        href="/"
                        className="flex items-center gap-2 group text-white/40 hover:text-white transition-colors"
                    >
                        <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white/5 transition-all">
                            <ChevronLeft size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-widest font-bold">Back to Store</span>
                            <span className="text-xl font-bold text-white uppercase tracking-tighter">Console Nexus</span>
                        </div>
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="flex flex-col items-end gap-4 pointer-events-auto"
                >
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex flex-col gap-1 items-end">
                        <span className="text-xs font-bold text-purple-400">NEXT-GEN SHOWROOM</span>
                        <h2 className="text-2xl font-black text-white italic">PRO SERIES V1</h2>
                    </div>
                </motion.div>
            </div>

            {/* Instruction Overlay */}
            <div className="absolute top-1/2 left-8 -translate-y-1/2 z-10 hidden lg:flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50">
                        <Info size={24} />
                    </div>
                    <div className="max-w-[180px]">
                        <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-widest font-bold">Interaction</p>
                        <p className="text-xs text-white/70 leading-relaxed mt-1">Left click to rotate. Right click to pan. Scroll to zoom.</p>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50">
                        <HelpCircle size={24} />
                    </div>
                    <div className="max-w-[180px]">
                        <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-widest font-bold">Discovery</p>
                        <p className="text-xs text-white/70 leading-relaxed mt-1">Click the pulsing pulse icons on the console to reveal features.</p>
                    </div>
                </div>
            </div>

            {/* Background Text Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
                <h1 className="text-[25vw] font-black text-white/[0.02] tracking-tighter uppercase leading-none">
                    NEXUS
                </h1>
            </div>

            {/* The 3D Scene */}
            <Suspense fallback={
                <div className="absolute inset-0 flex items-center justify-center bg-[#050505]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                        <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Initializing Nexus...</span>
                    </div>
                </div>
            }>
                <ShowroomCanvas preset={preset} finish={finish} />
            </Suspense>

            {/* User Controls */}
            <ShowroomControls
                preset={preset}
                setPreset={setPreset}
                finish={finish}
                setFinish={setFinish}
            />

            {/* Footer / Status Bar */}
            <div className="absolute bottom-6 left-8 right-8 flex justify-between items-center z-10 pointer-events-none">
                <div className="flex items-center gap-4">
                    <div className="h-1 w-24 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-purple-500"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                        />
                    </div>
                    <span className="text-[10px] text-white/20 font-mono tracking-widest uppercase">System Operational</span>
                </div>

                <div className="flex gap-4">
                    <span className="text-[10px] text-white/20 font-mono tracking-widest uppercase">60 FPS</span>
                    <span className="text-[10px] text-white/20 font-mono tracking-widest uppercase truncate max-w-[100px]">Model: PS5_BODY_V02</span>
                </div>
            </div>
        </main>
    );
}
