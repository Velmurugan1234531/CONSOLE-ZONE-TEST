"use client";

import { useState, useEffect, useRef } from "react";
import { Terminal, Activity, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PulseEvent {
    id: string;
    timestamp: string;
    type: 'EVENT' | 'SYSTEM' | 'ALERT' | 'SUCCESS';
    message: string;
    source: string;
}

export function SystemPulse() {
    const [events, setEvents] = useState<PulseEvent[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Simulated events for now - in production, this would use a Web Socket or shared event bus
    useEffect(() => {
        const initialEvents: PulseEvent[] = [
            { id: '1', timestamp: new Date().toLocaleTimeString(), type: 'SYSTEM', message: 'Neural Command Interface Initialized', source: 'CORE' },
            { id: '2', timestamp: new Date().toLocaleTimeString(), type: 'EVENT', message: 'Gateway standard encryption verified', source: 'AUTH' },
            { id: '3', timestamp: new Date().toLocaleTimeString(), type: 'SUCCESS', message: 'Sync complete with fleet nodes [1..64]', source: 'DB' }
        ];
        setEvents(initialEvents);

        const interval = setInterval(() => {
            const types: PulseEvent['type'][] = ['EVENT', 'SYSTEM', 'ALERT', 'SUCCESS'];
            const sources = ['HUB', 'KYC', 'BOOK', 'PAY', 'UX'];
            const messages = [
                'Node heartbeat detected at edge-in-01',
                'Identity packet received from user_77',
                'Transactional integrity verified',
                'Cache purge requested by master',
                'Latency spike detected: +12ms',
                'Database handshake successful'
            ];

            const newEvent: PulseEvent = {
                id: Math.random().toString(36).substr(2, 9),
                timestamp: new Date().toLocaleTimeString(),
                type: types[Math.floor(Math.random() * types.length)],
                message: messages[Math.floor(Math.random() * messages.length)],
                source: sources[Math.floor(Math.random() * sources.length)]
            };

            setEvents(prev => [...prev.slice(-19), newEvent]);
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [events]);

    return (
        <div className="relative bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden flex flex-col group h-full shadow-2xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Terminal size={14} className="text-blue-400" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">System Pulse Telemetry</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Live</span>
                </div>
            </div>

            {/* Terminal Feed */}
            <div
                ref={scrollRef}
                className="flex-1 p-6 font-mono text-[10px] space-y-2 overflow-y-auto custom-scrollbar scroll-smooth"
            >
                <AnimatePresence mode="popLayout">
                    {events.map((event) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-start gap-4 group/line"
                        >
                            <span className="text-gray-600 select-none">[{event.timestamp}]</span>
                            <span className={`font-black uppercase tracking-widest min-w-[60px] ${event.type === 'ALERT' ? 'text-red-500' :
                                    event.type === 'SUCCESS' ? 'text-emerald-500' :
                                        event.type === 'SYSTEM' ? 'text-blue-400' : 'text-purple-400'
                                }`}>
                                {event.type}
                            </span>
                            <span className="text-gray-500 italic min-w-[40px] opacity-60">@{event.source}</span>
                            <span className="text-white/80 group-hover/line:text-white transition-colors">{event.message}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Footer / Meta */}
            <div className="px-6 py-3 border-t border-white/5 bg-black/20 flex items-center justify-between text-[8px] font-black uppercase tracking-[0.2em] text-gray-600">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><Activity size={10} /> Sync: 100%</span>
                    <span className="flex items-center gap-1.5"><Zap size={10} /> Buffer: 20/20</span>
                </div>
                <span className="italic">Encrypted Session // console-zone-v4</span>
            </div>

            {/* Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.01),rgba(0,255,0,0.005),rgba(0,0,255,0.01))] bg-[length:100%_2px,3px_100%] z-20 opacity-20"></div>
        </div>
    );
}
