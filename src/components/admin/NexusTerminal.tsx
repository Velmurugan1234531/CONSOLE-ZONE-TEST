"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal, Cpu, Activity, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getDashboardActivity } from "@/services/admin";
import { format } from "date-fns";

export function NexusTerminal() {
    const [logs, setLogs] = useState<{ id: string; type: string; title: string; date: string; severity: 'info' | 'success' | 'warning' | 'error' }[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial logs and simulated live updates
    useEffect(() => {
        const fetchInitial = async () => {
            const activity = await getDashboardActivity();
            const initialLogs = activity.map((a: any) => ({
                id: a.id,
                type: a.type,
                title: a.title,
                date: a.date,
                severity: a.type === 'RENTAL' ? 'info' : a.type === 'SALE' ? 'success' : 'warning' as any
            }));
            setLogs(initialLogs);
        };
        fetchInitial();

        // Simulate live loop every 30-60 seconds for demo
        const interval = setInterval(async () => {
            const activity = await getDashboardActivity();
            if (activity.length > 0) {
                const latest = activity[0];
                setLogs(prev => {
                    if (prev.some(l => l.id === latest.id)) return prev;
                    return [...prev, {
                        id: latest.id,
                        type: latest.type,
                        title: latest.title,
                        date: latest.date,
                        severity: latest.type === 'RENTAL' ? 'info' : latest.type === 'SALE' ? 'success' : 'warning' as any
                    }].slice(-20); // Keep last 20
                });
            }
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="bg-[#050505] border border-white/10 rounded-[2rem] overflow-hidden flex flex-col h-full shadow-2xl">
            {/* Terminal Header */}
            <div className="bg-[#0a0a0a] border-b border-white/5 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Terminal size={16} className="text-[#3B82F6]" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Live Feedback Loop</span>
                        <span className="text-[8px] font-mono text-gray-600 uppercase">Nexus Core // Listening...</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest">Active</span>
                </div>
            </div>

            {/* Log Stream */}
            <div
                ref={scrollRef}
                className="flex-1 p-6 font-mono text-[10px] overflow-y-auto custom-scrollbar space-y-3 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-fixed"
            >
                <div className="text-gray-700 italic border-b border-white/5 pb-2 mb-4">
                    [SYSTEM] Initializing telemetry stream...
                </div>

                <AnimatePresence initial={false}>
                    {logs.map((log) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex gap-4 group hover:bg-white/5 p-2 rounded-lg transition-colors border-l-2 border-transparent hover:border-[#3B82F6]"
                        >
                            <span className="text-gray-600 shrink-0">[{format(new Date(log.date), 'HH:mm:ss')}]</span>
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${log.severity === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                                            log.severity === 'info' ? 'bg-blue-500/10 text-blue-500' :
                                                log.severity === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                                                    'bg-red-500/10 text-red-500'
                                        }`}>
                                        {log.type}
                                    </span>
                                    <span className="text-gray-300 font-bold uppercase tracking-tight">{log.title}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                <div className="flex items-center gap-2 text-[#3B82F6] opacity-50 animate-pulse">
                    <span>_</span>
                </div>
            </div>

            {/* Terminal Statistics */}
            <div className="p-4 bg-white/5 border-t border-white/5 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                    <Activity size={14} className="text-blue-400 opacity-50" />
                    <div className="flex flex-col">
                        <span className="text-[8px] text-gray-500 font-black uppercase">IO Throughput</span>
                        <span className="text-[10px] text-white font-mono">1.2 KB/s</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Cpu size={14} className="text-emerald-400 opacity-50" />
                    <div className="flex flex-col">
                        <span className="text-[8px] text-gray-500 font-black uppercase">Core Load</span>
                        <span className="text-[10px] text-white font-mono">0.02%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
