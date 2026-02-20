"use client";

import { useState } from "react";
import { X, Plus, Trash2, Save, Calculator } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Item {
    name: string;
    quantity: number;
    price: number;
}

interface CreateInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (invoice: any) => void;
}

export default function CreateInvoiceModal({ isOpen, onClose, onSave }: CreateInvoiceModalProps) {
    const [invoiceNumber, setInvoiceNumber] = useState(`CZ-${Math.floor(Date.now() / 1000).toString().slice(-6)}`);
    const [dueDate, setDueDate] = useState("");
    const [referenceId, setReferenceId] = useState("");
    const [discountValue, setDiscountValue] = useState(0);
    const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENT'>('FIXED');
    const [paymentMethod, setPaymentMethod] = useState('UPI');
    const [customerNotes, setCustomerNotes] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [type, setType] = useState<'RENTAL' | 'SALE' | 'BUYBACK'>('RENTAL');
    const [status, setStatus] = useState('Pending');
    const [items, setItems] = useState<Item[]>([{ name: "", quantity: 1, price: 0 }]);
    const [gstRate, setGstRate] = useState(18); // Default 18% GST

    const addItem = () => setItems([...items, { name: "", quantity: 1, price: 0 }]);
    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

    const updateItem = (index: number, field: keyof Item, value: any) => {
        const next = [...items];
        next[index] = { ...next[index], [field]: value };
        setItems(next);
    };

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const calculatedDiscount = discountType === 'PERCENT' ? (subtotal * discountValue) / 100 : discountValue;
    const taxableAmount = Math.max(0, subtotal - calculatedDiscount);
    const gstAmount = (taxableAmount * gstRate) / 100;
    const total = taxableAmount + gstAmount;

    const handleSave = () => {
        if (!customerName || items.some(i => !i.name || i.price <= 0)) {
            alert("Please fill in all required fields.");
            return;
        }

        onSave({
            invoiceNumber,
            dueDate,
            referenceId,
            paymentMethod,
            customerNotes,
            customerName,
            customerEmail,
            type,
            status,
            amount: total,
            items: items.map(i => ({ ...i, price: Number(i.price) })),
            discount: {
                value: discountValue,
                type: discountType,
                amount: calculatedDiscount
            },
            gstDetails: {
                rate: gstRate,
                amount: gstAmount
            }
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <Plus className="text-[#8B5CF6]" />
                            <h2 className="text-xl font-black uppercase tracking-tighter">
                                ADVANCED <span className="text-[#8B5CF6]">Invoice Deployment</span>
                            </h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Serial #</span>
                                <span className="text-xs font-mono text-[#8B5CF6] font-bold">{invoiceNumber}</span>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors ml-4 border border-white/5">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 max-h-[75vh] overflow-y-auto custom-scrollbar space-y-8">
                        {/* ADVASD METADATA */}
                        <div className="grid grid-cols-4 gap-4 pb-6 border-b border-white/5">
                            <div className="space-y-1.5">
                                <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest px-1">Internal Reference ID</label>
                                <input
                                    type="text"
                                    value={referenceId}
                                    onChange={(e) => setReferenceId(e.target.value)}
                                    placeholder="REF-00X"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-[#8B5CF6] outline-none transition-all font-mono"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest px-1">Mission Due Date</label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-[#8B5CF6] outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest px-1">Deployment Type</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as any)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#8B5CF6]"
                                >
                                    <option value="RENTAL" className="bg-[#0a0a0a] text-white">Rental Deployment</option>
                                    <option value="SALE" className="bg-[#0a0a0a] text-white">Direct Purchase</option>
                                    <option value="BUYBACK" className="bg-[#0a0a0a] text-white">Buyback / Trade-In</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest px-1">Payment Method</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#8B5CF6]"
                                >
                                    <option value="UPI" className="bg-[#0a0a0a] text-white">UPI Sync</option>
                                    <option value="CASH" className="bg-[#0a0a0a] text-white">Cash Liquid</option>
                                    <option value="CARD" className="bg-[#0a0a0a] text-white">Credit/Debit Card</option>
                                    <option value="BANK" className="bg-[#0a0a0a] text-white">Bank Transfer</option>
                                </select>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-1">Customer Name</label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Enter full name"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#8B5CF6] outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-1">Customer Email</label>
                                <input
                                    type="email"
                                    value={customerEmail}
                                    onChange={(e) => setCustomerEmail(e.target.value)}
                                    placeholder="email@example.com"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#8B5CF6] outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Invoice Config */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-1">Type</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as any)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"
                                >
                                    <option value="RENTAL" className="bg-[#0a0a0a] text-white">Rental</option>
                                    <option value="SALE" className="bg-[#0a0a0a] text-white">Sale</option>
                                    <option value="BUYBACK" className="bg-[#0a0a0a] text-white">Buyback</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-1">Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"
                                >
                                    <option value="Pending" className="bg-[#0a0a0a] text-white">Pending</option>
                                    <option value="Paid" className="bg-[#0a0a0a] text-white">Paid</option>
                                    <option value="Unpaid" className="bg-[#0a0a0a] text-white">Unpaid</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-1">GST Rate (%)</label>
                                <select
                                    value={gstRate}
                                    onChange={(e) => setGstRate(Number(e.target.value))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"
                                >
                                    <option value={0} className="bg-[#0a0a0a] text-white">No GST (0%)</option>
                                    <option value={5} className="bg-[#0a0a0a] text-white">5%</option>
                                    <option value={12} className="bg-[#0a0a0a] text-white">12%</option>
                                    <option value={18} className="bg-[#0a0a0a] text-white">18%</option>
                                    <option value={28} className="bg-[#0a0a0a] text-white">28%</option>
                                </select>
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black uppercase tracking-widest text-[#8B5CF6]">Mission Payload (Line Items)</h3>
                                <button onClick={addItem} className="text-[10px] flex items-center gap-1.5 bg-[#8B5CF6]/10 text-[#8B5CF6] px-3 py-1.5 rounded-full font-black hover:bg-[#8B5CF6] hover:text-white transition-all border border-[#8B5CF6]/20">
                                    <Plus size={12} /> ADD ITEM
                                </button>
                            </div>

                            <div className="space-y-3">
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex gap-3 items-end group bg-white/[0.02] p-3 rounded-2xl border border-white/5">
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[8px] text-gray-600 font-bold uppercase tracking-[0.2em] px-1">Description</label>
                                            <input
                                                type="text"
                                                placeholder="Deployment item description"
                                                value={item.name}
                                                onChange={(e) => updateItem(idx, 'name', e.target.value)}
                                                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#8B5CF6]/50 outline-none"
                                            />
                                        </div>
                                        <div className="w-20 space-y-1">
                                            <label className="text-[8px] text-gray-600 font-bold uppercase tracking-[0.2em] px-1 text-center block">Qty</label>
                                            <input
                                                type="number"
                                                placeholder="1"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                                                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white text-center focus:border-[#8B5CF6]/50 outline-none"
                                            />
                                        </div>
                                        <div className="w-32 space-y-1">
                                            <label className="text-[8px] text-gray-600 font-bold uppercase tracking-[0.2em] px-1 text-right block">Unit Price</label>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                value={item.price}
                                                onChange={(e) => updateItem(idx, 'price', Number(e.target.value))}
                                                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white text-right focus:border-[#8B5CF6]/50 outline-none font-mono"
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeItem(idx)}
                                            className="p-3 bg-red-500/5 text-red-500/40 rounded-xl hover:bg-red-500 hover:text-white transition-all mb-0.5"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ADVANCED OVERRIDES */}
                        <div className="grid grid-cols-2 gap-8 pt-6 border-t border-white/5">
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#8B5CF6]">Global Overrides</h3>
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-1.5">
                                        <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest px-1">Discount Value</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={discountValue}
                                                onChange={(e) => setDiscountValue(Number(e.target.value))}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-[#8B5CF6] outline-none transition-all font-mono"
                                            />
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                                                <button
                                                    onClick={() => setDiscountType('FIXED')}
                                                    className={`px-2 py-1 rounded text-[8px] font-bold ${discountType === 'FIXED' ? 'bg-[#8B5CF6] text-white' : 'text-gray-500 hover:text-white'}`}
                                                >₹</button>
                                                <button
                                                    onClick={() => setDiscountType('PERCENT')}
                                                    className={`px-2 py-1 rounded text-[8px] font-bold ${discountType === 'PERCENT' ? 'bg-[#8B5CF6] text-white' : 'text-gray-500 hover:text-white'}`}
                                                >%</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest px-1">GST Configuration</label>
                                        <select
                                            value={gstRate}
                                            onChange={(e) => setGstRate(Number(e.target.value))}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#8B5CF6]"
                                        >
                                            <option value={0} className="bg-[#0a0a0a] text-white">Exempt (0%)</option>
                                            <option value={5} className="bg-[#0a0a0a] text-white">Lesser (5%)</option>
                                            <option value={12} className="bg-[#0a0a0a] text-white">Standard (12%)</option>
                                            <option value={18} className="bg-[#0a0a0a] text-white">Enterprise (18%)</option>
                                            <option value={28} className="bg-[#0a0a0a] text-white">Luxury (28%)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#8B5CF6]">Notes for Customer</h3>
                                <textarea
                                    value={customerNotes}
                                    onChange={(e) => setCustomerNotes(e.target.value)}
                                    placeholder="Enter additional terms, warranty info, or mission notes..."
                                    className="w-full h-[85px] bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-[#8B5CF6] outline-none transition-all resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Summary & Actions */}
                    <div className="p-6 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                                <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Subtotal</span>
                                <span className="text-xs font-mono font-bold">₹{subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col border-l border-white/10 pl-6">
                                <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Discount {discountType === 'PERCENT' ? `(${discountValue}%)` : ''}</span>
                                <span className="text-xs font-mono font-bold text-emerald-500">-₹{calculatedDiscount.toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col border-l border-white/10 pl-6">
                                <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Taxable ({gstRate}%)</span>
                                <span className="text-xs font-mono font-bold text-gray-400">₹{gstAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col border-l border-white/10 pl-6 pr-8">
                                <span className="text-[9px] text-[#8B5CF6] font-black uppercase tracking-widest mb-0.5 animate-pulse">Grand Total Sync</span>
                                <span className="text-2xl font-black italic tracking-tighter text-white">₹{total.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={onClose} className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-colors border border-transparent hover:border-white/10">
                                Abort
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-10 py-3 bg-[#8B5CF6] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#7C3AED] transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center gap-3 active:scale-95 group"
                            >
                                <Save size={16} className="group-hover:rotate-12 transition-transform" />
                                DEPLOY INVOICE
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
