import { db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    limit as firestoreLimit
} from "firebase/firestore";
import { safeGetDocs, safeGetDoc } from "@/utils/firebase-utils";

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
    async findAvailableConsole(category: string, startTime: Date, endTime: Date): Promise<string | null> {
        try {
            // 1. Get all active consoles of the requested category
            const devicesRef = collection(db, "devices");
            const q = query(
                devicesRef,
                where("category", "==", category)
            );

            const allConsolesSnap = await safeGetDocs(q);

            // Filter out maintenance status locally if not-in query fails
            const allConsoles = allConsolesSnap.docs
                .map(d => ({ id: d.id, ...d.data() } as any))
                .filter(d => !["MAINTENANCE", "LOST", "UNDER_REPAIR", "Maintenance", "Lost", "Under-Repair"].includes(d.status));

            if (allConsoles.length === 0) {
                console.warn(`No fleet found for category: ${category}`);
                return null;
            }

            const positionStart = startTime.toISOString();
            const positionEnd = endTime.toISOString();

            for (const consoleItem of allConsoles) {
                // Check overlaps for this specific console in Firestore
                const rentalsRef = collection(db, "rentals");
                const rentalQ = query(
                    rentalsRef,
                    where("device_id", "==", consoleItem.id)
                );

                const rentalSnap = await safeGetDocs(rentalQ);

                // Filter active/booked rentals and check overlap client-side
                const activeRentals = rentalSnap.docs.map(doc => doc.data());
                const hasOverlap = activeRentals.some(rental => {
                    if (["cancelled", "completed", "Cancelled", "Completed"].includes(rental.status)) return false;

                    const rStart = rental.start_date;
                    const rEnd = rental.end_date;

                    // Overlap: (StartA < EndB) and (EndA > StartB)
                    return rStart < positionEnd && rEnd > positionStart;
                });

                if (!hasOverlap) {
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
    async getAvailabilityForMonth(category: string, year: number, month: number) {
        try {
            // 1. Get total active consoles count
            const devicesRef = collection(db, "devices");
            const devSnap = await safeGetDocs(query(devicesRef, where("category", "==", category)));
            const activeDevices = devSnap.docs
                .map(d => ({ id: d.id, ...d.data() } as any))
                .filter(d => !["MAINTENANCE", "LOST", "UNDER_REPAIR", "Maintenance", "Lost", "Under-Repair"].includes(d.status));

            const totalConsoles = activeDevices.length;
            if (totalConsoles === 0) return [];

            const deviceIds = new Set(activeDevices.map(d => d.id));

            // 2. Get all bookings for this month range
            const startOfMonth = new Date(year, month - 1, 1).toISOString();
            const endOfMonth = new Date(year, month, 0, 23, 59, 59).toISOString();

            const rentalsRef = collection(db, "rentals");
            // Fetch potential rentals (optimization: filter by device_id if few, else fetch all and filter)
            // For month view, we fetch active rentals and filter locally
            const rentalsSnap = await safeGetDocs(rentalsRef);

            const categoryBookings = rentalsSnap.docs
                .map(doc => doc.data())
                .filter(rental => {
                    if (["cancelled", "completed"].includes(rental.status?.toLowerCase())) return false;
                    if (!deviceIds.has(rental.device_id)) return false;

                    // Overlap with month: rental_start < month_end AND rental_end > month_start
                    return rental.start_date < endOfMonth && rental.end_date > startOfMonth;
                });

            // 3. Calculate daily status
            const daysInMonth = new Date(year, month, 0).getDate();
            const results = [];

            for (let day = 1; day <= daysInMonth; day++) {
                const currentDayStart = new Date(year, month - 1, day).toISOString();
                const currentDayEnd = new Date(year, month - 1, day, 23, 59, 59).toISOString();

                // Count overlaps for this day
                const uniqueDevicesBooked = new Set();

                categoryBookings.forEach((b: any) => {
                    if (b.start_date < currentDayEnd && b.end_date > currentDayStart) {
                        uniqueDevicesBooked.add(b.device_id);
                    }
                });

                const status = uniqueDevicesBooked.size >= totalConsoles ? 'FULL' : 'AVAILABLE';

                results.push({
                    date: currentDayStart.split('T')[0],
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
    async validateUserConstraints(userId: string) {
        // Bypass for demo users
        const isDemo = userId.startsWith('demo-') || userId === 'demo-user-123';
        if (isDemo) {
            return {
                isVerified: true,
                canPickup: true,
                isFirstTime: false
            };
        }

        try {
            const userSnap = await safeGetDoc(doc(db, "users", userId));

            if (!userSnap.exists()) {
                console.warn(`User ${userId} not found in Firestore. Treating as unverified.`);
                return {
                    isVerified: false,
                    canPickup: false,
                    isFirstTime: true
                };
            }

            const userData: any = userSnap.data();
            const kycStatus = userData.kyc_status || userData.metadata?.kyc_status;
            const totalBookings = userData.total_bookings || userData.metadata?.total_bookings || 0;

            return {
                isVerified: kycStatus === 'APPROVED',
                canPickup: totalBookings > 0 && kycStatus === 'APPROVED',
                isFirstTime: totalBookings === 0
            };

        } catch (error: any) {
            console.error(`User validation Firestore error for ${userId}: ${error.message}`);
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
