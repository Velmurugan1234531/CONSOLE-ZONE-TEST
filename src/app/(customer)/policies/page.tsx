"use client";

import { motion } from "framer-motion";
import { ShieldCheck, RefreshCcw, Truck, FileText, CheckCircle2, AlertCircle } from "lucide-react";

const policies = [
    {
        title: "Return Policy",
        icon: <RefreshCcw className="text-[#A855F7]" size={24} />,
        bg: "bg-purple-500/5",
        border: "border-purple-500/20",
        points: [
            "Pre-owned Games: 7-day functionality return policy from date of delivery.",
            "Items must have our official 'Console Zone' logo stamp/sticker intact.",
            "Returns not accepted if the disk stamp is tampered with or heavily scratched.",
            "New products are non-returnable once the manufacturer seal is broken."
        ]
    },
    {
        title: "Warranty Policy",
        icon: <ShieldCheck className="text-cyan-500" size={24} />,
        bg: "bg-cyan-500/5",
        border: "border-cyan-500/20",
        points: [
            "Pre-owned Consoles & Accessories: 1-month (30 days) comprehensive warranty.",
            "New Products: Covered by official manufacturer warranty as per brand terms.",
            "Warranty covers functional defects only; physical damage voids all claims.",
            "Verified claims will receive a replacement; refund only if stock is unavailable."
        ]
    },
    {
        title: "Refund Policy",
        icon: <FileText className="text-pink-500" size={24} />,
        bg: "bg-pink-500/5",
        border: "border-pink-500/20",
        points: [
            "Refunds processed to original payment method (Bank/UPI/Wallet).",
            "Cancellations before dispatch: Refund processed within 48 hours.",
            "Prepaid cancellations (Razorpay) incur a 3% processing fee unless site error.",
            "Estimated credit time: 7-10 working days as per bank norms."
        ]
    },
    {
        title: "Shipping & Pickup",
        icon: <Truck className="text-green-500" size={24} />,
        bg: "bg-green-500/5",
        border: "border-green-500/20",
        points: [
            "Free doorstep pickup for Sell/Trade-in requests across India.",
            "Buyer shipping: Flat rates based on order value (Free above ₹2000).",
            "Deliveries typically take 3-5 business days for Metro cities.",
            "Verification for trade-in payouts takes 24 hours post-pickup."
        ]
    }
];

export default function PoliciesPage() {
    return (
        <div className="min-h-screen bg-[#050505] pt-32 pb-20 px-4">
            <div className="max-w-4xl mx-auto space-y-16">
                {/* Header */}
                <div className="text-center space-y-4">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter"
                    >
                        Policies & <span className="text-[#A855F7]">Trust</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-500 max-w-xl mx-auto"
                    >
                        Transparent terms to ensure a premium and safe gaming experience for every member of our community.
                    </motion.p>
                </div>

                {/* Policy Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {policies.map((policy, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`p-8 rounded-2xl border ${policy.border} ${policy.bg} space-y-6 relative overflow-hidden group`}
                        >
                            <div className="flex items-center gap-4">
                                {policy.icon}
                                <h3 className="text-xl font-bold text-white uppercase tracking-tighter">{policy.title}</h3>
                            </div>
                            <ul className="space-y-4">
                                {policy.points.map((point, pIdx) => (
                                    <li key={pIdx} className="flex items-start gap-3 text-sm text-gray-400">
                                        <CheckCircle2 size={16} className="text-[#A855F7] shrink-0 mt-0.5" />
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                {policy.icon}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Important Notice */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="bg-[#A855F7]/10 border border-[#A855F7]/20 p-8 rounded-3xl flex flex-col md:flex-row items-center gap-8"
                >
                    <div className="bg-white/10 p-4 rounded-2xl">
                        <AlertCircle className="text-[#A855F7]" size={32} />
                    </div>
                    <div className="space-y-2 text-center md:text-left">
                        <h4 className="text-white font-bold uppercase tracking-widest text-sm">Need Clarification?</h4>
                        <p className="text-gray-500 text-sm">For specific inquiries regarding a current order or trade-in, reach out to our WhatsApp support at +91 97898 82979.</p>
                    </div>
                    <button className="bg-[#A855F7] hover:bg-white hover:text-black text-white px-8 py-3 rounded-full font-bold transition-all ml-auto">
                        CONTACT SUPPORT
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
