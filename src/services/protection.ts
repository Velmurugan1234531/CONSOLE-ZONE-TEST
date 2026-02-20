/**
 * Protection Plans Service
 * Manages rental insurance/protection offerings
 */

export type ProtectionPlanType = 'none' | 'basic' | 'premium' | 'elite';

export interface ProtectionPlan {
    id: ProtectionPlanType;
    name: string;
    dailyRate: number;
    description: string;
    coverage: {
        accidentalDamage: boolean;
        theft: boolean;
        lossOfData: boolean;
        prioritySupport: boolean;
    };
    maxCoverage: number; // Maximum claim amount in INR
    coveragePercentage: number; // Percentage of damage cost covered
    features: string[];
    badge?: string; // Display badge like "Most Popular"
}

// Available protection plans
export const PROTECTION_PLANS: ProtectionPlan[] = [
    {
        id: 'none',
        name: 'No Protection',
        dailyRate: 0,
        description: 'Standard rental without additional coverage',
        coverage: {
            accidentalDamage: false,
            theft: false,
            lossOfData: false,
            prioritySupport: false,
        },
        maxCoverage: 0,
        coveragePercentage: 0,
        features: [
            'Standard customer support',
            'Full liability for damages',
            'No theft protection'
        ]
    },
    {
        id: 'basic',
        name: 'Basic Protection',
        dailyRate: 50,
        description: 'Essential coverage for peace of mind',
        coverage: {
            accidentalDamage: true,
            theft: false,
            lossOfData: false,
            prioritySupport: false,
        },
        maxCoverage: 5000,
        coveragePercentage: 70,
        features: [
            '70% coverage on accidental damage',
            'Up to ₹5,000 max claim',
            'Standard support',
            'Minor scratches covered'
        ]
    },
    {
        id: 'premium',
        name: 'Premium Protection',
        dailyRate: 100,
        description: 'Comprehensive protection package',
        badge: 'Most Popular',
        coverage: {
            accidentalDamage: true,
            theft: true,
            lossOfData: true,
            prioritySupport: false,
        },
        maxCoverage: 15000,
        coveragePercentage: 100,
        features: [
            '100% coverage on damage',
            'Theft protection included',
            'Data loss protection',
            'Up to ₹15,000 max claim',
            'Email support priority'
        ]
    },
    {
        id: 'elite',
        name: 'Elite Protection',
        dailyRate: 150,
        description: 'Zero liability with VIP treatment',
        badge: 'Best Value',
        coverage: {
            accidentalDamage: true,
            theft: true,
            lossOfData: true,
            prioritySupport: true,
        },
        maxCoverage: 999999, // Unlimited
        coveragePercentage: 100,
        features: [
            'Zero liability coverage',
            'Unlimited claim amount',
            'Free replacement device',
            '24/7 priority support',
            'Instant claim processing',
            'No questions asked'
        ]
    }
];

/**
 * Get protection plan by ID
 */
export function getProtectionPlan(id: ProtectionPlanType): ProtectionPlan {
    return PROTECTION_PLANS.find(plan => plan.id === id) || PROTECTION_PLANS[0];
}

/**
 * Calculate total protection cost for rental period
 */
export function calculateProtectionCost(
    planId: ProtectionPlanType,
    days: number
): number {
    const plan = getProtectionPlan(planId);
    return plan.dailyRate * days;
}

/**
 * Calculate customer liability after damage
 */
export function calculateDamageLiability(
    damageCost: number,
    protectionPlan: ProtectionPlanType
): {
    totalDamage: number;
    coverageAmount: number;
    customerLiability: number;
    protectionSavings: number;
} {
    const plan = getProtectionPlan(protectionPlan);

    // Calculate coverage based on plan
    let coverageAmount = 0;
    if (plan.coveragePercentage > 0) {
        coverageAmount = Math.min(
            damageCost * (plan.coveragePercentage / 100),
            plan.maxCoverage
        );
    }

    const customerLiability = Math.max(0, damageCost - coverageAmount);
    const protectionSavings = coverageAmount;

    return {
        totalDamage: damageCost,
        coverageAmount,
        customerLiability,
        protectionSavings
    };
}

/**
 * Get protection plan recommendation based on rental value
 */
export function getRecommendedPlan(rentalValue: number): ProtectionPlanType {
    if (rentalValue >= 10000) return 'elite';
    if (rentalValue >= 5000) return 'premium';
    if (rentalValue >= 2000) return 'basic';
    return 'none';
}

/**
 * Format protection features for display
 */
export function formatProtectionFeatures(plan: ProtectionPlan): string[] {
    const features: string[] = [...plan.features];

    // Add coverage summary at the top
    if (plan.coveragePercentage > 0) {
        features.unshift(
            `${plan.coveragePercentage}% damage coverage`
        );
    }

    return features;
}

/**
 * Check if protection plan covers specific damage type
 */
export function isDamageCovered(
    planId: ProtectionPlanType,
    damageType: 'accidental' | 'theft' | 'data'
): boolean {
    const plan = getProtectionPlan(planId);

    switch (damageType) {
        case 'accidental':
            return plan.coverage.accidentalDamage;
        case 'theft':
            return plan.coverage.theft;
        case 'data':
            return plan.coverage.lossOfData;
        default:
            return false;
    }
}

/**
 * Demo: Get protection plan statistics
 */
export function getProtectionStats() {
    return {
        totalPlans: PROTECTION_PLANS.length - 1, // Exclude 'none'
        averageDailyRate: 100,
        mostPopular: 'premium',
        adoptionRate: 42, // Percentage of customers who choose protection
    };
}
