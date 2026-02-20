"use client";

import { useCart } from "@/context/cart-context";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { handleCheckout } from "./CheckoutHandler";
import { formatCurrency } from "@/utils/format";

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function CartPanel() {
    const { cart, isCartOpen, setIsCartOpen, removeItem, updateQuantity, totalPrice, addItem } = useCart();
    const [isLoading, setIsLoading] = useState(false);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => setIsScriptLoaded(true);
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    const onCheckout = async () => {
        if (!isScriptLoaded) {
            alert("Payment SDK is loading, please try again in a moment.");
            return;
        }

        setIsLoading(true);
        try {
            const orderData = await handleCheckout(totalPrice);

            if (orderData.demoMode) {
                console.warn("🎮 Payments in Demo Mode - Auto-confirming");
                alert("Demo Mode: Simulating Payment Process...");
                setTimeout(() => {
                    alert("Order Placed Successfully (Demo)!");
                    setIsCartOpen(false);
                }, 1000);
                return;
            }

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Console Zone",
                description: "Gaming Gear Order",
                order_id: orderData.id,
                handler: function (response: any) {
                    console.log("Payment Success:", response);
                    alert("Payment Successful! Order ID: " + response.razorpay_order_id);
                    setIsCartOpen(false);
                },
                prefill: {
                    name: "Customer",
                    email: "customer@consolezone.com",
                },
                theme: {
                    color: "#A855F7",
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error: any) {
            console.error("Checkout error:", error);
            if (error?.message?.includes("Invalid Razorpay Credentials")) {
                alert("⚠️ Razorpay Setup Pending: Proceeding in Demo Mode...");
                setTimeout(() => {
                    alert("Order Placed Successfully (Demo Fallback)!");
                    setIsCartOpen(false);
                }, 1000);
            } else {
                alert("Failed to initialize checkout. Please check console.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isCartOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsCartOpen(false)}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Cart Drawer - Clean Modern Style */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="relative w-full max-w-md h-full flex flex-col bg-[#0a0a0a] shadow-2xl border-l border-white/5"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 bg-[#050505]">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-[#A855F7]/20 flex items-center justify-center text-[#A855F7]">
                                        <ShoppingBag size={20} />
                                    </div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-tighter">Your <span className="text-[#A855F7]">Inventory</span></h2>
                                </div>
                                <button
                                    onClick={() => setIsCartOpen(false)}
                                    className="p-2 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-lg"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Free Delivery Tracker - GAMENATION STYLE */}
                            {cart.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                        <span className={totalPrice >= 1000 ? "text-[#39ff14]" : "text-gray-400"}>
                                            {totalPrice >= 1000 ? "FREE DELIVERY UNLOCKED" : `ADD ${formatCurrency(1000 - totalPrice)} FOR FREE DELIVERY`}
                                        </span>
                                        <span className="text-white">{Math.min(100, Math.floor((totalPrice / 1000) * 100))}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, (totalPrice / 1000) * 100)}%` }}
                                            className={`h-full transition-all duration-500 ${totalPrice >= 1000 ? "bg-[#39ff14] shadow-[0_0_10px_#39ff14]" : "bg-[#A855F7]"}`}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Items List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            <AnimatePresence mode="popLayout">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                        <ShoppingBag size={64} className="text-gray-600 mb-4" />
                                        <p className="text-gray-400 text-lg font-medium">Your cart is empty</p>
                                        <p className="text-gray-600 text-sm mt-1">Add some awesome gear to get started.</p>
                                    </div>
                                ) : (
                                    cart.map((item) => (
                                        <motion.div
                                            layout
                                            key={item.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="flex gap-4 bg-[#0a0a0a] rounded-xl p-3 border border-white/5 group"
                                        >
                                            <div className="w-20 h-20 bg-white/5 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-full h-full object-contain p-2"
                                                />
                                            </div>
                                            <div className="flex-1 flex flex-col justify-between">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="text-white font-semibold text-sm line-clamp-2 pr-2">
                                                        {item.name}
                                                    </h3>
                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="text-gray-500 hover:text-red-400 transition-colors p-1 -mt-1 -mr-1"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                                                        <span className="font-medium">Qty:</span>
                                                        <span className="text-white font-bold">{item.quantity}</span>
                                                    </div>
                                                    <span className="text-white font-bold text-sm">
                                                        {formatCurrency(item.price * item.quantity)}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        {cart.length > 0 && (
                            <div className="p-6 bg-[#050505] border-t border-white/10 space-y-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                                <div className="space-y-2 pb-4 border-b border-white/5 text-sm">
                                    <div className="flex justify-between items-center text-gray-400">
                                        <span className="font-medium">Order Subtotal</span>
                                        <span className="text-white">{formatCurrency(totalPrice)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-400">
                                        <span className="font-medium">Delivery Charges</span>
                                        <span className={totalPrice >= 1000 ? "text-[#39ff14] font-bold" : "text-white"}>
                                            {totalPrice >= 1000 ? "FREE" : formatCurrency(350)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="text-[#A855F7] font-black text-[10px] uppercase tracking-widest">Gamer Savings</span>
                                        <span className="text-[#39ff14] font-bold text-[10px]">-{formatCurrency(450)}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className="text-gray-400 text-xs font-bold uppercase tracking-widest block">Final Amount</span>
                                        <span className="text-2xl font-black text-white font-display">
                                            {formatCurrency(totalPrice >= 1000 ? totalPrice : totalPrice + 350)}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-500 font-bold italic">Inclusive of all taxes</p>
                                    </div>
                                </div>

                                <button
                                    onClick={onCheckout}
                                    disabled={isLoading}
                                    className="w-full relative group overflow-hidden bg-[#A855F7] text-white font-black uppercase tracking-[0.2em] py-5 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    {isLoading ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            DEPLOYING...
                                        </>
                                    ) : (
                                        <>
                                            INITIATE CHECKOUT <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
