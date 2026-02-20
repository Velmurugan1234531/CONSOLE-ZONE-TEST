import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
    const supabase = createClient();

    useEffect(() => {
        const fetchMetrics = async () => {
            const { data, error } = await supabase
                .from('orders') // Assuming 'orders' table exists
                .select('*');

            if (error) {
                console.error("Dashboard Listener Error:", error);
                setLoading(false);
                return;
            }

            let total = 0;
            let processing = 0;
            let failures = 0;
            let revenue = 0;
            let rejected = 0;

            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayTimestamp = todayStart.getTime();

            data.forEach((order: any) => {
                const createdAt = new Date(order.created_at).getTime();

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
        };

        fetchMetrics();

        const channel = supabase
            .channel('dashboard-metrics')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                () => fetchMetrics()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return { metrics, loading };
}
