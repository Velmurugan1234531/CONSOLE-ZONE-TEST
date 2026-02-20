"use client";

import { useEffect } from "react";
import { useVisuals } from "@/context/visuals-context";

export default function AppearanceProvider({ children }: { children: React.ReactNode }) {
    const { settings } = useVisuals();

    // Compute dynamic styles
    const dynamicStyles = settings ? {
        '--accent-color': settings.branding.accentColor,
        '--neon-purple': settings.globalDesign.colors.primary,
        '--neon-accent': settings.globalDesign.colors.accent,
        '--background': settings.globalDesign.colors.background,
        '--font-display': settings.globalDesign.typography.display,
        '--font-body': settings.globalDesign.typography.body,
        ...Object.entries(settings.globalDesign.colors).reduce((acc, [key, value]) => ({
            ...acc,
            [`--brand-${key}`]: value
        }), {})
    } : {};

    useEffect(() => {
        if (settings) {
            document.title = `${settings.branding.siteName} | ${settings.branding.tagline}`;
        }
    }, [settings]);

    return (
        <div style={dynamicStyles as any} className="contents">
            {children}
        </div>
    );
}
