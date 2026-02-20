"use client";

import { useState } from "react";
import { MoreVertical, Check, Wrench, Copy, Trash2, Activity } from "lucide-react";
import { Device } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

interface QuickActionsMenuProps {
    device: Device;
    onStatusChange: (deviceId: string, newStatus: Device['status']) => Promise<void>;
    onEdit: (device: Device) => void;
    onViewHistory: (device: Device) => void;
    onDuplicate?: (device: Device) => void;
    onDelete?: (deviceId: string) => void;
}

export function QuickActionsMenu({
    device,
    onStatusChange,
    onEdit,
    onViewHistory,
    onDuplicate,
    onDelete
}: QuickActionsMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isChangingStatus, setIsChangingStatus] = useState(false);

    const handleStatusChange = async (newStatus: Device['status']) => {
        setIsChangingStatus(true);
        try {
            await onStatusChange(device.id, newStatus);
            setIsOpen(false);
        } finally {
            setIsChangingStatus(false);
        }
    };

    const statusOptions: Device['status'][] = ['Ready', 'Rented', 'Maintenance', 'Under-Repair'];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                title="Quick Actions"
            >
                <MoreVertical size={16} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Menu */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-0 top-full mt-2 w-56 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                        >
                            {/* Status Change Section */}
                            <div className="p-2 border-b border-white/5">
                                <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 px-2 py-1">
                                    Change Status
                                </div>
                                {statusOptions.map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => handleStatusChange(status)}
                                        disabled={isChangingStatus || device.status === status}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${device.status === status
                                                ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] cursor-default'
                                                : 'hover:bg-white/5 text-gray-300 hover:text-white'
                                            } ${isChangingStatus ? 'opacity-50' : ''}`}
                                    >
                                        <span className="font-medium">{status}</span>
                                        {device.status === status && <Check size={14} className="text-[#8B5CF6]" />}
                                    </button>
                                ))}
                            </div>

                            {/* Quick Actions */}
                            <div className="p-2">
                                <button
                                    onClick={() => { onEdit(device); setIsOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-all"
                                >
                                    <Wrench size={14} />
                                    <span className="font-medium">Edit Details</span>
                                </button>

                                <button
                                    onClick={() => { onViewHistory(device); setIsOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-all"
                                >
                                    <Activity size={14} />
                                    <span className="font-medium">View History</span>
                                </button>

                                {onDuplicate && (
                                    <button
                                        onClick={() => { onDuplicate(device); setIsOpen(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-all"
                                    >
                                        <Copy size={14} />
                                        <span className="font-medium">Duplicate Unit</span>
                                    </button>
                                )}
                            </div>

                            {/* Danger Zone */}
                            {onDelete && (
                                <div className="p-2 border-t border-white/5">
                                    <button
                                        onClick={() => { onDelete(device.id); setIsOpen(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
                                    >
                                        <Trash2 size={14} />
                                        <span className="font-medium">Retire Unit</span>
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
