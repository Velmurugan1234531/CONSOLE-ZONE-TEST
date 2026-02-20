


import { db } from "@/lib/firebase";
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    updateDoc,
    doc,
    getDoc
} from "firebase/firestore";
import { safeGetDocs, safeGetDoc } from "@/utils/firebase-utils";

import { Rental } from "@/types";
import { BookingStatus, AdminActionLog } from "@/types/booking";
import { BookingPersistence } from "./booking-persistence";
import { sendNotification } from "./notifications";
import { Transmissions } from "@/utils/neural-messages";

import { checkRentalEligibility } from "./maintenance";

const RENTAL_COLLECTION = 'rentals';

export const createRental = async (rentalData: Partial<Rental>) => {
    // 1. Eligibility Check
    if (rentalData.console_id) {
        const eligibility = await checkRentalEligibility(rentalData.console_id);
        if (!eligibility.allowed) {
            throw new Error(`Rental Blocked: ${eligibility.reason}`);
        }
    }

    try {
        const docRef = await addDoc(collection(db, RENTAL_COLLECTION), rentalData);
        const newRental = { id: docRef.id, ...rentalData };

        // Automated Notification
        try {
            const transmission = Transmissions.RENTAL.BOOKED("Gaming Console", newRental.id);
            if (rentalData.user_id) {
                await sendNotification({
                    user_id: rentalData.user_id,
                    type: 'success',
                    title: transmission.title,
                    message: transmission.message
                });
            }
        } catch (e) {
            console.warn("Failed to send automated notification:", e);
        }

        return newRental;
    } catch (error) {
        console.error("Error creating rental:", error);
        throw error;
    }
};

export const getUserRentalsV2 = async (userId: string) => {
    // V2: Forced Cache Bust [TIMESTAMP_NOW]
    console.log(`[RentalsV2] Fetching for ${userId}`);

    // Demo Mode Support
    if (userId === 'demo-user-123') {
        const { DEMO_RENTALS } = await import("@/constants/demo-stock");
        return DEMO_RENTALS || [];
    }

    try {
        const q = query(
            collection(db, RENTAL_COLLECTION),
            where('user_id', '==', userId),
            orderBy('created_at', 'desc')
        );

        const snapshot = await safeGetDocs(q);

        if (snapshot.empty) {
            // Fallback check if empty might be offline error handled by safeGetDocs (it returns empty array on failure usually)
            // but if strictly empty, return empty
            return [];
        }

        // We need to manually populate 'product' and 'device' since Firestore doesn't do joins
        // For list views, efficient way is to fetch related IDs, but for simplicity here with small data:
        // We'll just return the rental data. The UI might need to fetch product info separately or we do it here.
        // Given existing code expects `product` and `device` populated:

        const rentals = await Promise.all(snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            let product = null;
            let device = null;

            // Fetch Product (if product_id exists)
            if (data.product_id) {
                try {
                    const pSnap = await safeGetDoc(doc(db, 'products', data.product_id));
                    if (pSnap.exists()) product = { id: pSnap.id, ...pSnap.data() };
                } catch (e) { /* ignore */ }
            }

            // Fetch Device (if device_id exists)
            if (data.device_id) {
                try {
                    const dSnap = await safeGetDoc(doc(db, 'devices', data.device_id));
                    if (dSnap.exists()) device = { id: dSnap.id, ...dSnap.data() };
                } catch (e) { /* ignore */ }
            }

            return {
                id: docSnap.id,
                ...data,
                product,
                device,
                console: device || null // Map for compatibility
            };
        }));

        return rentals;

    } catch (error: any) {
        console.error("Error fetching user rentals Firestore [V2]:", error);
        // Demo Fallback on catastrophic fail
        const { DEMO_RENTALS } = await import("@/constants/demo-stock");
        return DEMO_RENTALS || [];
    }
}


export const getUserRentals = getUserRentalsV2;

/**
 * Advanced Booking Lifecycle: Update Status with Admin Logging
 */
export const updateBookingStatus = async (
    bookingId: string,
    newStatus: BookingStatus,
    adminId?: string,
    notes?: string
): Promise<void> => {
    try {
        const timestamp = new Date().toISOString();
        const rentalRef = doc(db, RENTAL_COLLECTION, bookingId);

        // Load current booking for logging transition
        const snap = await safeGetDoc(rentalRef);

        let previousStatus: BookingStatus = 'BOOKING_PENDING';
        let userId = '';

        if (snap.exists()) {
            const booking = snap.data();
            previousStatus = booking.status as any;
            userId = booking.user_id;

            await updateDoc(rentalRef, {
                status: newStatus,
                updated_at: timestamp,
                admin_id: adminId
            });

        } else {
            // Local Session Persistence (Fallback)
            // If doc doesn't exist (maybe local only?), try updating local store
            const bookings = BookingPersistence.getBookings();
            const index = bookings.findIndex(b => b.id === bookingId);
            if (index !== -1) {
                previousStatus = bookings[index].booking_status;
                userId = bookings[index].user_id;
                BookingPersistence.updateBooking(bookingId, {
                    booking_status: newStatus,
                    assigned_rider_id: adminId // Overloading for demo
                });
            } else {
                throw new Error("Booking not found");
            }
        }

        // 2. Log Admin Action (Assuming 'admin_logs' collection exists or we keep local)
        // For now, keeping local logic as per original file structure (BookingPersistence)
        // BUT better to write to Firestore logs if possible.
        // Let's do BOTH for safety.

        const log: AdminActionLog = {
            id: `log-${Date.now()}`,
            booking_id: bookingId,
            admin_id: adminId || 'system-ai',
            action: `Status change: ${previousStatus} -> ${newStatus}`,
            previous_status: previousStatus,
            new_status: newStatus,
            notes,
            timestamp
        };
        BookingPersistence.addAdminLog(log);

        // Optional: Persist log to Firestore 'logs' collection
        try {
            await addDoc(collection(db, 'admin_logs'), log);
        } catch (e) { /* non-blocking */ }

        // 3. Automated Notification based on milestone
        if (userId) {
            let notificationTitle = `Booking Update: ${newStatus.replace('_', ' ')}`;
            let notificationMsg = `Your booking status has been updated to ${newStatus.replace('_', ' ')}.`;
            let type: any = 'info';

            // Custom Milestones
            if (newStatus === 'APPROVED') {
                notificationTitle = "Mission Approved! 🛰";
                notificationMsg = "Good news! Your rental has been approved and is moving to dispatch.";
                type = 'success';
            } else if (newStatus === 'OUT_FOR_DELIVERY') {
                notificationTitle = "Rider In Transit ⚡️";
                notificationMsg = "Your gaming gear is on the way! Watch for delivery updates.";
                type = 'success';
            } else if (newStatus === 'COMPLETED') {
                notificationTitle = "Mission Accomplished 🏁";
                notificationMsg = "Rental cycle complete. We hope you enjoyed the gear!";
                type = 'success';
            } else if (newStatus === 'REJECTED') {
                notificationTitle = "Security Protocol: Rejected 🛑";
                notificationMsg = "Unfortunately, your booking did not pass our automated security review.";
                type = 'error';
            }

            await sendNotification({
                user_id: userId,
                type,
                title: notificationTitle,
                message: notificationMsg
            });
        }
    } catch (e: any) {
        console.warn(`Rental Engine: Failed to update status for ${bookingId}`, e?.message || e);
    }
};

