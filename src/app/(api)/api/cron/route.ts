import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    // Basic security check (e.g., Cron secret)
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { ... }

    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        // 1. Check for overdue rentals
        const now = new Date().toISOString();

        const { data: overdueRentals, error } = await supabase
            .from('rentals')
            .select('*')
            .eq('status', 'active')
            .lt('end_date', now);

        if (error) throw error;

        if (overdueRentals && overdueRentals.length > 0) {
            // Update status to 'overdue'
            const ids = overdueRentals.map(r => r.id);

            const { error: updateError } = await supabase
                .from('rentals')
                .update({ status: 'overdue' })
                .in('id', ids);

            if (updateError) throw updateError;

            // In a real app, send emails here
            // await sendOverdueEmails(ids);
        }

        return NextResponse.json({
            success: true,
            processed: overdueRentals?.length || 0,
            message: "Automation checks completed."
        });

    } catch (error) {
        console.error("Cron Error:", error);
        return NextResponse.json({ success: false, error: 'Automation failed' }, { status: 500 });
    }
}
