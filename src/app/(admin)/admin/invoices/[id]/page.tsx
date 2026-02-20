"use client";

import { useEffect, useState } from "react";
import { getTransactionById, Transaction } from "@/services/admin";
import { format } from "date-fns";
import { Loader2, Printer, ArrowLeft, Download, Share2, Building2, Globe, Mail, Phone } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

export default function InvoicePrintPage() {
    const { id } = useParams();
    const router = useRouter();
    const [invoice, setInvoice] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchInvoice() {
            if (!id) return;
            try {
                const data = await getTransactionById(id as string);
                setInvoice(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchInvoice();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#8B5CF6]" size={48} />
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
                <h1 className="text-2xl font-bold mb-4">Invoice Not Found</h1>
                <button onClick={() => router.back()} className="text-gray-400 hover:text-white underline">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#1a1a1a] text-black font-sans p-8 md:p-12 print:p-0 print:bg-white flex justify-center">

            {/* Print Controls (Hidden when printing via CSS 'print:hidden') */}
            <div className="fixed top-0 left-0 right-0 p-4 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/10 flex justify-between items-center z-50 print:hidden shadow-xl">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white font-bold transition-colors">
                        <ArrowLeft size={18} /> Back
                    </button>
                    <span className="text-gray-600">|</span>
                    <span className="text-white font-mono text-sm">INVOICE #{invoice.id.slice(0, 8).toUpperCase()}</span>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => window.print()}
                        className="bg-white text-black px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-sm hover:bg-gray-200 transition-colors"
                    >
                        <Printer size={16} /> Print / Save PDF
                    </button>
                    <button className="bg-[#06B6D4] text-black px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-sm hover:bg-[#06B6D4]/80 transition-colors">
                        <Share2 size={16} /> Email
                    </button>
                </div>
            </div>

            {/* A4 Sheet Container */}
            <div className="w-[210mm] min-h-[297mm] bg-white shadow-2xl print:shadow-none print:w-full print:absolute print:top-0 print:left-0 p-12 relative mt-16 print:mt-0 mx-auto">

                {/* Brand Header */}
                <div className="flex justify-between items-start border-b-2 border-black pb-8 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-black text-white flex items-center justify-center rounded-xl">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none"><span className="text-black">Console</span> <span className="text-[#A855F7]">Zone</span></h1>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Premium Gaming Rentals</p>
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <h2 className="text-4xl font-black text-gray-200 uppercase tracking-tighter">INVOICE</h2>
                        <p className="font-mono font-bold mt-1 text-sm bg-black text-white px-3 py-0.5 rounded-full">#{invoice.id.slice(0, 8).toUpperCase()}</p>

                        {/* Dynamic Status Stamp */}
                        <div className="mt-4 relative scale-75 origin-right">
                            <div className={`px-8 py-2 border-4 rounded-xl font-black text-3xl uppercase tracking-tighter transform -rotate-12 ${invoice.status === 'Paid' || invoice.status === 'Completed' || invoice.status === 'Verified'
                                    ? 'border-emerald-500 text-emerald-500'
                                    : 'border-amber-500 text-amber-500'
                                }`}>
                                {invoice.type === 'BUYBACK' ? 'PAYOUT' : 'PAID'}
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-center mt-1 text-gray-400">
                                Authenticated by Console Zone
                            </div>
                        </div>
                    </div>
                </div>

                {/* Company & Client Grid */}
                <div className="grid grid-cols-2 gap-12 mb-12">
                    <div className="space-y-4">
                        <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-100 pb-1 w-fit">From</div>
                        <div>
                            <p className="font-bold text-lg"><span className="text-black">Console</span> <span className="text-[#A855F7]">Zone</span> India Pvt Ltd</p>
                            <div className="text-gray-600 text-sm space-y-1 mt-2">
                                <p className="flex items-center gap-2"><Building2 size={14} className="text-black" /> 123, Tech Plaza, Anna Nagar</p>
                                <p className="pl-6">Chennai, Tamil Nadu - 600040</p>
                                <p className="flex items-center gap-2"><Mail size={14} className="text-black" /> billing@consolezone.in</p>
                                <p className="flex items-center gap-2"><Phone size={14} className="text-black" /> +91 98765 43210</p>
                                <p className="flex items-center gap-2"><Globe size={14} className="text-black" /> consolezone.in</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                            <span className="font-bold text-black">GSTIN:</span> 33AAAAA0000A1Z5
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-100 pb-1 w-fit">Bill To</div>
                        <div>
                            <p className="font-bold text-lg">{invoice.customerName}</p>
                            <div className="text-gray-600 text-sm space-y-1 mt-2">
                                <p>{invoice.customerEmail}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-6 bg-gray-50 p-4 rounded-lg">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Issue Date</p>
                                <p className="font-bold">{format(new Date(invoice.date), 'dd MMM yyyy')}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Total Amount</p>
                                <p className="font-bold">₹{invoice.amount.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-8">
                    <thead className="bg-[#0a0a0a] text-white">
                        <tr>
                            <th className="p-4 text-left text-xs font-black uppercase tracking-wider rounded-l-lg">Mission Item / Description</th>
                            <th className="p-4 text-center text-xs font-black uppercase tracking-wider">Qty</th>
                            <th className="p-4 text-right text-xs font-black uppercase tracking-wider">Unit Rate</th>
                            <th className="p-4 text-right text-xs font-black uppercase tracking-wider rounded-r-lg">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {invoice.items.map((item, i) => (
                            <tr key={i} className="border-b border-gray-50">
                                <td className="p-5">
                                    <p className="font-black text-sm text-gray-900 uppercase tracking-tight">{item.name}</p>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                                        Asset Node: {invoice.type}/{invoice.id.slice(0, 4)}
                                    </p>
                                </td>
                                <td className="p-5 text-center text-sm font-mono font-bold text-gray-600">x{item.quantity}</td>
                                <td className="p-5 text-right text-sm font-mono font-bold text-gray-600">₹{item.price.toLocaleString()}</td>
                                <td className="p-5 text-right text-sm font-mono font-black text-black">₹{(item.price * item.quantity).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Financials & Footer */}
                <div className="flex justify-end mb-20">
                    <div className="w-72 bg-gray-50 p-6 rounded-xl space-y-3">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Subtotal</span>
                            <span className="font-mono font-bold text-black">₹{Math.round(invoice.amount / 1.18).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>CGST (9%)</span>
                            <span className="font-mono font-bold text-black">₹{Math.round((invoice.amount / 1.18) * 0.09).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>SGST (9%)</span>
                            <span className="font-mono font-bold text-black">₹{Math.round((invoice.amount / 1.18) * 0.09).toLocaleString()}</span>
                        </div>
                        <div className="border-t border-gray-900 my-2"></div>
                        <div className="flex justify-between text-lg font-black text-black items-center">
                            <span>Total</span>
                            <span className="font-mono">₹{invoice.amount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Terms Footer */}
                <div className="absolute bottom-12 left-12 right-12 border-t-2 border-black pt-6 flex justify-between items-end">
                    <div className="text-xs text-gray-500 max-w-sm">
                        <p className="font-bold text-black mb-1 uppercase tracking-wider">Terms & Conditions</p>
                        <p>1. Prices are inclusive of all taxes.</p>
                        <p>2. Subject to Chennai Jurisdiction.</p>
                        <p>3. This is a computer-generated invoice, no signature required.</p>
                    </div>
                    <div className="text-right">
                        <div className="h-12 flex items-end justify-end mb-2">
                            <span className="font-notes font-bold text-2xl text-gray-300 transform -rotate-12 translate-y-2">Authorized</span>
                        </div>
                        <p className="text-xs font-bold text-black uppercase tracking-widest">Authorized Signatory</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
