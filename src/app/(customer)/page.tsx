"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShoppingBag, Gamepad2, Star } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { getProducts, Product } from '@/services/products';
import { StockService } from '@/services/stock';
import { formatCurrency } from '@/utils/format';
import { useVisuals } from '@/context/visuals-context';

const PageHero: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
    <div className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-[#050505]"></div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-5xl md:text-7xl font-black text-white italic tracking-tighter uppercase mb-6 leading-tight"
            >
                {title}
            </motion.h1>
            {subtitle && (
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-xl md:text-2xl text-gray-300 font-mono mb-12 max-w-2xl mx-auto"
                >
                    {subtitle}
                </motion.p>
            )}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
            >
                {children}
            </motion.div>
        </div>
    </div>
);

export default function HomePage() {
    const { addItem } = useCart();
    const { settings } = useVisuals();
    const stock = StockService.useStock();
    const [shopProducts, setShopProducts] = useState<Product[]>([]);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const products = await getProducts('buy');
                setShopProducts(products.slice(0, 3)); // Display top 3 products
            } catch (err) {
                console.warn("Failed to load shop products for home page", err);
                // getProducts has internal fallback, but just in case
            }
        };
        loadProducts();
    }, []);

    const handleAddToCart = (product: Product) => {
        addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.images[0],
            quantity: 1
        });
    };

    // Content from Visuals Context or defaults
    const content = {
        home_hero_title: settings?.pageContent?.home_hero_title || "LEVEL UP YOUR GAMING",
        home_hero_subtitle: settings?.pageContent?.home_hero_subtitle || "Premium Console Rentals Delivered to Your Doorstep",
    };

    // Filter featured rentals for the new design
    const featuredRentals = stock.filter(item =>
        ['ps5', 'xbox', 'vr'].some(tag => item.id.includes(tag))
    ).slice(0, 3);

    return (
        <main className="min-h-screen bg-[#050505] overflow-hidden">
            <PageHero
                title={content.home_hero_title}
                subtitle={content.home_hero_subtitle}
            >
                <div className="flex flex-col sm:flex-row gap-6 justify-center mt-8">
                    <Link href="/rental">
                        <button
                            className="group px-12 py-5 bg-[#A855F7] text-white font-black uppercase tracking-[0.2em] skew-x-[-20deg] flex items-center gap-3 hover:bg-[#9333ea] transition-colors"
                        >
                            <span className="skew-x-[20deg] block text-lg font-black">RENTALS</span>
                            <ArrowRight className="w-6 h-6 skew-x-[20deg]" strokeWidth={3} />
                        </button>
                    </Link>

                    <Link href="/buy">
                        <button
                            className="group px-12 py-5 bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.2em] skew-x-[-20deg] backdrop-blur-sm hover:bg-white/10 transition-colors"
                        >
                            <span className="skew-x-[20deg] block text-lg font-black">SHOPPING</span>
                        </button>
                    </Link>
                </div>
            </PageHero>

            {/* Flash Sale Banner */}
            <section className="px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto mb-24 -mt-20 relative z-20">
                <div className="relative group overflow-hidden rounded-[3rem] bg-gradient-to-r from-[#A855F7] to-[#601cc9] p-1 shadow-2xl shadow-purple-900/20">
                    <div className="relative bg-[#0A0A0A] rounded-[2.9rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden">
                        {/* Decorative Background Element */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-[#A855F7]/10 blur-[100px] -translate-y-1/2 translate-x-1/2" />

                        <div className="relative z-10 space-y-6 text-center md:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#A855F7]/20 border border-[#A855F7]/30 rounded-full">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A855F7] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A855F7]"></span>
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A855F7]">Weekend Flash Sale</span>
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase leading-[0.9]">
                                GET <span className="text-[#A855F7]">20% OFF</span> ON <br />YOUR FIRST RENTAL
                            </h2>
                            <p className="text-gray-400 font-mono text-sm uppercase tracking-widest max-w-md">
                                Use code <span className="text-white font-bold underline decoration-[#A855F7] decoration-2">GAMER20</span> at checkout.
                                Mission ends in 48 hours.
                            </p>
                        </div>

                        <div className="relative z-10 w-full md:w-auto">
                            <Link href="/rental">
                                <button
                                    className="w-full md:w-auto px-12 py-6 bg-white text-black font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[#A855F7] hover:text-white transition-all shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_50px_rgba(168,85,247,0.3)]"
                                >
                                    CLAIM DISCOUNT
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Products Section ("Slay Style") */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto border-t border-white/5">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase mb-4">
                        START SHOPPING
                    </h2>
                    <div className="h-1 w-20 bg-[#A855F7] mx-auto rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                    {shopProducts.map((item) => (
                        <div key={item.id} className="group bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col p-6 space-y-6 hover:border-[#A855F7]/30 transition-colors">
                            <div className="relative aspect-square w-full bg-[#121212] rounded-[2rem] overflow-hidden flex items-center justify-center p-8 group-hover:bg-[#1a1a1a] transition-colors">
                                <span className="absolute top-4 left-4 bg-[#A855F7] text-white text-[8px] font-black px-3 py-1 rounded uppercase tracking-[0.2em] z-10">
                                    FEATURED
                                </span>
                                <img src={item.images[0]} alt={item.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                            </div>

                            <div className="space-y-4 px-2">
                                <h3 className="text-xl font-black text-white uppercase tracking-tight line-clamp-1">{item.name}</h3>
                                <p className="text-gray-500 text-xs line-clamp-2">{item.description}</p>
                                <div className="flex gap-2">
                                    <span className="text-[9px] font-black uppercase px-3 py-1 rounded border border-white/10 text-gray-400">PURCHASE</span>
                                    <span className="text-[9px] font-black uppercase px-3 py-1 rounded border border-[#A855F7]/30 text-[#A855F7]">{item.category}</span>
                                </div>
                                <div className="pt-4 flex items-center justify-between">
                                    <div>
                                        <div className="text-[9px] text-gray-600 font-bold uppercase">BUY FOR</div>
                                        <div className="text-2xl font-black text-white italic tracking-tighter">{formatCurrency(item.price)}</div>
                                    </div>
                                    <button
                                        onClick={() => handleAddToCart(item)}
                                        className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-[#A855F7] transition-all text-white"
                                    >
                                        <ShoppingBag size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase mb-4">
                        RENTAL PRODUCTS
                    </h2>
                    <div className="h-1 w-20 bg-[#A855F7] mx-auto rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                    {featuredRentals.map((item) => (
                        <div key={item.id} className="group bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col p-6 space-y-6 hover:border-[#A855F7]/30 transition-colors">
                            <div className="relative aspect-square w-full bg-[#121212] rounded-[2rem] overflow-hidden flex items-center justify-center p-8 group-hover:bg-[#1a1a1a] transition-colors">
                                <div className="absolute top-4 right-4 z-20">
                                    {item.available > 0 ? (
                                        <div className="bg-green-500/10 border border-green-500/20 text-green-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                            Available
                                        </div>
                                    ) : (
                                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                            Out of Stock
                                        </div>
                                    )}
                                </div>
                                <img src={item.image} alt={item.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                            </div>

                            <div className="space-y-4 px-2">
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">{item.name}</h3>
                                <p className="text-gray-500 text-xs line-clamp-2">High-performance rental gear. Includes controllers and cables.</p>
                                <div className="flex gap-2">
                                    <span className="text-[9px] font-black uppercase px-3 py-1 rounded border border-white/10 text-gray-400">RENTAL</span>
                                    <span className="text-[9px] font-black uppercase px-3 py-1 rounded border border-[#A855F7]/30 text-[#A855F7]">WEEKLY</span>
                                </div>
                                <div className="pt-4 flex items-center justify-between">
                                    <div>
                                        <div className="text-[9px] text-gray-600 font-bold uppercase">RENT FROM</div>
                                        <div className="text-2xl font-black text-white italic tracking-tighter">₹500<span className="text-sm text-gray-400 not-italic font-normal">/day</span></div>
                                    </div>
                                    <Link href="/rental">
                                        <button
                                            className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-[#A855F7] transition-all text-white"
                                        >
                                            <ArrowRight size={20} />
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* User Reviews Section */}
                <div className="pt-24 border-t border-white/5">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase mb-4">
                            WHAT GAMERS SAY
                        </h2>
                        <div className="h-1 w-20 bg-[#A855F7] mx-auto rounded-full" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { name: "Arjun R.", rating: 5, comment: "Rental process was super smooth. The PS5 arrived in pristine condition. Highly recommended!", location: "Chennai" },
                            { name: "Sarah K.", rating: 5, comment: "Sold my old PS4 for a great price. Payout was instant as promised. Best place to sell gear.", location: "Bangalore" },
                            { name: "Vivek M.", rating: 5, comment: "The 144Hz monitor rental changed my weekend tournament experience. Professional service!", location: "Mumbai" }
                        ].map((review, i) => (
                            <div key={i} className="bg-[#0A0A0A] border border-white/5 p-8 rounded-[2.5rem] space-y-6 relative group overflow-hidden hover:border-[#A855F7]/30 transition-colors">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-white">
                                    <Gamepad2 size={80} />
                                </div>
                                <div className="flex text-[#A855F7] gap-1">
                                    {[...Array(review.rating)].map((_, i) => <span key={i} className="text-xl">★</span>)}
                                </div>
                                <p className="text-gray-400 text-sm leading-relaxed italic">"{review.comment}"</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#A855F7] to-blue-500 flex items-center justify-center font-bold text-xs text-white">
                                        {review.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-white font-bold text-sm uppercase tracking-wider">{review.name}</div>
                                        <div className="text-gray-600 text-[10px] font-bold uppercase tracking-[0.2em]">{review.location}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="pt-32 pb-12">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase mb-4">
                            MISSION SUPPORT
                        </h2>
                        <p className="text-gray-500 font-mono text-sm uppercase tracking-widest">Everything you need to know about Console Zone</p>
                        <div className="h-1 w-20 bg-[#A855F7] mx-auto rounded-full mt-4" />
                    </div>

                    <div className="max-w-3xl mx-auto space-y-4">
                        {[
                            { q: "How does the rental deposit work?", a: "We take a minimal security deposit which is 100% refundable upon return of the console in original condition." },
                            { q: "What documents are needed for KYC?", a: "Just a valid ID proof (Aadhar/Voter ID) and current address proof. The process takes less than 5 minutes." },
                            { q: "Do you offer doorstep delivery?", a: "Yes! We offer same-day doorstep delivery and pickup across all major areas of Chennai." },
                            { q: "Can I buy a console I'm currently renting?", a: "Absolutely! We offer special conversion prices if you decide to permanently own your rental gear." }
                        ].map((faq, i) => (
                            <div key={i} className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 hover:border-[#A855F7]/30 transition-all cursor-pointer group">
                                <h3 className="text-white font-black uppercase text-sm tracking-widest flex items-center justify-between">
                                    {faq.q}
                                    <ArrowRight size={16} className="text-[#A855F7] group-hover:translate-x-1 transition-transform" />
                                </h3>
                                <p className="mt-4 text-gray-500 text-xs leading-relaxed group-hover:text-gray-400 transition-colors">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
