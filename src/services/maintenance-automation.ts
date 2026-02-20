/**
 * Maintenance Automation Service
 * Handles automated maintenance scheduling based on device usage
 */

export type MaintenanceType = 'cleaning' | 'inspection' | 'repair' | 'replacement' | 'preventive';
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type TriggerType = 'rental_hours' | 'condition_score' | 'calendar_days' | 'rental_count';

export interface MaintenanceRule {
    id: string;
    name: string;
    trigger: TriggerType;
    threshold: number;
    action: 'flag' | 'block' | 'notify_admin';
    maintenanceType: MaintenanceType;
    enabled: boolean;
    priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface DeviceHealth {
    deviceId: string;
    totalRentalHours: number;
    rentalCount: number;
    conditionScore: number; // 0-100
    lastMaintenance: Date;
    nextMaintenanceDue: Date;
    daysUntilMaintenance: number;
    isBlocked: boolean;
    blockedReason?: string;
}

export interface MaintenanceSchedule {
    id: string;
    deviceId: string;
    deviceName: string;
    maintenanceType: MaintenanceType;
    scheduledDate: Date;
    completedDate?: Date;
    status: MaintenanceStatus;
    triggeredBy: string; // Rule name or manual
    technician?: string;
    cost?: number;
    notes?: string;
    conditionBefore?: number;
    conditionAfter?: number;
}

/**
 * Get default maintenance rules
 */
export function getDefaultMaintenanceRules(): MaintenanceRule[] {
    return [
        {
            id: 'rule-1',
            name: 'Deep Cleaning - 50 Hours',
            trigger: 'rental_hours',
            threshold: 50,
            action: 'flag',
            maintenanceType: 'cleaning',
            enabled: true,
            priority: 'medium'
        },
        {
            id: 'rule-2',
            name: 'Inspection - 100 Hours',
            trigger: 'rental_hours',
            threshold: 100,
            action: 'notify_admin',
            maintenanceType: 'inspection',
            enabled: true,
            priority: 'medium'
        },
        {
            id: 'rule-3',
            name: 'Low Condition - Block',
            trigger: 'condition_score',
            threshold: 70,
            action: 'block',
            maintenanceType: 'repair',
            enabled: true,
            priority: 'high'
        },
        {
            id: 'rule-4',
            name: 'Monthly Preventive',
            trigger: 'calendar_days',
            threshold: 30,
            action: 'flag',
            maintenanceType: 'preventive',
            enabled: true,
            priority: 'low'
        },
        {
            id: 'rule-5',
            name: 'High Usage - Inspection',
            trigger: 'rental_count',
            threshold: 20,
            action: 'notify_admin',
            maintenanceType: 'inspection',
            enabled: true,
            priority: 'medium'
        }
    ];
}

/**
 * Get maintenance rules
 */
export function getMaintenanceRules(): MaintenanceRule[] {
    if (typeof window === 'undefined') return getDefaultMaintenanceRules();

    const stored = localStorage.getItem('maintenance-rules');
    if (!stored) return getDefaultMaintenanceRules();

    try {
        return JSON.parse(stored);
    } catch {
        return getDefaultMaintenanceRules();
    }
}

/**
 * Update maintenance rules
 */
export function updateMaintenanceRules(rules: MaintenanceRule[]): void {
    localStorage.setItem('maintenance-rules', JSON.stringify(rules));
}

/**
 * Calculate device health metrics
 */
export function calculateDeviceHealth(deviceId: string, deviceData?: {
    totalHours?: number;
    rentalCount?: number;
    lastMaintenanceDate?: Date;
}): DeviceHealth {
    // In production, fetch from database
    const totalRentalHours = deviceData?.totalHours || Math.floor(Math.random() * 150);
    const rentalCount = deviceData?.rentalCount || Math.floor(Math.random() * 30);
    const lastMaintenance = deviceData?.lastMaintenanceDate || new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

    // Calculate condition score (100 = perfect, 0 = broken)
    let conditionScore = 100;
    conditionScore -= totalRentalHours * 0.2; // Decrease with usage
    conditionScore -= Math.max(0, rentalCount - 10) * 2; // Heavy usage penalty
    conditionScore = Math.max(0, Math.min(100, conditionScore));

    // Calculate next maintenance due
    const daysSinceLastMaintenance = Math.floor((Date.now() - lastMaintenance.getTime()) / (1000 * 60 * 60 * 24));
    const maintenanceInterval = 30; // Default 30 days
    const daysUntilMaintenance = Math.max(0, maintenanceInterval - daysSinceLastMaintenance);
    const nextMaintenanceDue = new Date(lastMaintenance.getTime() + maintenanceInterval * 24 * 60 * 60 * 1000);

    // Check if device should be blocked
    const rules = getMaintenanceRules().filter(r => r.enabled);
    let isBlocked = false;
    let blockedReason = '';

    for (const rule of rules) {
        if (rule.action === 'block') {
            if (rule.trigger === 'condition_score' && conditionScore < rule.threshold) {
                isBlocked = true;
                blockedReason = `Condition score ${conditionScore.toFixed(0)} below threshold ${rule.threshold}`;
                break;
            } else if (rule.trigger === 'rental_hours' && totalRentalHours >= rule.threshold) {
                isBlocked = true;
                blockedReason = `Rental hours ${totalRentalHours} exceeded threshold ${rule.threshold}`;
                break;
            }
        }
    }

    return {
        deviceId,
        totalRentalHours,
        rentalCount,
        conditionScore: Math.round(conditionScore),
        lastMaintenance,
        nextMaintenanceDue,
        daysUntilMaintenance,
        isBlocked,
        blockedReason
    };
}

/**
 * Check if maintenance is due
 */
export function checkMaintenanceDue(deviceHealth: DeviceHealth): {
    isDue: boolean;
    urgency: 'low' | 'medium' | 'high';
    triggeredRules: string[];
} {
    const rules = getMaintenanceRules().filter(r => r.enabled);
    const triggeredRules: string[] = [];
    let urgency: 'low' | 'medium' | 'high' = 'low';

    for (const rule of rules) {
        let triggered = false;

        switch (rule.trigger) {
            case 'rental_hours':
                triggered = deviceHealth.totalRentalHours >= rule.threshold;
                break;
            case 'condition_score':
                triggered = deviceHealth.conditionScore < rule.threshold;
                break;
            case 'calendar_days':
                triggered = deviceHealth.daysUntilMaintenance <= 0;
                break;
            case 'rental_count':
                triggered = deviceHealth.rentalCount >= rule.threshold;
                break;
        }

        if (triggered) {
            triggeredRules.push(rule.name);
            if (rule.priority === 'high' || rule.priority === 'critical') {
                urgency = 'high';
            } else if (rule.priority === 'medium' && urgency !== 'high') {
                urgency = 'medium';
            }
        }
    }

    return {
        isDue: triggeredRules.length > 0,
        urgency,
        triggeredRules
    };
}

/**
 * Schedule maintenance
 */
export function scheduleMaintenance(maintenance: Omit<MaintenanceSchedule, 'id' | 'status'>): MaintenanceSchedule {
    const newMaintenance: MaintenanceSchedule = {
        ...maintenance,
        id: crypto.randomUUID(),
        status: 'scheduled'
    };

    const schedules = getMaintenanceSchedules();
    schedules.push(newMaintenance);
    localStorage.setItem('maintenance-schedules', JSON.stringify(schedules));

    return newMaintenance;
}

/**
 * Get all maintenance schedules
 */
export function getMaintenanceSchedules(): MaintenanceSchedule[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem('maintenance-schedules');
    if (!stored) return getDemoMaintenanceSchedules();

    try {
        return JSON.parse(stored);
    } catch {
        return getDemoMaintenanceSchedules();
    }
}

/**
 * Update maintenance status
 */
export function updateMaintenanceStatus(
    maintenanceId: string,
    status: MaintenanceStatus,
    updates?: Partial<MaintenanceSchedule>
): void {
    const schedules = getMaintenanceSchedules();
    const index = schedules.findIndex(m => m.id === maintenanceId);

    if (index !== -1) {
        schedules[index] = {
            ...schedules[index],
            status,
            ...updates
        };
        if (status === 'completed' && !schedules[index].completedDate) {
            schedules[index].completedDate = new Date();
        }
        localStorage.setItem('maintenance-schedules', JSON.stringify(schedules));
    }
}

/**
 * Get maintenance statistics
 */
export function getMaintenanceStats() {
    const schedules = getMaintenanceSchedules();

    return {
        total: schedules.length,
        scheduled: schedules.filter(m => m.status === 'scheduled').length,
        inProgress: schedules.filter(m => m.status === 'in_progress').length,
        completed: schedules.filter(m => m.status === 'completed').length,
        totalCost: schedules.reduce((sum, m) => sum + (m.cost || 0), 0),
        avgConditionImprovement: schedules
            .filter(m => m.conditionBefore && m.conditionAfter)
            .reduce((sum, m) => sum + (m.conditionAfter! - m.conditionBefore!), 0) / schedules.length,
        byType: {
            cleaning: schedules.filter(m => m.maintenanceType === 'cleaning').length,
            inspection: schedules.filter(m => m.maintenanceType === 'inspection').length,
            repair: schedules.filter(m => m.maintenanceType === 'repair').length,
            preventive: schedules.filter(m => m.maintenanceType === 'preventive').length,
        }
    };
}

/**
 * Demo maintenance schedules
 */
function getDemoMaintenanceSchedules(): MaintenanceSchedule[] {
    return [
        {
            id: 'maint-001',
            deviceId: 'ps5-001',
            deviceName: 'PS5 Console #001',
            maintenanceType: 'cleaning',
            scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            status: 'scheduled',
            triggeredBy: 'Deep Cleaning - 50 Hours'
        },
        {
            id: 'maint-002',
            deviceId: 'ps5-003',
            deviceName: 'PS5 Console #003',
            maintenanceType: 'inspection',
            scheduledDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            completedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            status: 'completed',
            triggeredBy: 'Manual',
            technician: 'Admin',
            cost: 500,
            conditionBefore: 72,
            conditionAfter: 95
        }
    ];
}
