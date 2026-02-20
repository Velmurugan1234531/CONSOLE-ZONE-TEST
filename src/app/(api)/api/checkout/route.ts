
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { PLANS, ADDONS } from "@/constants";

// Robust key handling avoiding strict '!' to prevent crash if env is missing
const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

const isConfigured = !!(
    key_id &&
    key_secret &&
    key_id !== 'YOUR_RAZORPAY_KEY_ID' &&
    !key_id.includes('DEMO')
);

if (!isConfigured) {
    console.warn("⚠️  RAZORPAY NOT CONFIGURED - Running in DEMO mode.");
}

const razorpay = isConfigured ? new Razorpay({
    key_id: key_id!,
    key_secret: key_secret!,
}) : null;

// Helper to determine price from DB or Fallback
async function calculateServerPrice(
    category: string,
    startDate: string,
    endDate: string,
    addons: any[] = []
): Promise<{ total: number, breakdown: any }> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationMs = end.getTime() - start.getTime();
    const days = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

    // Minimum 1 day
    const rentalDays = Math.max(1, days);

    let baseRate = 0;
    let controllerRate = 0;

    // 1. Fetch Pricing from Firestore
    let settings: any = null;
    try {
        const { getCatalogSettingsByCategory } = await import("@/services/catalog");
        settings = await getCatalogSettingsByCategory(category);
    } catch (e) {
        console.warn("Firestore pricing fetch failed:", e);
    }

    if (settings) {
        // Use DB Settings
        if (rentalDays >= 30) {
            baseRate = settings.monthly_rate;
            controllerRate = settings.controller_monthly_rate;
        } else if (rentalDays >= 7) {
            const weeks = Math.ceil(rentalDays / 7);
            baseRate = settings.weekly_rate * weeks;
            controllerRate = settings.controller_weekly_rate * weeks;
        } else {
            baseRate = settings.daily_rate * rentalDays;
            controllerRate = settings.controller_daily_rate * rentalDays;
        }
    } else {
        // Fallback to minimal safe defaults if DB is unreachable (shouldn't happen in prod)
        console.warn(`Price Calc: No settings for ${category}, utilizing safe defaults.`);
        // Default to daily rate of ~500 for safety
        baseRate = 500 * rentalDays;
    }

    // 2. Addons
    let addonsTotal = 0;
    if (addons && Array.isArray(addons)) {
        // Extra Controllers
        const extraControllers = addons.find(a => a.id === 'extra_controller')?.quantity || 0;
        if (extraControllers > 0) {
            addonsTotal += (controllerRate * extraControllers);
        }

        // Other fixed price addons
        addons.forEach(addon => {
            const staticAddon = ADDONS.find(a => a.id === addon.id);
            if (staticAddon) {
                addonsTotal += (staticAddon.price * (addon.quantity || 1));
            }
        });
    }

    return {
        total: baseRate + addonsTotal,
        breakdown: { baseRate, addonsTotal, rentalDays }
    };
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            currency = "INR",
            // Secure Params
            category,
            startDate,
            endDate,
            addons
        } = body;

        let finalAmount = 0;

        if (category && startDate && endDate) {
            // Secure Calculation
            const { total } = await calculateServerPrice(category, startDate, endDate, addons);
            finalAmount = total;
            console.log(`🔐 Secure Price Calculated: ₹${finalAmount} for ${category}`);
        } else if (body.amount && (!isConfigured || process.env.NODE_ENV === 'development')) {
            // Fallback for Dev/Demo only
            console.warn("⚠️ Using Client-Side Amount (Dev/Demo Only)");
            finalAmount = body.amount;
        } else {
            return NextResponse.json(
                { error: "Invalid Request: Missing pricing parameters (category, startDate, endDate)" },
                { status: 400 }
            );
        }

        if (finalAmount <= 0) {
            return NextResponse.json({ error: "Calculated amount is invalid" }, { status: 400 });
        }

        // DEMO MODE: Return mock order
        if (!isConfigured || !razorpay) {
            console.log("🎮 DEMO MODE: Simulating payment order creation");
            return NextResponse.json({
                id: `demo_order_${Date.now()}`,
                entity: "order",
                amount: Math.round(finalAmount * 100),
                amount_paid: 0,
                amount_due: Math.round(finalAmount * 100),
                currency,
                receipt: `demo_receipt_${Date.now()}`,
                status: "created",
                attempts: 0,
                notes: { demo: "true" },
                created_at: Math.floor(Date.now() / 1000),
                demoMode: true
            });
        }

        // LIVE MODE: Create actual Razorpay order
        const options = {
            amount: Math.round(finalAmount * 100), // Razorpay expects amount in paise
            currency,
            receipt: `receipt_${Date.now()}`,
        };

        try {
            const order = await razorpay.orders.create(options);
            return NextResponse.json(order);
        } catch (razorpayError: any) {
            console.error("Razorpay API Call Failed:", razorpayError);

            if (razorpayError.statusCode === 401) {
                return NextResponse.json(
                    { error: "Invalid Razorpay Credentials", details: razorpayError, demoMode: true },
                    { status: 401 }
                );
            }
            throw razorpayError;
        }
    } catch (error: any) {
        console.error("Payment Route Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
