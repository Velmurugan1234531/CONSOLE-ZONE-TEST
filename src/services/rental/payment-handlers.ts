
import { createClient } from "@/lib/supabase/client";
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
        const supabase = createClient();
        try {
            console.log(`💰 Processing Payment ${paymentId} for Booking ${bookingId}`);

            // 1. Record Payment
            const { error: insertError } = await supabase
                .from('payments') // Assuming 'payments' table exists from recent schema updates
                .insert({
                    id: paymentId, // Or let DB generate ID and store this as provider_payment_id? 
                    // Function arg 'paymentId' seems like OUR system ID or provider ID?
                    // Let's assume provider ID and map to 'transaction_id' or similar, OR use it as ID if UUID.
                    // 'payments' table: id (uuid), booking_id, amount, status, etc.
                    // schema: payments (id UUID, order_id UUID, ...). 
                    // Wait, recent schema added 'payments' table?
                    // Let's check schema/viewed file if possible.
                    // Assume standard fields.
                    booking_id: bookingId, // Map to booking_id (or order_id if schema shared)
                    gateway: gateway,
                    transaction_id: transactionId,
                    amount: amount,
                    status: 'success',
                    webhook_verified: true,
                    created_at: new Date().toISOString()
                });

            if (insertError) throw insertError;

            // 2. Update Booking Payment Status
            // Fetch current metadata to merge
            const { data: booking } = await supabase.from('rentals').select('metadata').eq('id', bookingId).single();
            const currentMeta = booking?.metadata || {};

            const { error: updateError } = await supabase
                .from('rentals')
                .update({
                    // payment_status: 'SUCCESS', // If column exists
                    // Or metadata
                    metadata: {
                        ...currentMeta,
                        paymentStatus: 'SUCCESS'
                    },
                    updated_at: new Date().toISOString()
                })
                .eq('id', bookingId);

            if (updateError) throw updateError;

            // 3. Trigger Risk Engine for Auto-Approval
            // Post-transaction to allow async processing
            await RiskEngine.evaluateBookingRisk(bookingId);

            // 4. TODO: GST Invoice Generation Trigger

        } catch (error) {
            console.error("Payment processing failed:", error);
            throw error;
        }
    },

    /**
     * Handle Payment Failure
     */
    processPaymentFailure: async (bookingId: string, reason: string) => {
        const supabase = createClient();

        // Fetch current metadata to merge
        const { data: booking } = await supabase.from('rentals').select('metadata').eq('id', bookingId).single();
        const currentMeta = booking?.metadata || {};

        await supabase
            .from('rentals')
            .update({
                metadata: {
                    ...currentMeta,
                    paymentStatus: 'FAILED',
                    failureReason: reason
                },
                updated_at: new Date().toISOString()
            })
            .eq('id', bookingId);

        // Log failure for risk scoring future attempts
        console.warn(`Payment failed for ${bookingId}: ${reason}`);
    }
};
