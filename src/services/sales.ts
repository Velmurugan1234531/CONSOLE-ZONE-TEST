import { db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    orderBy,
    addDoc,
    getDocs,
    doc,
    serverTimestamp
} from "firebase/firestore";
import { safeGetDocs } from "@/utils/firebase-utils";
import { SaleRecord } from "@/types";

export const getSales = async (): Promise<SaleRecord[]> => {
    try {
        const salesRef = collection(db, 'sales');
        const q = query(salesRef, orderBy('created_at', 'desc'));
        const snapshot = await safeGetDocs(q);

        return snapshot.docs.map((doc) => {
            const sale = doc.data();
            return {
                id: doc.id,
                items: sale.items,
                total_amount: Number(sale.total_amount),
                payment_method: sale.payment_method,
                status: sale.status,
                date: sale.created_at,
                timestamp: sale.created_at ? new Date(sale.created_at).getTime() : Date.now()
            } as SaleRecord;
        });
    } catch (error: any) {
        console.warn(`Error fetching sales Firestore:`, error?.message || error);
        return [];
    }
};

export const getDailyRevenue = async (): Promise<number> => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const salesRef = collection(db, 'sales');
        const q = query(salesRef, where('created_at', '>=', today.toISOString()));
        const snapshot = await safeGetDocs(q);

        return snapshot.docs.reduce((sum, doc) => sum + (Number(doc.data().total_amount) || 0), 0);
    } catch (error: any) {
        console.warn(`Error fetching daily revenue Firestore:`, error?.message || error);
        return 0;
    }
};

export const getMonthlyRevenue = async (): Promise<number> => {
    try {
        const firstDay = new Date();
        firstDay.setDate(1);
        firstDay.setHours(0, 0, 0, 0);

        const salesRef = collection(db, 'sales');
        const q = query(salesRef, where('created_at', '>=', firstDay.toISOString()));
        const snapshot = await safeGetDocs(q);

        return snapshot.docs.reduce((sum, doc) => sum + (Number(doc.data().total_amount) || 0), 0);
    } catch (error: any) {
        console.warn(`Error fetching monthly revenue Firestore:`, error?.message || error);
        return 0;
    }
};

export const recordSale = async (sale: Omit<SaleRecord, 'id' | 'date' | 'timestamp'>): Promise<boolean> => {
    try {
        const payload = {
            user_id: sale.user_id || null,
            items: sale.items,
            total_amount: sale.total_amount,
            payment_method: sale.payment_method,
            status: sale.status || 'completed',
            created_at: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, 'sales'), payload);

        // Automated Notification
        if (sale.user_id) {
            try {
                const { sendNotification } = await import("./notifications");
                await sendNotification({
                    user_id: sale.user_id,
                    type: 'success',
                    title: 'Purchase Successful!',
                    message: `Thank you for your purchase of ₹${sale.total_amount}. Your transaction id is ${docRef.id}.`
                });
            } catch (e: any) {
                console.warn(`Failed to send sale notification: ${e?.message || e}`);
            }
        }

        return true;
    } catch (error: any) {
        console.error(`Error recording sale Firestore: ${error.message || error}`);
        return false;
    }
};

export const getUserSales = async (userId: string): Promise<SaleRecord[]> => {
    // Demo Mode Support
    if (userId === 'demo-user-123') {
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

    try {
        const salesRef = collection(db, 'sales');
        const q = query(
            salesRef,
            where('user_id', '==', userId),
            orderBy('created_at', 'desc')
        );
        const snapshot = await safeGetDocs(q);

        return snapshot.docs.map((doc) => {
            const sale = doc.data();
            return {
                id: doc.id,
                items: sale.items,
                total_amount: Number(sale.total_amount),
                payment_method: sale.payment_method,
                status: sale.status,
                date: sale.created_at,
                timestamp: sale.created_at ? new Date(sale.created_at).getTime() : Date.now()
            } as SaleRecord;
        });

    } catch (error: any) {
        console.warn(`Error fetching user sales Firestore:`, error?.message || error);
        return [];
    }
};
