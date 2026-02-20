import { createClient } from "@/lib/supabase/client";
import { Order } from "@/types";

export const OrderService = {
    /**
     * Create a new secure order transaction.
     */
    createOrder: async (userId: string, items: any[], total: number) => {
        const supabase = createClient();
        try {
            const orderData = {
                id: `ORD-${Date.now()}`, // Generate ID client side or let UUID default if changed to UUID. Using text ID like old system for now.
                user_id: userId,
                total_amount: total,
                status: 'pending',
                payment_status: 'pending',
                items: items,
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('orders')
                .insert(orderData)
                .select()
                .single();

            if (error) throw error;
            return { ...orderData, id: data.id }; // Ensure ID is correct one
        } catch (error) {
            console.error("Error creating order:", error);
            throw error;
        }
    },

    /**
     * Get real-time status of an order.
     */
    getOrderStatus: async (orderId: string) => {
        const supabase = createClient();
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('status, tracking_id, payment_status')
                .eq('id', orderId)
                .single();

            if (data && !error) {
                return {
                    status: data.status,
                    tracking_id: data.tracking_id,
                    payment_status: data.payment_status
                };
            }
            return null;
        } catch (error) {
            console.error("Error fetching order status:", error);
            return null;
        }
    }
};

export async function getOrders(): Promise<Order[]> {
    const supabase = createClient();
    try {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                user:users!user_id(full_name, email)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            // Fallback or just return empty
            console.warn("Supabase fetch orders failed", error);
            return [];
        }

        const orders = data.map((d: any) => ({
            id: d.id,
            ...d,
            user: {
                full_name: d.user?.full_name || d.user?.email || 'Unknown User',
                email: d.user?.email || 'N/A'
            }
        })) as any as Order[];

        return orders;
    } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
    }
}
