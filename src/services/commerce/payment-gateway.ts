
import { createClient } from "@/lib/supabase/client";
import { CommercePayment } from "@/types/commerce";

export const PaymentGateway = {
    /**
     * Step 1: Create Order on Razorpay/Stripe (Simulated)
     */
    initiatePayment: async (orderId: string, amount: number, gateway: 'razorpay' | 'stripe') => {
        // In a real backend, this calls Razorpay API orders.create()
        // Here we simulate returning an order_id
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
     * Verifies signature and updates DB
     */
    handleWebhook: async (
        eventData: any,
        signature: string,
        gateway: 'razorpay' | 'stripe'
    ) => {
        // Verify Signature Logic (crypto.createHmac...)
        const isVerified = true; // Simulated verification
        const supabase = createClient();

        if (isVerified) {
            const { order_id, payment_id } = eventData;

            // 1. Log Payment
            const paymentData = {
                order_id,
                gateway,
                razorpay_order_id: gateway === 'razorpay' ? eventData.razorpay_order_id : undefined,
                payment_intent_id: gateway === 'stripe' ? eventData.payment_intent : undefined,
                status: 'success',
                amount: eventData.amount,
                currency: 'INR',
                webhook_verified: true,
                created_at: new Date().toISOString()
            };

            const { error: paymentError } = await supabase.from('payments').insert(paymentData);
            if (paymentError) console.error("Payment Log Error:", paymentError);

            // 2. Update Order Status
            const { error: orderError } = await supabase
                .from('orders')
                .update({
                    payment_status: 'paid',
                    status: 'CONFIRMED', // Auto-confirm on payment
                    updated_at: new Date().toISOString()
                })
                .eq('id', order_id);

            if (orderError) {
                console.error("Order Update Error:", orderError);
                return { success: false, error: "Order update failed" };
            }

            // 3. Trigger AI Approval (Return true to signal caller to run AI)
            return {
                success: true,
                shouldTriggerAI: true,
                orderId: order_id
            };
        }

        return { success: false, error: "Signature Mismatch" };
    }
};
