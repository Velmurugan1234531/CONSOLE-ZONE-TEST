import { db } from "@/lib/firebase";
import {
    collection,
    addDoc,
    doc,
    updateDoc,
    getDoc,
    serverTimestamp
} from "firebase/firestore";
import { safeGetDoc } from "@/utils/firebase-utils";
import { BookingStatus, RentalProduct } from "@/types/rental";

const RENTALS_COLLECTION = "rentals";
const PRODUCTS_COLLECTION = "products";

export const BookingEngine = {
    /**
     * Create a new rental booking request.
     */
    createBooking: async (
        userId: string,
        product: RentalProduct,
        startDate: Date,
        endDate: Date
    ): Promise<string> => {
        try {
            // 1. Calculate Duration & Cost
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const rentalCost = days * product.rentalPricePerDay;
            const gstAmount = (rentalCost * (product.gstPercent || 18)) / 100;
            const totalAmount = rentalCost + gstAmount + (product.depositAmount || 0);

            // 2. Initial Risk Assessment
            let initialRiskScore = 0;
            if (totalAmount > 50000) initialRiskScore += 20;

            const bookingData = {
                user_id: userId,
                device_id: product.productId || (product as any).id, // Handle potential missing productId if id is present from Firestore doc
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                total_cost: totalAmount,
                status: 'pending',
                metadata: {
                    depositAmount: product.depositAmount || 0,
                    gstAmount,
                    riskScore: initialRiskScore,
                    trackingActive: false,
                    paymentStatus: 'PENDING'
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // 3. Create Booking Doc
            const docRef = await addDoc(collection(db, RENTALS_COLLECTION), bookingData);
            return docRef.id;

        } catch (error) {
            console.error("Booking creation failed (Firestore):", error);
            throw error;
        }
    },

    /**
     * Transition Booking Status (State Machine).
     */
    updateStatus: async (bookingId: string, newStatus: BookingStatus): Promise<void> => {
        try {
            const bookingDocRef = doc(db, RENTALS_COLLECTION, bookingId);
            const bookingSnap = await safeGetDoc(bookingDocRef);

            if (!bookingSnap.exists()) throw new Error("Booking not found");
            const booking = bookingSnap.data() as any;

            const currentStatus = booking.status;
            const productId = booking.device_id;

            // State Machine Logic
            if (newStatus === 'RENTAL_ACTIVE' && currentStatus !== 'RENTAL_ACTIVE') {
                // Reduce Stock
                const productDocRef = doc(db, PRODUCTS_COLLECTION, productId);
                const productSnap = await safeGetDoc(productDocRef);
                if (productSnap.exists()) {
                    const currentStock = productSnap.data().stock || 0;
                    await updateDoc(productDocRef, { stock: Math.max(0, currentStock - 1) });
                }

                // Activate Tracking in metadata
                const newMeta = { ...(booking.metadata || {}), trackingActive: true };
                await updateDoc(bookingDocRef, { metadata: newMeta });
            }

            if (newStatus === 'COMPLETED' || newStatus === 'CANCELLED') {
                if (currentStatus === 'RENTAL_ACTIVE') {
                    // Restore Stock
                    const productDocRef = doc(db, PRODUCTS_COLLECTION, productId);
                    const productSnap = await safeGetDoc(productDocRef);
                    if (productSnap.exists()) {
                        const currentStock = productSnap.data().stock || 0;
                        await updateDoc(productDocRef, { stock: currentStock + 1 });
                    }
                }
                // Deactivate Tracking
                const newMeta = { ...(booking.metadata || {}), trackingActive: false };
                await updateDoc(bookingDocRef, { metadata: newMeta });
            }

            // Commit Status Update
            await updateDoc(bookingDocRef, {
                status: newStatus,
                updated_at: new Date().toISOString()
            });

        } catch (error) {
            console.error("Error updating booking status (Firestore):", error);
            throw error;
        }
    }
};
