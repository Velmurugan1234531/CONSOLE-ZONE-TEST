import { db } from "@/lib/firebase";
import {
    doc,
    updateDoc
} from "firebase/firestore";
import { safeGetDoc } from "@/utils/firebase-utils";

export interface ApprovalDecision {
    decision: 'APPROVE' | 'MANUAL_REVIEW' | 'REJECT';
    reason: string;
    risk_score: number;
}

export const AIApprovalEngine = {
    /**
     * Analyzes Order to decide: APPROVE | MANUAL_REVIEW | REJECT
     */
    analyzeOrder: async (orderId: string): Promise<ApprovalDecision> => {
        try {
            const orderDocRef = doc(db, "orders", orderId);
            const orderSnap = await safeGetDoc(orderDocRef);

            if (!orderSnap.exists()) {
                return { decision: 'MANUAL_REVIEW', reason: "Order not found", risk_score: 100 };
            }

            const order = orderSnap.data() as any;

            // Fetch User for history check
            const userId = order.user_id || order.customer_id;
            const userSnap = await safeGetDoc(doc(db, "users", userId));
            const user = userSnap.exists() ? userSnap.data() : null;

            let decision: 'APPROVE' | 'MANUAL_REVIEW' | 'REJECT' = 'MANUAL_REVIEW';
            let reason = "Default Review";
            let risk_score = 50;

            // --- RULES ENGINE ---
            const isSuspiciousPattern = false;
            const addressMismatch = false;
            const hasFailedPayments = false;

            if (isSuspiciousPattern) {
                decision = 'REJECT';
                reason = "Suspicious pattern detected (Multiple high orders)";
                risk_score = 95;
            }
            else if (hasFailedPayments) {
                decision = 'MANUAL_REVIEW';
                reason = "User has > 3 failed payments";
                risk_score = 75;
            }
            else if (addressMismatch) {
                decision = 'MANUAL_REVIEW';
                reason = "Delivery address differs by > 1000km";
                risk_score = 80;
            }
            else if ((order.total_amount || 0) < 10000) {
                decision = 'APPROVE';
                reason = "Low value order (< 10k INR)";
                risk_score = 10;
            }
            else if (order.payment_status === 'paid' && user?.kyc_status === 'approved') {
                decision = 'APPROVE';
                reason = "Verified trusted customer";
                risk_score = 15;
            }
            else {
                decision = 'MANUAL_REVIEW';
                reason = "High value order needs review";
                risk_score = 60;
            }

            // --- EXECUTION ---
            await updateDoc(orderDocRef, {
                ai_approval: decision === 'APPROVE' ? 'approved' : 'manual_review',
                updated_at: new Date().toISOString()
            });

            return { decision, reason, risk_score };

        } catch (error) {
            console.error("AI Analysis Failed (Firestore):", error);
            return { decision: 'MANUAL_REVIEW', reason: "System Error", risk_score: 100 };
        }
    }
};
