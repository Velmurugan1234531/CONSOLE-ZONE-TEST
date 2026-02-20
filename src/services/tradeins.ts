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

export interface TradeInRequest {
    id: string;
    user_id: string;
    user_name: string;
    item_name: string;
    category: string;
    condition: string;
    description: string;
    images: string[];
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    offered_credit: number;
    created_at: string;
}

export interface SellOrderItem {
    product_id: string;
    product_name: string;
    quantity: number;
    cash_price: number;
    credit_price: number;
    image?: string;
}

export type PaymentMethod = 'credits' | 'upi' | 'imps' | 'paytm';
export type ShippingMethod = 'free_pickup' | 'self_ship';
export type SellOrderStatus = 'pending' | 'in-transit' | 'verified' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'processing' | 'completed';

export interface SellOrder {
    id: string;
    user_id: string;
    user_name?: string;
    user_email?: string;
    user_phone?: string;
    items: SellOrderItem[];
    total_cash_value: number;
    total_credit_value: number;
    payment_method: PaymentMethod;
    shipping_method: ShippingMethod;
    pincode: string;
    address?: string;
    status: SellOrderStatus;
    payment_status: PaymentStatus;
    notes?: string;
    admin_notes?: string;
    created_at: string;
    updated_at: string;
}

export const getTradeInRequests = async (): Promise<TradeInRequest[]> => {
    try {
        const trRef = collection(db, "trade_in_requests");
        const q = query(trRef, orderBy("created_at", "desc"));
        const snapshot = await safeGetDocs(q);

        if (snapshot.empty) {
            return getMockTradeInRequests();
        }

        const requests = await Promise.all(snapshot.docs.map(async (trDoc) => {
            const tr = trDoc.data();
            let userName = "Unknown User";

            if (tr.user_id) {
                const userSnap = await safeGetDoc(doc(db, "users", tr.user_id));
                if (userSnap.exists()) {
                    const u = userSnap.data();
                    userName = u.full_name || u.display_name || u.email || "Unknown User";
                }
            }

            return {
                id: trDoc.id,
                user_id: tr.user_id,
                user_name: userName,
                item_name: tr.item_name,
                category: tr.category,
                condition: tr.condition,
                description: tr.description,
                images: tr.images || [],
                status: tr.status || 'pending',
                offered_credit: tr.offered_credit || 0,
                created_at: tr.created_at
            } as TradeInRequest;
        }));

        return requests;
    } catch (error) {
        console.error("getTradeInRequests Firestore failed:", error);
        return getMockTradeInRequests();
    }
};

const getMockTradeInRequests = (): TradeInRequest[] => [
    {
        id: "tr-001",
        user_id: "u-001",
        user_name: "Rahul Sharma",
        item_name: "The Last of Us Part II (PS4)",
        category: "Game",
        condition: "Like New",
        description: "Discs are scratch-free. Original box included.",
        images: ["https://images.unsplash.com/photo-1605898399783-1820b7f80b53?q=80&w=400"],
        status: 'pending',
        offered_credit: 1200,
        created_at: new Date().toISOString()
    },
    {
        id: "tr-002",
        user_id: "u-002",
        user_name: "Ananya Iyer",
        item_name: "DualSense Controller (Midnight Black)",
        category: "Accessory",
        condition: "Good",
        description: "Slight drift on left stick, otherwise perfect.",
        images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?q=80&w=400"],
        status: 'pending',
        offered_credit: 2500,
        created_at: new Date(Date.now() - 86400000).toISOString()
    }
];

export const updateTradeInStatus = async (id: string, status: TradeInRequest['status'], credit?: number) => {
    try {
        const trRef = doc(db, "trade_in_requests", id);
        const updates: any = { status, updated_at: new Date().toISOString() };
        if (credit !== undefined) updates.offered_credit = credit;

        await updateDoc(trRef, updates);

        // Notification logic
        const requestSnap = await safeGetDoc(trRef);
        if (requestSnap.exists()) {
            const request = requestSnap.data();
            try {
                const { sendNotification } = await import("./notifications");
                await sendNotification({
                    user_id: request.user_id,
                    type: status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info',
                    title: 'Trade-In Update',
                    message: status === 'approved'
                        ? `Good news! Your trade-in for "${request.item_name}" has been approved for ₹${credit} credit.`
                        : `Your trade-in for "${request.item_name}" status has been updated to ${status}.`
                });
            } catch (e) {
                console.warn("Notification failed:", e);
            }
        }
    } catch (error) {
        console.error("updateTradeInStatus failed:", error);
    }
};

export const getUserTradeInRequests = async (userId: string): Promise<TradeInRequest[]> => {
    // Demo Mode Support
    if (userId === 'demo-user-123') {
        const allTradeIns = await getTradeInRequests();
        return allTradeIns.filter(t => t.user_id === 'u-001' || t.user_id === 'demo-user-123');
    }

    try {
        const trRef = collection(db, "trade_in_requests");
        const q = query(trRef, where("user_id", "==", userId), orderBy("created_at", "desc"));
        const snapshot = await safeGetDocs(q);

        const userSnap = await safeGetDoc(doc(db, "users", userId));
        const userData = userSnap.exists() ? userSnap.data() : null;
        const userName = userData?.full_name || userData?.email || "User";

        return snapshot.docs.map((item: any) => ({
            id: item.id,
            ...item.data(),
            user_name: userName
        })) as TradeInRequest[];
    } catch (error) {
        console.error("getUserTradeInRequests failed:", error);
        return [];
    }
};

const SELL_ORDERS_STORAGE_KEY = 'console_zone_sell_orders_mock_v1';

// Helper for persistent sell orders in demo mode
const getMockSellOrders = (): SellOrder[] => {
    if (typeof window === 'undefined') return getDemoSellOrders();
    const stored = localStorage.getItem(SELL_ORDERS_STORAGE_KEY);
    if (!stored) {
        const initial = getDemoSellOrders();
        localStorage.setItem(SELL_ORDERS_STORAGE_KEY, JSON.stringify(initial));
        return initial;
    }
    try {
        return JSON.parse(stored);
    } catch {
        return getDemoSellOrders();
    }
};

const saveMockSellOrders = (orders: SellOrder[]) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(SELL_ORDERS_STORAGE_KEY, JSON.stringify(orders));
    }
};

/**
 * Create a new sell order
 */
export const createSellOrder = async (
    userId: string,
    items: SellOrderItem[],
    paymentMethod: PaymentMethod,
    shippingMethod: ShippingMethod,
    pincode: string,
    userInfo?: { name?: string; email?: string; phone?: string; address?: string }
): Promise<SellOrder> => {
    let multiplier = 1.0;
    try {
        const { getMarketplaceSettings } = await import("./marketplace-settings");
        const settings = await getMarketplaceSettings();
        multiplier = settings.multipliers?.buyback || 1.0;
    } catch (e) {
        console.warn("Sell Order: Failed to fetch pricing multipliers", e);
    }

    const totalCashValue = Math.round(items.reduce((sum, item) => sum + (item.cash_price * item.quantity), 0) * multiplier);
    const totalCreditValue = Math.round(items.reduce((sum, item) => sum + (item.credit_price * item.quantity), 0) * multiplier);

    const sellOrderData: any = {
        user_id: userId,
        user_name: userInfo?.name || "",
        user_email: userInfo?.email || "",
        user_phone: userInfo?.phone || "",
        items,
        total_cash_value: totalCashValue,
        total_credit_value: totalCreditValue,
        payment_method: paymentMethod,
        shipping_method: shippingMethod,
        pincode,
        address: userInfo?.address || "",
        status: 'pending',
        payment_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    try {
        const docRef = await addDoc(collection(db, "sell_orders"), sellOrderData);

        // Send notification
        try {
            const { sendNotification } = await import("./notifications");
            await sendNotification({
                user_id: userId,
                type: 'success',
                title: 'Sell Order Created',
                message: `Your sell order has been received. We'll contact you within 24 hours.`
            });
        } catch (e) {
            console.warn("Notification failed:", e);
        }

        return { id: docRef.id, ...sellOrderData } as SellOrder;
    } catch (error) {
        console.error("createSellOrder Firestore failed:", error);
        return createLocalSellOrder(sellOrderData);
    }
};

const createLocalSellOrder = (data: any): SellOrder => {
    const currentOrders = getMockSellOrders();
    const newOrder = {
        id: `sell-${Date.now()}`,
        ...data
    } as SellOrder;

    currentOrders.unshift(newOrder); // Add to top
    saveMockSellOrders(currentOrders);
    return newOrder;
};

export const getAllSellOrders = async (): Promise<SellOrder[]> => {
    try {
        const ordersRef = collection(db, "sell_orders");
        const q = query(ordersRef, orderBy("created_at", "desc"));
        const snapshot = await safeGetDocs(q);

        if (snapshot.empty) {
            return getMockSellOrders();
        }

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as SellOrder[];
    } catch (error) {
        console.error("getAllSellOrders Firestore failed:", error);
        return getMockSellOrders();
    }
};

export const getUserSellOrders = async (userId: string): Promise<SellOrder[]> => {
    try {
        const ordersRef = collection(db, "sell_orders");
        const q = query(ordersRef, where("user_id", "==", userId), orderBy("created_at", "desc"));
        const snapshot = await safeGetDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as SellOrder[];
    } catch (error) {
        console.error("getUserSellOrders Firestore failed:", error);
        return [];
    }
};

export const updateSellOrderStatus = async (
    orderId: string,
    status: SellOrderStatus,
    paymentStatus?: PaymentStatus,
    adminNotes?: string
): Promise<void> => {
    try {
        const orderRef = doc(db, "sell_orders", orderId);
        const updates: any = {
            status,
            updated_at: new Date().toISOString()
        };

        if (paymentStatus) updates.payment_status = paymentStatus;
        if (adminNotes) updates.admin_notes = adminNotes;

        await updateDoc(orderRef, updates);

        // Fetch order for additional logic
        const orderSnap = await safeGetDoc(orderRef);

        if (orderSnap.exists()) {
            const order = orderSnap.data();
            // Handle payment completion - add credits to wallet if needed
            if (paymentStatus === 'completed' && order.payment_method === 'credits') {
                try {
                    const { addCredits } = await import('./wallet');
                    await addCredits(
                        order.user_id,
                        order.total_credit_value,
                        'sell_order',
                        orderId,
                        `Credits from sell order #${orderId}`
                    );
                } catch (e) {
                    console.error("Failed to add credits", e);
                }
            }

            // Send notification
            if (order.user_id) {
                try {
                    const { sendNotification } = await import("./notifications");
                    const amount = order.payment_method === 'credits' ? order.total_credit_value : order.total_cash_value;
                    let message = '';

                    if (status === 'verified') {
                        message = `Your items have been verified! Payment of ₹${amount} will be processed soon.`;
                    } else if (status === 'completed') {
                        message = `Payment of ₹${amount} has been successfully processed via ${order.payment_method.toUpperCase()}.`;
                    } else if (status === 'in-transit') {
                        message = `Your sell order is in transit. We'll verify and process payment once received.`;
                    }

                    if (message) {
                        await sendNotification({
                            user_id: order.user_id,
                            type: status === 'completed' ? 'success' : 'info',
                            title: 'Sell Order Update',
                            message
                        });
                    }
                } catch (e) {
                    console.warn("Notification failed:", e);
                }
            }
        }
    } catch (error) {
        console.error("updateSellOrderStatus Firestore failed:", error);
    }
};

/**
 * Demo sell orders data
 */
function getDemoSellOrders(): SellOrder[] {
    return [
        {
            id: 'sell-001',
            user_id: 'u-001',
            user_name: 'Rahul Sharma',
            user_email: 'rahul@example.com',
            user_phone: '+91 98765 43210',
            items: [
                {
                    product_id: 'ps4-pro',
                    product_name: 'PlayStation 4 Pro 1TB',
                    quantity: 1,
                    cash_price: 18000,
                    credit_price: 20700,
                    image: '/images/products/ps4-pro.png'
                },
                {
                    product_id: 'dualsense',
                    product_name: 'DualSense Controller',
                    quantity: 2,
                    cash_price: 2500,
                    credit_price: 2875,
                    image: '/images/products/dualsense.png'
                }
            ],
            total_cash_value: 23000,
            total_credit_value: 26450,
            payment_method: 'credits',
            shipping_method: 'free_pickup',
            pincode: '600020',
            address: '123 MG Road, Chennai',
            status: 'verified',
            payment_status: 'processing',
            notes: 'All items in good condition',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
            id: 'sell-002',
            user_id: 'u-002',
            user_name: 'Ananya Iyer',
            user_email: 'ananya@example.com',
            user_phone: '+91 87654 32109',
            items: [
                {
                    product_id: 'xbox-series-x',
                    product_name: 'Xbox Series X',
                    quantity: 1,
                    cash_price: 32000,
                    credit_price: 36800,
                    image: '/images/products/xbox-series-x.png'
                }
            ],
            total_cash_value: 32000,
            total_credit_value: 36800,
            payment_method: 'upi',
            shipping_method: 'free_pickup',
            pincode: '560001',
            address: '456 Brigade Road, Bangalore',
            status: 'pending',
            payment_status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ];
}

