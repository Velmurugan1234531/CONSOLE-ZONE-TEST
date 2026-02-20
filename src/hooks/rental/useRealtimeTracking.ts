import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
    collection,
    onSnapshot,
    query,
    orderBy
} from "firebase/firestore";

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

    useEffect(() => {
        const trackingRef = collection(db, 'tracking');
        const q = query(trackingRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const formattedData = snapshot.docs.map((doc) => {
                const item = doc.data();
                return {
                    bookingId: item.booking_id || doc.id,
                    customerLocation: item.customer_location,
                    riderLocation: item.rider_location,
                    status: item.status,
                    updatedAt: item.updated_at || new Date().toISOString()
                };
            });
            setActiveFleet(formattedData);
            setLoading(false);
        }, (error) => {
            console.error("useRealtimeTracking Firestore error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { activeFleet, loading };
}
