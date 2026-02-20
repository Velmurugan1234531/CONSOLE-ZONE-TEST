
const IS_CLIENT = typeof window !== 'undefined';
const KEY = 'CONTROLLER_SETTINGS';

export interface ControllerSettings {
    maxQuantity: number;
    pricing: {
        ps4: {
            DAILY: number;
            WEEKLY: number;
            MONTHLY: number;
        };
        ps5: {
            DAILY: number;
            WEEKLY: number;
            MONTHLY: number;
        };
    };
}

const DEFAULT_SETTINGS: ControllerSettings = {
    maxQuantity: 4,
    pricing: {
        ps4: {
            DAILY: 150,
            WEEKLY: 800,
            MONTHLY: 2500
        },
        ps5: {
            DAILY: 350,
            WEEKLY: 2000,
            MONTHLY: 5500
        }
    }
};

export const getControllerSettings = (): ControllerSettings => {
    if (!IS_CLIENT) return DEFAULT_SETTINGS;

    const stored = localStorage.getItem(KEY);
    if (stored) {
        try {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        } catch (e) {
            console.error("Failed to parse controller settings", e);
            return DEFAULT_SETTINGS;
        }
    }
    return DEFAULT_SETTINGS;
};

export const saveControllerSettings = (settings: ControllerSettings) => {
    if (!IS_CLIENT) return;
    localStorage.setItem(KEY, JSON.stringify(settings));
};

export const resetControllerSettings = () => {
    if (!IS_CLIENT) return;
    localStorage.removeItem(KEY);
};
