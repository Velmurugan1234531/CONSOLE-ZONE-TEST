
export interface PlanConfig {
    price: number;
    features: string[];
}

export interface ConsolePlan {
    daily: PlanConfig;
    weekly: PlanConfig;
    monthly: PlanConfig;
    weekend?: PlanConfig;
}

export interface CatalogSettings {
    [category: string]: ConsolePlan;
}

const STORAGE_KEY = 'catalog_settings_v1';

// Default Fallback Settings (Static Defaults)
const DEFAULT_SETTINGS: CatalogSettings = {
    ps5: {
        daily: {
            price: 699,
            features: ["4K 120Hz Gaming", "100+ Games Free", "24 Hours Access", "Self Pickup Available"]
        },
        weekly: {
            price: 4499,
            features: ["4K 120Hz Gaming", "100+ Games Free", "7 Days Access", "Free Delivery", "Priority Support"]
        },
        monthly: {
            price: 9999,
            features: ["4K 120Hz Gaming", "100+ Games Free", "30 Days Access", "Free Delivery", "Game Pass Included"]
        }
    },
    ps4: {
        daily: {
            price: 399,
            features: ["HDR Gaming", "100+ Games Free", "24 Hours Access", "Budget Friendly"]
        },
        weekly: {
            price: 2499,
            features: ["HDR Gaming", "100+ Games Free", "7 Days Access", "Free Delivery"]
        },
        monthly: {
            price: 4999,
            features: ["HDR Gaming", "100+ Games Free", "30 Days Access", "Free Delivery"]
        }
    },
    xbox: {
        daily: {
            price: 599,
            features: ["Game Pass Ultimate", "100+ Games Free", "24 Hours Access", "Next-Gen Power"]
        },
        weekly: {
            price: 3999,
            features: ["Game Pass Ultimate", "100+ Games Free", "7 Days Access", "Free Delivery"]
        },
        monthly: {
            price: 7999,
            features: ["Game Pass Ultimate", "100+ Games Free", "30 Days Access", "Free Delivery"]
        }
    }
};

/**
 * Get catalog settings from localStorage or return defaults
 */
export const getCatalogSettings = (): CatalogSettings => {
    if (typeof window === 'undefined') {
        return DEFAULT_SETTINGS;
    }

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Merge with defaults to ensure all required fields exist for known types
            return {
                ...DEFAULT_SETTINGS,
                ...parsed
            };
        }
    } catch (error) {
        console.error('Failed to load catalog settings:', error);
    }

    return DEFAULT_SETTINGS;
};

/**
 * Save catalog settings to localStorage
 */
export const saveCatalogSettings = (settings: CatalogSettings): void => {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error('Failed to save catalog settings:', error);
        throw error;
    }
};

/**
 * Reset catalog settings to defaults
 */
export const resetCatalogSettings = (): void => {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Failed to reset catalog settings:', error);
        throw error;
    }
};

/**
 * Get default plan for an unknown category
 */
export const getDefaultPlan = (): ConsolePlan => ({
    daily: { price: 500, features: ["Standard Equipment", "24h Support", "Express Pickup"] },
    weekly: { price: 3000, features: ["Standard Equipment", "24h Support", "Free Delivery"] },
    monthly: { price: 8000, features: ["Standard Equipment", "24h Support", "Free Delivery", "Priority Swap"] }
});
