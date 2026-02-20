
"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal } from "lucide-react";

interface LogEntry {
    id: string;
    action: string;
    severity: 'info' | 'warning' | 'critical';
    created_at: string;
    user_id?: string;
}

export default function NeuralConsole() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initial Mock Logs
        const initialLogs: LogEntry[] = [
            { id: '1', action: 'SYSTEM_BOOT_SEQUENCE_INITIATED', severity: 'info', created_at: new Date().toISOString() },
            { id: '2', action: 'NEURAL_LINK_ESTABLISHED', severity: 'info', created_at: new Date().toISOString() },
            { id: '3', action: 'SECURITY_GRID_ONLINE', severity: 'info', created_at: new Date().toISOString() }
        ];
        setLogs(initialLogs);

        // Real-time Simulation
        const interval = setInterval(() => {
            if (Math.random() > 0.6) {
                const newLog = generateMockLog();
                setLogs(prev => {
                    const updated = [...prev, newLog];
                    return updated.slice(-50); // Keep last 50 logs
                });
            }
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="h-[300px] w-full bg-[#0a0a0a] rounded-3xl border border-white/5 p-6 flex flex-col overflow-hidden relative group">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 z-10">
                <div className="flex items-center gap-2">
                    <Terminal size={16} className="text-[#8B5CF6]" />
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-white">Neural Mainframe</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-mono text-emerald-500 uppercase">Online</span>
                </div>
            </div>

            {/* Scanline Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,21,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%] opacity-20" />

            {/* Logs Area */}
            <div className="flex-1 overflow-y-auto space-y-2 relative z-10 custom-scrollbar mask-image-gradient">
                <AnimatePresence initial={false}>
                    {logs.map((log) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-start gap-3 text-[10px] font-mono"
                        >
                            <span className="text-gray-600 shrink-0">
                                {new Date(log.created_at).toLocaleTimeString([], { hour12: false })}
                            </span>
                            <span className={`
                                ${log.severity === 'critical' ? 'text-red-500 font-bold' :
                                    log.severity === 'warning' ? 'text-amber-500' : 'text-[#8B5CF6]/80'}
                            `}>
                                {log.severity === 'critical' && '🚨 '}
                                {log.action}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={bottomRef} />
            </div>
        </div>
    );
}

function generateMockLog(): LogEntry {
    const actions = [
        { msg: "PACKET_INTERCEPT_SUCCESS", sev: 'info' },
        { msg: "ENCRYPTED_HANDSHAKE_VERIFIED", sev: 'info' },
        { msg: "ADMIN_ACCESS_GRANTED_NODE_7", sev: 'warning' },
        { msg: "DATA_SYNC_COMPLETE", sev: 'info' },
        { msg: "FIREWALL_PING_DETECTED", sev: 'warning' },
        { msg: "UNAUTHORIZED_ACCESS_BLOCKED", sev: 'critical' },
        { msg: "SUPABASE_CONNECTION_STABLE", sev: 'info' },
        { msg: "POSTGRES_REPLICATION_SYNC", sev: 'info' }
    ];
    const rand = actions[Math.floor(Math.random() * actions.length)];
    return {
        id: Math.random().toString(36).substr(2, 9),
        action: rand.msg,
        severity: rand.sev as 'info' | 'warning' | 'critical',
        created_at: new Date().toISOString()
    };
}
