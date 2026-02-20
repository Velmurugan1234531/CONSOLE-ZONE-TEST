import { db } from "@/lib/firebase";
import {
    collection,
    addDoc,
    doc,
    updateDoc
} from "firebase/firestore";
import { safeGetDoc } from "@/utils/firebase-utils";
import { RiskEngine } from "./risk-engine";

export const PaymentHandler = {
    /**
     * Handle Razorpay/Stripe Webhook Success Event
     */
    processPaymentSuccess: async (
        paymentId: string,
        bookingId: string,
        transactionId: string,
        gateway: 'RAZORPAY' | 'STRIPE',
        amount: number
    ) => {
        try {
            console.log(`💰 Processing Payment ${paymentId} for Booking ${bookingId}`);

            // 1. Record Payment
            await addDoc(collection(db, 'payments'), {
                provider_payment_id: paymentId,
                booking_id: bookingId,
                gateway: gateway,
                transaction_id: transactionId,
                amount: amount,
                status: 'success',
                webhook_verified: true,
                created_at: new Date().toISOString()
            });

            // 2. Update Booking Payment Status
            const bookingDocRef = doc(db, 'rentals', bookingId);
            const bookingSnap = await safeGetDoc(bookingDocRef);
            const currentMeta = bookingSnap.exists() ? bookingSnap.data().metadata : {};

            await updateDoc(bookingDocRef, {
                metadata: {
                    ...currentMeta,
                    paymentStatus: 'SUCCESS'
                },
                updated_at: new Date().toISOString()
            });

            // 3. Trigger Risk Engine for Auto-Approval
            await RiskEngine.evaluateBookingRisk(bookingId);

        } catch (error) {
            console.error("Payment processing failed (Firestore):", error);
            throw error;
        }
    },

    /**
     * Handle Payment Failure
     */
    processPaymentFailure: async (bookingId: string, reason: string) => {
        try {
            const bookingDocRef = doc(db, 'rentals', bookingId);
            const bookingSnap = await safeGetDoc(bookingDocRef);
            const currentMeta = bookingSnap.exists() ? bookingSnap.data().metadata : {};

            await updateDoc(bookingDocRef, {
                metadata: {
                    ...currentMeta,
                    paymentStatus: 'FAILED',
                    failureReason: reason
                },
                updated_at: new Date().toISOString()
            });

            console.warn(`Payment failed for ${bookingId}: ${reason}`);
        } catch (error) {
            console.error("Payment failure logging failed (Firestore):", error);
        }
    }
};
