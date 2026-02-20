"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, File, Download, Trash2, Loader2, FileText, Image as ImageIcon } from "lucide-react";
import { uploadFile, deleteFile, subscribeToFiles, FileDocument } from "@/services/files";

interface MyFilesSectionProps {
    userId: string;
}

export default function MyFilesSection({ userId }: MyFilesSectionProps) {
    const [files, setFiles] = useState<FileDocument[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToFiles(userId, (updatedFiles) => {
            setFiles(updatedFiles);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            await uploadFile(userId, file);
            e.target.value = ""; // Reset input
        } catch (error: any) {
            alert(error.message || "Failed to upload file");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (fileId: string, storagePath: string) => {
        if (!confirm("Are you sure you want to delete this file?")) return;

        try {
            await deleteFile(userId, fileId, storagePath);
        } catch (error) {
            alert("Failed to delete file");
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
        return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith("image/")) return ImageIcon;
        return FileText;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-[#A855F7]" size={32} />
            </div>
        );
    }

    return (
        <div>
            {/* Upload Section */}
            <div className="mb-8">
                <label className="
                    flex flex-col items-center justify-center
                    w-full h-48 border-2 border-dashed border-white/20
                    rounded-2xl cursor-pointer
                    bg-white/5 hover:bg-white/10 hover:border-[#A855F7]/50
                    transition-all
                ">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploading ? (
                            <>
                                <Loader2 className="animate-spin text-[#A855F7] mb-4" size={40} />
                                <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Uploading...</p>
                            </>
                        ) : (
                            <>
                                <Upload className="text-[#A855F7] mb-4" size={40} />
                                <p className="text-sm text-white font-bold uppercase tracking-wider mb-2">
                                    Click to upload
                                </p>
                                <p className="text-xs text-gray-500 font-medium">
                                    Max file size: 10MB
                                </p>
                            </>
                        )}
                    </div>
                    <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploading}
                    />
                </label>
            </div>

            {/* Files List */}
            {files.length === 0 ? (
                <div className="text-center py-20">
                    <File className="mx-auto text-gray-600 mb-4" size={48} />
                    <p className="text-gray-500 font-bold uppercase tracking-wider">No files yet</p>
                    <p className="text-gray-600 text-sm mt-2">Upload your first file to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {files.map((file, index) => {
                        const FileIcon = getFileIcon(file.type);
                        return (
                            <motion.div
                                key={file.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="
                                    bg-white/5 border border-white/10 rounded-xl p-4
                                    hover:bg-white/10 hover:border-[#A855F7]/50
                                    transition-all group
                                "
                            >
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-[#A855F7]/20 rounded-lg">
                                        <FileIcon className="text-[#A855F7]" size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-bold text-sm truncate">
                                            {file.name}
                                        </h3>
                                        <p className="text-gray-500 text-xs mt-1">
                                            {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <a
                                        href={file.url}
                                        download={file.name}
                                        className="
                                            flex-1 flex items-center justify-center gap-2
                                            py-2 px-3 bg-[#A855F7]/20 hover:bg-[#A855F7]/30
                                            border border-[#A855F7]/30 rounded-lg
                                            text-[#A855F7] text-xs font-bold uppercase tracking-wider
                                            transition-all
                                        "
                                    >
                                        <Download size={14} />
                                        Download
                                    </a>
                                    <button
                                        onClick={() => handleDelete(file.id, file.storagePath)}
                                        className="
                                            p-2 bg-red-500/20 hover:bg-red-500/30
                                            border border-red-500/30 rounded-lg
                                            text-red-500 transition-all
                                        "
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
