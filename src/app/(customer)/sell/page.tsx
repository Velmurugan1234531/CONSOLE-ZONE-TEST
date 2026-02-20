"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Tag,
    Truck,
    ShieldCheck,
    Search,
    Trash2,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    ChevronDown,
    Loader2,
    Package,
    MapPin,
    Wallet,
    CreditCard,
    Banknote,
    Smartphone,
    TrendingUp,
    Clock,
    Info
} from "lucide-react";
import { formatCurrency } from "@/utils/format";
import { usePageSEO } from "@/hooks/use-seo";
import { getProducts } from "@/services/products";
import { Product } from "@/types";
import { getAllSellPricing, calculateCreditPrice } from "@/services/sell-pricing";
import { createSellOrder } from "@/services/tradeins";

interface SellItem {
    id: string;
    name: string;
    category: string;
    basePrice: number;      // Cash price
    creditPrice: number;    // Credit price (15% higher)
    image: string;
    quantity: number;
}

const SUPPORTED_PINCODES = [600020, 560001, 400001, 110001, 700001, 500001]; // Dummy supported metros

import PageHero from "@/components/layout/PageHero";
import { VisualsService, VisualSettings } from "@/services/visuals";

export default function SellPage() {
    usePageSEO('sell');

    // State
    const [items, setItems] = useState<SellItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [visualSettings, setVisualSettings] = useState<VisualSettings | null>(null);

    const [sellCart, setSellCart] = useState<SellItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [pincode, setPincode] = useState("");
    const [isPincodeChecked, setIsPincodeChecked] = useState(false);
    const [isServiceable, setIsServiceable] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeFaq, setActiveFaq] = useState<number | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'info' }>({ show: false, message: '', type: 'success' });

    const showToast = (message: string, type: 'success' | 'info' = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    // New state for pricing mode and payment selection
    const [pricingMode, setPricingMode] = useState<'cash' | 'credits'>('credits'); // Default to credits (higher value)
    const [paymentMethod, setPaymentMethod] = useState<'credits' | 'upi' | 'imps' | 'paytm'>('credits');
    const [shippingMethod, setShippingMethod] = useState<'free_pickup' | 'self_ship'>('free_pickup');

    useEffect(() => {
        const loadVisuals = async () => {
            const settings = await VisualsService.getSettings();
            setVisualSettings(settings);
        };
        loadVisuals();
    }, []);

    const totalValue = sellCart.reduce((sum, item) => {
        const price = pricingMode === 'credits' ? item.creditPrice : item.basePrice;
        return sum + (price * item.quantity);
    }, 0);

    // Load Items from Backend
    useEffect(() => {
        const load = async () => {
            try {
                const products = await getProducts('trade-in');

                // Map Product to SellItem with both cash and credit pricing
                const mappedItems: SellItem[] = products.map(p => ({
                    id: p.id,
                    name: p.name,
                    category: p.category,
                    basePrice: p.price,
                    creditPrice: calculateCreditPrice(p.price), // 15% bonus
                    image: p.images?.[0] || (p as any).image || "/images/products/ps5.png",
                    quantity: 1
                }));

                setItems(mappedItems);
            } catch (error) {
                console.error("Failed to load sell items", error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const addToCart = (item: SellItem) => {
        setSellCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                showToast(`Increased quantity of ${item.name}`, 'info');
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            showToast(`Added ${item.name} to sell cart`);
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const removeFromCart = (id: string) => {
        setSellCart(prev => prev.filter(item => item.id !== id));
    };

    const updateQuantity = (id: string, delta: number) => {
        setSellCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const checkPincode = () => {
        const pin = parseInt(pincode);
        const serviceable = SUPPORTED_PINCODES.some(p => Math.floor(p / 1000) === Math.floor(pin / 1000));
        setIsServiceable(serviceable);
        setIsPincodeChecked(true);
    };


    const handleFinalSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Prepare sell order items
            const orderItems = sellCart.map(item => ({
                product_id: item.id,
                product_name: item.name,
                quantity: item.quantity,
                cash_price: item.basePrice,
                credit_price: item.creditPrice,
                image: item.image
            }));

            // Create sell order (using demo user for now)
            await createSellOrder(
                'demo-user-123',
                orderItems,
                paymentMethod,
                shippingMethod,
                pincode,
                { name: 'Demo User', address: 'Demo Address' }
            );

            setIsSubmitting(false);
            setIsSuccess(true);
        } catch (error) {
            console.error('Failed to create sell order:', error);
            alert('Failed to submit sell order. Please try again.');
            setIsSubmitting(false);
        }
    };

    const filteredItems = items.filter(item => {
        return item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category.toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#050505] text-white selection:bg-[#A855F7] selection:text-white pb-20">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md mx-auto bg-[#0A0A0A] border border-[#A855F7]/30 rounded-3xl p-8 text-center space-y-6 shadow-[0_0_50px_rgba(168,85,247,0.15)] mt-32"
                >
                    <div className="w-20 h-20 bg-[#A855F7]/20 rounded-full flex items-center justify-center mx-auto border border-[#A855F7]/30">
                        <CheckCircle2 size={40} className="text-[#A855F7]" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black uppercase italic">Pickup Scheduled!</h2>
                        <p className="text-gray-500 text-sm font-mono uppercase tracking-widest">Our agent will contact you within 24 hours for verification and payout initiation.</p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 bg-[#A855F7] text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-white hover:text-black transition-all"
                    >
                        DONE
                    </button>
                </motion.div>
            </div>
        );
    }


    return (
        <div className="min-h-screen relative bg-[#050505] text-white">
            <PageHero
                title={visualSettings?.pageContent?.sell_title || "CASH FOR CLUTTER"}
                subtitle={visualSettings?.pageContent?.sell_subtitle || "Get instant valuation for your pre-owned consoles and controllers."}
                images={visualSettings?.pageBackgrounds?.sell || []}
                height="100vh"
            />

            <div className="text-white pb-20">


                <div className="px-4 sm:px-6 lg:px-8 w-full max-w-none mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Side: Item Selection */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Search & Pincode Checker */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="text"
                                    placeholder="WHAT ARE YOU SELLING? (E.G. PS5, XBOX...)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold placeholder:text-gray-600 focus:outline-none focus:border-[#A855F7]/50 transition-all uppercase tracking-widest"
                                />
                            </div>
                            <div className="flex gap-2">
                                <div className="relative flex-grow">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        type="text"
                                        placeholder="ENTER PINCODE"
                                        maxLength={6}
                                        value={pincode}
                                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold placeholder:text-gray-600 focus:outline-none focus:border-[#A855F7]/50 transition-all uppercase tracking-widest"
                                    />
                                </div>
                                <button
                                    onClick={checkPincode}
                                    disabled={pincode.length !== 6}
                                    className="bg-white/5 hover:bg-[#A855F7] hover:text-white disabled:opacity-50 disabled:hover:bg-white/5 disabled:hover:text-gray-400 px-6 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
                                >
                                    Check
                                </button>
                            </div>
                        </div>

                        {/* Serviceability Status */}
                        <AnimatePresence>
                            {isPincodeChecked && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className={`rounded-2xl p-4 flex items-center gap-3 ${isServiceable ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}
                                >
                                    {isServiceable ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                                    <p className="text-sm font-bold uppercase tracking-wide">
                                        {isServiceable ? "Great news! We offer pickup in your area." : "Sorry! We aren't in this area yet."}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Pricing Mode Toggle */}
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <TrendingUp size={80} />
                            </div>
                            <div className="space-y-1 relative z-10">
                                <h3 className="text-xl font-black uppercase italic tracking-tighter">Choose Your <span className="text-[#A855F7]">Payout</span></h3>
                                <p className="text-gray-500 text-[10px] font-mono uppercase tracking-widest">Get 15% more value by choosing Store Credits</p>
                            </div>

                            <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 relative z-10">
                                <button
                                    onClick={() => {
                                        setPricingMode('cash');
                                        if (paymentMethod === 'credits') setPaymentMethod('upi');
                                    }}
                                    className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${pricingMode === 'cash' ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-gray-500 hover:text-white'}`}
                                >
                                    <Banknote size={16} />
                                    Cash
                                </button>
                                <button
                                    onClick={() => {
                                        setPricingMode('credits');
                                        setPaymentMethod('credits');
                                    }}
                                    className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${pricingMode === 'credits' ? 'bg-[#A855F7] text-white shadow-lg shadow-[#A855F7]/20' : 'text-gray-500 hover:text-white'}`}
                                >
                                    <Wallet size={16} />
                                    Credits
                                    <span className="bg-white/20 text-[8px] px-1.5 py-0.5 rounded-full">+15%</span>
                                </button>
                            </div>
                        </div>

                        {/* Results Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {loading ? (
                                <div className="col-span-full py-20 flex justify-center text-[#A855F7]"><Loader2 className="animate-spin" size={32} /></div>
                            ) : filteredItems.length === 0 ? (
                                <div className="col-span-full py-10 text-center text-gray-500 text-sm uppercase tracking-wide">
                                    No items found matching your search.
                                </div>
                            ) : (
                                filteredItems.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        layoutId={item.id}
                                        whileTap={{ scale: 0.95 }}
                                        className={`relative group bg-[#0A0A0A] border ${sellCart.find(i => i.id === item.id) ? 'border-[#A855F7] bg-[#A855F7]/5' : 'border-white/10 hover:border-white/20'} rounded-3xl p-4 flex items-center gap-4 cursor-pointer transition-all overflow-hidden`}
                                        onClick={() => addToCart(item)}
                                    >
                                        {/* Selection Indicator */}
                                        {sellCart.find(i => i.id === item.id) && (
                                            <div className="absolute top-4 right-4 text-[#A855F7]">
                                                <CheckCircle2 size={20} fill="currentColor" className="text-black" />
                                            </div>
                                        )}

                                        <div className="w-20 h-20 bg-[#121212] rounded-2xl flex items-center justify-center p-2 shrink-0">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-1">{item.category}</p>
                                            <h3 className="font-bold text-white uppercase tracking-tight truncate pr-8">{item.name}</h3>
                                            <p className="text-gray-400 text-xs mt-1">
                                                {pricingMode === 'credits' ? 'GET ' : 'UP TO '}
                                                <span className={`${pricingMode === 'credits' ? 'text-[#A855F7]' : 'text-white'} font-black`}>
                                                    {formatCurrency(pricingMode === 'credits' ? item.creditPrice : item.basePrice)}
                                                </span>
                                            </p>
                                        </div>

                                        {!sellCart.find(i => i.id === item.id) && (
                                            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[#A855F7] group-hover:bg-[#A855F7] group-hover:text-black transition-all">
                                                <Tag size={14} />
                                            </div>
                                        )}
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Side: Sell Cart */}
                    <div className="lg:col-span-4">
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 sticky top-24 space-y-6 shadow-2xl">
                            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2 italic">
                                    SELL <span className="text-[#A855F7]">CART</span>
                                    <span className="text-[10px] bg-[#A855F7]/20 px-2 py-0.5 rounded-full not-italic tracking-normal">{sellCart.length}</span>
                                </h2>
                                {sellCart.length > 0 && (
                                    <button onClick={() => setSellCart([])} className="text-gray-600 hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2 no-scrollbar">
                                {sellCart.length > 0 ? (
                                    sellCart.map(item => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5"
                                        >
                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/40 shrink-0">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[10px] font-bold text-white truncate uppercase">{item.name}</div>
                                                <div className="text-[9px] font-black text-[#A855F7]">
                                                    {formatCurrency((pricingMode === 'credits' ? item.creditPrice : item.basePrice) * item.quantity)}
                                                </div>
                                            </div>

                                            {/* Quantity Controls */}
                                            <div className="flex items-center gap-2 bg-black/40 rounded-lg p-1">
                                                <button
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                    className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-white transition-colors text-xs font-bold"
                                                >
                                                    -
                                                </button>
                                                <span className="text-[10px] font-bold w-4 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                    className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-white transition-colors text-xs font-bold"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <button onClick={() => removeFromCart(item.id)} className="text-gray-500 hover:text-red-500 transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 space-y-4">
                                        <Package size={40} className="mx-auto text-gray-700" />
                                        <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest">Cart is looking empty, gamer.</p>
                                    </div>
                                )}
                            </div>

                            {sellCart.length > 0 && (
                                <div className="space-y-6 pt-6 border-t border-white/5">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Estimated Value</div>
                                            <div className="text-3xl font-black italic text-[#A855F7] drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]">{formatCurrency(totalValue)}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[8px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded border border-green-500/20 font-black tracking-tighter uppercase">Instant Payout</div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-[9px] text-gray-500 font-bold uppercase">
                                            <ShieldCheck size={12} className="text-[#A855F7]" />
                                            Prices are subject to physical verification
                                        </div>

                                        {/* Shipping & Payment Selectors */}
                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Shipping Method</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={() => setShippingMethod('free_pickup')}
                                                        className={`p-3 rounded-xl border text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2 ${shippingMethod === 'free_pickup' ? 'border-[#A855F7] bg-[#A855F7]/10 text-white' : 'border-white/5 bg-white/5 text-gray-400 hover:border-white/20'}`}
                                                    >
                                                        <Truck size={14} /> Pickup
                                                    </button>
                                                    <button
                                                        onClick={() => setShippingMethod('self_ship')}
                                                        className={`p-3 rounded-xl border text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2 ${shippingMethod === 'self_ship' ? 'border-[#A855F7] bg-[#A855F7]/10 text-white' : 'border-white/5 bg-white/5 text-gray-400 hover:border-white/20'}`}
                                                    >
                                                        <Package size={14} /> Self Ship
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Payment Method</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {pricingMode === 'credits' ? (
                                                        <button
                                                            className="col-span-2 p-3 rounded-xl border border-[#A855F7] bg-[#A855F7]/10 text-white text-[10px] font-bold uppercase flex items-center justify-center gap-2 cursor-default"
                                                            disabled
                                                        >
                                                            <Wallet size={14} /> Store Credits (Instant)
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => setPaymentMethod('upi')}
                                                                className={`p-3 rounded-xl border text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2 ${paymentMethod === 'upi' ? 'border-[#A855F7] bg-[#A855F7]/10 text-white' : 'border-white/5 bg-white/5 text-gray-400 hover:border-white/20'}`}
                                                            >
                                                                <Smartphone size={14} /> UPI
                                                            </button>
                                                            <button
                                                                onClick={() => setPaymentMethod('imps')}
                                                                className={`p-3 rounded-xl border text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2 ${paymentMethod === 'imps' ? 'border-[#A855F7] bg-[#A855F7]/10 text-white' : 'border-white/5 bg-white/5 text-gray-400 hover:border-white/20'}`}
                                                            >
                                                                <CreditCard size={14} /> IMPS
                                                            </button>
                                                            <button
                                                                onClick={() => setPaymentMethod('paytm')}
                                                                className={`p-3 rounded-xl border text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2 ${paymentMethod === 'paytm' ? 'border-[#A855F7] bg-[#A855F7]/10 text-white' : 'border-white/5 bg-white/5 text-gray-400 hover:border-white/20'}`}
                                                            >
                                                                <Banknote size={14} /> Paytm
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleFinalSubmit}
                                            disabled={isSubmitting || !isServiceable}
                                            className="w-full py-4 bg-[#A855F7] hover:bg-[#9333EA] text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg shadow-[#A855F7]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? <><Loader2 className="animate-spin" size={18} /> INITIATING...</> : <>GET QUOTE & PICKUP <ChevronRight size={18} /></>}
                                        </button>
                                        {!isServiceable && isPincodeChecked && (
                                            <p className="text-[8px] text-red-500 text-center font-bold uppercase tracking-widest">Pickup not available for this Pincode</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Steps Section */}
                <section className="px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto mt-32 space-y-16">
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl font-black italic tracking-tighter uppercase">How Selling <span className="text-[#A855F7]">Works</span></h2>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">A 4-step mission to upgrade your setup</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { icon: <Search />, title: "Request Quote", desc: "Search for your device above and add it to your sell cart for an instant valuation." },
                            { icon: <Truck />, title: "Free Pickup", desc: "Choose a convenient time slot. Our agent will come to your doorstep for free." },
                            { icon: <ShieldCheck />, title: "Verification", desc: "Quick physical check to verify the condition and functionality of your gear." },
                            { icon: <Wallet />, title: "Instant Payout", desc: "Receive money instantly via UPI or get 15% extra as Store Credits." },
                        ].map((step, i) => (
                            <div key={i} className="bg-[#0A0A0A] p-8 rounded-3xl border border-white/5 space-y-4 hover:border-[#A855F7]/30 transition-all group relative">
                                <div className="absolute top-8 right-8 text-4xl font-black italic text-white/5 group-hover:text-[#A855F7]/10 transition-colors">0{i + 1}</div>
                                <div className="w-12 h-12 bg-[#A855F7]/10 rounded-2xl flex items-center justify-center border border-[#A855F7]/20 text-[#A855F7] group-hover:scale-110 transition-transform">
                                    {step.icon}
                                </div>
                                <h3 className="text-xl font-bold uppercase tracking-tight relative z-10">{step.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed relative z-10">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="px-4 sm:px-6 lg:px-8 w-full max-w-4xl mx-auto mt-32 mb-40 space-y-12">
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl font-black italic tracking-tighter uppercase">Intelligence <span className="text-[#A855F7]">Briefing</span></h2>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Everything you need to know about selling gear</p>
                    </div>

                    <div className="space-y-4">
                        {[
                            { q: "What products do you buy?", a: "We buy major gaming consoles (PS5, PS4, Xbox Series X/S, Nintendo Switch), popular games, and gaming accessories like controllers and headsets." },
                            { q: "How are the prices determined?", a: "Prices are based on current market value, demand, and the condition of the product. Store Credits always offer a 15% higher valuation than cash." },
                            { q: "What condition should my gear be in?", a: "We accept gear in varying conditions. However, the gear must be functional and not have significant physical damage unless specified during the quote process." },
                            { q: "How long does the payment take?", a: "Store Credits are issued instantly after verification. Cash payouts via UPI or IMPS typically take 24-48 hours after the product reaches our hub." },
                            { q: "What about pickup charges?", a: "Standard pickup is free for all supported metro areas. If your pincode is not serviceable, you can opt for self-shipping, and we'll reimburse shipping costs up to ₹300." },
                        ].map((faq, i) => (
                            <div key={i} className="border border-white/5 rounded-2xl overflow-hidden bg-[#0a0a0a] transition-all">
                                <button
                                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                                    className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
                                >
                                    <span className="font-bold text-gray-200 text-left uppercase tracking-tight text-sm">{faq.q}</span>
                                    <ChevronDown size={18} className={`text-gray-500 transition-transform duration-300 ${activeFaq === i ? 'rotate-180 text-[#A855F7]' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {activeFaq === i && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-6 pt-0 text-gray-500 text-xs leading-relaxed border-t border-white/5 italic">
                                                {faq.a}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Toast Notification */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100]"
                    >
                        <div className={`px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md flex items-center gap-3 ${toast.type === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-[#A855F7]/20 border-[#A855F7]/30 text-[#A855F7]'}`}>
                            {toast.type === 'success' ? <CheckCircle2 size={20} /> : <TrendingUp size={20} />}
                            <p className="text-sm font-bold uppercase tracking-wider">{toast.message}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
