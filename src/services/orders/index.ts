import { db } from "@/lib/firebase";
import {
    collection,
    addDoc,
    getDoc,
    getDocs,
    doc,
    query,
    orderBy,
    where
} from "firebase/firestore";
import { safeGetDocs, safeGetDoc } from "@/utils/firebase-utils";
import { Order } from "@/types";

const COLLECTION = 'orders';

export const OrderService = {
    /**
     * Create a new secure order transaction.
     */
    createOrder: async (userId: string, items: any[], total: number) => {
        try {
            const orderId = `ORD-${Date.now()}`;
            const orderData = {
                id: orderId,
                user_id: userId,
                total_amount: total,
                status: 'pending',
                payment_status: 'pending',
                items: items,
                created_at: new Date().toISOString()
            };

            await addDoc(collection(db, COLLECTION), orderData);
            return orderData;
        } catch (error) {
            console.error("Error creating order (Firestore):", error);
            throw error;
        }
    },

    /**
     * Get real-time status of an order.
     */
    getOrderStatus: async (orderId: string) => {
        try {
            // Since we use custom IDs in data but Firestore generates its own doc IDs if we use addDoc,
            // we should ideally query by the 'id' field if we used addDoc, or use setDoc with orderId.
            // For now, assume we query by the 'id' field for consistency with legacy.
            const q = query(collection(db, COLLECTION), where('id', '==', orderId));
            const snapshot = await safeGetDocs(q);

            if (!snapshot.empty) {
                const data = snapshot.docs[0].data();
                return {
                    status: data.status,
                    tracking_id: data.tracking_id,
                    payment_status: data.payment_status
                };
            }
            return null;
        } catch (error) {
            console.error("Error fetching order status (Firestore):", error);
            return null;
        }
    }
};

export async function getOrders(): Promise<Order[]> {
    try {
        const q = query(collection(db, COLLECTION), orderBy('created_at', 'desc'));
        const snapshot = await safeGetDocs(q);

        if (snapshot.empty) {
            return [];
        }

        const orders = await Promise.all(snapshot.docs.map(async (docSnap) => {
            const d = docSnap.data();

            // Enrich with user data
            let userData = { full_name: 'Unknown User', email: 'N/A' };
            if (d.user_id) {
                const userRef = doc(db, 'users', d.user_id);
                const userSnap = await safeGetDoc(userRef);
                if (userSnap.exists()) {
                    const u = userSnap.data();
                    userData = {
                        full_name: u.full_name || u.displayName || u.email || 'Unknown User',
                        email: u.email || 'N/A'
                    };
                }
            }

            return {
                id: d.id || docSnap.id,
                ...d,
                user: userData
            } as any as Order;
        }));

        return orders;
    } catch (error) {
        console.error("Error fetching orders (Firestore):", error);
        return [];
    }
}
