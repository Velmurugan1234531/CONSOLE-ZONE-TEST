import { db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    getDoc,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    increment
} from "firebase/firestore";
import { safeGetDocs, safeGetDoc } from "@/utils/firebase-utils";

export interface PromotionalOffer {
    id: string;
    code: string;
    title: string;
    description: string | null;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_rental_days: number;
    max_uses: number | null;
    current_uses: number;
    valid_from: string;
    valid_until: string | null;
    is_active: boolean;
    applicable_categories: string[] | null;
}

export interface OfferValidationResult {
    is_valid: boolean;
    discount_type: 'percentage' | 'fixed' | null;
    discount_value: number | null;
    message: string;
}

const COLLECTION = 'promotional_offers';

// DEMO DATA for testing/fallback
const DEMO_OFFERS: PromotionalOffer[] = [
    {
        id: "demo-offer-1",
        code: "FIRST10",
        title: "First Time User Discount",
        description: "Get 10% off your first rental",
        discount_type: "percentage",
        discount_value: 10,
        min_rental_days: 1,
        max_uses: null,
        current_uses: 0,
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        applicable_categories: null
    },
    {
        id: "demo-offer-2",
        code: "WEEKEND50",
        title: "Weekend Special",
        description: "Flat ₹50 off on weekend rentals",
        discount_type: "fixed",
        discount_value: 50,
        min_rental_days: 2,
        max_uses: 100,
        current_uses: 15,
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        applicable_categories: ["PS5", "Xbox"]
    },
    {
        id: "demo-offer-3",
        code: "MONTHLY20",
        title: "Monthly Plan Discount",
        description: "20% off on monthly rentals",
        discount_type: "percentage",
        discount_value: 20,
        min_rental_days: 28,
        max_uses: null,
        current_uses: 0,
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        applicable_categories: null
    }
];

export const getAllOffers = async (): Promise<PromotionalOffer[]> => {
    try {
        const offersRef = collection(db, COLLECTION);
        const q = query(offersRef, orderBy('valid_from', 'desc'));
        const snapshot = await safeGetDocs(q);

        if (snapshot.empty) {
            return DEMO_OFFERS;
        }

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as PromotionalOffer[];
    } catch (e) {
        console.warn("Firestore offers fetch failed (using demo fallback):", e);
        return DEMO_OFFERS;
    }
};

export const getActiveOffers = async (): Promise<PromotionalOffer[]> => {
    try {
        const now = new Date().toISOString();
        const offersRef = collection(db, COLLECTION);
        // Firestore doesn't support OR queries across different fields easily with complex filters
        // Fetch active ones and filter by date client-side for simplicity/resilience
        const q = query(offersRef, where('is_active', '==', true));
        const snapshot = await safeGetDocs(q);

        const offers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as PromotionalOffer[];

        const activeOffers = offers.filter(offer =>
            new Date(offer.valid_from) <= new Date() &&
            (!offer.valid_until || new Date(offer.valid_until) >= new Date())
        );

        if (activeOffers.length === 0) {
            return DEMO_OFFERS.filter(offer =>
                offer.is_active &&
                new Date(offer.valid_from) <= new Date() &&
                (!offer.valid_until || new Date(offer.valid_until) >= new Date())
            );
        }

        return activeOffers;
    } catch (e) {
        return DEMO_OFFERS;
    }
};

export const validateOfferCode = async (
    code: string,
    category: string,
    rentalDays: number
): Promise<OfferValidationResult> => {
    let offer: PromotionalOffer | undefined;

    try {
        const offersRef = collection(db, COLLECTION);
        const q = query(offersRef, where('code', '==', code.toUpperCase()));
        const snapshot = await safeGetDocs(q);

        if (!snapshot.empty) {
            const docSnap = snapshot.docs[0];
            offer = { id: docSnap.id, ...docSnap.data() } as PromotionalOffer;
        }
    } catch (e) {
        console.error("Error fetching offer for validation (Firestore):", e);
    }

    if (!offer) {
        // Check demo offers if not found in DB
        offer = DEMO_OFFERS.find(o => o.code.toUpperCase() === code.toUpperCase());
    }

    if (!offer) {
        return {
            is_valid: false,
            discount_type: null,
            discount_value: null,
            message: "Invalid offer code"
        };
    }

    if (!offer.is_active) {
        return {
            is_valid: false,
            discount_type: null,
            discount_value: null,
            message: "Offer is no longer active"
        };
    }

    const now = new Date();
    if (new Date(offer.valid_from) > now || (offer.valid_until && new Date(offer.valid_until) < now)) {
        return {
            is_valid: false,
            discount_type: null,
            discount_value: null,
            message: "Offer has expired"
        };
    }

    if (offer.max_uses && offer.current_uses >= offer.max_uses) {
        return {
            is_valid: false,
            discount_type: null,
            discount_value: null,
            message: "Offer has reached maximum usage limit"
        };
    }

    if (rentalDays < offer.min_rental_days) {
        return {
            is_valid: false,
            discount_type: null,
            discount_value: null,
            message: `Minimum rental period of ${offer.min_rental_days} days required`
        };
    }

    if (offer.applicable_categories && offer.applicable_categories.length > 0) {
        if (!offer.applicable_categories.includes(category)) {
            return {
                is_valid: false,
                discount_type: null,
                discount_value: null,
                message: "Offer not applicable to this device category"
            };
        }
    }

    return {
        is_valid: true,
        discount_type: offer.discount_type,
        discount_value: offer.discount_value,
        message: "Offer applied successfully"
    };
};

export const createOffer = async (offerData: Omit<PromotionalOffer, 'id' | 'current_uses'>): Promise<PromotionalOffer | null> => {
    try {
        const newOffer = {
            ...offerData,
            code: offerData.code.toUpperCase(),
            current_uses: 0,
            created_at: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, COLLECTION), newOffer);
        const snapshot = await getDoc(docRef);

        return { id: snapshot.id, ...snapshot.data() } as PromotionalOffer;
    } catch (error: any) {
        console.error(`Error creating offer (Firestore): ${error.message || error}`);
        throw error;
    }
};

export const updateOffer = async (id: string, updates: Partial<PromotionalOffer>): Promise<PromotionalOffer | null> => {
    try {
        const docRef = doc(db, COLLECTION, id);
        const finalUpdates = { ...updates };
        if (updates.code) finalUpdates.code = updates.code.toUpperCase();

        await updateDoc(docRef, finalUpdates);
        const snapshot = await getDoc(docRef);
        return { id: snapshot.id, ...snapshot.data() } as PromotionalOffer;
    } catch (error: any) {
        console.error(`Error updating offer (Firestore): ${error.message || error}`);
        throw error;
    }
};

export const deleteOffer = async (id: string): Promise<boolean> => {
    try {
        await deleteDoc(doc(db, COLLECTION, id));
        return true;
    } catch (error: any) {
        console.error(`Error deleting offer (Firestore): ${error.message || error}`);
        throw error;
    }
};

export const incrementOfferUsage = async (code: string): Promise<void> => {
    try {
        const offersRef = collection(db, COLLECTION);
        const q = query(offersRef, where('code', '==', code.toUpperCase()));
        const snapshot = await safeGetDocs(q);

        if (!snapshot.empty) {
            const docRef = doc(db, COLLECTION, snapshot.docs[0].id);
            await updateDoc(docRef, {
                current_uses: increment(1)
            });
        }
    } catch (error: any) {
        console.error(`Error incrementing offer usage (Firestore): ${error.message || error}`);
    }
};

// Calculate final price with offer applied
export const applyOffer = (
    basePrice: number,
    discountType: 'percentage' | 'fixed',
    discountValue: number
): { discount: number; finalPrice: number } => {
    let discount = 0;

    if (discountType === 'percentage') {
        discount = (basePrice * discountValue) / 100;
    } else {
        discount = discountValue;
    }

    // Ensure discount doesn't exceed base price
    discount = Math.min(discount, basePrice);

    return {
        discount,
        finalPrice: basePrice - discount
    };
};
