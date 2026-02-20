import { db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    orderBy,
    limit,
    getCountFromServer
} from "firebase/firestore";
import { safeGetDoc, safeGetDocs } from "@/utils/firebase-utils";

export interface RentalEligibility {
    allowed: boolean;
    reason?: string;
    maintenanceStatus?: string;
}

export const checkRentalEligibility = async (deviceId: string): Promise<RentalEligibility> => {
    try {
        // 1. Fetch Device Status & Metrics
        const deviceSnap = await safeGetDoc(doc(db, 'devices', deviceId));

        if (!deviceSnap.exists()) {
            return { allowed: false, reason: "Device not found." };
        }

        const device = deviceSnap.data() as any;

        // 2. Check Explicit Maintenance Status
        if (['Overdue', 'Critical', 'In-Repair'].includes(device.maintenance_status)) {
            return {
                allowed: false,
                reason: `Device is flagged as ${device.maintenance_status} in Maintenance Control.`,
                maintenanceStatus: device.maintenance_status
            };
        }

        // 3. Check Open Critical Work Orders
        const workOrdersRef = collection(db, 'work_orders');
        const q = query(
            workOrdersRef,
            where('device_id', '==', deviceId),
            where('status', 'in', ['Open', 'In-Progress', 'Waiting-Parts'])
        );

        const woSnapshot = await getDocs(q);
        const openCriticalOrders = woSnapshot.docs.filter((d: any) => ['High', 'Critical'].includes(d.data().priority));

        if (openCriticalOrders.length > 0) {
            return {
                allowed: false,
                reason: "Active Critical Work Order in progress.",
                maintenanceStatus: 'In-Repair'
            };
        }

        return { allowed: true };

    } catch (error: any) {
        console.error(`Error checking eligibility (Firestore): ${error?.message || error}`);
        return { allowed: false, reason: "System error during eligibility check." };
    }
};

export const getMaintenanceDashboardStats = async () => {
    try {
        const devicesRef = collection(db, 'devices');

        // Fetch Overdue Count
        const overdueQuery = query(devicesRef, where('maintenance_status', 'in', ['Overdue', 'Critical']));
        const overdueSnap = await getCountFromServer(overdueQuery);

        // Fetch In-Repair Count
        const repairQuery = query(devicesRef, where('maintenance_status', '==', 'In-Repair'));
        const repairSnap = await getCountFromServer(repairQuery);

        return {
            overdue: overdueSnap.data().count || 0,
            inRepair: repairSnap.data().count || 0,
            healthScore: 92
        };
    } catch (error) {
        console.warn("Maintenance stats fetch failed (Firestore):", error);
        return { overdue: 0, inRepair: 0, healthScore: 0 };
    }
};

export const triggerMaintenanceAlerts = async () => {
    try {
        // 1. Fetch Active Policies
        const policiesRef = collection(db, 'maintenance_policies');
        const pq = query(policiesRef, where('is_active', '==', true));
        const policiesSnap = await getDocs(pq);
        const policies = policiesSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

        if (policies.length === 0) return { updated: 0 };

        // 2. Fetch All Devices
        const devicesRef = collection(db, 'devices');
        const devicesSnap = await getDocs(devicesRef);
        const devices = devicesSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

        if (devices.length === 0) return { updated: 0 };

        const updates = [];

        // 3. Evaluate Each Device against Policies
        for (const device of devices) {
            let newStatus = device.maintenance_status;

            if (['Critical', 'In-Repair'].includes(device.maintenance_status)) continue;

            const metrics = device.usage_metrics || { total_rentals: 0, total_days_rented: 0, last_service_date: null };
            const lastService = metrics.last_service_date ? new Date(metrics.last_service_date) : new Date(0);
            const daysSinceService = Math.floor((new Date().getTime() - lastService.getTime()) / (1000 * 3600 * 24));

            for (const policy of policies) {
                if (policy.interval_days) {
                    if (daysSinceService >= policy.interval_days) {
                        newStatus = 'Overdue';
                    } else if (daysSinceService >= policy.interval_days - 7) {
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

        // 4. Batch Update
        for (const update of updates) {
            await updateDoc(doc(db, 'devices', update.id), {
                maintenance_status: update.maintenance_status,
                updated_at: new Date().toISOString()
            });
        }

        return { updated: updates.length };
    } catch (error) {
        console.error("Maintenance alerts trigger failed (Firestore):", error);
        return { updated: 0 };
    }
};

export const getCriticalAssets = async () => {
    try {
        const devicesRef = collection(db, 'devices');
        const q = query(
            devicesRef,
            where('maintenance_status', 'in', ['Overdue', 'Critical', 'In-Repair', 'Due-Soon']),
            orderBy('maintenance_status', 'desc')
        );
        const snapshot = await safeGetDocs(q);

        return snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.warn("Critical assets fetch failed (Firestore):", error);
        return [];
    }
};
