
import { createClient } from "@/lib/supabase/client";

export interface OrderItem {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
}

export interface Order {
    id: string;
    customer_id: string;
    customer_name: string;
    items: OrderItem[];
    total_amount: number;
    payment_method: 'cash' | 'card' | 'upi';
    payment_status: 'pending' | 'paid' | 'refunded';
    status: 'pending' | 'completed' | 'cancelled';
    notes?: string;
    created_at: string;
    updated_at?: string;
}

const ORDERS_STORAGE_KEY = 'console_zone_orders_v1';

// Demo data for development/testing
const DEMO_ORDERS: Order[] = [
    {
        id: "ord-001",
        customer_id: "user-001",
        customer_name: "Rahul Sharma",
        items: [
            {
                product_id: "978c1aa9-a069-46a5-b14a-2bcc8d031f10",
                product_name: "Sony PS5 Slim Disc Edition",
                quantity: 1,
                unit_price: 54990,
                subtotal: 54990
            }
        ],
        total_amount: 54990,
        payment_method: 'card',
        payment_status: 'paid',
        status: 'completed',
        notes: "Customer requested gift wrap",
        created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
        id: "ord-002",
        customer_id: "user-002",
        customer_name: "Ananya Iyer",
        items: [
            {
                product_id: "ps5-controller-dual-sense",
                product_name: "PS5 DualSense Wireless Controller",
                quantity: 2,
                unit_price: 5990,
                subtotal: 11980
            }
        ],
        total_amount: 11980,
        payment_method: 'upi',
        payment_status: 'paid',
        status: 'completed',
        created_at: new Date(Date.now() - 86400000).toISOString()
    }
];

/**
 * Get all orders from database or fallback to demo data
 */
export const getAllOrders = async (): Promise<Order[]> => {
    const supabase = createClient();
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Store in localStorage on success
        if (typeof window !== 'undefined' && data && data.length > 0) {
            localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(data));
        }

        return data as Order[];
    } catch (error) {
        console.warn('Failed to fetch orders from Supabase/DB, using fallback:', error);

        // Try localStorage first
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        }

        // Return demo data as last resort
        return DEMO_ORDERS;
    }
};

/**
 * Get a single order by ID
 */
export const getOrderById = async (id: string): Promise<Order | null> => {
    const supabase = createClient();
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) throw new Error("Order not found");
        return data as Order;
    } catch (error) {
        console.warn('Failed to fetch order from database:', error);

        // Fallback to localStorage or demo data
        const allOrders = await getAllOrders();
        return allOrders.find(order => order.id === id) || null;
    }
};

/**
 * Create a new order
 */
export const createOrder = async (orderData: Omit<Order, 'id' | 'created_at'>): Promise<Order> => {
    const supabase = createClient();
    const newOrderData = {
        ...orderData,
        created_at: new Date().toISOString()
    };

    try {
        const { data, error } = await supabase
            .from('orders')
            .insert(newOrderData)
            .select()
            .single();

        if (error) throw error;
        return data as Order;
    } catch (error) {
        console.warn('Failed to create order in database, saving to localStorage:', error);

        const newOrder = {
            id: `ord-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...newOrderData
        } as Order;

        // Fallback to localStorage
        if (typeof window !== 'undefined') {
            const existing = await getAllOrders();
            const updated = [newOrder, ...existing];
            localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
        }

        return newOrder;
    }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (id: string, status: Order['status']): Promise<void> => {
    const supabase = createClient();
    try {
        const { error } = await supabase
            .from('orders')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
    } catch (error) {
        console.warn('Failed to update order status in database:', error);

        // Fallback to localStorage
        if (typeof window !== 'undefined') {
            const orders = await getAllOrders();
            const updated = orders.map(order =>
                order.id === id
                    ? { ...order, status, updated_at: new Date().toISOString() }
                    : order
            );
            localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
        }
    }
};

/**
 * Search/filter orders based on criteria
 */
export const searchOrders = async (filters: {
    customerId?: string;
    customerName?: string;
    paymentMethod?: 'cash' | 'card' | 'upi';
    status?: Order['status'];
    dateFrom?: string;
    dateTo?: string;
}): Promise<Order[]> => {
    // Ideally this should use Supabase compound queries, but for now filtering in memory
    // to match the previous behavior and support the varied optional filters easily
    const allOrders = await getAllOrders();

    return allOrders.filter(order => {
        if (filters.customerId && order.customer_id !== filters.customerId) return false;
        if (filters.customerName && !order.customer_name.toLowerCase().includes(filters.customerName.toLowerCase())) return false;
        if (filters.paymentMethod && order.payment_method !== filters.paymentMethod) return false;
        if (filters.status && order.status !== filters.status) return false;
        if (filters.dateFrom && new Date(order.created_at) < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && new Date(order.created_at) > new Date(filters.dateTo)) return false;
        return true;
    });
};

/**
 * Get orders by customer ID
 */
export const getOrdersByCustomer = async (customerId: string): Promise<Order[]> => {
    const supabase = createClient();
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Order[];
    } catch (e) {
        console.warn("Supabase getOrdersByCustomer failed, falling back to search", e);
        return searchOrders({ customerId });
    }
};
