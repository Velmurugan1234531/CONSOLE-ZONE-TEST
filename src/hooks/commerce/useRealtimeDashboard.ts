import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, Unsubscribe } from "firebase/firestore";

export interface DashboardMetrics {
    totalOrders: number;
    processingOrders: number;
    paymentFailures: number;
    revenueToday: number;
    aiRejected: number;
    liveProcessing: number;
}

export function useRealtimeDashboard() {
    const [metrics, setMetrics] = useState<DashboardMetrics>({
        totalOrders: 0,
        processingOrders: 0,
        paymentFailures: 0,
        revenueToday: 0,
        aiRejected: 0,
        liveProcessing: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const ordersRef = collection(db, "orders");
        const q = query(ordersRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let total = 0;
            let processing = 0;
            let failures = 0;
            let revenue = 0;
            let rejected = 0;

            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayTimestamp = todayStart.getTime();

            snapshot.forEach((doc) => {
                const order = doc.data();
                // Firestore timestamps might be strings or Timestamp objects depending on how they were saved
                const createdAt = typeof order.created_at === 'string'
                    ? new Date(order.created_at).getTime()
                    : order.created_at?.toDate?.()?.getTime() || 0;

                // Total Orders Today
                if (createdAt > todayTimestamp) {
                    total++;
                    if (order.payment_status === 'paid') {
                        revenue += (order.total_amount || 0);
                    }
                }

                if (order.order_status === 'processing' || order.order_status === 'confirmed') {
                    processing++;
                }

                if (order.payment_status === 'failed') {
                    failures++;
                }

                if (order.ai_approval === 'rejected') {
                    rejected++;
                }
            });

            setMetrics({
                totalOrders: total,
                processingOrders: processing,
                paymentFailures: failures,
                revenueToday: revenue,
                aiRejected: rejected,
                liveProcessing: processing
            });
            setLoading(false);
        }, (error) => {
            console.error("Dashboard Listener Error:", error);
            setLoading(false);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    return { metrics, loading };
}
