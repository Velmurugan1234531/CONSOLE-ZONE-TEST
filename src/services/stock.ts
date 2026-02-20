import { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import {
    collection,
    query,
    onSnapshot,
    getDocs
} from "firebase/firestore";
import { safeGetDocs } from "@/utils/firebase-utils";
import { DEMO_DEVICES } from "@/constants/demo-stock";
import { CONSOLE_IMAGES } from "@/constants/images";
import { Device } from "@/types";

export interface StockItem {
    id: string; // This will map to category (e.g., 'PS5', 'Xbox')
    name: string;
    total: number;
    rented: number;
    available: number;
    image: string;
    label?: string;
    lowStockAlert?: boolean;
    maxControllers?: number;
    extraControllerEnabled?: boolean;
}

const STOCK_KEY = 'CONSOLE_STOCK_DATA_V2';

// Helper to aggregate stock from a list of devices
const aggregateStock = (devices: Device[]): StockItem[] => {
    const aggregated = devices.reduce((acc: Record<string, StockItem>, device: Device) => {
        if (!device.category) return acc;
        if (device.status === 'Lost') return acc;

        const cat = device.category.trim().toLowerCase().replace(/\s+/g, '-');
        if (!acc[cat]) {
            acc[cat] = {
                id: cat,
                name: device.category,
                total: 0,
                rented: 0,
                available: 0,
                image: (['ps5', 'ps4', 'xbox', 'switch', 'vr', 'quest', 'meta'].some(type => cat.includes(type)))
                    ? `/assets/products/${cat}-console.png`
                    : CONSOLE_IMAGES.default.preview,
                label: device.category,
                lowStockAlert: true,
                maxControllers: 4,
                extraControllerEnabled: true
            };
        }

        acc[cat].total += 1;
        const isUnavailable = ['RENTED', 'MAINTENANCE', 'UNDER_REPAIR', 'Rented', 'Maintenance', 'Under-Repair'].includes(device.status);

        if (isUnavailable) {
            acc[cat].rented += 1;
        } else {
            acc[cat].available += 1;
        }

        return acc;
    }, {});

    return Object.values(aggregated);
};

let listeners: (() => void)[] = [];

function emitChange() {
    for (const listener of listeners) {
        listener();
    }
}

const getMergedDevices = (dbDevices: Device[] = []): Device[] => {
    let allDevices = [...dbDevices];

    if (typeof window !== 'undefined') {
        const localAdded = localStorage.getItem('DEMO_ADDED_DEVICES');
        if (localAdded) {
            try {
                const added = JSON.parse(localAdded);
                const newAdded = added.filter((a: Device) => !allDevices.some(d => d.serialNumber === a.serialNumber));
                allDevices = [...allDevices, ...newAdded];
            } catch (e) {
                console.error("Failed to parse local added devices", e);
            }
        }

        const localUpdates = localStorage.getItem('DEMO_UPDATED_DEVICES');
        if (localUpdates) {
            try {
                const updates = JSON.parse(localUpdates);
                allDevices = allDevices.map(d => {
                    const update = updates.find((u: Partial<Device>) => u.id === d.id);
                    return update ? { ...d, ...update } : d;
                });
            } catch (e) {
                console.error("Failed to parse local device updates", e);
            }
        }
    }

    if (allDevices.length === 0) return DEMO_DEVICES;
    return allDevices;
};

export const StockService = {
    useStock: () => {
        const [stock, setStock] = useState<StockItem[]>([]);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            setLoading(true);

            const devicesRef = collection(db, "devices");
            const q = query(devicesRef);

            // Firestore Realtime Subscription
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const dbDevices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Device));
                const allDevices = getMergedDevices(dbDevices);
                const result = aggregateStock(allDevices);

                setStock(result);
                setLoading(false);

                if (typeof window !== 'undefined') {
                    localStorage.setItem(STOCK_KEY, JSON.stringify(result));
                }
            }, (error) => {
                console.warn("Stock Firestore subscription error, using cache/demo:", error);
                const stored = typeof window !== 'undefined' ? localStorage.getItem(STOCK_KEY) : null;
                setStock(stored ? JSON.parse(stored) : aggregateStock(getMergedDevices([])));
                setLoading(false);
            });

            const listener = () => {
                // When local storage changes, we might want to re-process current Firestore data
                // but for now we just rely on onSnapshot for DB changes.
            };
            listeners.push(listener);
            window.addEventListener('storage', listener);

            return () => {
                unsubscribe();
                listeners = listeners.filter(l => l !== listener);
                window.removeEventListener('storage', listener);
            };
        }, []);

        return stock;
    },

    getItems: async (): Promise<StockItem[]> => {
        try {
            const devicesRef = collection(db, "devices");
            const snapshot = await safeGetDocs(query(devicesRef));
            const consoles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Device));

            return aggregateStock(getMergedDevices(consoles));
        } catch (e) {
            console.error("Stock.getItems error:", e);
            return aggregateStock(getMergedDevices([]));
        }
    },

    saveItems: (items: StockItem[]) => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(STOCK_KEY, JSON.stringify(items));
        emitChange();
    },

    updateUsage: async (id: string, delta: number) => {
        emitChange();
    }
};
