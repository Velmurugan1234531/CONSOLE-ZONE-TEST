
import { createClient } from "@/lib/supabase/client";

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

function mapLogToCamelCase(data: any): AdminLog {
    return {
        id: data.id,
        adminId: data.admin_id,
        adminEmail: data.admin_email,
        action: data.action,
        targetUserId: data.target_user_id,
        targetUserEmail: data.target_user_email,
        details: data.details,
        timestamp: new Date(data.timestamp), // Convert to Date object for frontend
        ipAddress: data.ip_address,
        userAgent: data.user_agent
    };
}

/**
 * Log admin action
 */
export async function logAdminAction(log: Omit<AdminLog, "id" | "timestamp">): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
        .from('admin_logs')
        .insert({
            admin_id: log.adminId,
            admin_email: log.adminEmail,
            action: log.action,
            target_user_id: log.targetUserId,
            target_user_email: log.targetUserEmail,
            details: log.details,
            ip_address: log.ipAddress,
            user_agent: log.userAgent,
        });

    if (error) {
        console.error("Failed to log admin action:", error);
    }
}

/**
 * Get all admin logs
 */
export async function getAdminLogs(limitCount: number = 100): Promise<AdminLog[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('admin_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limitCount);

    if (error) {
        console.error("Failed to fetch admin logs:", error);
        return [];
    }

    return data.map(mapLogToCamelCase);
}

/**
 * Get logs for specific admin
 */
export async function getAdminLogsByAdminId(adminId: string, limitCount: number = 50): Promise<AdminLog[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('admin_logs')
        .select('*')
        .eq('admin_id', adminId)
        .order('timestamp', { ascending: false })
        .limit(limitCount);

    if (error) return [];

    return data.map(mapLogToCamelCase);
}

/**
 * Get logs for specific target user
 */
export async function getAdminLogsByTargetUser(targetUserId: string, limitCount: number = 50): Promise<AdminLog[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('admin_logs')
        .select('*')
        .eq('target_user_id', targetUserId)
        .order('timestamp', { ascending: false })
        .limit(limitCount);

    if (error) return [];

    return data.map(mapLogToCamelCase);
}
