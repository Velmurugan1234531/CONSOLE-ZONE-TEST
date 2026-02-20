import { db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    orderBy,
    doc,
    getDoc,
    updateDoc,
    addDoc,
    deleteDoc,
    writeBatch
} from "firebase/firestore";
import { safeGetDocs, safeGetDoc } from "@/utils/firebase-utils";

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

// DEMO DATA for testing without Supabase/Firestore
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
    try {
        const catalogRef = collection(db, "catalog_settings");
        const q = query(catalogRef, orderBy("display_order", "asc"));
        const snapshot = await safeGetDocs(q);

        if (snapshot.empty) {
            console.warn("Firestore catalog empty, using demo fallback");
            return loadDemoSettings();
        }

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as CatalogSettings[];
    } catch (e) {
        console.warn("Catalog fetch Firestore failed:", e);
        return loadDemoSettings();
    }
};

export const getCatalogSettingsByCategory = async (category: string): Promise<CatalogSettings | null> => {
    try {
        const catalogRef = collection(db, "catalog_settings");
        const q = query(catalogRef, where("device_category", "==", category));
        const snapshot = await safeGetDocs(q);

        if (snapshot.empty) {
            return loadDemoSettings().find(c => c.device_category === category) || null;
        }

        const doc = snapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data()
        } as CatalogSettings;
    } catch (e) {
        console.warn(`Catalog category fetch failed for ${category}:`, e);
        return loadDemoSettings().find(c => c.device_category === category) || null;
    }
};

export const updateCatalogSettings = async (
    category: string,
    updates: Partial<CatalogSettings>
): Promise<CatalogSettings | null> => {
    try {
        const catalogRef = collection(db, "catalog_settings");
        const q = query(catalogRef, where("device_category", "==", category));
        const snapshot = await safeGetDocs(q);

        if (snapshot.empty) {
            console.error("Firestore update catalog failed: Category not found");
            // Fallback to demo update
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

        const catalogDoc = snapshot.docs[0];
        const docRef = doc(db, "catalog_settings", catalogDoc.id);
        await updateDoc(docRef, {
            ...updates,
            updated_at: new Date().toISOString()
        });

        return {
            id: catalogDoc.id,
            ...catalogDoc.data(),
            ...updates
        } as CatalogSettings;
    } catch (e) {
        console.error("Update catalog Firestore failed:", e);
        return null;
    }
};

export const createCatalogSettings = async (
    settings: Omit<CatalogSettings, 'id'>
): Promise<CatalogSettings | null> => {
    try {
        const docRef = await addDoc(collection(db, "catalog_settings"), {
            ...settings,
            created_at: new Date().toISOString()
        });

        return {
            id: docRef.id,
            ...settings
        } as CatalogSettings;
    } catch (e) {
        console.error("Create catalog Firestore failed:", e);
        // Fallback
        const newSetting: CatalogSettings = { ...settings, id: `demo-cat-${Date.now()}` };
        const currentSettings = loadDemoSettings();
        currentSettings.push(newSetting);
        persistDemoSettings(currentSettings);
        return newSetting;
    }
};

export const deleteCatalogSettings = async (category: string): Promise<boolean> => {
    try {
        const catalogRef = collection(db, "catalog_settings");
        const q = query(catalogRef, where("device_category", "==", category));
        const snapshot = await safeGetDocs(q);

        if (snapshot.empty) {
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

        await deleteDoc(doc(db, "catalog_settings", snapshot.docs[0].id));
        return true;
    } catch (e) {
        console.error("Delete catalog Firestore failed:", e);
        return false;
    }
};

export const renameCategory = async (
    oldCategory: string,
    newCategory: string
): Promise<boolean> => {
    try {
        const batch = writeBatch(db);

        // 1. Update catalog_settings
        const catalogRef = collection(db, "catalog_settings");
        const q = query(catalogRef, where("device_category", "==", oldCategory));
        const snapshot = await safeGetDocs(q);

        if (!snapshot.empty) {
            batch.update(doc(db, "catalog_settings", snapshot.docs[0].id), {
                device_category: newCategory,
                updated_at: new Date().toISOString()
            });
        }

        // 2. Update devices collection
        const devicesRef = collection(db, "devices");
        const devQ = query(devicesRef, where("category", "==", oldCategory));
        const devSnap = await safeGetDocs(devQ);

        devSnap.docs.forEach(deviceDoc => {
            batch.update(doc(db, "devices", deviceDoc.id), {
                category: newCategory
            });
        });

        await batch.commit();
        return true;
    } catch (e: any) {
        console.error(`Firestore renaming failure: ${e?.message || e}`);

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


