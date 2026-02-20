import { createClient } from "@/lib/supabase/client";
import { ServiceBooking } from "@/types";

export const createServiceBooking = async (bookingData: Partial<ServiceBooking>) => {
    const supabase = createClient();

    try {
        const payload = {
            ...bookingData,
            created_at: new Date().toISOString(),
            status: bookingData.status || 'pending'
        };

        const { data, error } = await supabase
            .from('service_bookings')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;

        console.log("Booking created with ID:", data.id);
        return { id: data.id, ...payload };
    } catch (error) {
        console.error("Error creating booking:", error);
        throw error;
    }
};

export const getUserServiceBookings = async (userId: string) => {
    // Demo Mode Support
    if (userId === 'demo-user-123') {
        const { DEMO_SERVICE_BOOKINGS } = await import("@/constants/demo-stock");
        return DEMO_SERVICE_BOOKINGS || [];
    }

    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('service_bookings')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Supabase fetch service bookings error:", error);
            // Fallback
            return [];
        }

        return data.map((doc: any) => ({
            id: doc.id,
            ...doc
        }));
    } catch (error) {
        console.error("Error fetching user bookings:", error);
        return [];
    }
};
