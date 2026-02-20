import { NextResponse } from "next/server";
import { BookingLogic } from "@/services/booking-logic";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const month = searchParams.get("month"); // YYYY-MM

    if (!category || !month) {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const [year, monthNum] = month.split("-").map(Number);
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    try {
        const availability = await BookingLogic.getAvailabilityForMonth(category, year, monthNum, supabase);
        return NextResponse.json(availability);
    } catch (error) {
        console.error("Availability API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
