/**
 * Auto-Approval Rules Service
 * Handles automatic booking approval based on configurable rules
 */

export interface AutoApprovalRules {
    enabled: boolean;
    maxRentalValue: number;        // Auto-approve if total < this amount
    verifiedCustomersOnly: boolean; // Only verified KYC users
    maxRentalDays: number;         // Max days for auto-approval
    blacklistCheck: boolean;       // Check against banned users
    requireDeposit: boolean;       // Require deposit payment
    fallbackToManual: boolean;     // Manual review if rules fail
}

export interface ApprovalDecision {
    approved: boolean;
    reason: string;
    requiresManual: boolean;
    confidence: number; // 0-100
}

export interface ApprovalLog {
    id: string;
    rentalId: string;
    timestamp: Date;
    decision: 'approved' | 'rejected' | 'manual_review';
    reason: string;
    isAutomatic: boolean;
    reviewedBy?: string;
}

/**
 * Get current auto-approval rules
 */
export function getAutoApprovalRules(): AutoApprovalRules {
    if (typeof window === 'undefined') {
        return getDefaultRules();
    }

    const stored = localStorage.getItem('auto-approval-rules');
    if (!stored) return getDefaultRules();

    try {
        return JSON.parse(stored);
    } catch {
        return getDefaultRules();
    }
}

/**
 * Update auto-approval rules
 */
export function updateAutoApprovalRules(rules: AutoApprovalRules): void {
    localStorage.setItem('auto-approval-rules', JSON.stringify(rules));
}

/**
 * Default auto-approval rules
 */
function getDefaultRules(): AutoApprovalRules {
    return {
        enabled: true,
        maxRentalValue: 5000,
        verifiedCustomersOnly: false,
        maxRentalDays: 30,
        blacklistCheck: true,
        requireDeposit: false,
        fallbackToManual: true
    };
}

/**
 * Check if rental should be auto-approved
 */
export function checkAutoApproval(params: {
    userId: string;
    totalAmount: number;
    rentalDays: number;
    isKycVerified: boolean;
    hasActiveRentals: boolean;
}): ApprovalDecision {
    const rules = getAutoApprovalRules();

    // If auto-approval is disabled, require manual review
    if (!rules.enabled) {
        return {
            approved: false,
            reason: 'Auto-approval is disabled',
            requiresManual: true,
            confidence: 0
        };
    }

    let confidence = 100;
    const failedChecks: string[] = [];

    // Check rental value
    if (params.totalAmount > rules.maxRentalValue) {
        failedChecks.push(`Rental value ₹${params.totalAmount} exceeds limit ₹${rules.maxRentalValue}`);
        confidence -= 30;
    }

    // Check KYC verification
    if (rules.verifiedCustomersOnly && !params.isKycVerified) {
        failedChecks.push('Customer KYC not verified');
        confidence -= 40;
    }

    // Check rental duration
    if (params.rentalDays > rules.maxRentalDays) {
        failedChecks.push(`Duration ${params.rentalDays} days exceeds limit ${rules.maxRentalDays} days`);
        confidence -= 20;
    }

    // Check blacklist
    if (rules.blacklistCheck && isUserBlacklisted(params.userId)) {
        failedChecks.push('User is blacklisted');
        confidence = 0;
        return {
            approved: false,
            reason: 'User is blacklisted',
            requiresManual: false,
            confidence: 0
        };
    }

    // Decision logic
    if (confidence >= 70) {
        return {
            approved: true,
            reason: 'All auto-approval checks passed',
            requiresManual: false,
            confidence
        };
    } else if (confidence >= 40 && rules.fallbackToManual) {
        return {
            approved: false,
            reason: `Some checks failed: ${failedChecks.join(', ')}`,
            requiresManual: true,
            confidence
        };
    } else {
        return {
            approved: false,
            reason: `Auto-approval failed: ${failedChecks.join(', ')}`,
            requiresManual: rules.fallbackToManual,
            confidence
        };
    }
}

/**
 * Check if user is blacklisted
 */
function isUserBlacklisted(userId: string): boolean {
    // In production, check against database
    const blacklist = getBlacklist();
    return blacklist.includes(userId);
}

/**
 * Get blacklisted users
 */
function getBlacklist(): string[] {
    const stored = localStorage.getItem('user-blacklist');
    if (!stored) return [];
    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

/**
 * Add user to blacklist
 */
export function addToBlacklist(userId: string, reason: string): void {
    const blacklist = getBlacklist();
    if (!blacklist.includes(userId)) {
        blacklist.push(userId);
        localStorage.setItem('user-blacklist', JSON.stringify(blacklist));

        // Log the blacklist action
        console.log(`User ${userId} blacklisted: ${reason}`);
    }
}

/**
 * Remove user from blacklist
 */
export function removeFromBlacklist(userId: string): void {
    const blacklist = getBlacklist();
    const filtered = blacklist.filter(id => id !== userId);
    localStorage.setItem('user-blacklist', JSON.stringify(filtered));
}

/**
 * Log approval decision
 */
export function logApprovalDecision(log: Omit<ApprovalLog, 'id' | 'timestamp'>): void {
    const logs = getApprovalLogs();
    logs.push({
        ...log,
        id: crypto.randomUUID(),
        timestamp: new Date()
    });
    localStorage.setItem('approval-logs', JSON.stringify(logs));
}

/**
 * Get approval logs
 */
export function getApprovalLogs(): ApprovalLog[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem('approval-logs');
    if (!stored) return [];
    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

/**
 * Get approval statistics
 */
export function getApprovalStats() {
    const logs = getApprovalLogs();
    const total = logs.length;
    const autoApproved = logs.filter(l => l.isAutomatic && l.decision === 'approved').length;
    const manualReview = logs.filter(l => l.decision === 'manual_review').length;
    const rejected = logs.filter(l => l.decision === 'rejected').length;

    return {
        total,
        autoApproved,
        manualReview,
        rejected,
        autoApprovalRate: total > 0 ? (autoApproved / total) * 100 : 0,
        manualReviewRate: total > 0 ? (manualReview / total) * 100 : 0
    };
}
