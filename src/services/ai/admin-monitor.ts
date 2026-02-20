import { db } from "@/lib/firebase";
import {
    collection,
    addDoc
} from "firebase/firestore";

export const AdminMonitorAI = {
    /**
     * Log and analyze admin action for risk.
     */
    logAction: async (adminId: string, action: string, metadata: any = {}) => {
        const timestamp = new Date().toISOString();
        const severity = calculateRisk(action, metadata);

        console.log(`[AI-MONITOR] [${severity}] Admin ${adminId} -> ${action}`);

        if (severity === 'critical') {
            console.warn(`[AI-ALERT] 🚨 SUSPICIOUS ADMIN ACTIVITY DETECTED: ${action}`);
            // TODO: Trigger auto-lockout or email alert
        }

        // Persist to Firestore Audit Log
        try {
            await addDoc(collection(db, 'audit_logs'), {
                user_id: adminId,
                action: action,
                metadata: metadata,
                severity: severity, // info, warning, critical
                event_type: 'ADMIN_ACTION',
                request_id: metadata?.requestId, // Optional if we have it
                created_at: timestamp
            });
        } catch (e) {
            console.warn("AI Monitor log failed (Firestore)", e);
        }
    }
};

/**
 * Heuristic Risk Engine
 */
function calculateRisk(action: string, metadata: any): 'info' | 'warning' | 'critical' {
    const criticalActions = ['DELETE_USER', 'BULK_DELETE', 'DROP_TABLE', 'FORCE_OVERRIDE'];
    const warningActions = ['UPDATE_ROLE', 'REFUND_PROCESS', 'MANUAL_ADJUSTMENT'];

    if (criticalActions.some(a => action.includes(a))) return 'critical';
    if (warningActions.some(a => action.includes(a))) return 'warning';

    // Check for bulk operations in metadata
    if (metadata?.count && metadata.count > 10) return 'warning';
    if (metadata?.count && metadata.count > 50) return 'critical';

    return 'info';
}
