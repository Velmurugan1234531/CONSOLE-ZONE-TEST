
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface TrackingData {
    bookingId: string;
    customerLocation?: { lat: number; lng: number };
    riderLocation?: { lat: number; lng: number };
    status: string;
    updatedAt: string;
}

export function useRealtimeTracking() {
    const [activeFleet, setActiveFleet] = useState<TrackingData[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchInitialState = async () => {
            const { data, error } = await supabase
                .from('tracking')
                .select('*');

            if (data) {
                // Map DB columns to interface if needed, assuming camelCase in DB or mapper
                // But typically Supabase uses snake_case. 
                // Let's assume the table has snake_case columns and we map them.
                const formattedData = data.map((item: any) => ({
                    bookingId: item.booking_id,
                    customerLocation: item.customer_location,
                    riderLocation: item.rider_location,
                    status: item.status,
                    updatedAt: item.updated_at
                }));
                setActiveFleet(formattedData);
            }
            setLoading(false);
        };

        fetchInitialState();

        const channel = supabase
            .channel('tracking-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tracking'
                },
                (payload) => {
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const newItem = payload.new as any;
                        const formattedItem = {
                            bookingId: newItem.booking_id,
                            customerLocation: newItem.customer_location,
                            riderLocation: newItem.rider_location,
                            status: newItem.status,
                            updatedAt: newItem.updated_at
                        };

                        setActiveFleet((prev) => {
                            const exists = prev.find(p => p.bookingId === formattedItem.bookingId);
                            if (exists) {
                                return prev.map(p => p.bookingId === formattedItem.bookingId ? formattedItem : p);
                            } else {
                                return [...prev, formattedItem];
                            }
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return { activeFleet, loading };
}

