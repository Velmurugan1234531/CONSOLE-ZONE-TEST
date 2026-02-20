"use client";

import { useState } from "react";
import { MoreVertical, CalendarPlus, Bell, FileText, Trash2, CheckSquare } from "lucide-react";
import { updateRentalStatus } from "@/services/admin";

interface ActionMenuProps {
    rentalId: string;
    currentStatus: string;
    onUpdate: () => void;
}

export function ActionMenu({ rentalId, currentStatus, onUpdate }: ActionMenuProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleAction = async (action: string) => {
        setIsOpen(false);
        if (action === 'return') {
            if (confirm("Confirm return?")) {
                await updateRentalStatus(rentalId, 'completed');
                onUpdate();
            }
        } else if (action === 'extend') {
            alert("Extension feature: Would update end_date +1 day in DB.");
        } else if (action === 'remind') {
            alert("Reminder sent: Queued email/SMS notification to user.");
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            >
                <MoreVertical size={16} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#0a0a0a] border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-1">
                        {currentStatus !== 'completed' && (
                            <>
                                <button onClick={() => handleAction('return')} className="w-full text-left px-3 py-2 text-xs font-bold text-green-500 hover:bg-green-500/10 rounded-lg flex items-center gap-2">
                                    <CheckSquare size={14} /> Mark Returned
                                </button>
                                <button onClick={() => handleAction('extend')} className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-white/10 rounded-lg flex items-center gap-2">
                                    <CalendarPlus size={14} /> Extend (+1 Day)
                                </button>
                                <button onClick={() => handleAction('remind')} className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-white/10 rounded-lg flex items-center gap-2">
                                    <Bell size={14} /> Send Reminder
                                </button>
                            </>
                        )}
                        <button className="w-full text-left px-3 py-2 text-xs font-bold text-gray-400 hover:bg-white/10 rounded-lg flex items-center gap-2">
                            <FileText size={14} /> Add Note
                        </button>
                        <hr className="border-white/10 my-1" />
                        <button className="w-full text-left px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-lg flex items-center gap-2">
                            <Trash2 size={14} /> Delete Record
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
