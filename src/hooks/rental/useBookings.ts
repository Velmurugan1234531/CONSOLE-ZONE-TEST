import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export const useBookings = (limitCount = 10) => {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const { data, error } = await supabase
                    .from('rentals')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(limitCount);

                if (error) {
                    console.error("Error fetching bookings details:", {
                        message: error.message,
                        code: error.code,
                        details: error.details,
                        hint: error.hint,
                        fullError: error
                    });
                    return;
                }

                if (data) {
                    setBookings(data.map((b: any) => ({
                        bookingId: b.id,
                        bookingStatus: b.status,
                        totalAmount: b.total_price || b.total_cost || 0,
                        createdAt: { toDate: () => new Date(b.created_at) }, // Mock Firebase Timestamp .toDate()
                        // Map other fields as needed by UI
                        userId: b.user_id,
                        rentalStart: b.start_date,
                        rentalEnd: b.end_date
                    })));
                }
            } catch (err) {
                console.error("Error in fetchBookings:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();

        // Real-time subscription
        const channel = supabase
            .channel('public:rentals')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'rentals' }, () => {
                fetchBookings();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [limitCount, supabase]);

    return { bookings, loading };
};
