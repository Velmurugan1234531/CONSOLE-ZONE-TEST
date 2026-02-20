

import { db } from "@/lib/firebase";
import {
    collection,
    getDocs,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy
} from "firebase/firestore";
import { safeGetDocs, safeGetDoc } from "@/utils/firebase-utils";
import { Product, ProductType, ProductCategory } from "@/types";

// Export types for usage in other files
export type { Product, ProductType, ProductCategory };

const PRODUCTS_STORAGE_KEY = 'console_zone_products_v2';
const COLLECTION_NAME = 'products';

export const DEMO_PRODUCTS: Product[] = [
    {
        id: "978c1aa9-a069-46a5-b14a-2bcc8d031f10",
        name: "Sony PS5 Slim Disc Edition (New)",
        description: "Latest Slim model with 1TB SSD and detachable disc drive.",
        price: 54990,
        type: 'buy',
        category: 'PS5',
        stock: 5,
        images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?q=80&w=600"],
        status: 'available',
        created_at: new Date().toISOString()
    },
    {
        id: "xbox-series-x-001",
        name: "Xbox Series X 1TB",
        description: "The fastest, most powerful Xbox ever. 4K gaming at up to 120 FPS.",
        price: 49990,
        type: 'buy',
        category: 'Xbox',
        stock: 10,
        images: ["https://images.unsplash.com/photo-1621259182902-3b836c824e22?q=80&w=600"],
        status: 'available',
        created_at: new Date().toISOString()
    },
    {
        id: "ps5-controller-dual-sense",
        name: "PS5 DualSense Wireless Controller",
        description: "Immersive haptic feedback, dynamic adaptive triggers, and a built-in microphone.",
        price: 5990,
        type: 'buy',
        category: 'Accessory',
        stock: 25,
        images: ["https://images.unsplash.com/photo-1590650046871-92c887180603?q=80&w=600"],
        status: 'available',
        created_at: new Date().toISOString()
    },
    {
        id: "meta-quest-3",
        name: "Meta Quest 3 128GB",
        description: "Breakthrough mixed reality. 4K+ Infinite Display. Powerful new processor.",
        price: 2499,
        type: 'rent',
        category: 'VR',
        stock: 3,
        images: ["https://images.unsplash.com/photo-1622979135225-d2ba269fb1bd?q=80&w=600"],
        status: 'available',
        created_at: new Date().toISOString()
    },
    {
        id: "ps5-disc-rental",
        name: "Sony PS5 Disc Edition",
        description: "Experience lightning-fast loading with an ultra-high speed SSD, deeper immersion with haptic feedback.",
        price: 1999,
        type: 'rent',
        category: 'PS5',
        stock: 8,
        images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?q=80&w=600"],
        status: 'available',
        created_at: new Date().toISOString()
    },
    {
        id: "xbox-series-x-rental",
        name: "Xbox Series X 1TB",
        description: "The fastest, most powerful Xbox ever. Experience true 4K gaming at up to 120 FPS.",
        price: 1899,
        type: 'rent',
        category: 'Xbox',
        stock: 6,
        images: ["https://images.unsplash.com/photo-1621259182902-3b836c824e22?q=80&w=600"],
        status: 'available',
        created_at: new Date().toISOString()
    },
    {
        id: "nintendo-switch-oled-rental",
        name: "Nintendo Switch OLED",
        description: "Vibrant 7-inch OLED screen. Enhanced audio. 64GB internal storage.",
        price: 1299,
        type: 'rent',
        category: 'Handheld',
        stock: 10,
        images: ["https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?q=80&w=600"],
        status: 'available',
        created_at: new Date().toISOString()
    },
    {
        id: "gaming-monitor-rental",
        name: "ASUS ROG 27\" 144Hz Gaming Monitor",
        description: "1440p QHD display, 1ms response time, G-SYNC compatible.",
        price: 999,
        type: 'rent',
        category: 'Accessory',
        stock: 5,
        images: ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=600"],
        status: 'available',
        created_at: new Date().toISOString()
    },
    {
        id: "gaming-headset-rental",
        name: "SteelSeries Arctis Pro Wireless",
        description: "Lossless 2.4G wireless + Bluetooth. Hi-Res audio certified.",
        price: 599,
        type: 'rent',
        category: 'Accessory',
        stock: 12,
        images: ["https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=600"],
        status: 'available',
        created_at: new Date().toISOString()
    },
    {
        id: "gaming-headset-pro",
        name: "Razer BlackShark V2 Pro",
        description: "HyperSpeed Wireless Technology. TriForce Titanium 50mm Drivers.",
        price: 11990,
        type: 'buy',
        category: 'Accessory',
        stock: 15,
        images: ["https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=600"],
        status: 'available',
        created_at: new Date().toISOString()
    },
    // Trade-In Items (Sell Page)
    {
        id: "ps4-pro-1tb-tradein",
        name: "Sony PS4 Pro 1TB Console",
        description: "Trade in your old PS4 Pro for cash or credit.",
        price: 18000,
        type: 'trade-in',
        category: 'PS4',
        stock: 0,
        images: ["https://images.unsplash.com/photo-1507457379470-08b800bebc67?q=80&w=600"],
        status: 'available',
        created_at: new Date().toISOString()
    },
    {
        id: "xbox-one-x-tradein",
        name: "Xbox One X 1TB Console",
        description: "Sell your Xbox One X. Best value guaranteed.",
        price: 16500,
        type: 'trade-in',
        category: 'Xbox',
        stock: 0,
        images: ["https://images.unsplash.com/photo-1605901309584-818e25960b8f?q=80&w=600"],
        status: 'available',
        created_at: new Date().toISOString()
    },
    {
        id: "nintendo-switch-v2-tradein",
        name: "Nintendo Switch V2 (Neon)",
        description: "Get great value for your Switch console.",
        price: 14000,
        type: 'trade-in',
        category: 'Handheld',
        stock: 0,
        images: ["https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?q=80&w=600"],
        status: 'available',
        created_at: new Date().toISOString()
    },
    {
        id: "xbox-series-s-tradein",
        name: "Xbox Series S Digital",
        description: "Upgrade to Series X by trading in your Series S.",
        price: 19000,
        type: 'trade-in',
        category: 'Xbox',
        stock: 0,
        images: ["https://images.unsplash.com/photo-1621259182902-3b836c824e22?q=80&w=600"],
        status: 'available',
        created_at: new Date().toISOString()
    }
];

// Helper to filter products (Client Data)
const filterProducts = (products: Product[], type?: ProductType, category?: string, includeHidden = false) => {
    let filtered = products;
    if (!includeHidden) {
        filtered = filtered.filter(p => p.status !== 'hidden');
    }
    if (type) {
        filtered = filtered.filter(p => p.type === type);
    }
    if (category && category !== 'All') {
        if (category === 'Consoles') filtered = filtered.filter(p => ['PS5', 'Xbox', 'PS4'].includes(p.category));
        else if (category === 'VR') filtered = filtered.filter(p => p.category === 'VR');
        else if (category === 'Controllers') filtered = filtered.filter(p => p.category === 'Accessory');
        else filtered = filtered.filter(p => p.category === category);
    }
    return filtered;
};

// Map helper to ensure consistent image property
const mapProduct = (p: any): Product => ({
    ...p,
    image: p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600'
});

/**
 * Fetch products with Firebase + LocalStorage Fallback
 */
export const getProducts = async (type?: ProductType, category?: string, includeHidden: boolean = false): Promise<Product[]> => {
    let products: Product[] = [];

    // 1. Try Firebase Firestore
    try {
        const collectionRef = collection(db, COLLECTION_NAME);
        let q = query(collectionRef, orderBy('created_at', 'desc'));

        if (!includeHidden) {
            q = query(q, where('status', '!=', 'hidden'));
        }
        if (type) {
            q = query(q, where('type', '==', type));
        }

        const snapshot = await safeGetDocs(q); // Use safeGetDocs for offline timeout handling

        if (!snapshot.empty) {
            products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as Product[];
            // Sync to local storage for future offline access
            if (typeof window !== 'undefined' && !includeHidden) {
                localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
            }
        }
    } catch (error) {
        console.warn("Firestore fetch failed/using fallback:", error);
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
            if (stored) {
                products = JSON.parse(stored);
            } else {
                products = [...DEMO_PRODUCTS];
            }
        } else {
            products = [...DEMO_PRODUCTS];
        }
    }

    // 2. Client-side filtering (extra safety & complex categories)
    // Firestore might catch some, but complex "category groups" are safer to do here if query was broad.
    products = filterProducts(products, type, category, includeHidden);

    // 3. Apply Multipliers (Marketplace Settings)
    try {
        // Dynamic import to avoid cycles if any
        const { getMarketplaceSettings } = await import("./marketplace-settings");
        const marketSettings = getMarketplaceSettings();
        const multiplier = marketSettings.multipliers?.retail || 1.0;

        if (multiplier !== 1.0) {
            products = products.map(p => {
                if (p.type === 'buy') {
                    return { ...p, price: Math.round(p.price * multiplier) };
                }
                return p;
            });
        }
    } catch (e) {
        // ignore
    }

    return products.map(mapProduct);
};

export const getProductById = async (id: string): Promise<Product | null> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const snapshot = await safeGetDoc(docRef);

        if (!snapshot.exists()) throw new Error("Not found");
        return mapProduct({ id: snapshot.id, ...snapshot.data() });

    } catch (error) {
        // Fallback
        if (typeof window !== 'undefined') {
            const stored = JSON.parse(localStorage.getItem(PRODUCTS_STORAGE_KEY) || '[]');
            let found = stored.find((p: Product) => p.id === id);
            if (!found) found = DEMO_PRODUCTS.find(p => p.id === id);
            return found ? mapProduct(found) : null;
        }
        return null;
    }
};

export const updateProductStock = async (id: string, newStock: number) => {
    // Optimistic update local first if needed, but let's stick to simple async
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, { stock: newStock });
    } catch (e) {
        console.error("Failed to update product stock:", e);
    }
};

export const createProduct = async (productData: Partial<Product>) => {
    const images = productData.images || (productData.image ? [productData.image] : ['https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600']);
    const formatted: any = {
        ...productData,
        images,
        created_at: new Date().toISOString()
    };

    // Fallback ID generation if offline
    if (typeof window !== 'undefined' && !navigator.onLine) {
        console.warn("Offline: Creating product locally");
        const offlineProduct = { id: `offline-${Date.now()}`, ...formatted };
        // In a real app we'd queue this. For now, we return it to UI.
        // And maybe save to local storage
        const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
        const existing = stored ? JSON.parse(stored) : [...DEMO_PRODUCTS];
        localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify([offlineProduct, ...existing]));
        return mapProduct(offlineProduct);
    }

    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), formatted);
        return mapProduct({ id: docRef.id, ...formatted });
    } catch (error) {
        console.warn("Firestore create failed, using local:", error);
        // Fallback
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
            const existing = stored ? JSON.parse(stored) : [...DEMO_PRODUCTS];
            const p = { id: crypto.randomUUID(), ...formatted };
            localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify([p, ...existing])); // Prepend
            return mapProduct(p);
        }
        throw error;
    }
};

export const createProductsBatch = async (productsData: Partial<Product>[]) => {
    // Firestore doesn't have a simple 'insertMany' like SQL, we use batch or parallel writes.
    // For simplicity, we'll do parallel awaits. 
    // In production, use writeBatch()

    const results = [];
    for (const p of productsData) {
        try {
            const res = await createProduct(p);
            results.push(res);
        } catch (e) {
            console.error("Batch item failed", e);
        }
    }
    return results;
};

export const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, productData);
        // Return updated data (simulated since updateDoc returns void)
        return mapProduct({ id, ...productData }); // This is partial, technically, but UI usually updates optimistically
    } catch (error) {
        console.warn("Firestore update failed, using local:", error);
        // Local fallback
        if (typeof window !== 'undefined') {
            const stored = JSON.parse(localStorage.getItem(PRODUCTS_STORAGE_KEY) || '[]');
            const updated = stored.map((p: Product) => p.id === id ? { ...p, ...productData } : p);
            localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updated));
            const found = updated.find((p: Product) => p.id === id);
            return found ? mapProduct(found) : null;
        }
        throw error;
    }
};

export const deleteProduct = async (id: string) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
    } catch (error) {
        console.warn("Firestore delete failed:", error);
    }

    // Always try to remove from local mirror
    if (typeof window !== 'undefined') {
        const stored = JSON.parse(localStorage.getItem(PRODUCTS_STORAGE_KEY) || '[]');
        const updated = stored.filter((p: Product) => p.id !== id);
        localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updated));
    }
};
