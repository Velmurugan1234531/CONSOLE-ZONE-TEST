
import { createClient } from "@/lib/supabase/client";
import { SaleOrder, OrderStatus } from "@/types/commerce";

const ORDER_TABLE = "orders";
const PRODUCT_TABLE = "products";

export const OrderEngine = {
    /**
     * Step 2: Customer Places Order
     */
    createOrder: async (orderData: Omit<SaleOrder, 'orderId' | 'createdAt' | 'updatedAt'>): Promise<string> => {
        const supabase = createClient();
        try {
            // Smart Automation check could go here
            const { data, error } = await supabase
                .from(ORDER_TABLE)
                .insert({
                    ...orderData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            return data.id;
        } catch (error) {
            console.error("Error creating order:", error);
            throw error;
        }
    },

    /**
     * Step 3: Order Processing & Status Updates
     */
    updateOrderStatus: async (orderId: string, newStatus: OrderStatus): Promise<void> => {
        const supabase = createClient();
        const { error } = await supabase
            .from(ORDER_TABLE)
            .update({
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId);

        if (error) throw error;
    },

    /**
     * Payment Success Handler (Triggers Smart Automation)
     * IF payment = success AND stock > 0 THEN auto confirm
     */
    processPaymentSuccess: async (orderId: string, transactionId: string) => {
        const supabase = createClient();

        // Supabase doesn't support complex client-side transactions broadly like Firestore client SDK.
        // We typically use RPC calls for transactions or careful sequential operations.
        // For now, we will do sequential checks.

        // 1. Fetch Order
        const { data: order, error: orderError } = await supabase
            .from(ORDER_TABLE)
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError || !order) throw new Error("Order not found");

        const saleOrder = order as any; // Cast for now, handle types better ideally

        // 2. Check Stock for all items
        let allStockAvailable = true;
        // Optimization: Fetch all products in one go if possible, or loop.
        // Loop for simplicity now.
        for (const item of saleOrder.items) {
            const { data: prod } = await supabase
                .from(PRODUCT_TABLE)
                .select('stock')
                .eq('id', item.productId)
                .single();

            const currentStock = prod?.stock || 0;

            if (currentStock < item.quantity) {
                allStockAvailable = false;
                break;
            }
        }

        const updates: any = {
            payment_status: 'paid', // Schema matches
            updated_at: new Date().toISOString()
        };

        if (allStockAvailable) {
            // Auto Confirm & Deduct Stock
            updates.status = 'CONFIRMED';
            // updates['metadata.autoConfirmed'] = true; // Need to merge metadata manually
            updates.metadata = { ...(saleOrder.metadata || {}), autoConfirmed: true };

            for (const item of saleOrder.items) {
                // Decrement stock.
                // Ideally use RPC for atomic decrement: await supabase.rpc('decrement_stock', { p_id: item.productId, qty: item.quantity })
                // For now, read-modify-write (potential race condition but acceptable for this stage)
                const { data: prod } = await supabase
                    .from(PRODUCT_TABLE)
                    .select('stock')
                    .eq('id', item.productId)
                    .single();

                if (prod) {
                    await supabase
                        .from(PRODUCT_TABLE)
                        .update({
                            stock: Math.max(0, prod.stock - item.quantity),
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', item.productId);
                }
            }
        } else {
            // Out of Stock Logic -> Auto Refund or Manual Review
            updates.status = 'cancelled'; // or 'CANCELLED'
            updates.metadata = {
                ...(saleOrder.metadata || {}),
                failureReason: "Stock mismatch during payment"
            };
            // Trigger Auto-Refund Logic Here
        }

        await supabase
            .from(ORDER_TABLE)
            .update(updates)
            .eq('id', orderId);
    }
};
