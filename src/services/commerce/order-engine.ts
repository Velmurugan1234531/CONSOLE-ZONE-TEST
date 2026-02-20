import { db } from "@/lib/firebase";
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    runTransaction
} from "firebase/firestore";
import { safeGetDoc } from "@/utils/firebase-utils";
import { SaleOrder, OrderStatus } from "@/types/commerce";

const ORDER_COLLECTION = "orders";
const PRODUCT_COLLECTION = "products";

export const OrderEngine = {
    /**
     * Step 2: Customer Places Order
     */
    createOrder: async (orderData: Omit<SaleOrder, 'orderId' | 'createdAt' | 'updatedAt'>): Promise<string> => {
        try {
            const docRef = await addDoc(collection(db, ORDER_COLLECTION), {
                ...orderData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

            return docRef.id;
        } catch (error) {
            console.error("Error creating order (Firestore):", error);
            throw error;
        }
    },

    /**
     * Step 3: Order Processing & Status Updates
     */
    updateOrderStatus: async (orderId: string, newStatus: OrderStatus): Promise<void> => {
        try {
            const docRef = doc(db, ORDER_COLLECTION, orderId);
            await updateDoc(docRef, {
                status: newStatus,
                updated_at: new Date().toISOString()
            });
        } catch (error) {
            console.error("Error updating order status (Firestore):", error);
            throw error;
        }
    },

    /**
     * Payment Success Handler (Triggers Smart Automation)
     * Atomic transaction for stock deduction
     */
    processPaymentSuccess: async (orderId: string, transactionId: string) => {
        try {
            await runTransaction(db, async (transaction) => {
                const orderRef = doc(db, ORDER_COLLECTION, orderId);
                const orderSnapshot = await transaction.get(orderRef);

                if (!orderSnapshot.exists()) {
                    throw new Error("Order not found");
                }

                const saleOrder = orderSnapshot.data() as any;
                let allStockAvailable = true;
                const productSnapshots: any[] = [];

                // 1. Fetch all product snapshots and verify stock
                for (const item of saleOrder.items) {
                    const productRef = doc(db, PRODUCT_COLLECTION, item.productId);
                    const prodSnap = await transaction.get(productRef);

                    if (!prodSnap.exists()) {
                        allStockAvailable = false;
                        break;
                    }

                    const currentStock = Number(prodSnap.data().stock || 0);
                    if (currentStock < Number(item.quantity)) {
                        allStockAvailable = false;
                        break;
                    }
                    productSnapshots.push({ ref: productRef, currentStock, quantity: Number(item.quantity) });
                }

                const updates: any = {
                    payment_status: 'paid',
                    updated_at: new Date().toISOString()
                };

                if (allStockAvailable) {
                    // 2. Auto Confirm & Deduct Stock
                    updates.status = 'CONFIRMED';
                    updates.metadata = { ...(saleOrder.metadata || {}), autoConfirmed: true, transactionId };

                    for (const p of productSnapshots) {
                        transaction.update(p.ref, {
                            stock: Math.max(0, p.currentStock - p.quantity),
                            updated_at: new Date().toISOString()
                        });
                    }
                } else {
                    // 3. Out of Stock Logic -> Cancellation
                    updates.status = 'cancelled';
                    updates.metadata = {
                        ...(saleOrder.metadata || {}),
                        failureReason: "Stock mismatch during payment",
                        transactionId
                    };
                }

                transaction.update(orderRef, updates);
            });
        } catch (e) {
            console.error("Order payment processing failed (Transaction):", e);
            throw e;
        }
    }
};
