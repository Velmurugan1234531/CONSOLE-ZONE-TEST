import { db } from "@/lib/firebase";
import {
    doc,
    getDoc,
    setDoc
} from "firebase/firestore";
import { safeGetDoc } from "@/utils/firebase-utils";

export interface MarketplaceSettings {
    tradeInRate: number; // Percentage of shelf price paid in cash (e.g., 0.4)
    creditBonus: number; // Percentage bonus for store credit (e.g., 0.2)
    tradeInFee: number;
    enableTradeIn: boolean;
    payoutTiers: {
        credit: number; // hours
        bank: number; // hours
        upi: number; // hours
    };
    multipliers: {
        rental: number; // e.g., 1.0 (baseline)
        retail: number; // e.g., 1.0
        buyback: number; // e.g., 1.0
    };
}

const DEFAULT_SETTINGS: MarketplaceSettings = {
    tradeInRate: 0.4,
    creditBonus: 0.2,
    tradeInFee: 5,
    enableTradeIn: true,
    payoutTiers: {
        credit: 12,
        bank: 24,
        upi: 48
    },
    multipliers: {
        rental: 1.0,
        retail: 1.0,
        buyback: 1.0
    }
};

const SETTINGS_KEY = 'marketplace_settings';
const COLLECTION = 'settings';
const DOC_ID = 'marketplace';

export const getMarketplaceSettings = (): MarketplaceSettings => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;

    // Fast local sync
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) return DEFAULT_SETTINGS;
    try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
        return DEFAULT_SETTINGS;
    }
};

/**
 * Fetch settings from Firestore and sync to local storage
 */
export const syncMarketplaceSettings = async (): Promise<MarketplaceSettings> => {
    try {
        const docRef = doc(db, COLLECTION, DOC_ID);
        const docSnap = await safeGetDoc(docRef);

        if (docSnap.exists()) {
            const settings = docSnap.data() as MarketplaceSettings;
            if (typeof window !== 'undefined') {
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            }
            return { ...DEFAULT_SETTINGS, ...settings };
        }

    } catch (e) {
        console.warn("Marketplace sync failed (Firestore):", e);
    }
    return getMarketplaceSettings();
};

export const saveMarketplaceSettings = async (settings: MarketplaceSettings) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }

    try {
        const docRef = doc(db, COLLECTION, DOC_ID);
        await setDoc(docRef, {
            ...settings,
            updated_at: new Date().toISOString()
        }, { merge: true });

    } catch (e) {
        console.error("Firestore settings save failed:", e);
    }
};

export const resetMarketplaceSettings = async () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(SETTINGS_KEY);
    }
    await saveMarketplaceSettings(DEFAULT_SETTINGS);
};
