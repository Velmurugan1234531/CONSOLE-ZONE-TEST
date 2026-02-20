"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Bot, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AdminAIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
        { role: 'ai', text: "Hello Admin. I am your system assistant. Ask me about sales, rentals, or inventory." }
    ]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!query.trim()) return;

        const userMsg = query;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setQuery("");
        setLoading(true);

        try {
            const res = await fetch('/api/ai', {
                method: 'POST',
                body: JSON.stringify({ query: userMsg }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'ai', text: data.response }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', text: "I encountered a connection error." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-[#0a0a0a] border border-[#8B5CF6]/30 rounded-2xl w-80 md:w-96 shadow-[0_0_50px_rgba(139,92,246,0.3)] overflow-hidden mb-4"
                    >
                        {/* Header */}
                        <div className="bg-[#8B5CF6]/10 p-4 border-b border-[#8B5CF6]/20 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-[#8B5CF6] flex items-center justify-center">
                                    <Bot size={18} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm">CORTEX AI</h3>
                                    <p className="text-[10px] text-[#8B5CF6] uppercase font-mono tracking-wider">System Online</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Chat Body */}
                        <div ref={scrollRef} className="h-80 overflow-y-auto p-4 space-y-4 bg-black/50 backdrop-blur-sm">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl p-3 text-sm font-medium ${msg.role === 'user'
                                            ? 'bg-[#8B5CF6] text-white rounded-br-none'
                                            : 'bg-white/10 text-gray-200 rounded-bl-none border border-white/5'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white/10 rounded-2xl p-3 rounded-bl-none">
                                        <Loader2 size={16} className="animate-spin text-gray-400" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-3 border-t border-white/10 bg-[#0a0a0a]">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask about system status..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-4 pr-10 text-sm text-white focus:border-[#8B5CF6] outline-none"
                                />
                                <button
                                    onClick={handleSend}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[#8B5CF6] rounded-lg text-white hover:bg-[#7c3aed] transition-colors"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#6366f1] flex items-center justify-center text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transition-all z-50"
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            </motion.button>
        </div>
    );
}
