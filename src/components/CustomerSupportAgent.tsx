"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Bot, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function CustomerSupportAgent() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
        { role: 'ai', text: "Hi there! 👋 Welcome to Console Zone. Looking for a PS5 or Xbox? I can help you find the perfect console!" }
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
            // Mock response for now - in real app connect to /api/ai
            setTimeout(() => {
                setMessages(prev => [...prev, { role: 'ai', text: "I'm checking our inventory for you. We have PS5s available for rent starting at ₹499/day! Would you like to book one?" }]);
                setLoading(false);
            }, 1000);

            // Real API call would look like:
            /*
            const res = await fetch('/api/ai/customer', {
                method: 'POST',
                body: JSON.stringify({ query: userMsg }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'ai', text: data.response }]);
            */

        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', text: "Oops, I'm having trouble connecting to the store. Please try again!" }]);
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white border border-gray-200 rounded-2xl w-80 md:w-96 shadow-2xl overflow-hidden mb-4"
                    >
                        {/* Header */}
                        <div className="bg-[#0a0a0a] p-4 flex justify-between items-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg">
                                    <Bot size={20} className="text-black" />
                                </div>
                                <div>
                                    <h3 className="font-black text-white text-base">Console Zone Support</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        <p className="text-[10px] text-gray-300 font-bold uppercase tracking-wider">Online & Ready</p>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors relative z-10 bg-white/10 p-1.5 rounded-full hover:bg-white/20">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Chat Body */}
                        <div ref={scrollRef} className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                        ? 'bg-black text-white rounded-br-none'
                                        : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white rounded-2xl p-4 rounded-bl-none shadow-sm border border-gray-100">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-3 border-t border-gray-100 bg-white">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="relative flex items-center gap-2"
                            >
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Type your question..."
                                    className="w-full bg-gray-100 border-none rounded-full py-3 pl-4 pr-12 text-sm text-black placeholder:text-gray-500 focus:ring-2 focus:ring-black/5 outline-none transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!query.trim()}
                                    className="absolute right-1.5 p-2 bg-black rounded-full text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                            <p className="text-[10px] text-center text-gray-400 mt-2 flex items-center justify-center gap-1">
                                <Sparkles size={10} /> Powered by Cortex AI
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setIsOpen(!isOpen)}
                className="group relative flex items-center justify-center"
            >
                <div className="absolute inset-0 bg-black rounded-full animate-ping opacity-20 group-hover:opacity-30"></div>
                <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center text-white shadow-2xl hover:bg-gray-900 transition-colors z-10 border-2 border-white">
                    {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
                </div>
                {!isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute right-16 bg-white px-4 py-2 rounded-xl rounded-tr-none shadow-xl border border-gray-100 whitespace-nowrap"
                    >
                        <p className="text-sm font-bold text-black">Need with help?</p>
                    </motion.div>
                )}
            </motion.button>
        </div>
    );
}
