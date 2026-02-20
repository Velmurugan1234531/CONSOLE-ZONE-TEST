import { db } from "@/lib/firebase";
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    getDocs
} from "firebase/firestore";
import { safeGetDocs } from "@/utils/firebase-utils";
import { ServiceBooking } from "@/types";

export const createServiceBooking = async (bookingData: Partial<ServiceBooking>) => {
    try {
        const payload = {
            ...bookingData,
            created_at: new Date().toISOString(),
            status: bookingData.status || 'pending'
        };

        const docRef = await addDoc(collection(db, 'service_bookings'), payload);

        console.log("Booking created with ID:", docRef.id);
        return { id: docRef.id, ...payload };
    } catch (error) {
        console.error("Error creating booking (Firestore):", error);
        throw error;
    }
};

export const getUserServiceBookings = async (userId: string) => {
    // Demo Mode Support
    if (userId === 'demo-user-123') {
        const { DEMO_SERVICE_BOOKINGS } = await import("@/constants/demo-stock");
        return DEMO_SERVICE_BOOKINGS || [];
    }

    try {
        const bookingsRef = collection(db, 'service_bookings');
        const q = query(
            bookingsRef,
            where('user_id', '==', userId),
            orderBy('created_at', 'desc')
        );

        const snapshot = await safeGetDocs(q);

        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching user bookings (Firestore):", error);
        return [];
    }
};
