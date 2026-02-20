import { createClient } from "@/lib/supabase/client";

export interface PageSEO {
    title: string;
    description: string;
    keywords: string;
}

export interface SiteSettings {
    siteTitle: string;
    siteDescription: string;
    holidayMode: boolean;
    maintenanceMode: boolean;
    announcement: string;
    seo: Record<string, PageSEO>;
    securityDeposit: number;
    taxRate: number;
    minRentalDays: number;
    freeDeliveryThreshold: number;
}

const STORAGE_KEY = 'site_settings';
// Supabase settings table key
const SETTINGS_DB_KEY = 'site_settings';

const DEFAULT_SETTINGS: SiteSettings = {
    siteTitle: "Console Zone",
    siteDescription: "Premium Gaming Rental Platform",
    holidayMode: false,
    maintenanceMode: false,
    announcement: "",
    securityDeposit: 2000,
    taxRate: 18,
    minRentalDays: 3,
    freeDeliveryThreshold: 5000,
    seo: {
        'home': {
            title: "Console Zone | Rent PS5, Xbox & Gaming Gear",
            description: "Premium gaming rentals delivered to your doorstep. Experience the latest consoles without the commitment.",
            keywords: "ps5 rental, xbox rental, gaming console, rent games"
        },
        'rentals': {
            title: "Rent Consoles | PS5, Xbox Series X, PS4",
            description: "Browse our fleet of calibrated gaming consoles. Flexible daily, weekly, and monthly plans.",
            keywords: "ps5 rent price, xbox series x rental, gaming laptop rent"
        },
        'buy': {
            title: "Buy Gaming Gear | New & Pre-Owned",
            description: "Shop certified pre-owned consoles and new gaming accessories. Best prices guaranteed.",
            keywords: "buy ps5, used ps5, second hand gaming console"
        },
        'sell': {
            title: "Sell Your Console | Instant Cash Quote",
            description: "Get the best price for your old gaming gear. Instant quotes and doorstep pickup.",
            keywords: "sell ps5, sell xbox, cash for consoles"
        },
        'services': {
            title: "Repair & Mod | Expert Console Services",
            description: "Professional repair services for controllers, consoles, and gaming hardware.",
            keywords: "ps5 repair, controller stick drift fix, console cleaning"
        }
    }
};

/**
 * Get site settings from Supabase (Async) or LocalStorage (Fallback)
 */
export const fetchSiteSettings = async (): Promise<SiteSettings> => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;

    // Check localStorage first for immediate render if valid
    const saved = localStorage.getItem(STORAGE_KEY);
    let localSettings: SiteSettings | null = null;
    if (saved) {
        try {
            localSettings = JSON.parse(saved);
        } catch (e) { console.warn("Invalid local settings", e); }
    }

    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', SETTINGS_DB_KEY)
            .single();

        if (data && !error) {
            const remoteSettings = data.value as SiteSettings;

            // Sync with local storage
            const mergedSettings = { ...DEFAULT_SETTINGS, ...remoteSettings };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedSettings));
            return mergedSettings;
        }
    } catch (e: any) {
        console.error("Failed to fetch from Supabase:", e?.message || e);
    }

    return localSettings || DEFAULT_SETTINGS;
};

/**
 * Sync version for legacy components (returns last known cached state)
 */
export const getSiteSettings = (): SiteSettings => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_SETTINGS;
    try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
        return DEFAULT_SETTINGS;
    }
};

/**
 * Save site settings to Supabase and LocalStorage
 */
export const saveSiteSettings = async (settings: SiteSettings) => {
    if (typeof window === 'undefined') return;

    try {
        // Fetch current mainly for announcement comparison (optional optimization, skipped for speed)
        const oldSettings = getSiteSettings();

        // Save to LocalStorage immediately for responsive UI
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

        const supabase = createClient();
        const { error } = await supabase
            .from('settings')
            .upsert({
                key: SETTINGS_DB_KEY,
                value: settings,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

        if (error) throw error;

        // Global Announcement Link
        if (settings.announcement && settings.announcement !== oldSettings?.announcement) {
            try {
                const { sendNotification } = await import("./notifications");
                await sendNotification({
                    type: 'info',
                    title: 'System Announcement',
                    message: settings.announcement
                });
            } catch (e) {
                console.warn("Announcement notification failed:", e);
            }
        }
    } catch (e) {
        console.error("Failed to save to Supabase:", e);
    }
};

export const resetSiteSettings = async () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);

    const supabase = createClient();
    try {
        await supabase
            .from('settings')
            .delete()
            .eq('key', SETTINGS_DB_KEY);
    } catch (e) {
        console.error("Failed to reset in Supabase:", e);
    }
};
