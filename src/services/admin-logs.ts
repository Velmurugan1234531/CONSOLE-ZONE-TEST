import { db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    orderBy,
    limit as firestoreLimit,
    doc,
    addDoc
} from "firebase/firestore";
import { safeGetDocs } from "@/utils/firebase-utils";

export interface AdminLog {
    id?: string;
    adminId: string;
    adminEmail: string;
    action: string;
    targetUserId?: string;
    targetUserEmail?: string;
    details?: any;
    timestamp: any; // Keep generic to handle ISO string or Date
    ipAddress: string;
    userAgent?: string;
}

function mapLogToCamelCase(id: string, data: any): AdminLog {
    return {
        id: id,
        adminId: data.admin_id,
        adminEmail: data.admin_email,
        action: data.action,
        targetUserId: data.target_user_id,
        targetUserEmail: data.target_user_email,
        details: data.details,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        ipAddress: data.ip_address,
        userAgent: data.user_agent
    };
}

/**
 * Log admin action
 */
export async function logAdminAction(log: Omit<AdminLog, "id" | "timestamp">): Promise<void> {
    try {
        await addDoc(collection(db, 'admin_logs'), {
            admin_id: log.adminId,
            admin_email: log.adminEmail,
            action: log.action,
            target_user_id: log.targetUserId || null,
            target_user_email: log.targetUserEmail || null,
            details: log.details || null,
            ip_address: log.ipAddress,
            user_agent: log.userAgent || null,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Failed to log admin action Firestore:", error);
    }
}

/**
 * Get all admin logs
 */
export async function getAdminLogs(limitCount: number = 100): Promise<AdminLog[]> {
    try {
        const logsRef = collection(db, 'admin_logs');
        const q = query(logsRef, orderBy('timestamp', 'desc'), firestoreLimit(limitCount));
        const snapshot = await safeGetDocs(q);

        return snapshot.docs.map(doc => mapLogToCamelCase(doc.id, doc.data()));
    } catch (error) {
        console.error("Failed to fetch admin logs Firestore:", error);
        return [];
    }
}

/**
 * Get logs for specific admin
 */
export async function getAdminLogsByAdminId(adminId: string, limitCount: number = 50): Promise<AdminLog[]> {
    try {
        const logsRef = collection(db, 'admin_logs');
        const q = query(
            logsRef,
            where('admin_id', '==', adminId),
            orderBy('timestamp', 'desc'),
            firestoreLimit(limitCount)
        );
        const snapshot = await safeGetDocs(q);

        return snapshot.docs.map(doc => mapLogToCamelCase(doc.id, doc.data()));
    } catch (error) {
        console.error("Failed to fetch admin logs by adminId Firestore:", error);
        return [];
    }
}

/**
 * Get logs for specific target user
 */
export async function getAdminLogsByTargetUser(targetUserId: string, limitCount: number = 50): Promise<AdminLog[]> {
    try {
        const logsRef = collection(db, 'admin_logs');
        const q = query(
            logsRef,
            where('target_user_id', '==', targetUserId),
            orderBy('timestamp', 'desc'),
            firestoreLimit(limitCount)
        );
        const snapshot = await safeGetDocs(q);

        return snapshot.docs.map(doc => mapLogToCamelCase(doc.id, doc.data()));
    } catch (error) {
        console.error("Failed to fetch admin logs by targetUser Firestore:", error);
        return [];
    }
}
