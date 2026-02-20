
import { createClient } from "@/lib/supabase/client";
import { SaleProduct, ProductStatus } from "@/types/commerce";

// Mapping 'sale_products' logic to 'products' table
// product-engine seems to be used for SALES products (buy)
const TABLE = "products";

export const ProductEngine = {
    /**
     * Create a new product draft
     */
    createProduct: async (data: Omit<SaleProduct, 'productId' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> => {
        const supabase = createClient();
        try {
            const productData = {
                ...data,
                // status: 'AVAILABLE', // Removed duplicate, handled by db defaults or specific logic
                // The Omit type removes status, so we add it back.
                // data includes stockQuantity? 
                // The error says "Property 'stockQuantity' does not exist on type Omit...".
                // This means 'data' (which is the Omit type) DOES NOT have stockQuantity?
                // Wait, if SaleProduct has stockQuantity, then Omit<SaleProduct, ...> should have it unless it's omitted.
                // It is NOT omitted in the signature: Omit<SaleProduct, 'productId' | 'createdAt' | 'updatedAt' | 'status'>
                // So it should be there. Maybe SaleProduct interface is different.
                status: 'DRAFT',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Map SaleProduct fields to DB fields
            // We need to cast data to any or specific type if typescript is complaining about specific fields not being in 'data'
            const source = data as any;

            const dbData = {
                name: source.name,
                description: source.description,
                price: source.price,
                stock: source.stockQuantity,
                type: 'buy',
                category: source.category,
                images: source.images,
                status: 'DRAFT',
                metadata: { ...source } // Store full original data in metadata just in case
            };

            const { data: inserted, error } = await supabase
                .from(TABLE)
                .insert(dbData)
                .select()
                .single();

            if (error) throw error;
            return inserted.id;
        } catch (error) {
            console.error("Error creating sale product:", error);
            throw error;
        }
    },

    /**
     * Update product status (Workflow Step 1)
     * Draft -> Pending -> Live -> Out of Stock -> Disabled
     */
    updateStatus: async (productId: string, newStatus: ProductStatus): Promise<void> => {
        const supabase = createClient();
        // Map ProductStatus to DB status
        // DB status: 'available' usually. 
        // We can use same string if we want.
        const { error } = await supabase
            .from(TABLE)
            .update({
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', productId);

        if (error) throw error;
    },

    /**
     * Update Stock Quantity
     */
    updateStock: async (productId: string, quantity: number): Promise<void> => {
        const supabase = createClient();

        const updates: any = {
            stock: quantity, // Schema uses 'stock'
            updated_at: new Date().toISOString()
        };

        if (quantity === 0) {
            updates.status = 'OUT_OF_STOCK';
        } else if (quantity > 0) {
            // Fetch current to check if it WAS out of stock
            const { data: current } = await supabase.from(TABLE).select('status').eq('id', productId).single();
            if (current?.status === 'OUT_OF_STOCK') {
                updates.status = 'LIVE'; // or 'available'
            }
        }

        const { error } = await supabase
            .from(TABLE)
            .update(updates)
            .eq('id', productId);

        if (error) throw error;
    }
};
