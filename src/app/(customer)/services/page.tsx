"use client";

import { Suspense } from "react";
import { Cpu, ShieldCheck, Zap, ArrowRight, Cog, Wrench, Gamepad2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ThreeHero from "@/components/ThreeHero";

import { VisualsService, VisualSettings } from "@/services/visuals";
import { BuilderRenderer } from "@/components/Builder/BuilderRenderer";
import { useState, useEffect } from "react";
import { usePageSEO } from "@/hooks/use-seo";
import Link from "next/link";

import PageHero from "@/components/layout/PageHero";

export default function ServicesPage() {
    usePageSEO('services');
    const [content, setContent] = useState({ title: 'HARDWARE LAB', subtitle: "Precision Diagnostics & Professional Restoration" });
    const [visualSettings, setVisualSettings] = useState<VisualSettings | null>(null);

    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const visualSettings = await VisualsService.getSettings();
            setVisualSettings(visualSettings);
            if (visualSettings.pageContent.services_title) {
                setContent({
                    title: visualSettings.pageContent.services_title,
                    subtitle: visualSettings.pageContent.services_subtitle
                });
            }

            try {
                // Import dynamically to avoid server-side issues if any
                const { getServices } = await import('@/services/repair-services');
                const data = await getServices();
                const activeServices = data.filter(s => s.status === 'Active');
                setServices(activeServices);
            } catch (error) {
                console.error("Failed to load services", error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const getServiceIcon = (category: string) => {
        switch (category) {
            case 'Repair': return <Cpu size={40} className="text-[#A855F7]" />;
            case 'Maintenance': return <Zap size={40} className="text-[#39ff14]" />;
            case 'Modification': return <Gamepad2 size={40} className="text-[#8B5CF6]" />;
            default: return <Cog size={40} className="text-white" />;
        }
    };

    const getServiceColor = (category: string) => {
        switch (category) {
            case 'Repair': return "#A855F7";
            case 'Maintenance': return "#39ff14";
            case 'Modification': return "#8B5CF6";
            default: return "#FFFFFF";
        }
    };

    return (
        <div className="min-h-screen relative bg-[#050505] overflow-hidden">


            <PageHero
                title={visualSettings?.pageContent?.services_title || "HARDWARE LAB"}
                subtitle={visualSettings?.pageContent?.services_subtitle || "Precision Diagnostics & Professional Restoration"}
                images={visualSettings?.pageBackgrounds?.services || []}
                height="100vh"
            >
                {(visualSettings?.layouts?.services?.layers?.length || 0) > 0 && (
                    <BuilderRenderer
                        elements={visualSettings!.layouts.services.layers}
                        globalDesign={visualSettings!.globalDesign}
                    />
                )}
            </PageHero>

            <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 pb-32 pt-20 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {loading ? (
                        <div className="col-span-full text-center py-20 text-gray-500 font-mono animate-pulse">
                            INITIALIZING SERVICES DATABASE...
                        </div>
                    ) : services.length === 0 ? (
                        <div className="col-span-full text-center py-20 text-gray-500 font-mono">
                            NO ACTIVE SERVICES FOUND.
                        </div>
                    ) : (
                        services.map((service, index) => (
                            <motion.div
                                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                key={service.id}
                                className="group bg-[#0a0a0a] border border-white/5 rounded-3xl p-10 hover:border-[#A855F7]/30 transition-all duration-500 hover:shadow-[0_0_50px_rgba(168,85,247,0.1)] flex flex-col relative overflow-hidden"
                            >
                                {/* Abstract Glow Background */}
                                <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#A855F7]/5 rounded-full blur-[80px] group-hover:bg-[#A855F7]/10 transition-all" />

                                <div className="flex items-start justify-between mb-8 relative z-10">
                                    <div className="p-5 bg-white/5 rounded-2xl border border-white/5 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                                        {getServiceIcon(service.category)}
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-2">
                                        <p className="text-[10px] text-gray-600 font-mono uppercase font-black tracking-widest mb-1">Service Tier</p>
                                        <p className="text-[#A855F7] font-mono text-xs uppercase font-bold tracking-widest italic opacity-0 group-hover:opacity-100 transition-opacity">
                                            {service.category}
                                        </p>
                                    </div>
                                </div>

                                <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tight group-hover:text-[#A855F7] transition-colors">{service.name}</h3>
                                <p className="text-gray-500 text-base mb-10 flex-grow font-light leading-relaxed max-w-sm">
                                    {service.description || "Professional grade repair and maintenance service."}
                                </p>

                                <div className="flex items-center justify-between mt-auto pt-8 border-t border-white/5 relative z-10">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-500 uppercase font-bold mb-1">Estimated Cost</span>
                                        <span className="text-2xl font-black text-white font-display uppercase tracking-widest italic">₹{service.price}</span>
                                    </div>
                                    <Link href={`/services/book?serviceId=${service.id}`} className="flex items-center gap-3 bg-white/5 hover:bg-[#A855F7] hover:text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest transition-all text-xs group/btn shadow-inner">
                                        BOOK NOW <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Call to Action Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-24 relative overflow-hidden rounded-[2.5rem]"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#06B6D4]/20 via-[#8B5CF6]/10 to-[#39ff14]/10 opacity-40 blur-3xl" />
                    <div className="relative bg-[#0a0a0a] border border-white/10 p-12 md:p-20 flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left shadow-2xl">
                        <div className="max-w-xl">
                            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 uppercase tracking-tighter leading-none font-display">
                                NEED A CUSTOM <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A855F7] to-[#FFFFFF]">SYSTEM FIX?</span>
                            </h2>
                            <p className="text-gray-400 text-lg font-light tracking-wide font-mono">
                                Not sure what's wrong? Our technicians provide zero-cost diagnostics for all hardware brought into the lab.
                            </p>
                        </div>
                        <button className="whitespace-nowrap bg-[#A855F7] text-white font-black px-12 py-6 rounded-none skew-x-[-15deg] hover:scale-105 transition-all shadow-[0_0_30px_rgba(168,85,247,0.5)] uppercase tracking-[0.2em] font-display">
                            <span className="skew-x-[15deg]">Initiate Repair</span>
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Footer Trust Section */}
            <div className="bg-black/50 border-t border-white/5 py-20 px-4">
                <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12 text-center">
                    <div>
                        <ShieldCheck size={32} className="mx-auto mb-4 text-[#8B5CF6] opacity-50" />
                        <p className="text-[10px] text-gray-500 font-mono font-bold uppercase tracking-widest">90-Day Coverage</p>
                    </div>
                    <div>
                        <Wrench size={32} className="mx-auto mb-4 text-[#A855F7] opacity-50" />
                        <p className="text-[10px] text-gray-500 font-mono font-bold uppercase tracking-widest">Oem Components Only</p>
                    </div>
                    <div>
                        <Zap size={32} className="mx-auto mb-4 text-[#39ff14] opacity-50" />
                        <p className="text-[10px] text-gray-500 font-mono font-bold uppercase tracking-widest">Rapid Restoration</p>
                    </div>
                    <div>
                        <Cog size={32} className="mx-auto mb-4 text-[#F59E0B] opacity-50" />
                        <p className="text-[10px] text-gray-500 font-mono font-bold uppercase tracking-widest">Certified Lab Techs</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
