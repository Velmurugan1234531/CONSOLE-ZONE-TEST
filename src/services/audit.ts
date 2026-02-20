import { db } from "@/lib/firebase";
import {
    collection,
    addDoc
} from "firebase/firestore";

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

    // 2. Persist to Firestore Audit Log
    try {
        await addDoc(collection(db, 'audit_logs'), {
            event_type: event.type,
            user_id: event.userId,
            action: event.action,
            resource: event.resource,
            ip_address: event.ip,
            metadata: event.metadata,
            severity: event.severity || 'info',
            created_at: timestamp
        });
    } catch (e: any) {
        console.warn("Audit log persistence failed (Firestore):", e?.message || e);
    }
};
