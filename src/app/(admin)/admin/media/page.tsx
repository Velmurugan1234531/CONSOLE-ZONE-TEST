"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listFiles, uploadFile, deleteFile } from "@/services/files";
import {
    Image as ImageIcon,
    Upload,
    Trash2,
    Download,
    File as FileIcon,
    Search,
    Grid,
    List,
    MoreVertical,
    CheckCircle2,
    X,
    Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StorageFile {
    name: string;
    id: string;
    updated_at: string;
    created_at: string;
    last_accessed_at: string;
    metadata: Record<string, any>;
}

export default function MediaManager() {
    const queryClient = useQueryClient();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isUploading, setIsUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const { data: files = [], isLoading } = useQuery<{ name: string; url: string; }[]>({
        queryKey: ['adminMedia'],
        queryFn: () => listFiles()
    });

    const uploadMutation = useMutation<string, Error, File>({
        mutationFn: (file: File) => uploadFile(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminMedia'] });
            setIsUploading(false);
        }
    });

    const deleteMutation = useMutation<void, Error, string>({
        mutationFn: (path: string) => deleteFile(path),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminMedia'] });
        }
    });

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        uploadMutation.mutate(file);
    };

    const filteredFiles = files.filter((f: any) => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 text-[#10B981] animate-spin" />
                <p className="text-gray-500 font-mono text-xs uppercase tracking-widest animate-pulse">Scanning Storage...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-white pl-6">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter mb-1 font-display">
                        Media <span className="opacity-40">Library</span>
                    </h1>
                    <p className="text-gray-400 font-mono text-xs tracking-widest uppercase">
                        Manage Assets & Uploads
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <label className="cursor-pointer bg-white text-black px-6 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center gap-2 shadow-xl shadow-white/5 relative overflow-hidden">
                        {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                        {isUploading ? 'Uploading...' : 'Upload Asset'}
                        <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} />
                        {isUploading && (
                            <motion.div
                                className="absolute bottom-0 left-0 h-1 bg-black"
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 2 }}
                            />
                        )}
                    </label>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search media assets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-white focus:ring-1 focus:ring-white/50 outline-none transition-all font-mono"
                    />
                </div>
                <div className="flex bg-[#0a0a0a] p-1 rounded-xl border border-white/10">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        <Grid size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        <List size={20} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredFiles.map((file, index) => (
                            <motion.div
                                key={file.name}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ delay: index * 0.02 }}
                                className="group relative aspect-square bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden hover:border-white/30 transition-all shadow-xl"
                            >
                                <div className="absolute inset-0 flex items-center justify-center opacity-20 transition-opacity group-hover:opacity-40">
                                    <ImageIcon size={48} />
                                </div>
                                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black to-transparent">
                                    <p className="text-[10px] font-mono truncate text-gray-400 group-hover:text-white transition-colors">
                                        {file.name}
                                    </p>
                                </div>

                                {/* Hover Actions */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => {
                                            if (confirm("Permanently delete this asset?")) {
                                                deleteMutation.mutate(file.name);
                                            }
                                        }}
                                        className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all scale-75 group-hover:scale-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <button className="p-2 bg-white/10 text-white rounded-lg hover:bg-white hover:text-black transition-all scale-75 group-hover:scale-100">
                                        <Download size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">
                            <tr>
                                <th className="p-4 pl-6">Asset Name</th>
                                <th className="p-4">Type</th>
                                <th className="p-4 text-right pr-6">Size</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                            {filteredFiles.map(file => (
                                <tr key={file.name} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="p-4 pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center">
                                                <FileIcon size={14} className="text-gray-500" />
                                            </div>
                                            <span className="text-gray-300 group-hover:text-white">{file.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-500 uppercase">{file.name.split('.').pop()}</td>
                                    <td className="p-4 text-right pr-6 text-gray-500">PKT-42KB</td>
                                    <td className="p-4">
                                        <div className="flex justify-center gap-2">
                                            <button className="text-gray-500 hover:text-white transition-colors">
                                                <MoreVertical size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {filteredFiles.length === 0 && (
                <div className="py-32 text-center space-y-4 bg-[#0a0a0a]/50 border-2 border-dashed border-white/5 rounded-3xl">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-700 animate-pulse">
                        <Upload size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold uppercase tracking-widest text-gray-500">Storage Void</h3>
                        <p className="text-gray-600 font-mono text-xs uppercase">No assets found in target sector</p>
                    </div>
                </div>
            )}
        </div>
    );
}
