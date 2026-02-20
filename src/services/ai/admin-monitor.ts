import { createClient } from "@/lib/supabase/client";

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

        // Persist to audit (using existing table logic or new service)
        const supabase = createClient();

        try {
            await supabase.from('audit_logs').insert({
                user_id: adminId,
                action: action,
                metadata: metadata,
                severity: severity, // info, warning, critical
                event_type: 'ADMIN_ACTION', // Added to satisfy table schema constraint if any, or just for consistency
                request_id: metadata?.requestId, // Optional if we have it
                created_at: timestamp
            });
        } catch (e) {
            // fast fail
            console.warn("AI Monitor log failed", e);
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
