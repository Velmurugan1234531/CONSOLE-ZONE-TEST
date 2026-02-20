
import { createClient } from "@/lib/supabase/client";

const RISK_THRESHOLD = 50;
const BOOKING_TABLE = "rentals";
const USER_TABLE = "users";

/**
 * AI Auto Approval Engine
 * Simulates Cloud Function Logic
 */
export const RiskEngine = {
    /**
     * Evaluates a booking's risk and automates approval/rejection.
     * Callable from API Route (Webhook) or Cloud Function.
     */
    evaluateBookingRisk: async (bookingId: string) => {
        const supabase = createClient();
        try {
            // 1. Fetch Booking
            const { data: booking, error: bookingError } = await supabase
                .from(BOOKING_TABLE)
                .select('*')
                .eq('id', bookingId)
                .single();

            if (bookingError || !booking) throw new Error("Booking not found");

            // 2. Fetch User Profile
            const { data: user, error: userError } = await supabase
                .from(USER_TABLE)
                .select('*')
                .eq('id', booking.user_id)
                .single();

            let currentRiskScore = booking.metadata?.riskScore || 0;
            const riskFactors: string[] = [];

            // 3. Risk Heuristics
            if (user) {
                // New User Risk
                // Supabase stored created_at as ISO string usually
                if (user.created_at && (Date.now() - new Date(user.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000) {
                    currentRiskScore += 15;
                    riskFactors.push("New Account (<7 days)");
                }
                // High Risk Flag in Profile
                // Assuming 'risk_level' column exists or is in metadata. 
                // Let's assume metadata for now if not standard.
                // Or user.riskLevel if mapped. 
                // Let's check if 'risk_level' is in schema.
                // Schema users table: wallet_balance, phone, etc. No explicit risk_level.
                // Checking usage: user.riskLevel.
                // Let's assume it's in metadata or we check a default.
                const userRiskLevel = user.metadata?.riskLevel || 0; // fallback
                if (userRiskLevel > 50) {
                    currentRiskScore += 30;
                    riskFactors.push("High Risk User Profile");
                }
                // Device Fingerprint Mismatch (Simulated)
                const bookingFP = booking.metadata?.deviceFingerprint;
                const userFP = user.metadata?.deviceFingerprint;
                if (bookingFP && userFP && bookingFP !== userFP) {
                    currentRiskScore += 25;
                    riskFactors.push("Device Fingerprint Mismatch");
                }
            } else {
                currentRiskScore += 10; // Unknown user (shouldn't happen with FK)
            }

            // Location Mismatch (Placeholder logic)
            // if (booking.location !== user.location) currentRiskScore += 20;

            console.log(`🛡 Booking ${bookingId} Risk Score: ${currentRiskScore}`, riskFactors);

            // 4. Auto-Decision Matrix
            let nextStatus = booking.status;
            let adminLogMessage = "";

            // Check payment status from metadata or separate column if added.
            const paymentStatus = booking.metadata?.paymentStatus || 'PENDING';

            if (currentRiskScore < RISK_THRESHOLD) {
                // LOW RISK -> AUTO APPROVE
                if (paymentStatus === 'SUCCESS') {
                    nextStatus = 'APPROVED'; // Ensure this matches allowed status
                    adminLogMessage = `Auto-Approved by AI (Risk: ${currentRiskScore})`;
                } else {
                    adminLogMessage = `Low Risk (${currentRiskScore}), waiting for payment`;
                }
            } else {
                // HIGH RISK -> MANUAL REVIEW
                nextStatus = 'UNDER_REVIEW';
                adminLogMessage = `Flagged for Manual Review (Risk: ${currentRiskScore}: ${riskFactors.join(", ")})`;
            }

            // 5. Update Booking
            const updates = {
                status: nextStatus,
                metadata: {
                    ...(booking.metadata || {}),
                    riskScore: currentRiskScore,
                    riskFactors: riskFactors
                    // bookingsStatus: nextStatus // sync metadata if needed
                },
                updated_at: new Date().toISOString()
            };

            await supabase
                .from(BOOKING_TABLE)
                .update(updates)
                .eq('id', bookingId);

            // 6. Log to Admin Logs (Simulated via console for now)
            console.log(adminLogMessage);

        } catch (error) {
            console.error("Risk evaluation failed:", error);
        }
    }
};
