
import { createClient } from "@/lib/supabase/client";
import { ServiceBooking } from "@/types";

export const getAllServiceBookings = async () => {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('service_bookings')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching all bookings:", error);
            return [];
        }

        // Map data if needed (assuming snake_case in DB, camelCase in type? 
        // Need to check ServiceBooking type really, but usually it's best to match frontend expectations)
        // For now, returning as-is or basic mapping
        return data as ServiceBooking[];
    } catch (error) {
        console.error("Error fetching all bookings:", error);
        return [];
    }
};

export const updateBookingStatus = async (id: string, status: string) => {
    const supabase = createClient();
    try {
        const { error } = await supabase
            .from('service_bookings')
            .update({ status })
            .eq('id', id);

        if (error) throw error;
    } catch (error) {
        console.error("Error updating booking status:", error);
        throw error;
    }
};

export const deleteBooking = async (id: string) => {
    const supabase = createClient();
    try {
        const { error } = await supabase
            .from('service_bookings')
            .delete()
            .eq('id', id);

        if (error) throw error;
    } catch (error) {
        console.error("Error deleting booking:", error);
        throw error;
    }
};
