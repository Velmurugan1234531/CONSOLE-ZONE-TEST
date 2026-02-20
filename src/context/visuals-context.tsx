"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { VisualsService, VisualSettings, DEFAULT_SETTINGS } from "@/services/visuals";

interface VisualsContextType {
    settings: VisualSettings | null;
    isLoading: boolean;
    updateSettings: (newSettings: VisualSettings) => Promise<void>;
    refreshSettings: () => Promise<void>;
}

const VisualsContext = createContext<VisualsContextType | undefined>(undefined);

export function VisualsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<VisualSettings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const data = await VisualsService.getSettings();
            setSettings(data);
        } catch (error) {
            console.error("Failed to load visual settings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'VISUAL_SETTINGS_V11') {
                loadSettings();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const updateSettings = async (newSettings: VisualSettings) => {
        setSettings(newSettings);
        await VisualsService.saveSettings(newSettings);
    };

    return (
        <VisualsContext.Provider
            value={{
                settings,
                isLoading,
                updateSettings,
                refreshSettings: loadSettings
            }}
        >
            {children}
        </VisualsContext.Provider>
    );
}

export function useVisuals() {
    const context = useContext(VisualsContext);
    if (context === undefined) {
        throw new Error("useVisuals must be used within a VisualsProvider");
    }
    return context;
}
