import { db } from "@/lib/firebase";
import {
    doc,
    updateDoc
} from "firebase/firestore";
import { safeGetDoc } from "@/utils/firebase-utils";

const RISK_THRESHOLD = 50;

/**
 * AI Auto Approval Engine
 * Simulates Cloud Function Logic
 */
export const RiskEngine = {
    /**
     * Evaluates a booking's risk and automates approval/rejection.
     */
    evaluateBookingRisk: async (bookingId: string) => {
        try {
            // 1. Fetch Booking
            const bookingDocRef = doc(db, "rentals", bookingId);
            const bookingSnap = await safeGetDoc(bookingDocRef);

            if (!bookingSnap.exists()) throw new Error("Booking not found");
            const booking = bookingSnap.data() as any;

            // 2. Fetch User Profile
            const userSnap = await safeGetDoc(doc(db, "users", booking.user_id));
            const user = userSnap.exists() ? userSnap.data() : null;

            let currentRiskScore = booking.metadata?.riskScore || 0;
            const riskFactors: string[] = [];

            // 3. Risk Heuristics
            if (user) {
                // New User Risk
                if (user.created_at && (Date.now() - new Date(user.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000) {
                    currentRiskScore += 15;
                    riskFactors.push("New Account (<7 days)");
                }

                const userRiskLevel = user.metadata?.riskLevel || 0;
                if (userRiskLevel > 50) {
                    currentRiskScore += 30;
                    riskFactors.push("High Risk User Profile");
                }

                // Device Fingerprint Mismatch
                const bookingFP = booking.metadata?.deviceFingerprint;
                const userFP = user.metadata?.deviceFingerprint;
                if (bookingFP && userFP && bookingFP !== userFP) {
                    currentRiskScore += 25;
                    riskFactors.push("Device Fingerprint Mismatch");
                }
            } else {
                currentRiskScore += 10;
            }

            console.log(`🛡 Booking ${bookingId} Risk Score: ${currentRiskScore}`, riskFactors);

            // 4. Auto-Decision Matrix
            let nextStatus = booking.status;
            let adminLogMessage = "";

            const paymentStatus = booking.metadata?.paymentStatus || 'PENDING';

            if (currentRiskScore < RISK_THRESHOLD) {
                // LOW RISK -> AUTO APPROVE
                if (paymentStatus === 'SUCCESS') {
                    nextStatus = 'APPROVED';
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
            await updateDoc(bookingDocRef, {
                status: nextStatus,
                metadata: {
                    ...(booking.metadata || {}),
                    riskScore: currentRiskScore,
                    riskFactors: riskFactors
                },
                updated_at: new Date().toISOString()
            });

            console.log(adminLogMessage);

        } catch (error) {
            console.error("Risk evaluation failed (Firestore):", error);
        }
    }
};
