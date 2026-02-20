
import { createClient } from "@/lib/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";

export interface BookingRequest {
    category: string;
    startTime: Date;
    endTime: Date;
}

export const BookingLogic = {
    /**
     * The "Tetris Brain" - Auto-Assignment Algorithm
     * Finds an available console of the given category for the specified time range.
     * Returns the console_id if found, or null if no slot is available.
     */
    async findAvailableConsole(category: string, startTime: Date, endTime: Date, supabaseClient?: SupabaseClient): Promise<string | null> {
        const supabase = supabaseClient || createClient();

        try {
            // 1. Get all active consoles of the requested category
            // We assume 'devices' table holds individual units.
            // We assume 'devices' table holds individual units.
            // not 'status', 'in', '("MAINTENANCE","LOST","UNDER_REPAIR")'

            const { data: allConsoles, error } = await supabase
                .from('devices')
                .select('*')
                .eq('category', category)
                .not('status', 'in', '("MAINTENANCE","LOST","UNDER_REPAIR")');

            if (error || !allConsoles || allConsoles.length === 0) {
                console.warn(`No fleet found for category: ${category}`);
                return null;
            }

            const positionStart = startTime.toISOString();
            const positionEnd = endTime.toISOString();

            for (const consoleItem of allConsoles) {
                // Check overlaps for this specific console
                // Overlap: (StartA <= EndB) and (EndA >= StartB)
                // We check if ANY rental for this console overlaps.

                const { count, error: rentalError } = await supabase
                    .from('rentals')
                    .select('*', { count: 'exact', head: true })
                    .eq('device_id', consoleItem.id) // using device_id as foreign key
                    .not('status', 'in', '("cancelled","completed")')
                    .lt('start_date', positionEnd)
                    .gt('end_date', positionStart);

                // If count is 0, no overlap
                if (count === 0) {
                    return consoleItem.id;
                }
            }
        } catch (error: any) {
            console.error(`Error finding available console: ${error?.message || error}`);
        }

        return null; // No available console found
    },

    /**
     * Get availability for a whole month (Calendar View)
     * Returns: { date: '2026-02-01', status: 'AVAILABLE' | 'FULL' }[]
     */
    async getAvailabilityForMonth(category: string, year: number, month: number, supabaseClient?: SupabaseClient) {
        const supabase = supabaseClient || createClient();
        try {
            // 1. Get total active consoles count
            const { count: totalConsoles, error: devError } = await supabase
                .from('devices')
                .select('*', { count: 'exact', head: true })
                .eq('category', category)
                .not('status', 'in', '("MAINTENANCE","LOST","UNDER_REPAIR")');

            if (!totalConsoles || totalConsoles === 0) return [];

            // 2. Get all bookings for this month
            const startDate = new Date(year, month - 1, 1).toISOString();
            const endDate = new Date(year, month, 0).toISOString(); // Last day of month

            // Fetch active bookings that overlap with this month
            // Starts before month end AND ends after month start
            const { data: bookings, error: rentalError } = await supabase
                .from('rentals')
                .select('start_date, end_date, device_id')
                .not('status', 'in', '("cancelled","completed")')
                .lt('start_date', endDate)
                .gt('end_date', startDate);

            // We need to filter rentals that are for devices of THIS category.
            // If rentals don't have category, we must join or pre-filter.
            // My table schema doesn't have category on rentals, but has product_id / device_id.
            // We can fetch device IDs for this category first.
            const { data: devices } = await supabase
                .from('devices')
                .select('id')
                .eq('category', category);

            const deviceIds = new Set(devices?.map(d => d.id) || []);

            const categoryBookings = (bookings || []).filter(r => deviceIds.has(r.device_id));

            // 3. Calculate daily status
            const daysInMonth = new Date(year, month, 0).getDate();
            const results = [];

            for (let day = 1; day <= daysInMonth; day++) {
                const currentDayStart = new Date(year, month - 1, day);
                const currentDayEnd = new Date(year, month - 1, day, 23, 59, 59);

                // Count overlaps for this day
                // Overlap logic: Booking Start < Day End AND Booking End > Day Start
                const uniqueDevicesBooked = new Set();

                categoryBookings.forEach((b: any) => {
                    const bStart = new Date(b.start_date);
                    const bEnd = new Date(b.end_date);
                    if (bStart < currentDayEnd && bEnd > currentDayStart) {
                        uniqueDevicesBooked.add(b.device_id);
                    }
                });

                const status = uniqueDevicesBooked.size >= totalConsoles ? 'FULL' : 'AVAILABLE';

                results.push({
                    date: currentDayStart.toISOString().split('T')[0],
                    status
                });
            }

            return results;
        } catch (error) {
            console.error("Availability check failed:", error);
            return [];
        }
    },

    /**
     * Validate current user constraints for booking
     */
    async validateUserConstraints(userId: string, supabaseClient?: SupabaseClient) {
        // Bypass for demo users
        const isDemo = userId.startsWith('demo-') || userId === 'demo-user-123';
        if (isDemo) {
            return {
                isVerified: true,
                canPickup: true,
                isFirstTime: false
            };
        }

        const supabase = supabaseClient || createClient();

        try {
            const { data: userData, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error || !userData) {
                console.warn(`User ${userId} not found in DB. Treating as unverified.`);
                return {
                    isVerified: false,
                    canPickup: false,
                    isFirstTime: true
                };
            }

            // Map flat user table fields or metadata?
            // Schema has 'kyc_status' in metadata usually, but let's check if my schema defined it as column.
            // In 'supabase_schema.sql', I defined 'users' table.
            // Let's assume I need to check columns.
            // Previous code accessed userData.kyc_status directly.
            // My schema probably has it as column or in metadata.
            // To be safe, I'll check both or assume column if I migrated that way.
            // Checking: I see I didn't verify the user schema columns fully, but 'admin-auth.ts' used metadata.
            // Let's check metadata if column missing.

            const kycStatus = userData.kyc_status || userData.metadata?.kyc_status;
            const totalBookings = userData.total_bookings || userData.metadata?.total_bookings || 0;

            return {
                isVerified: kycStatus === 'APPROVED',
                canPickup: totalBookings > 0 && kycStatus === 'APPROVED',
                isFirstTime: totalBookings === 0
            };

        } catch (error: any) {
            console.error(`User validation DB error for ${userId}: ${error.message}`);
            throw new Error("User validation failed due to system error");
        }
    },

    /**
     * Mock Console Search for Demo Mode
     */
    async mockFindAvailableConsole(category: string): Promise<string> {
        // Return a fixed ID for demo consoles
        return category.toLowerCase().includes('ps5') ? '101' : '102';
    },

    /**
     * AI Auto-Approval Engine: Risk Score Calculation
     */
    calculateRiskScore(userId: string, data: {
        location: { lat: number, lng: number },
        device_fingerprint: string,
        kyc_status: string,
        history: any[]
    }): { score: number, verdict: 'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'FLAGGED' } {
        let score = 0;

        // 1. KYC Factor
        if (data.kyc_status !== 'APPROVED') score += 40;

        // 2. Behavioral History
        const failedPayments = data.history.filter(h => h.payment_status === 'failed').length;
        score += failedPayments * 15;

        // 3. Location Mismatch (Simplified mock check)
        if (data.location.lat === 0) score += 20;

        // 4. Device Fingerprint (First time device)
        if (!data.device_fingerprint) score += 10;

        let verdict: any = 'AUTO_APPROVE';
        if (score >= 60) verdict = 'FLAGGED';
        else if (score >= 30) verdict = 'MANUAL_REVIEW';

        return { score: Math.min(score, 100), verdict };
    },

    /**
     * Advanced Pricing Engine
     */
    calculateAdvancedPricing(baseDailyRate: number, days: number): {
        subtotal: number,
        gst: number,
        deposit: number,
        total: number
    } {
        const subtotal = baseDailyRate * days;
        const gst = Math.round(subtotal * 0.18);
        const deposit = Math.round(subtotal * 0.5); // 50% refundable deposit

        return {
            subtotal,
            gst,
            deposit,
            total: subtotal + gst + deposit
        };
    }
};
