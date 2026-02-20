"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { VisualsService, CustomPage, VisualSettings } from "@/services/visuals";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";
import PageHero from "@/components/layout/PageHero";

export default function DynamicPage() {
    const params = useParams();
    const slug = Array.isArray(params.slug) ? params.slug.join('/') : params.slug;
    const [page, setPage] = useState<CustomPage | null>(null);
    const [settings, setSettings] = useState<VisualSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await VisualsService.getSettings();
            setSettings(data);
            const found = data.customPages.find(p => p.slug === slug || p.slug === `/${slug}`);
            setPage(found || null);
            setLoading(false);
        };
        load();
    }, [slug]);

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8B5CF6]"></div>
        </div>
    );

    if (!page) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                <FileQuestion className="text-[#8B5CF6]" size={32} />
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Deploy Error 404</h1>
            <p className="text-gray-500 text-sm mb-8 text-center max-w-xs">The requested asset coordinate does not exist in our database.</p>
            <Link href="/" className="px-8 py-3 bg-[#A855F7] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all flex items-center gap-2">
                <ArrowLeft size={16} /> Return to Home
            </Link>
        </div>
    );

    // Dynamic Background Logic
    const bgEffect = settings?.layouts?.[page.id]?.background ?? settings?.backgroundEffects;
    const opacity = (bgEffect?.imageOpacity ?? 100) / 100;
    const darkness = (bgEffect?.overlayDarkness ?? 30) / 100;
    const blur = bgEffect?.blurIntensity ?? 1;

    const layouts = {
        default: "max-w-4xl mx-auto py-24 px-6",
        narrow: "max-w-2xl mx-auto py-24 px-6",
        landing: "w-full max-w-none mx-auto py-24 px-6"
    };

    return (
        <main className="min-h-screen relative bg-[#050505] overflow-hidden">
            <PageHero
                title={page.title}
                subtitle="Customized Page Content"
                images={settings?.pageBackgrounds?.home || []}
            />

            <div className={`relative z-10 ${layouts[page.layout] || layouts.default}`}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >

                    <div
                        className="prose prose-invert prose-purple max-w-none text-gray-400 leading-relaxed space-y-6"
                        dangerouslySetInnerHTML={{ __html: page.content.replace(/\n/g, '<br />') }}
                    />
                </motion.div>
            </div>
        </main>
    );
}
