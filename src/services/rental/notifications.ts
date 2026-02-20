
import { sendNotification } from "@/services/notifications";
import { SupabaseClient } from "@supabase/supabase-js";

export const RentalNotificationService = {
    /**
     * Send Push Notification to User via FCM -> Legacy
     * Now routes to internal Supabase Notifications.
     */
    sendToUser: async (userId: string, title: string, body: string, data?: Record<string, any>, supabaseClient?: SupabaseClient) => {
        try {
            await sendNotification({
                user_id: userId,
                type: (data?.type as any) || 'info', // Map to NotificationType
                title,
                message: body,
                metadata: data
            }, supabaseClient);

            console.log(`📲 Notification stored for ${userId}: ${title}`);

        } catch (error) {
            console.error("Error storing notification:", error);
        }
    },

    /**
     * Standard Rental Events
     */
    notifyBookingCreated: async (userId: string, bookingId: string, supabaseClient?: SupabaseClient) => {
        await RentalNotificationService.sendToUser(
            userId,
            "Booking Received 📅",
            "We have received your rental request. It is currently under review.",
            { bookingId, type: 'info' }, // mapped type
            supabaseClient
        );
    },

    notifyPaymentSuccess: async (userId: string, bookingId: string, supabaseClient?: SupabaseClient) => {
        await RentalNotificationService.sendToUser(
            userId,
            "Payment Confirmed ✅",
            "Your payment was successful. We are generating your invoice.",
            { bookingId, type: 'success' },
            supabaseClient
        );
    },

    notifyApproval: async (userId: string, bookingId: string, supabaseClient?: SupabaseClient) => {
        await RentalNotificationService.sendToUser(
            userId,
            "Rental Approved 🚀",
            "Great news! Your rental request has been approved. A rider will be assigned shortly.",
            { bookingId, type: 'success' },
            supabaseClient
        );
    },

    notifyRiderAssigned: async (userId: string, riderName: string, bookingId: string, supabaseClient?: SupabaseClient) => {
        await RentalNotificationService.sendToUser(
            userId,
            "Rider Assigned 🛵",
            `${riderName} is on the way with your console!`,
            { bookingId, type: 'info' },
            supabaseClient
        );
    }
};
