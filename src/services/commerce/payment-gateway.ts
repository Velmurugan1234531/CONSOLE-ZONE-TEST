import { db } from "@/lib/firebase";
import {
    collection,
    addDoc,
    doc,
    updateDoc
} from "firebase/firestore";

export const PaymentGateway = {
    /**
     * Step 1: Create Order on Razorpay/Stripe (Simulated)
     */
    initiatePayment: async (order_id: string, amount: number, gateway: 'razorpay' | 'stripe') => {
        // In a real backend, this calls Razorpay API orders.create()
        const providerOrderId = gateway === 'razorpay' ? `order_${Date.now()}` : `pi_${Date.now()}`;

        return {
            success: true,
            providerOrderId,
            amount,
            currency: "INR",
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY || "test_key"
        };
    },

    /**
     * Step 4-6: Webhook Handler (Simulated)
     */
    handleWebhook: async (
        eventData: any,
        signature: string,
        gateway: 'razorpay' | 'stripe'
    ) => {
        // Verify Signature Logic (Simulated)
        const isVerified = true;

        if (isVerified) {
            const { order_id } = eventData;

            try {
                // 1. Log Payment
                const paymentData = {
                    order_id,
                    gateway,
                    razorpay_order_id: gateway === 'razorpay' ? eventData.razorpay_order_id : null,
                    payment_intent_id: gateway === 'stripe' ? eventData.payment_intent : null,
                    status: 'success',
                    amount: eventData.amount,
                    currency: 'INR',
                    webhook_verified: true,
                    created_at: new Date().toISOString()
                };

                await addDoc(collection(db, 'payments'), paymentData);

                // 2. Update Order Status
                const orderDocRef = doc(db, 'orders', order_id);
                await updateDoc(orderDocRef, {
                    payment_status: 'paid',
                    status: 'CONFIRMED',
                    updated_at: new Date().toISOString()
                });

                // 3. Trigger AI Approval
                return {
                    success: true,
                    shouldTriggerAI: true,
                    orderId: order_id
                };
            } catch (error) {
                console.error("Payment Process Error (Firestore):", error);
                return { success: false, error: "Database update failed" };
            }
        }

        return { success: false, error: "Signature Mismatch" };
    }
};
