import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
    collection,
    query,
    orderBy,
    limit as firestoreLimit,
    onSnapshot
} from "firebase/firestore";

export const useBookings = (limitCount = 10) => {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const rentalsRef = collection(db, 'rentals');
        const q = query(
            rentalsRef,
            orderBy('created_at', 'desc'),
            firestoreLimit(limitCount)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const formattedBookings = snapshot.docs.map((doc) => {
                const b = doc.data();
                return {
                    bookingId: doc.id,
                    bookingStatus: b.status,
                    totalAmount: b.total_price || b.total_cost || 0,
                    createdAt: { toDate: () => new Date(b.created_at) }, // Mock Firebase Timestamp .toDate()
                    userId: b.user_id,
                    rentalStart: b.start_date,
                    rentalEnd: b.end_date
                };
            });
            setBookings(formattedBookings);
            setLoading(false);
        }, (error) => {
            console.error("useBookings Firestore error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [limitCount]);

    return { bookings, loading };
};
