import { createClient } from "@/lib/supabase/client";

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
 * Fetch settings from Supabase and sync to local storage
 */
export const syncMarketplaceSettings = async (): Promise<MarketplaceSettings> => {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'marketplace')
            .single();

        if (data) {
            const settings = data.value as MarketplaceSettings;
            if (typeof window !== 'undefined') {
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            }
            return { ...DEFAULT_SETTINGS, ...settings };
        }

        if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found" which is fine (use defaults)
            console.warn("Marketplace sync warning:", error.message);
        }

    } catch (e) {
        console.warn("Marketplace sync failed:", e);
    }
    return getMarketplaceSettings();
};

export const saveMarketplaceSettings = async (settings: MarketplaceSettings) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }

    const supabase = createClient();
    try {
        const { error } = await supabase
            .from('settings')
            .upsert({
                key: 'marketplace',
                value: settings,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' }); // Ensure key is unique constraint

        if (error) throw error;
    } catch (e) {
        console.error("Supabase settings save failed:", e);
    }
};

export const resetMarketplaceSettings = async () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(SETTINGS_KEY);
    }
    await saveMarketplaceSettings(DEFAULT_SETTINGS);
};
