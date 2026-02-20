"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VisualsService, VisualSettings } from "@/services/visuals";

interface BackgroundSlideshowProps {
    page: string;
}

export function BackgroundSlideshow({ page }: BackgroundSlideshowProps) {
    const [settings, setSettings] = useState<VisualSettings | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const load = async () => {
            const s = await VisualsService.getSettings();
            setSettings(s);
        };
        load();

        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'VISUAL_SETTINGS') {
                load();
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const images = settings?.pageBackgrounds?.[page] || [];
    const effects = settings?.layouts?.[page]?.background || settings?.backgroundEffects;

    useEffect(() => {
        if (!images || images.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [images]);

    if (!images.length) return null;

    // Use current index, fallback to 0 if out of bounds (e.g. after deletion)
    const activeImage = images[currentIndex] || images[0];

    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${page}-${activeImage}`}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{
                        opacity: (effects?.imageOpacity ?? 100) / 100,
                        scale: 1
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5 }}
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${activeImage})` }}
                />
            </AnimatePresence>

            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black transition-all duration-500"
                style={{ opacity: (effects?.overlayDarkness ?? 30) / 100 }}
            />

            {/* Blur */}
            <div
                className="absolute inset-0 backdrop-blur transition-all duration-500"
                style={{ backdropFilter: `blur(${effects?.blurIntensity ?? 0}px)` }}
            />
        </div>
    );
}
