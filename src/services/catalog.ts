import { createClient } from "@/lib/supabase/client";

export interface CatalogSettings {
    id: string;
    device_category: string;
    is_enabled: boolean;
    is_featured: boolean;
    max_controllers: number;
    extra_controller_enabled: boolean;
    daily_rate: number;
    weekly_rate: number;
    monthly_rate: number;
    controller_daily_rate: number;
    controller_weekly_rate: number;
    controller_monthly_rate: number;
    display_order: number;
    features?: string[];
}

// DEMO DATA for testing without Supabase
const DEMO_CATALOG_SETTINGS: CatalogSettings[] = [
    {
        id: "demo-cat-1",
        device_category: "PS5",
        is_enabled: true,
        is_featured: true,
        max_controllers: 4,
        extra_controller_enabled: true,
        daily_rate: 699,
        weekly_rate: 4499,
        monthly_rate: 9999,
        controller_daily_rate: 100,
        controller_weekly_rate: 500,
        controller_monthly_rate: 1500,
        display_order: 1,
        features: ["4K 120Hz Gaming", "100+ Games Free", "24 Hours Access", "Self Pickup Available"]
    },
    {
        id: "demo-cat-2",
        device_category: "PS4",
        is_enabled: true,
        is_featured: false,
        max_controllers: 4,
        extra_controller_enabled: true,
        daily_rate: 399,
        weekly_rate: 2499,
        monthly_rate: 4999,
        controller_daily_rate: 75,
        controller_weekly_rate: 400,
        controller_monthly_rate: 1200,
        display_order: 2,
        features: ["HDR Gaming Support", "100+ Games Library", "24/7 Support Access", "Budget Friendly Rig"]
    },
    {
        id: "demo-cat-3",
        device_category: "Xbox",
        is_enabled: true,
        is_featured: false,
        max_controllers: 4,
        extra_controller_enabled: true,
        daily_rate: 599,
        weekly_rate: 3999,
        monthly_rate: 8999,
        controller_daily_rate: 100,
        controller_weekly_rate: 500,
        controller_monthly_rate: 1500,
        display_order: 3,
        features: ["4K 120Hz Gaming", "Game Pass Ultimate", "Quick Resume", "Performance Mode"]
    }
];

// Helper to persist demo settings
const persistDemoSettings = (settings: CatalogSettings[]) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('DEMO_CATALOG_SETTINGS', JSON.stringify(settings));
        window.dispatchEvent(new Event('storage'));
    }
};

// Helper to load demo settings
const loadDemoSettings = (): CatalogSettings[] => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('DEMO_CATALOG_SETTINGS');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error("Failed to parse demo catalog settings", e);
            }
        }
    }
    return DEMO_CATALOG_SETTINGS;
};

export const getCatalogSettings = async (): Promise<CatalogSettings[]> => {
    const supabase = createClient();
    try {
        const { data, error } = await supabase
            .from('catalog_settings')
            .select('*')
            .order('created_at', { ascending: true }); // Using created_at since display_order might not be in DB yet

        if (error) {
            console.warn("Catalog fetch Supabase fail:", error);
            return loadDemoSettings();
        }

        if (!data || data.length === 0) {
            console.warn("Supabase catalog empty, using demo fallback");
            return loadDemoSettings();
        }

        return data as CatalogSettings[];
    } catch (e) {
        console.warn("Catalog fetch failed:", e);
        return loadDemoSettings();
    }
};

export const getCatalogSettingsByCategory = async (category: string): Promise<CatalogSettings | null> => {
    const supabase = createClient();
    try {
        const { data, error } = await supabase
            .from('catalog_settings')
            .select('*')
            .eq('device_category', category)
            .single();

        if (error || !data) {
            return loadDemoSettings().find(c => c.device_category === category) || null;
        }

        return data as CatalogSettings;
    } catch (e) {
        console.warn(`Catalog category fetch failed for ${category}:`, e);
        return loadDemoSettings().find(c => c.device_category === category) || null;
    }
};

export const updateCatalogSettings = async (
    category: string,
    updates: Partial<CatalogSettings>
): Promise<CatalogSettings | null> => {
    const supabase = createClient();
    try {
        const { data, error } = await supabase
            .from('catalog_settings')
            .update(updates)
            .eq('device_category', category)
            .select()
            .single();

        if (error) {
            console.error("Supabase update catalog failed:", error);
            // Fallback to demo update for seamless UI
            const currentSettings = loadDemoSettings();
            const index = currentSettings.findIndex(c => c.device_category === category);
            if (index !== -1) {
                const updated = { ...currentSettings[index], ...updates };
                currentSettings[index] = updated;
                persistDemoSettings(currentSettings);
                return updated;
            }
            return null;
        }

        return data as CatalogSettings;
    } catch (e) {
        console.error("Update catalog failed:", e);
        return null;
    }
};

export const createCatalogSettings = async (
    settings: Omit<CatalogSettings, 'id'>
): Promise<CatalogSettings | null> => {
    const supabase = createClient();
    try {
        const { data, error } = await supabase
            .from('catalog_settings')
            .insert(settings)
            .select()
            .single();

        if (error) {
            console.error("Supabase create catalog failed:", error);
            // Fallback
            const newSetting: CatalogSettings = { ...settings, id: `demo-cat-${Date.now()}` };
            const currentSettings = loadDemoSettings();
            currentSettings.push(newSetting);
            persistDemoSettings(currentSettings);
            return newSetting;
        }

        return data as CatalogSettings;
    } catch (e) {
        console.error("Create catalog failed:", e);
        return null;
    }
};

export const deleteCatalogSettings = async (category: string): Promise<boolean> => {
    const supabase = createClient();
    try {
        const { error } = await supabase
            .from('catalog_settings')
            .delete()
            .eq('device_category', category);

        if (error) {
            console.error("Supabase delete catalog failed:", error);
            // Fallback
            const currentSettings = loadDemoSettings();
            const index = currentSettings.findIndex(c => c.device_category === category);
            if (index !== -1) {
                currentSettings.splice(index, 1);
                persistDemoSettings(currentSettings);
                return true;
            }
            return false;
        }

        return true;
    } catch (e) {
        console.error("Delete catalog failed:", e);
        return false;
    }
};

export const renameCategory = async (
    oldCategory: string,
    newCategory: string
): Promise<boolean> => {
    const supabase = createClient();
    try {
        // 1. Update catalog_settings
        const { error: catError } = await supabase
            .from('catalog_settings')
            .update({ device_category: newCategory })
            .eq('device_category', oldCategory);

        if (catError) throw catError;

        // 2. Update devices collection
        const { error: devError } = await supabase
            .from('devices')
            .update({ category: newCategory })
            .eq('category', oldCategory);

        if (devError) console.warn("Failed to update related devices during rename:", devError);

        return true;
    } catch (e: any) {
        console.error(`Supabase renaming failure: ${e?.message || e}`);

        // Fallback
        const currentSettings = loadDemoSettings();
        const index = currentSettings.findIndex(c => c.device_category === oldCategory);
        if (index !== -1) {
            currentSettings[index].device_category = newCategory;
            persistDemoSettings(currentSettings);
            return true;
        }
        return false;
    }
};

export const getEnabledDevices = async (): Promise<CatalogSettings[]> => {
    const allSettings = await getCatalogSettings();
    return allSettings.filter(s => s.is_enabled);
};

export const getFeaturedDevices = async (): Promise<CatalogSettings[]> => {
    const allSettings = await getCatalogSettings();
    return allSettings.filter(s => s.is_enabled && s.is_featured);
};

export const calculatePriceFromSettings = (
    settings: CatalogSettings,
    days: number,
    extraControllers: number = 0
): { basePrice: number; controllerPrice: number; total: number } => {
    let basePrice = 0;
    let controllerPrice = 0;

    if (days >= 28) {
        basePrice = settings.monthly_rate;
        controllerPrice = extraControllers * (settings.controller_weekly_rate * 4);
    } else if (days >= 7) {
        const weeks = Math.ceil(days / 7);
        basePrice = settings.weekly_rate * weeks;
        controllerPrice = extraControllers * settings.controller_weekly_rate * weeks;
    } else {
        basePrice = settings.daily_rate * days;
        controllerPrice = extraControllers * settings.controller_daily_rate * days;
    }

    return { basePrice, controllerPrice, total: basePrice + controllerPrice };
};

export const calculateRentalPrice = async (
    category: string,
    days: number,
    extraControllers: number = 0
): Promise<{ basePrice: number; controllerPrice: number; total: number }> => {
    let settings: CatalogSettings | null = null;
    try {
        settings = await getCatalogSettingsByCategory(category);
    } catch (error) { }

    if (!settings) {
        settings = loadDemoSettings().find(c => c.device_category === category) || null;
    }

    if (!settings) return { basePrice: 0, controllerPrice: 0, total: 0 };

    return calculatePriceFromSettings(settings, days, extraControllers);
};


