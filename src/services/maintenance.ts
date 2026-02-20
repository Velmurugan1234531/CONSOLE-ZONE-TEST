
import { createClient } from "@/lib/supabase/client";

export interface RentalEligibility {
    allowed: boolean;
    reason?: string;
    maintenanceStatus?: string;
}

export const checkRentalEligibility = async (deviceId: string): Promise<RentalEligibility> => {
    const supabase = createClient();

    try {
        // 1. Fetch Device Status & Metrics
        // 'consoles' table -> 'devices' collection
        const { data: deviceData, error: deviceError } = await supabase
            .from('devices')
            .select('*')
            .eq('id', deviceId)
            .single();

        if (deviceError || !deviceData) {
            return { allowed: false, reason: "Device not found." };
        }

        const device = deviceData as any;

        // 2. Check Explicit Maintenance Status
        if (['Overdue', 'Critical', 'In-Repair'].includes(device.maintenance_status)) {
            return {
                allowed: false,
                reason: `Device is flagged as ${device.maintenance_status} in Maintenance Control.`,
                maintenanceStatus: device.maintenance_status
            };
        }

        // 3. Check Open Critical Work Orders
        const { data: workOrders, error: woError } = await supabase
            .from('work_orders')
            .select('priority')
            .eq('device_id', deviceId)
            .in('status', ['Open', 'In-Progress', 'Waiting-Parts']);

        if (!woError && workOrders) {
            const openCriticalOrders = workOrders.filter((d: any) => ['High', 'Critical'].includes(d.priority));
            if (openCriticalOrders.length > 0) {
                return {
                    allowed: false,
                    reason: "Active Critical Work Order in progress.",
                    maintenanceStatus: 'In-Repair'
                };
            }
        }

        return { allowed: true };

    } catch (error: any) {
        console.error(`Error checking eligibility: ${error?.message || error}`);
        return { allowed: false, reason: "System error during eligibility check." };
    }
};

export const getMaintenanceDashboardStats = async () => {
    const supabase = createClient();

    try {
        // Fetch Overdue Count
        const { count: overdueCount, error: overdueError } = await supabase
            .from('devices')
            .select('*', { count: 'exact', head: true })
            .in('maintenance_status', ['Overdue', 'Critical']);

        // Fetch In-Repair Count
        const { count: repairCount, error: repairError } = await supabase
            .from('devices')
            .select('*', { count: 'exact', head: true })
            .eq('maintenance_status', 'In-Repair');

        // Fetch Pending QC
        // Placeholder logic for QC

        return {
            overdue: overdueCount || 0,
            inRepair: repairCount || 0,
            healthScore: 92 // Mocked for now
        };
    } catch (error) {
        console.warn("Maintenance stats fetch failed:", error);
        return { overdue: 0, inRepair: 0, healthScore: 0 };
    }
};

export const triggerMaintenanceAlerts = async () => {
    const supabase = createClient();

    try {
        // 1. Fetch Active Policies
        const { data: policies, error: policiesError } = await supabase
            .from('maintenance_policies')
            .select('*')
            .eq('is_active', true);

        if (!policies || policies.length === 0) return { updated: 0 };

        // 2. Fetch All Consoles
        const { data: devices, error: devicesError } = await supabase
            .from('devices')
            .select('*');

        if (!devices || devices.length === 0) return { updated: 0 };

        const updates = [];

        // 3. Evaluate Each Console against Policies
        for (const deviceDoc of devices) {
            const device = deviceDoc as any;
            let newStatus = device.maintenance_status;

            // Skip if already Critical or In-Repair
            if (['Critical', 'In-Repair'].includes(device.maintenance_status)) continue;

            const metrics = device.usage_metrics || { total_rentals: 0, total_days_rented: 0, last_service_date: null };
            const lastService = metrics.last_service_date ? new Date(metrics.last_service_date) : new Date(0); // If null, epoch
            const daysSinceService = Math.floor((new Date().getTime() - lastService.getTime()) / (1000 * 3600 * 24));

            for (const policy of policies) {
                // Time-based check
                if (policy.interval_days) {
                    if (daysSinceService >= policy.interval_days) {
                        newStatus = 'Overdue';
                    } else if (daysSinceService >= policy.interval_days - 7) {
                        // Only escalate, don't downgrade from Overdue
                        if (newStatus !== 'Overdue') newStatus = 'Due-Soon';
                    }
                }
            }

            if (newStatus !== device.maintenance_status) {
                updates.push({
                    id: device.id,
                    maintenance_status: newStatus
                });
            }
        }

        // 4. Batch Update (Sequential for now)
        for (const update of updates) {
            await supabase
                .from('devices')
                .update({ maintenance_status: update.maintenance_status })
                .eq('id', update.id);
        }

        return { updated: updates.length };
    } catch (error) {
        console.error("Maintenance alerts trigger failed:", error);
        return { updated: 0 };
    }
};

export const getCriticalAssets = async () => {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('devices')
            .select('*')
            .in('maintenance_status', ['Overdue', 'Critical', 'In-Repair', 'Due-Soon'])
            .order('maintenance_status', { ascending: false }); // Client side sort might be better if enum order is weird, but text sort OK for rough check

        if (error) throw error;

        return data.map((d: any) => ({ id: d.id, ...d }));
    } catch (error) {
        console.warn("Critical assets fetch failed:", error);
        return [];
    }
};
