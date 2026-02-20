import { db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    orderBy,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    writeBatch
} from "firebase/firestore";
import { Notification } from "@/types";
import { safeGetDocs } from "@/utils/firebase-utils";

// Helper for fail-fast write operations
const withTimeout = async <T>(promise: Promise<T>, fallbackValue: T): Promise<T> => {
    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("FIRESTORE_TIMEOUT")), 2500)
    );

    try {
        return await Promise.race([promise, timeoutPromise]);
    } catch (error: any) {
        if (error.message === "FIRESTORE_TIMEOUT" || error.code === "unavailable") {
            console.warn("Operation timed out. Using offline mock/fallback.");
            return fallbackValue;
        }
        console.error("Firebase operation failed:", error);
        return fallbackValue; // Safe fallback for now
    }
};

export const getNotifications = async (userId?: string): Promise<Notification[]> => {
    try {
        const notifsRef = collection(db, "notifications");
        let q;

        if (userId) {
            q = query(
                notifsRef,
                where("user_id", "==", userId),
                orderBy("created_at", "desc")
            );
        } else {
            // System-wide
            q = query(
                notifsRef,
                where("user_id", "==", null),
                orderBy("created_at", "desc")
            );
        }

        const snapshot = await safeGetDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Notification[];

    } catch (e: any) {
        console.warn(`getNotifications failed (Offline/Error). Using Mock Data.`, e);
        return [
            {
                id: 'mock-1',
                user_id: userId || 'demo',
                type: 'info',
                title: 'Welcome (Offline Mode)',
                message: 'You are viewing cached/mock notifications.',
                read: false,
                created_at: new Date().toISOString()
            },
            {
                id: 'mock-2',
                user_id: userId || 'demo',
                type: 'warning',
                title: 'Network Issue',
                message: 'Some features may be limited.',
                read: false,
                created_at: new Date(Date.now() - 3600000).toISOString()
            }
        ] as Notification[];
    }
};

export const sendNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => {
    const newNotification = {
        ...notification,
        read: false,
        created_at: new Date().toISOString()
    };

    return await withTimeout(
        (async () => {
            const docRef = await addDoc(collection(db, "notifications"), newNotification);
            return { id: docRef.id, ...newNotification } as Notification;
        })(),
        { id: `mock-sent-${Date.now()}`, ...newNotification } as Notification
    );
};

export const markAsRead = async (id: string) => {
    return await withTimeout(
        updateDoc(doc(db, "notifications", id), { read: true }),
        undefined
    );
};

export const markAllAsRead = async (userId: string) => {
    // Batch update for atomicity
    return await withTimeout(
        (async () => {
            const q = query(
                collection(db, "notifications"),
                where("user_id", "==", userId),
                where("read", "==", false)
            );
            const snapshot = await getDocs(q); // safeGetDocs not needed for batch prep usually, but good practice if reading lots

            const batch = writeBatch(db);
            snapshot.docs.forEach(doc => {
                batch.update(doc.ref, { read: true });
            });
            await batch.commit();
        })(),
        undefined
    );
};

export const deleteNotification = async (id: string) => {
    return await withTimeout(
        deleteDoc(doc(db, "notifications", id)),
        undefined
    );
};

export const getUnreadCount = async (userId: string): Promise<number> => {
    try {
        const q = query(
            collection(db, "notifications"),
            where("user_id", "==", userId),
            where("read", "==", false)
        );
        const snapshot = await safeGetDocs(q);
        return snapshot.size;
    } catch (e: any) {
        console.warn(`getUnreadCount failed. Using Mock Count.`);
        return 2;
    }
};

