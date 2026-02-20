import { createClient } from "@/lib/supabase/client";
import { SaleRecord } from "@/types";

export const getSales = async (): Promise<SaleRecord[]> => {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('sales')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.warn("Error fetching sales Supabase (fallback to empty):", error.message);
            return [];
        }

        return data.map((sale: any) => ({
            id: sale.id,
            items: sale.items,
            total_amount: Number(sale.total_amount),
            payment_method: sale.payment_method,
            status: sale.status,
            date: sale.created_at,
            timestamp: new Date(sale.created_at).getTime()
        })) as SaleRecord[];

    } catch (error: any) {
        console.warn(`Error fetching sales:`, error?.message || error);
        return [];
    }
};

export const getDailyRevenue = async (): Promise<number> => {
    const supabase = createClient();

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
            .from('sales')
            .select('total_amount')
            .gte('created_at', today.toISOString());

        if (error) throw error;

        return data.reduce((sum, sale) => sum + (Number(sale.total_amount) || 0), 0);
    } catch (error: any) {
        console.warn(`Error fetching daily revenue:`, error?.message || error);
        return 0;
    }
};

export const getMonthlyRevenue = async (): Promise<number> => {
    const supabase = createClient();

    try {
        const firstDay = new Date();
        firstDay.setDate(1);
        firstDay.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
            .from('sales')
            .select('total_amount')
            .gte('created_at', firstDay.toISOString());

        if (error) throw error;

        return data.reduce((sum, sale) => sum + (Number(sale.total_amount) || 0), 0);
    } catch (error: any) {
        console.warn(`Error fetching monthly revenue:`, error?.message || error);
        return 0;
    }
};

export const recordSale = async (sale: Omit<SaleRecord, 'id' | 'date' | 'timestamp'>): Promise<boolean> => {
    const supabase = createClient();

    try {
        const newSale = {
            id: `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate ID client side or let UUID default if changed to UUID
            user_id: sale.user_id,
            items: sale.items,
            total_amount: sale.total_amount,
            payment_method: sale.payment_method,
            status: sale.status || 'completed',
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('sales')
            .insert(newSale)
            .select()
            .single();

        if (error) throw error;

        // Automated Notification
        if (sale.user_id) {
            try {
                const { sendNotification } = await import("./notifications");
                await sendNotification({
                    user_id: sale.user_id,
                    type: 'success',
                    title: 'Purchase Successful!',
                    message: `Thank you for your purchase of ₹${sale.total_amount}. Your transaction id is ${data.id}.`
                });
            } catch (e: any) {
                console.warn(`Failed to send sale notification: ${e?.message || e}`);
            }
        }

        return true;
    } catch (error: any) {
        console.error(`Error recording sale: ${error.message || error}`);
        return false;
    }
};

export const getUserSales = async (userId: string): Promise<SaleRecord[]> => {
    // Demo Mode Support
    if (userId === 'demo-user-123') {
        // Mock a purchase
        return [{
            id: "sale-demo-1",
            user_id: userId,
            items: [{
                product_id: "prod-xbox",
                product_name: "Xbox Wireless Controller",
                price: 5490,
                quantity: 1,
                total: 5490
            }],
            total_amount: 5490,
            payment_method: 'upi',
            status: 'completed',
            date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            timestamp: Date.now() - 60 * 24 * 60 * 60 * 1000
        }] as any;
    }

    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('sales')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map((sale: any) => ({
            id: sale.id,
            items: sale.items,
            total_amount: Number(sale.total_amount),
            payment_method: sale.payment_method,
            status: sale.status,
            date: sale.created_at,
            timestamp: new Date(sale.created_at).getTime()
        })) as SaleRecord[];

    } catch (error: any) {
        console.warn(`Error fetching user sales:`, error?.message || error);
        return [];
    }
};
