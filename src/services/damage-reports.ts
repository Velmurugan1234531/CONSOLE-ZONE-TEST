/**
 * Damage Reports Service
 * Handles damage reporting, photo uploads, and coverage calculations
 */

import { ProtectionPlanType, calculateDamageLiability } from './protection';

export type DamageType = 'cosmetic' | 'functional' | 'severe';
export type DamageStatus = 'reported' | 'assessed' | 'charged' | 'resolved';

export interface DamagePhoto {
    id: string;
    url: string;
    caption?: string;
    timestamp: Date;
}

export interface DamageReport {
    id: string;
    rentalId: string;
    deviceId: string;
    reportedBy: 'customer' | 'admin';
    reportedAt: Date;
    damageType: DamageType;
    description: string;
    photos: DamagePhoto[];
    estimatedCost: number;
    actualCost?: number;
    protectionPlan?: ProtectionPlanType;
    customerLiability: number;
    coverageAmount: number;
    status: DamageStatus;
    resolvedAt?: Date;
    notes?: string;
}

/**
 * Calculate damage liability based on protection plan
 */
export function calculateDamageCost(
    damageType: DamageType,
    estimatedCost: number,
    protectionPlan: ProtectionPlanType = 'none'
): {
    totalDamage: number;
    coverageAmount: number;
    customerLiability: number;
    protectionSavings: number;
} {
    const liability = calculateDamageLiability(estimatedCost, protectionPlan);
    return liability;
}

/**
 * Get estimated cost range based on damage type
 */
export function getEstimatedCostRange(damageType: DamageType): { min: number; max: number; typical: number } {
    switch (damageType) {
        case 'cosmetic':
            return { min: 500, max: 2000, typical: 1000 };
        case 'functional':
            return { min: 2000, max: 8000, typical: 4000 };
        case 'severe':
            return { min: 8000, max: 25000, typical: 15000 };
        default:
            return { min: 0, max: 0, typical: 0 };
    }
}

/**
 * Create a new damage report
 */
export async function createDamageReport(
    report: Omit<DamageReport, 'id' | 'reportedAt' | 'status'>
): Promise<DamageReport> {
    const newReport: DamageReport = {
        ...report,
        id: crypto.randomUUID(),
        reportedAt: new Date(),
        status: 'reported'
    };

    // Save to localStorage for demo
    const reports = getDamageReports();
    reports.push(newReport);
    localStorage.setItem('damage-reports', JSON.stringify(reports));

    return newReport;
}

/**
 * Get all damage reports
 */
export function getDamageReports(): DamageReport[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem('damage-reports');
    if (!stored) return getDemoDamageReports();

    try {
        return JSON.parse(stored);
    } catch {
        return getDemoDamageReports();
    }
}

/**
 * Get damage reports for a specific rental
 */
export function getDamageReportsByRental(rentalId: string): DamageReport[] {
    return getDamageReports().filter(report => report.rentalId === rentalId);
}

/**
 * Update damage report status
 */
export async function updateDamageReportStatus(
    reportId: string,
    status: DamageStatus,
    actualCost?: number
): Promise<void> {
    const reports = getDamageReports();
    const index = reports.findIndex(r => r.id === reportId);

    if (index !== -1) {
        reports[index].status = status;
        if (actualCost !== undefined) {
            reports[index].actualCost = actualCost;
            // Recalculate liability based on actual cost
            const liability = calculateDamageLiability(
                actualCost,
                reports[index].protectionPlan || 'none'
            );
            reports[index].customerLiability = liability.customerLiability;
            reports[index].coverageAmount = liability.coverageAmount;
        }
        if (status === 'resolved') {
            reports[index].resolvedAt = new Date();
        }
        localStorage.setItem('damage-reports', JSON.stringify(reports));
    }
}

/**
 * Upload damage photo (simulated for demo)
 */
export async function uploadDamagePhoto(file: File): Promise<DamagePhoto> {
    // In production, this would upload to cloud storage
    // For demo, we'll use FileReader to create data URL
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            resolve({
                id: crypto.randomUUID(),
                url: e.target?.result as string,
                timestamp: new Date()
            });
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Get damage statistics
 */
export function getDamageStats() {
    const reports = getDamageReports();

    return {
        total: reports.length,
        pending: reports.filter(r => r.status === 'reported' || r.status === 'assessed').length,
        resolved: reports.filter(r => r.status === 'resolved').length,
        totalClaimed: reports.reduce((sum, r) => sum + (r.actualCost || r.estimatedCost), 0),
        totalCovered: reports.reduce((sum, r) => sum + r.coverageAmount, 0),
        totalLiability: reports.reduce((sum, r) => sum + r.customerLiability, 0),
        byType: {
            cosmetic: reports.filter(r => r.damageType === 'cosmetic').length,
            functional: reports.filter(r => r.damageType === 'functional').length,
            severe: reports.filter(r => r.damageType === 'severe').length,
        }
    };
}

/**
 * Demo damage reports
 */
function getDemoDamageReports(): DamageReport[] {
    return [
        {
            id: 'dmg-001',
            rentalId: 'rent-001',
            deviceId: 'ps5-001',
            reportedBy: 'admin',
            reportedAt: new Date('2024-02-10'),
            damageType: 'cosmetic',
            description: 'Minor scratch on controller surface',
            photos: [],
            estimatedCost: 800,
            actualCost: 750,
            protectionPlan: 'premium',
            customerLiability: 0,
            coverageAmount: 750,
            status: 'resolved',
            resolvedAt: new Date('2024-02-11')
        },
        {
            id: 'dmg-002',
            rentalId: 'rent-002',
            deviceId: 'ps5-002',
            reportedBy: 'admin',
            reportedAt: new Date('2024-02-12'),
            damageType: 'functional',
            description: 'HDMI port damaged, not working properly',
            photos: [],
            estimatedCost: 4500,
            protectionPlan: 'basic',
            customerLiability: 1350,
            coverageAmount: 3150,
            status: 'assessed'
        }
    ];
}
