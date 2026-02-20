
const IS_CLIENT = typeof window !== 'undefined';
const KEY = 'BUSINESS_SETTINGS';

export interface BusinessSettings {
    logistics: {
        deliveryFee: number;
        freeDeliveryThreshold: number;
        expressDeliveryMultiplier: number; // For same-day delivery
    };
    finance: {
        taxRate: number; // Percentage
        platformFee: number; // Service fee per transaction
        lateFeePerDay: number; // Enforcement
    };
    general: {
        currency: string;
        supportEmail: string;
    };
}

const DEFAULT_SETTINGS: BusinessSettings = {
    logistics: {
        deliveryFee: 150,
        freeDeliveryThreshold: 2000,
        expressDeliveryMultiplier: 1.5
    },
    finance: {
        taxRate: 18,
        platformFee: 50,
        lateFeePerDay: 500
    },
    general: {
        currency: 'INR',
        supportEmail: 'support@consolezone.com'
    }
};

export const getBusinessSettings = (): BusinessSettings => {
    if (!IS_CLIENT) return DEFAULT_SETTINGS;

    const stored = localStorage.getItem(KEY);
    if (stored) {
        try {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        } catch (e) {
            console.error("Failed to parse business settings", e);
            return DEFAULT_SETTINGS;
        }
    }
    return DEFAULT_SETTINGS;
};

export const saveBusinessSettings = (settings: BusinessSettings) => {
    if (!IS_CLIENT) return;
    localStorage.setItem(KEY, JSON.stringify(settings));
};

export const resetBusinessSettings = () => {
    if (!IS_CLIENT) return;
    localStorage.removeItem(KEY);
};
