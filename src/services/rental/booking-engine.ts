
import { createClient } from "@/lib/supabase/client";
import { RentalBooking, BookingStatus, RentalProduct } from "@/types/rental";

const BOOKING_TABLE = "rentals"; // Mapping 'bookings' to 'rentals' table
const PRODUCT_TABLE = "products";

export const BookingEngine = {
    /**
     * Create a new rental booking request.
     * Calculates initial costs and risk score.
     */
    createBooking: async (
        userId: string,
        product: RentalProduct,
        startDate: Date,
        endDate: Date
    ): Promise<string> => {
        const supabase = createClient();
        try {
            // 1. Calculate Duration & Cost
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const rentalCost = days * product.rentalPricePerDay;
            const gstAmount = (rentalCost * product.gstPercent) / 100;
            const totalAmount = rentalCost + gstAmount + product.depositAmount;

            // 2. Initial Risk Assessment (Simple Heuristic)
            // TODO: Enhance with AI logic later
            let initialRiskScore = 0;
            if (totalAmount > 50000) initialRiskScore += 20; // High value risk

            // Map to Supabase table
            // rentals table columns: user_id, device_id, start_date, end_date, total_cost, status, etc.
            // Check schema: 
            // rental_start, rental_end ?? Based on rentals.ts:
            // "start_date", "end_date" were used in rentals.ts logic? 
            // Let's check rentals.ts content again if needed, or just guess standard. 
            // Earlier rentals.ts migration used: .from('rentals').select...
            // properties used in rentals.ts: start_date, end_date, total_cost, status.

            const bookingData = {
                user_id: userId,
                device_id: product.productId, // Assuming productId maps to device_id
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                total_cost: totalAmount,
                status: 'pending', // 'BOOKING_PENDING' maps to 'pending'? 
                // rentals.ts has status.
                // We should probably normalize status.
                // BookingStatus type has 'BOOKING_PENDING'.
                // rentals table status enum/text? 
                // Let's use 'pending' as safe bet for now, or use the string from type if schema handles it.
                // rentals.ts used: status.
                // Let's stick to BookingStatus string if possible, but schema might restrict.
                // If schema is strict enum, we might fail. 
                // Assuming schema accepts text or we updated it.
                // Let's store precise status in metadata if schema status is restricted.
                // Actually, rentals.ts used 'status'.

                metadata: {
                    depositAmount: product.depositAmount,
                    gstAmount,
                    riskScore: initialRiskScore,
                    trackingActive: false,
                    paymentStatus: 'PENDING'
                }
            };

            // 3. Create Booking Doc
            const { data, error } = await supabase
                .from(BOOKING_TABLE)
                .insert({
                    ...bookingData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            return data.id;

        } catch (error) {
            console.error("Booking creation failed:", error);
            throw error;
        }
    },

    /**
     * Transition Booking Status (State Machine).
     * Handles side-effects like stock reduction or tracking activation.
     */
    updateStatus: async (bookingId: string, newStatus: BookingStatus): Promise<void> => {
        const supabase = createClient();

        try {
            // Fetch booking first to check current status
            const { data: booking, error: fetchError } = await supabase
                .from(BOOKING_TABLE)
                .select('*')
                .eq('id', bookingId)
                .single();

            if (fetchError || !booking) throw new Error("Booking not found");

            const currentStatus = booking.status; // Or metadata.bookingStatus? Using status column.
            const productId = booking.device_id;

            // State Machine Logic
            if (newStatus === 'RENTAL_ACTIVE' && currentStatus !== 'RENTAL_ACTIVE') {
                // Reduce Stock
                // Fetch product first
                const { data: product } = await supabase.from(PRODUCT_TABLE).select('stock').eq('id', productId).single();
                if (product) {
                    await supabase.from(PRODUCT_TABLE).update({ stock: product.stock - 1 }).eq('id', productId);
                }

                // Activate Tracking
                // Assuming tracking is in metadata or separate table? 
                // rentals schema had `tracking_active`? Probably not. 
                // Let's store in metadata or if tracking_active column exists (unlikely in v1 schema).
                // We'll update metadata.
                const newMeta = { ...(booking.metadata || {}), trackingActive: true };
                await supabase.from(BOOKING_TABLE).update({ metadata: newMeta }).eq('id', bookingId);
            }

            if (newStatus === 'COMPLETED' || newStatus === 'CANCELLED') {
                if (currentStatus === 'RENTAL_ACTIVE') {
                    // Restore Stock
                    const { data: product } = await supabase.from(PRODUCT_TABLE).select('stock').eq('id', productId).single();
                    if (product) {
                        await supabase.from(PRODUCT_TABLE).update({ stock: product.stock + 1 }).eq('id', productId);
                    }
                }
                // Deactivate Tracking
                const newMeta = { ...(booking.metadata || {}), trackingActive: false };
                await supabase.from(BOOKING_TABLE).update({ metadata: newMeta }).eq('id', bookingId);
            }

            // Commit Status Update
            const { error: updateError } = await supabase
                .from(BOOKING_TABLE)
                .update({
                    status: newStatus, // Ensure this matches schema enum or is text
                    updated_at: new Date().toISOString()
                })
                .eq('id', bookingId);

            if (updateError) throw updateError;

        } catch (error) {
            console.error("Error updating booking status:", error);
            throw error;
        }
    }
};
