"use client";

import { useState } from "react";
import { X, Calendar, AlertTriangle, CheckCircle, Calculator } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface ReturnModalProps {
    rental: any;
    onClose: () => void;
    onConfirm: (data: { damageCharges: number; lateFees: number; notes: string }) => void;
}

export function ReturnModal({ rental, onClose, onConfirm }: ReturnModalProps) {
    const today = new Date();
    const dueDate = new Date(rental.end_date);
    const daysOverdue = Math.max(0, differenceInDays(today, dueDate));

    const [damageCharges, setDamageCharges] = useState(0);
    const [lateFees, setLateFees] = useState(daysOverdue * 100); // 100 per day default
    const [notes, setNotes] = useState("");

    const totalToPay = damageCharges + lateFees;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-[#06B6D4]/10 to-transparent">
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Process Return</h3>
                        <p className="text-gray-500 text-xs font-mono">ID: {rental.id.slice(0, 8)}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Rental Info Snapshot */}
                    <div className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                        <img src={rental.product?.images?.[0]} className="w-16 h-16 rounded-lg object-cover" />
                        <div>
                            <h4 className="text-white font-bold text-sm">{rental.product?.name}</h4>
                            <p className="text-gray-500 text-xs">Rented by: {rental.user?.full_name}</p>
                            <div className={`mt-2 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${daysOverdue > 0 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                {daysOverdue > 0 ? <AlertTriangle size={10} /> : <CheckCircle size={10} />}
                                {daysOverdue > 0 ? `${daysOverdue} Days Overdue` : 'On Time'}
                            </div>
                        </div>
                    </div>

                    {/* Financials Logic */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Late Fees</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                    <input
                                        type="number"
                                        value={lateFees}
                                        onChange={(e) => setLateFees(Number(e.target.value))}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-7 pr-4 text-white outline-none focus:border-[#06B6D4]"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Damage Charges</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                    <input
                                        type="number"
                                        value={damageCharges}
                                        onChange={(e) => setDamageCharges(Number(e.target.value))}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-7 pr-4 text-white outline-none focus:border-[#EF4444]"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Notes / Damage Details</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any issues or damage found during check?"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-white/20 h-24 text-sm resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer / Action */}
                <div className="p-6 bg-white/5 border-t border-white/10 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-gray-400">
                            <Calculator size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Additional Total</span>
                        </div>
                        <span className="text-2xl font-black text-white">₹{totalToPay}</span>
                    </div>

                    <button
                        onClick={() => onConfirm({ damageCharges, lateFees, notes })}
                        className="w-full bg-[#06B6D4] text-black font-black py-4 rounded-xl hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all uppercase tracking-widest text-sm"
                    >
                        Mark as Returned & Release Stock
                    </button>
                </div>
            </div>
        </div>
    );
}
