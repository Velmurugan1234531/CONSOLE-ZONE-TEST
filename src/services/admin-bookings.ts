import { db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    orderBy,
    doc,
    updateDoc,
    deleteDoc,
    getDocs
} from "firebase/firestore";
import { safeGetDocs } from "@/utils/firebase-utils";
import { ServiceBooking } from "@/types";

export const getAllServiceBookings = async () => {
    try {
        const bookingsRef = collection(db, 'service_bookings');
        const q = query(bookingsRef, orderBy('created_at', 'desc'));
        const snapshot = await safeGetDocs(q);

        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as ServiceBooking[];
    } catch (error) {
        console.error("Error fetching all bookings Firestore:", error);
        return [];
    }
};

export const updateBookingStatus = async (id: string, status: string) => {
    try {
        const bookingRef = doc(db, 'service_bookings', id);
        await updateDoc(bookingRef, { status, updated_at: new Date().toISOString() });
    } catch (error) {
        console.error("Error updating booking status Firestore:", error);
        throw error;
    }
};

export const deleteBooking = async (id: string) => {
    try {
        const bookingRef = doc(db, 'service_bookings', id);
        await deleteDoc(bookingRef);
    } catch (error) {
        console.error("Error deleting booking Firestore:", error);
        throw error;
    }
};
