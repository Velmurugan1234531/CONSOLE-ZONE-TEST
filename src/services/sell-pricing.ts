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
    setDoc
} from "firebase/firestore";
import { safeGetDocs, safeGetDoc } from "@/utils/firebase-utils";

export interface SellPricing {
    id: string;
    product_id: string;
    product_name: string;
    cash_price: number;
    credit_price: number;
    is_active: boolean;
    updated_at: string;
}

// Credit bonus multiplier (15% more for credits)
const CREDIT_BONUS_MULTIPLIER = 1.15;

/**
 * Calculate credit price from cash price
 */
export const calculateCreditPrice = (cashPrice: number): number => {
    return Math.round(cashPrice * CREDIT_BONUS_MULTIPLIER);
};

/**
 * Calculate cash price from credit price
 */
export const calculateCashPrice = (creditPrice: number): number => {
    return Math.round(creditPrice / CREDIT_BONUS_MULTIPLIER);
};

/**
 * Get sell pricing for a specific product
 */
export const getSellPricing = async (productId: string): Promise<SellPricing | null> => {
    try {
        const pricingRef = collection(db, "sell_pricing");
        const q = query(
            pricingRef,
            where("product_id", "==", productId),
            where("is_active", "==", true)
        );

        const snapshot = await safeGetDocs(q);
        if (snapshot.empty) {
            return null;
        }

        const pricingDoc = snapshot.docs[0];
        const pricingData = {
            id: pricingDoc.id,
            ...pricingDoc.data()
        } as SellPricing;

        // Phase 11: Apply Global Market Multiplier
        try {
            const { getMarketplaceSettings } = await import("./marketplace-settings");
            const marketSettings = await getMarketplaceSettings();
            const multiplier = marketSettings.multipliers?.buyback || 1.0;

            if (multiplier !== 1.0) {
                return {
                    ...pricingData,
                    cash_price: Math.round(pricingData.cash_price * multiplier),
                    credit_price: Math.round(pricingData.credit_price * multiplier)
                };
            }
        } catch (e) {
            console.warn("Sell Pricing: Failed to apply market multiplier", e);
        }

        return pricingData;
    } catch (e) {
        console.warn("Sell Pricing fetch failed (Firestore):", e);
        return null;
    }
};

/**
 * Get all sell pricing configurations
 */
export const getAllSellPricing = async (): Promise<SellPricing[]> => {
    try {
        const pricingRef = collection(db, "sell_pricing");
        const q = query(
            pricingRef,
            where("is_active", "==", true),
            orderBy("product_name", "asc")
        );

        const snapshot = await safeGetDocs(q);
        if (snapshot.empty) {
            return getDemoSellPricing();
        }

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as SellPricing[];
    } catch (error) {
        console.warn("Sell pricing fetch failed (Firestore), using demo data", error);
        return getDemoSellPricing();
    }
};

/**
 * Update sell pricing for a product (Admin function)
 */
export const updateSellPricing = async (
    productId: string,
    cashPrice: number,
    creditPrice?: number
): Promise<SellPricing | null> => {
    const finalCreditPrice = creditPrice || calculateCreditPrice(cashPrice);

    const pricingUpdate = {
        cash_price: cashPrice,
        credit_price: finalCreditPrice,
        updated_at: new Date().toISOString()
    };

    try {
        const pricingRef = collection(db, "sell_pricing");
        const q = query(
            pricingRef,
            where("product_id", "==", productId),
            where("is_active", "==", true)
        );

        const snapshot = await safeGetDocs(q);
        if (snapshot.empty) {
            throw new Error("Pricing record not found for update");
        }

        const docRef = doc(db, "sell_pricing", snapshot.docs[0].id);
        await updateDoc(docRef, pricingUpdate);

        return {
            id: snapshot.docs[0].id,
            ...snapshot.docs[0].data(),
            ...pricingUpdate
        } as SellPricing;
    } catch (error: any) {
        throw new Error(`Firestore update failed: ${error.message}`);
    }
};

/**
 * Create sell pricing for a product (Admin function)
 */
export const createSellPricing = async (
    productId: string,
    productName: string,
    cashPrice: number,
    creditPrice?: number
): Promise<SellPricing> => {
    const finalCreditPrice = creditPrice || calculateCreditPrice(cashPrice);

    const pricing = {
        product_id: productId,
        product_name: productName,
        cash_price: cashPrice,
        credit_price: finalCreditPrice,
        is_active: true,
        updated_at: new Date().toISOString()
    };

    try {
        const docRef = await addDoc(collection(db, "sell_pricing"), pricing);
        return {
            id: docRef.id,
            ...pricing
        } as SellPricing;
    } catch (error: any) {
        throw new Error(`Firestore insert failed: ${error.message}`);
    }
};

/**
 * Delete/deactivate sell pricing (Admin function)
 */
export const deleteSellPricing = async (productId: string): Promise<void> => {
    try {
        const pricingRef = collection(db, "sell_pricing");
        const q = query(
            pricingRef,
            where("product_id", "==", productId),
            where("is_active", "==", true)
        );

        const snapshot = await safeGetDocs(q);
        if (snapshot.empty) return;

        const docRef = doc(db, "sell_pricing", snapshot.docs[0].id);
        await updateDoc(docRef, { is_active: false });
    } catch (error: any) {
        throw new Error(`Firestore delete (soft) failed: ${error.message}`);
    }
};

/**
 * Demo sell pricing data
 */
function getDemoSellPricing(): SellPricing[] {
    return [
        {
            id: 'sp-001',
            product_id: 'ps5-console',
            product_name: 'PlayStation 5 Console',
            cash_price: 35000,
            credit_price: 40250, // 15% bonus
            is_active: true,
            updated_at: new Date().toISOString()
        },
        {
            id: 'sp-002',
            product_id: 'ps4-pro',
            product_name: 'PlayStation 4 Pro 1TB',
            cash_price: 18000,
            credit_price: 20700,
            is_active: true,
            updated_at: new Date().toISOString()
        },
        {
            id: 'sp-003',
            product_id: 'xbox-series-x',
            product_name: 'Xbox Series X',
            cash_price: 32000,
            credit_price: 36800,
            is_active: true,
            updated_at: new Date().toISOString()
        },
        {
            id: 'sp-004',
            product_id: 'dualsense',
            product_name: 'DualSense Controller',
            cash_price: 2500,
            credit_price: 2875,
            is_active: true,
            updated_at: new Date().toISOString()
        },
        {
            id: 'sp-005',
            product_id: 'tlou-part-1',
            product_name: 'PlayStation 5 Console',
            cash_price: 2800,
            credit_price: 3220,
            is_active: true,
            updated_at: new Date().toISOString()
        },
        {
            id: 'sp-006',
            product_id: 'red-dead-2',
            product_name: 'Red Dead Redemption 2 - PS4',
            cash_price: 1500,
            credit_price: 1725,
            is_active: true,
            updated_at: new Date().toISOString()
        },
        {
            id: 'sp-007',
            product_id: 'rtx-3090',
            product_name: 'MSI RTX 3090 Ti 24GB',
            cash_price: 85000,
            credit_price: 97750,
            is_active: true,
            updated_at: new Date().toISOString()
        },
        {
            id: 'sp-008',
            product_id: 'i9-12900k',
            product_name: 'Intel Core i9 12900K',
            cash_price: 35000,
            credit_price: 40250,
            is_active: true,
            updated_at: new Date().toISOString()
        }
    ];
}

/**
 * Bulk import sell pricing from CSV/JSON (Admin function)
 */
export const bulkImportPricing = async (pricingData: Array<{
    product_id: string;
    product_name: string;
    cash_price: number;
}>): Promise<{ success: number; failed: number }> => {
    let success = 0;
    let failed = 0;

    for (const item of pricingData) {
        try {
            await createSellPricing(item.product_id, item.product_name, item.cash_price);
            success++;
        } catch (error) {
            console.error(`Failed to import pricing for ${item.product_id}`, error);
            failed++;
        }
    }

    return { success, failed };
};
