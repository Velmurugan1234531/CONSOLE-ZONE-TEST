
import { NextResponse } from "next/server";
import { BookingLogic } from "@/services/booking-logic";
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

        // Initialize Firestore
        const { db } = await import("@/lib/firebase");
        const { collection, addDoc, updateDoc, doc, query, where, getDocs, Timestamp } = await import("firebase/firestore");
        const { safeGetDocs, safeGetDoc } = await import("@/utils/firebase-utils");

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
                const constraints = await BookingLogic.validateUserConstraints(authenticatedUserId);

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
        // Logic handles Firestore internally
        if (isDemo) {
            consoleId = await (BookingLogic as any).mockFindAvailableConsole(productCategory);
        } else {
            consoleId = await BookingLogic.findAvailableConsole(productCategory, start, end);
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

        // 3a. Update User Profile (Save/Update client details)
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

                // Update user profile
                const userRef = doc(db, "users", userId);
                await updateDoc(userRef, profileData);
            } catch (e) {
                console.warn('Could not update user profile in Firestore:', e);
            }
        }

        // 3b. Resolve Product ID for the category (needed for rentals table)
        let productId = null;
        try {
            // Find product by matching category
            const productsRef = collection(db, "products");
            const prodQ = query(productsRef, where("category", "==", productCategory));
            const prodSnap = await safeGetDocs(prodQ);

            if (!prodSnap.empty) {
                productId = prodSnap.docs[0].id;
            }
        } catch (e) { }

        // 3c. Insert into Rentals
        let noteContent = `Delivery: ${deliveryType}, Address: ${address}`;
        if (!userId || userId === 'guest') {
            const guestInfo = `[GUEST] Name: ${body.firstName} ${body.lastName} | Mobile: ${body.mobile} | Email: ${body.email}`;
            noteContent = `${guestInfo} || ${noteContent}`;
        }

        const rentalData = {
            user_id: (userId && userId !== 'guest') ? userId : null,
            device_id: consoleId,
            product_id: productId,
            plan_id: planId || "DAILY",
            duration_plan: planId,
            start_date: start.toISOString(),
            end_date: end.toISOString(),
            status: 'Pending',
            payment_status: 'paid',
            total_price: body.totalAmount || 0,
            notes: noteContent,
            addons: addons || [],
            created_at: new Date().toISOString()
        };

        const rentalsRef = collection(db, "rentals");
        const docRef = await addDoc(rentalsRef, rentalData);

        // 4. Update Console Status to RENTED
        try {
            const deviceRef = doc(db, "devices", consoleId);
            await updateDoc(deviceRef, { status: 'RENTED' });
        } catch (e) {
            console.warn("Failed to update device status to RENTED in Firestore", e);
        }

        // 6. Neural Sync Upgrade
        if (userId && userId !== 'guest') {
            try {
                const newTotal = await NeuralSyncService.addXP(userId, 50);
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
            bookingId: docRef.id,
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
