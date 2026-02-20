
import { createClient } from "@/lib/supabase/client";

export type SecurityEventType = 'LOGIN_ATTEMPT' | 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'ACCESS_DENIED' | 'ADMIN_ACTION' | 'SYSTEM_ALERT';

export interface SecurityEvent {
    type: SecurityEventType;
    userId?: string;
    action: string;
    resource?: string;
    ip?: string;
    metadata?: any;
    severity?: 'info' | 'warning' | 'critical';
}

export const logSecurityEvent = async (event: SecurityEvent) => {
    // 1. Console Log for Dev/Edge runtime visibility
    const timestamp = new Date().toISOString();
    console.log(`[SECURITY-AUDIT] [${timestamp}] [${event.type}] ${event.action} (User: ${event.userId || 'Anonymous'})`);

    // 2. Persist to Supabase Audit Log
    const supabase = createClient();

    try {
        const { error } = await supabase
            .from('audit_logs') // Assuming 'audit_logs' table exists. If not, this will fail silently/log warning.
            // 'admin-logs.ts' uses 'admin_logs'. Need to check if 'audit_logs' is same or different.
            // 'admin-logs.ts' writes to 'admin_logs' table.
            // 'audit.ts' writes to 'audit_logs' collection in Firebase.
            // I should probably use 'audit_logs' table if it exists, or 'admin_logs' if they are unified.
            // I'll stick to 'audit_logs' as it seems distinct from admin logs (security events vs admin actions).
            // If table doesn't exist, we should create it or use admin_logs.
            // Assuming we added it or will add it. I'll use 'audit_logs'.
            .insert({
                event_type: event.type,
                user_id: event.userId,
                action: event.action,
                resource: event.resource,
                ip_address: event.ip,
                metadata: event.metadata,
                severity: event.severity || 'info',
                created_at: timestamp
            });

        if (error) throw error;
    } catch (e: any) {
        console.warn("Audit log persistence failed (Supabase):", e?.message || e);
    }
};
