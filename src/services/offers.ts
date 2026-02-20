import { createClient } from "@/lib/supabase/client";

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
    const supabase = createClient();
    try {
        const { data, error } = await supabase
            .from('promotional_offers')
            .select('*')
            .order('valid_from', { ascending: false });

        if (error || !data || data.length === 0) {
            return DEMO_OFFERS;
        }

        return data as PromotionalOffer[];
    } catch (e) {
        console.warn("Offers fetch failed (using demo fallback):", e);
        return DEMO_OFFERS;
    }
};

export const getActiveOffers = async (): Promise<PromotionalOffer[]> => {
    const supabase = createClient();
    try {
        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from('promotional_offers')
            .select('*')
            .eq('is_active', true)
            .lte('valid_from', now)
            .or(`valid_until.is.null,valid_until.gte.${now}`);

        if (error || !data) {
            return DEMO_OFFERS.filter(offer =>
                offer.is_active &&
                new Date(offer.valid_from) <= new Date() &&
                (!offer.valid_until || new Date(offer.valid_until) >= new Date())
            );
        }

        return data as PromotionalOffer[];
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
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('promotional_offers')
            .select('*')
            .eq('code', code)
            .single();

        if (data) {
            offer = data as PromotionalOffer;
        }
    } catch (e) {
        console.error("Error fetching offer for validation:", e);
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
    const supabase = createClient();
    try {
        const newOffer = { ...offerData, current_uses: 0, created_at: new Date().toISOString() };
        const { data, error } = await supabase
            .from('promotional_offers')
            .insert(newOffer)
            .select()
            .single();

        if (error) {
            console.error(`Error creating offer: ${error.message}`);
            return null; // Should handle error better in UI
        }
        return data as PromotionalOffer;
    } catch (error: any) {
        console.error(`Error creating offer: ${error.message || error}`);
        throw error;
    }
};

export const updateOffer = async (id: string, updates: Partial<PromotionalOffer>): Promise<PromotionalOffer | null> => {
    const supabase = createClient();
    try {
        const { data, error } = await supabase
            .from('promotional_offers')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as PromotionalOffer;
    } catch (error: any) {
        console.error(`Error updating offer: ${error.message || error}`);
        throw error;
    }
};

export const deleteOffer = async (id: string): Promise<boolean> => {
    const supabase = createClient();
    try {
        const { error } = await supabase
            .from('promotional_offers')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error: any) {
        console.error(`Error deleting offer: ${error.message || error}`);
        throw error;
    }
};

export const incrementOfferUsage = async (code: string): Promise<void> => {
    const supabase = createClient();
    try {
        // Supabase doesn't have a direct 'increment' in client like Firebase
        // We'd typically use an RPC, but for now specific read-update or just rely on backend triggers?
        // Let's do simple read-update for now (optimistic concurrency issues ignored for MVP)
        const { data: offer } = await supabase.from('promotional_offers').select('id, current_uses').eq('code', code).single();
        if (offer) {
            await supabase.from('promotional_offers').update({ current_uses: offer.current_uses + 1 }).eq('id', offer.id);
        }
    } catch (error: any) {
        console.error(`Error incrementing offer usage: ${error.message || error}`);
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
