
import { NextResponse } from "next/server";
import { BookingLogic } from "@/services/booking-logic";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { PLANS } from "@/constants";
import { NeuralSyncService } from "@/services/neural-sync";
import { sendNotification } from "@/services/notifications";
import { Transmissions } from "@/utils/neural-messages";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            userId,
            productCategory, // 'PS5', 'Xbox'
            planId, // 'daily', 'weekly'
            startDate,
            endDate,
            deliveryType, // 'DELIVERY', 'PICKUP'
            address,
            addons
        } = body;

        // Initialize Supabase Client
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        console.log("Booking Request Received:", {
            hasUserId: !!userId,
            userId,
            productCategory,
            startDate,
            endDate
        });

        // Basic validation
        if (!productCategory || !startDate || !endDate) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const authenticatedUserId = userId; // Trust client ID since verified by middleware presumably or handled client side

        // 1b. Validate User Constraints
        if (authenticatedUserId && authenticatedUserId !== 'guest') {
            try {
                // Use the authenticated ID for constraints check
                const constraints = await BookingLogic.validateUserConstraints(authenticatedUserId, supabase);

                // CRITICAL: Block all bookings if not APPROVED
                if (!constraints.isVerified) {
                    return NextResponse.json({
                        error: "Identity Verification Required",
                        message: "Your KYC is still pending or not submitted. Please complete verification in your profile.",
                        code: "KYC_REQUIRED"
                    }, { status: 403 });
                }

                if (deliveryType === 'PICKUP' && !constraints.canPickup) {
                    return NextResponse.json({
                        error: "Pickup not available",
                        message: "Self-pickup is only available for verified users with a booking history.",
                        code: "PICKUP_RESTRICTED"
                    }, { status: 403 });
                }
            } catch (e: any) {
                console.error(`Booking API: User validation error: ${e?.message || e}`);
                return NextResponse.json({ error: "Identity check failed. Please try again later." }, { status: 500 });
            }
        } else {
            // Block Guest Checkout for Rentals
            return NextResponse.json({
                error: "Authentication Required",
                message: "Please login and complete KYC verification to rent consoles.",
                code: "AUTH_REQUIRED"
            }, { status: 401 });
        }

        // 2. Find Available Console (Tetris Logic)
        const isDemo = userId.startsWith('demo-');

        let consoleId;
        // Logic handles Supabase internally now
        if (isDemo) {
            consoleId = await (BookingLogic as any).mockFindAvailableConsole(productCategory);
        } else {
            consoleId = await BookingLogic.findAvailableConsole(productCategory, start, end, supabase);
        }

        if (!consoleId) {
            return NextResponse.json({
                error: "No consoles available for these dates.",
                available: false
            }, { status: 409 });
        }

        // 3. Create Booking Record
        if (isDemo) {
            console.log("[BOOKING] SUCCESS (Demo Mode):", { userId, productCategory, consoleId });
            return NextResponse.json({
                success: true,
                bookingId: `demo-${crypto.randomUUID()}`,
                consoleId: consoleId,
                message: "Booking confirmed (Demo Mode)!"
            });
        }

        // 3a. Upsert User Profile (Save/Update client details)
        if (userId && userId !== 'guest') {
            try {
                const profileData: any = {
                    updated_at: new Date().toISOString()
                };

                // Add profile fields if provided in booking
                if (body.firstName || body.lastName) {
                    const fullName = `${body.firstName || ''} ${body.lastName || ''}`.trim();
                    if (fullName) profileData.full_name = fullName;
                }
                if (body.email) profileData.email = body.email;
                if (body.mobile) profileData.phone = body.mobile;

                // Upsert user profile (insert or update)
                // Using Supabase
                const { error } = await supabase
                    .from('users')
                    .update(profileData)
                    .eq('id', userId);

                if (error) {
                    // If update failed, maybe strict RLS or user doesnt exist?
                    console.warn('Could not update user profile (Supabase):', error);
                }
            } catch (e) {
                console.warn('Could not update user profile:', e);
            }
        }

        // 3b. Resolve Product ID for the category (needed for rentals table)
        let productId = null;
        try {
            // Find product by matching category
            const { data: products } = await supabase
                .from('products')
                .select('id')
                .eq('category', productCategory)
                .limit(1);

            if (products && products.length > 0) {
                productId = products[0].id;
            }
        } catch (e) { }

        // 3c. Insert into Rentals
        let noteContent = `Delivery: ${deliveryType}, Address: ${address}`;
        if (!userId || userId === 'guest') {
            const guestInfo = `[GUEST] Name: ${body.firstName} ${body.lastName} | Mobile: ${body.mobile} | Email: ${body.email}`;
            noteContent = `${guestInfo} || ${noteContent}`;
        }

        const rentalData = {
            user_id: (userId && userId !== 'guest') ? userId : null, // Ensure valid UUID or null
            // For Supabase, if foreign key fails (e.g. guest), using null is safer if allowed.
            // My schema: user_id UUID REFERENCES users(id). If null allowed? 
            // Default PostgreSQL allows null FK unless NOT NULL. 
            // My schema: user_id UUID REFERENCES... (implied nullable).
            // But if userId is "guest" string, it will fail UUID check.
            // So logic above (userId && userId !== 'guest') ? userId : null is correct.

            device_id: consoleId, // consoleId is text ID from devices table
            product_id: productId, // UUID from products table
            plan_id: planId || "DAILY", // defaulting if missing

            // Map logic: planId is just text in my schema 'duration_plan'.
            duration_plan: planId,

            start_date: start.toISOString(),
            end_date: end.toISOString(),
            status: 'Pending',
            payment_status: 'paid', // Assuming payment successful if we reached here
            total_price: body.totalAmount || 0,
            notes: noteContent,
            addons: addons || [], // JSONB in schema
            created_at: new Date().toISOString()
        };

        const { data: rental, error: rentalError } = await supabase
            .from('rentals')
            .insert(rentalData)
            .select()
            .single();

        if (rentalError) {
            console.error("Failed to create rental record:", rentalError);
            throw new Error("Failed to create booking record");
        }

        // 4. Update Console Status to RENTED
        try {
            await supabase
                .from('devices')
                .update({ status: 'RENTED' })
                .eq('id', consoleId);
        } catch (e) {
            console.warn("Failed to update device status to RENTED", e);
        }

        // 5. Record Addons (logging usage) - already stored in 'addons' JSONB column

        // 6. Neural Sync Upgrade
        if (userId && userId !== 'guest') {
            try {
                // calls Supabase internally
                const newTotal = await NeuralSyncService.addXP(userId, 50, supabase);
                const transmission = Transmissions.SYNC.XP_GAINED(50, newTotal);
                await sendNotification({
                    user_id: userId,
                    type: 'success',
                    title: transmission.title,
                    message: transmission.message
                });
            } catch (e) {
                console.warn("Neural sync upgrade failed (non-critical):", e);
            }
        }

        return NextResponse.json({
            success: true,
            bookingId: rental.id,
            consoleId: consoleId,
            message: "Booking confirmed!"
        });

    } catch (error: any) {
        console.error("Booking API Error Stack:", error?.stack);
        console.error("Booking API Error Message:", error?.message);
        return NextResponse.json(
            {
                error: error?.message || "Internal System Error",
                details: process.env.NODE_ENV === 'development' ? String(error) : undefined
            },
            { status: 500 }
        );
    }
}
