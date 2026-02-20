"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getContent, saveContent, deleteContent } from "@/services/content";
import { Content } from "@/lib/schemas";
import {
    FileText,
    Plus,
    Search,
    MoreVertical,
    Eye,
    Edit2,
    Trash2,
    Globe,
    Lock,
    Clock,
    ChevronRight,
    X,
    Layout
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

export default function ContentCMS() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState<'all' | 'page' | 'post'>('all');

    const { data: content = [], isLoading } = useQuery({
        queryKey: ['adminContent', selectedType],
        queryFn: () => getContent(selectedType === 'all' ? undefined : selectedType)
    });

    const deleteMutation = useMutation<void, Error, string>({
        mutationFn: deleteContent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminContent'] });
        }
    });

    const filteredContent = content.filter((item: Content) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-[#8B5CF6]/20 border-t-[#8B5CF6] rounded-full animate-spin" />
                <p className="text-gray-500 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Archives...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-[#8B5CF6] pl-6">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter mb-1 font-display">
                        Content <span className="text-[#8B5CF6]">CMS</span>
                    </h1>
                    <p className="text-gray-400 font-mono text-xs tracking-widest uppercase">
                        Manage Pages, Posts & Announcements
                    </p>
                </div>
                <button className="bg-[#8B5CF6] text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-[#7C3AED] transition-all flex items-center gap-2 shadow-lg shadow-[#8B5CF6]/20">
                    <Plus size={20} />
                    Create Content
                </button>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#8B5CF6] transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="SEARCH TITLES OR SLUGS..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]/50 outline-none transition-all font-mono placeholder:text-gray-700"
                    />
                </div>
                <div className="flex bg-[#0a0a0a] p-1 rounded-xl border border-white/10">
                    {(['all', 'page', 'post'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedType === type
                                ? 'bg-[#8B5CF6] text-white shadow-lg'
                                : 'text-gray-500 hover:text-white'
                                }`}
                        >
                            {type}S
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredContent.map((item: Content, index: number) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden group hover:border-[#8B5CF6]/50 transition-all flex flex-col"
                        >
                            {/* Preview/Image placeholder */}
                            <div className="h-40 bg-gradient-to-br from-[#121212] to-[#1a1a1a] relative flex items-center justify-center overflow-hidden">
                                {item.featured_image ? (
                                    <img src={item.featured_image} alt={item.title} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" />
                                ) : (
                                    <div className="absolute inset-0 opacity-10 flex items-center justify-center">
                                        {item.type === 'page' ? <Layout size={80} /> : <FileText size={80} />}
                                    </div>
                                )}
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-tighter ${item.status === 'published' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                                        }`}>
                                        {item.status}
                                    </span>
                                    <span className="px-2 py-1 rounded text-[8px] font-black bg-white/10 text-white border border-white/20 uppercase tracking-tighter">
                                        {item.type}
                                    </span>
                                </div>
                            </div>

                            <div className="p-5 space-y-4 flex-1 flex flex-col">
                                <div>
                                    <h3 className="text-lg font-black uppercase tracking-tight line-clamp-1 group-hover:text-[#8B5CF6] transition-colors">
                                        {item.title}
                                    </h3>
                                    <p className="text-gray-500 font-mono text-[10px] uppercase truncate">/{item.slug}</p>
                                </div>

                                <div className="flex items-center gap-4 text-gray-500 text-[10px] font-mono uppercase">
                                    <div className="flex items-center gap-1">
                                        <Clock size={12} />
                                        {item.updated_at ? formatDistanceToNow(new Date(item.updated_at)) : 'long ago'}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {item.status === 'published' ? <Globe size={12} className="text-emerald-500" /> : <Lock size={12} className="text-orange-500" />}
                                        {item.status === 'published' ? 'Visible' : 'Private'}
                                    </div>
                                </div>

                                <div className="pt-4 mt-auto border-t border-white/5 flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <button className="p-2 rounded-lg bg-white/5 hover:bg-[#8B5CF6]/10 hover:text-[#8B5CF6] transition-all" title="View Preview">
                                            <Eye size={16} />
                                        </button>
                                        <button className="p-2 rounded-lg bg-white/5 hover:bg-blue-500/10 hover:text-blue-500 transition-all" title="Edit Content">
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (item.id && confirm("Are you sure you want to delete this content?")) {
                                                deleteMutation.mutate(item.id);
                                            }
                                        }}
                                        className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 hover:text-red-500 transition-all"
                                        title="Delete Permanently"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Empty State */}
                {filteredContent.length === 0 && (
                    <div className="col-span-full py-20 text-center space-y-4 bg-[#0a0a0a] border border-dashed border-white/10 rounded-3xl">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-600">
                            <FileText size={32} />
                        </div>
                        <div>
                            <p className="text-white font-bold uppercase tracking-widest">No matching archives found</p>
                            <p className="text-gray-500 text-xs">Try adjusting your filters or search terms</p>
                        </div>
                        <button className="text-[#8B5CF6] font-mono text-xs uppercase hover:underline">
                            Create New Entry
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
