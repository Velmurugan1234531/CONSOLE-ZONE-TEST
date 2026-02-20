
import { createClient } from "@/lib/supabase/client";
import { RentalProduct } from "@/types/rental"; // Path updated from firebase to rental

const TABLE = "products";

export const RentalProductService = {
    /**
     * Fetch all active rental products.
     */
    getAllProducts: async (): Promise<RentalProduct[]> => {
        const supabase = createClient();
        try {
            const { data, error } = await supabase
                .from(TABLE)
                .select('*')
                .eq('type', 'rental') // Assuming 'rental' type for rental products based on previous context
                // .eq('isActive', true) // Schema has 'status' not 'isActive'.
                .eq('status', 'available'); // Assuming 'available' logic. Or check if 'isActive' existed in schema? No. 
            // Schema has status: 'available' as default.
            // Let's assume 'available' means active.

            if (error) {
                console.error("Error fetching products Supabase:", error);
                return [];
            }

            return data.map((doc: any) => ({
                productId: doc.id,
                name: doc.name,
                description: doc.description,
                rentalPricePerDay: doc.price, // Map price to rentalPricePerDay
                category: doc.category,
                images: doc.images,
                stockAvailable: doc.stock, // Map stock to stockAvailable
                isActive: doc.status === 'available',
                // Add specific rental fields if stored in metadata or distinct columns
                // Schema had: deposit_amount? No. 
                // We might need to handle extra fields in metadata if they are not in schema.
                // RentalProduct type has: depositAmount, gstPercent.
                // These might be in metadata or we need to look at schema again. 
                // Let's assume metadata for now if not in columns.
                depositAmount: doc.metadata?.depositAmount || 0,
                gstPercent: doc.metadata?.gstPercent || 18,

                ...doc, // spread safeguards
                id: doc.id // ensure id presence
            } as unknown as RentalProduct));
        } catch (error) {
            console.error("Error fetching products:", error);
            return [];
        }
    },

    /**
     * Get a single product by ID.
     */
    getProductById: async (productId: string): Promise<RentalProduct | null> => {
        const supabase = createClient();
        try {
            const { data, error } = await supabase
                .from(TABLE)
                .select('*')
                .eq('id', productId)
                .single();

            if (error || !data) {
                return null;
            }

            return {
                productId: data.id,
                name: data.name,
                description: data.description,
                rentalPricePerDay: data.price,
                stockAvailable: data.stock,
                isActive: data.status === 'available',
                depositAmount: data.metadata?.depositAmount || 0,
                gstPercent: data.metadata?.gstPercent || 18,
                category: data.category,
                images: data.images,
                ...data
            } as unknown as RentalProduct;
        } catch (error) {
            console.error("Error fetching product:", error);
            return null;
        }
    },

    /**
     * Create a new rental product listing.
     * RESTRICTED: Admin Only (Backend rules must enforce this).
     */
    createProduct: async (productData: Omit<RentalProduct, 'productId'>): Promise<string> => {
        const supabase = createClient();
        try {
            // Map RentalProduct to DB columns
            const dbData = {
                name: productData.name,
                description: productData.description,
                price: productData.rentalPricePerDay,
                stock: productData.stockAvailable,
                type: 'rental',
                category: productData.category,
                images: productData.images,
                status: productData.isActive ? 'available' : 'disabled',
                metadata: {
                    // productData includes depositAmount, gstPercent, etc.
                    // We store full object in metadata for extensibility
                    ...productData
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from(TABLE)
                .insert(dbData)
                .select()
                .single();

            if (error) throw error;
            return data.id;
        } catch (error) {
            console.error("Error creating product:", error);
            throw error;
        }
    },

    /**
     * Update stock or details.
     */
    updateProduct: async (productId: string, updates: Partial<RentalProduct>): Promise<void> => {
        const supabase = createClient();
        try {
            const dbUpdates: any = {
                updated_at: new Date().toISOString()
            };

            if (updates.name) dbUpdates.name = updates.name;
            if (updates.description) dbUpdates.description = updates.description;
            if (updates.rentalPricePerDay !== undefined) dbUpdates.price = updates.rentalPricePerDay;
            if (updates.stockAvailable !== undefined) dbUpdates.stock = updates.stockAvailable;
            if (updates.isActive !== undefined) dbUpdates.status = updates.isActive ? 'available' : 'disabled';
            if (updates.category) dbUpdates.category = updates.category;
            if (updates.images) dbUpdates.images = updates.images;

            // For metadata updates, we need to fetch existing, merge, and update.
            // Or just merge if Supabase supports jsonb merge update? 
            // Supabase/request update merges top level fields, but for jsonb it replaces unless we use specialized query or fetch-modify-save.
            // Let's do fetch-modify-save for metadata safety if needed, or just simplistic approach.
            // Given simpler scope, let's assume partial updates to simple columns are most common.
            // If metadata fields like depositAmount update, we should handle it.

            if (updates.depositAmount !== undefined || updates.gstPercent !== undefined) {
                const { data: current } = await supabase.from(TABLE).select('metadata').eq('id', productId).single();
                const currentMeta = current?.metadata || {};
                dbUpdates.metadata = {
                    ...currentMeta,
                    ...(updates.depositAmount !== undefined ? { depositAmount: updates.depositAmount } : {}),
                    ...(updates.gstPercent !== undefined ? { gstPercent: updates.gstPercent } : {})
                };
            }

            const { error } = await supabase
                .from(TABLE)
                .update(dbUpdates)
                .eq('id', productId);

            if (error) throw error;
        } catch (error) {
            console.error("Error updating product:", error);
            throw error;
        }
    }
};
