"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { NotificationType } from "@/types";

export interface TacticalAlert {
    id: string;
    type: NotificationType | "order" | "rental" | "buyback" | "service";
    title: string;
    message: string;
    duration?: number;
}

interface NeuralAlertContextType {
    activeAlert: TacticalAlert | null;
    triggerAlert: (alert: Omit<TacticalAlert, "id">) => void;
    dismissAlert: () => void;
}

const NeuralAlertContext = createContext<NeuralAlertContextType | undefined>(undefined);

export function NeuralAlertProvider({ children }: { children: ReactNode }) {
    const [activeAlert, setActiveAlert] = useState<TacticalAlert | null>(null);

    const triggerAlert = useCallback((alert: Omit<TacticalAlert, "id">) => {
        const id = Math.random().toString(36).substr(2, 9);
        setActiveAlert({ ...alert, id });

        // Sound effect logic (Futuristic synth beep)
        playTacticalSound(alert.type);
    }, []);

    const dismissAlert = useCallback(() => {
        setActiveAlert(null);
    }, []);

    const playTacticalSound = (type: string) => {
        try {
            const audio = new Audio("https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a7315b.mp3"); // High-tech notify
            audio.volume = 0.4;
            audio.play().catch(() => { });
        } catch (e) {
            console.warn("Tactical Audio Uplink Failed:", e);
        }
    };

    return (
        <NeuralAlertContext.Provider value={{ activeAlert, triggerAlert, dismissAlert }}>
            {children}
        </NeuralAlertContext.Provider>
    );
}

export function useNeuralAlert() {
    const context = useContext(NeuralAlertContext);
    if (context === undefined) {
        throw new Error("useNeuralAlert must be used within a NeuralAlertProvider");
    }
    return context;
}
