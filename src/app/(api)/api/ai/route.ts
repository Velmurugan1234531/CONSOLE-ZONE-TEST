import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { query: userQuery } = await req.json();
        const lowerQuery = userQuery.toLowerCase();

        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        let responseText = "I'm not sure how to help with that. Try asking about 'revenue', 'active rentals', or 'stock'.";

        // Logic to interpret natural language queries and fetch real data

        if (lowerQuery.includes("sales") || lowerQuery.includes("revenue") || lowerQuery.includes("income")) {
            const { data: paidOrders } = await supabase
                .from('orders')
                .select('total_amount')
                .eq('payment_status', 'paid');

            const total = paidOrders?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) || 0;
            responseText = `Total revenue from sales is ₹${total.toLocaleString()}.`;

        } else if (lowerQuery.includes("rental") || lowerQuery.includes("booking")) {
            const { count } = await supabase
                .from('rentals')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');
            responseText = `There are currently ${count || 0} active rentals.`;

        } else if (lowerQuery.includes("stock") || lowerQuery.includes("inventory")) {
            const { count: totalCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true });

            const { count: lowStockCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .lt('stock', 5);

            responseText = `We have ${totalCount || 0} total items in inventory. ${lowStockCount || 0} items are low on stock.`;

        } else if (lowerQuery.includes("user") || lowerQuery.includes("customer")) {
            const { count } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });
            responseText = `We have ${count || 0} registered users.`;

        } else if (lowerQuery.includes("overdue")) {
            const { count: overdueCount } = await supabase
                .from('rentals')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'overdue');

            responseText = (overdueCount || 0) > 0
                ? `Alert: There are ${overdueCount} overdue rentals requiring attention.`
                : "Good news! There are no overdue rentals at the moment.";
        }

        return NextResponse.json({ response: responseText });

    } catch (error) {
        console.error("AI Error:", error);
        return NextResponse.json({ response: "My internal systems are experiencing an error." }, { status: 500 });
    }
}
