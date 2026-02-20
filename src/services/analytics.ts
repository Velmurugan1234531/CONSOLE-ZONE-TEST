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
import { startOfWeek, startOfMonth, subDays, format } from "date-fns";

export interface RevenueStats {
    today: number;
    week: number;
    month: number;
    total: number;
}

export interface UtilizationStats {
    activeRentals: number;
    totalConsoles: number;
    utilizationRate: number;
}

export interface TopCustomer {
    id: string;
    name: string;
    email: string;
    totalSpent: number;
    rentalCount: number;
}

export interface RevenueDataPoint {
    date: string;
    revenue: number;
}

/**
 * Get revenue statistics for different time periods
 */
export const getRevenueStats = async (): Promise<RevenueStats> => {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const weekStart = startOfWeek(new Date()).toISOString();
    const monthStart = startOfMonth(new Date()).toISOString();

    try {
        const rentalsRef = collection(db, 'rentals');
        const qRentals = query(rentalsRef, where('status', '==', 'completed'));
        const rentalsSnap = await safeGetDocs(qRentals);

        const ordersRef = collection(db, 'orders');
        const qOrders = query(ordersRef, where('payment_status', '==', 'paid'));
        const ordersSnap = await safeGetDocs(qOrders);

        const rentalList = rentalsSnap.docs.map(doc => doc.data());
        const orderList = ordersSnap.docs.map(doc => doc.data());

        // Helper to sum
        const calculateSum = (start: string | null) => {
            const rentalSum = rentalList
                .filter(r => !start || (r.created_at || r.updated_at) >= start)
                .reduce((sum, r) => sum + Number(r.total_price || r.total_cost || 0), 0);
            const orderSum = orderList
                .filter(o => !start || o.created_at >= start)
                .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
            return rentalSum + orderSum;
        };

        return {
            today: calculateSum(todayStart),
            week: calculateSum(weekStart),
            month: calculateSum(monthStart),
            total: calculateSum(null)
        };
    } catch (error) {
        console.warn('Firestore analytics fetch failed:', error);
        return { today: 0, week: 0, month: 0, total: 0 };
    }
};

/**
 * Get fleet utilization statistics
 */
export const getUtilizationStats = async (): Promise<UtilizationStats> => {
    try {
        // Active Rentals
        const rentalsRef = collection(db, 'rentals');
        // Accept multiple active statuses
        const activeSnap = await safeGetDocs(rentalsRef);
        const activeCount = activeSnap.docs.filter(doc =>
            ['active', 'overdue', 'RENTAL_ACTIVE'].includes(doc.data().status)
        ).length;

        // Total Consoles
        const productsRef = collection(db, 'products');
        const productsSnap = await safeGetDocs(productsRef);
        // Map types carefully: 'rental' vs 'Rental'
        const totalCount = productsSnap.docs.filter(doc =>
            doc.data().type?.toLowerCase() === 'rental' || doc.data().category?.toLowerCase() === 'console'
        ).length || 1;

        const utilizationRate = Math.round((activeCount / totalCount) * 100);

        return {
            activeRentals: activeCount,
            totalConsoles: totalCount,
            utilizationRate
        };
    } catch (error) {
        console.warn('Utilization fetch failed (Firestore):', error);
        return { activeRentals: 0, totalConsoles: 0, utilizationRate: 0 };
    }
};

/**
 * Get top customers by revenue
 */
export const getTopCustomers = async (limit: number = 5): Promise<TopCustomer[]> => {
    try {
        const rentalsRef = collection(db, 'rentals');
        const q = query(rentalsRef, where('status', '==', 'completed'));
        const snapshot = await safeGetDocs(q);

        if (snapshot.empty) return [];

        const userGroups = new Map<string, { totalSpent: number; count: number }>();
        snapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            const uid = data.user_id;
            if (!uid) return;

            const existing = userGroups.get(uid) || { totalSpent: 0, count: 0 };
            existing.totalSpent += Number(data.total_price || data.total_cost || 0);
            existing.count += 1;
            userGroups.set(uid, existing);
        });

        // Convert to array and sort
        const sortedUsers = Array.from(userGroups.entries())
            .sort((a, b) => b[1].totalSpent - a[1].totalSpent)
            .slice(0, limit);

        // Fetch user profiles for display names
        const topCustomers = await Promise.all(sortedUsers.map(async ([uid, stats]) => {
            const userRef = doc(db, 'users', uid);
            const userSnap = await safeGetDoc(userRef);
            const userData = userSnap.exists() ? userSnap.data() : {};

            return {
                id: uid,
                name: userData.full_name || userData.displayName || 'Anonymous User',
                email: userData.email || 'No email',
                totalSpent: stats.totalSpent,
                rentalCount: stats.count
            };
        }));

        return topCustomers;
    } catch (error) {
        console.warn('Top customers fetch failed (Firestore):', error);
        return [];
    }
};

/**
 * Get revenue trend data for the last N days
 */
export const getRevenueTrend = async (days: number = 7): Promise<RevenueDataPoint[]> => {
    try {
        const startDate = subDays(new Date(), days).toISOString();

        const rentalsRef = collection(db, 'rentals');
        const ordersRef = collection(db, 'orders');

        const [rentalsSnap, ordersSnap] = await Promise.all([
            safeGetDocs(query(rentalsRef, where('status', '==', 'completed'))),
            safeGetDocs(query(ordersRef, where('payment_status', '==', 'paid')))
        ]);

        const dateMap = new Map<string, number>();

        // Initialize all dates with 0
        for (let i = days - 1; i >= 0; i--) {
            const date = format(subDays(new Date(), i), 'MMM dd');
            dateMap.set(date, 0);
        }

        // Aggregate rentals
        rentalsSnap.docs.forEach(docSnap => {
            const data = docSnap.data();
            const createdAt = data.created_at || data.updated_at;
            if (createdAt && createdAt >= startDate) {
                const date = format(new Date(createdAt), 'MMM dd');
                if (dateMap.has(date)) {
                    dateMap.set(date, (dateMap.get(date) || 0) + Number(data.total_price || data.total_cost || 0));
                }
            }
        });

        // Aggregate orders
        ordersSnap.docs.forEach(docSnap => {
            const data = docSnap.data();
            if (data.created_at && data.created_at >= startDate) {
                const date = format(new Date(data.created_at), 'MMM dd');
                if (dateMap.has(date)) {
                    dateMap.set(date, (dateMap.get(date) || 0) + Number(data.total_amount || 0));
                }
            }
        });

        return Array.from(dateMap.entries()).map(([date, revenue]) => ({ date, revenue }));
    } catch (error) {
        console.warn('Revenue trend fetch failed (Firestore):', error);
        return [];
    }
};

/**
 * Export rental data to CSV
 */
export const exportRentalsToCSV = (rentals: any[]): void => {
    const headers = ['ID', 'Customer', 'Product', 'Start Date', 'End Date', 'Status', 'Total Price', 'Payment Method'];
    const rows = rentals.map(rental => [
        rental.id,
        rental.user?.full_name || rental.customer_name || 'Unknown',
        rental.product?.name || rental.product_name || 'Unknown',
        new Date(rental.start_date).toLocaleDateString(),
        new Date(rental.end_date).toLocaleDateString(),
        rental.status,
        `₹${rental.total_price || rental.total_cost || 0}`,
        rental.payment_method || 'N/A'
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    if (typeof window !== 'undefined') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `rentals_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
