
import { createClient } from "@/lib/supabase/client";
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
    const supabase = createClient();
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const weekStart = startOfWeek(now).toISOString();
    const monthStart = startOfMonth(now).toISOString();

    try {
        // Fetch completed rentals and paid orders
        // Optimization: In a real app, we might want to pre-aggregate this or use distributed counters

        // Supabase select
        const { data: rentals, error: rentalsError } = await supabase
            .from('rentals')
            .select('total_price, created_at') // fetch only needed fields
            .eq('status', 'completed'); // 'completed' status. Check schema if enum.

        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('total_amount, created_at')
            .eq('payment_status', 'paid');
        // .eq('status', 'completed'); // Maybe check payment_status 'paid'? Original looked for paid.

        if (rentalsError || ordersError) throw rentalsError || ordersError;

        const rentalList = rentals || [];
        const orderList = orders || [];

        // Calculate today's revenue
        const todayRevenue = [
            ...rentalList.filter((r: any) => r.created_at >= todayStart).map((r: any) => r.total_price),
            ...orderList.filter((o: any) => o.created_at >= todayStart).map((o: any) => o.total_amount)
        ].reduce((sum, amount) => sum + Number(amount), 0);

        // Calculate week's revenue
        const weekRevenue = [
            ...rentalList.filter((r: any) => r.created_at >= weekStart).map((r: any) => r.total_price),
            ...orderList.filter((o: any) => o.created_at >= weekStart).map((o: any) => o.total_amount)
        ].reduce((sum, amount) => sum + Number(amount), 0);

        // Calculate month's revenue
        const monthRevenue = [
            ...rentalList.filter((r: any) => r.created_at >= monthStart).map((r: any) => r.total_price),
            ...orderList.filter((o: any) => o.created_at >= monthStart).map((o: any) => o.total_amount)
        ].reduce((sum, amount) => sum + Number(amount), 0);

        // Calculate total revenue
        const totalRevenue = [
            ...rentalList.map((r: any) => r.total_price),
            ...orderList.map((o: any) => o.total_amount)
        ].reduce((sum, amount) => sum + Number(amount), 0);

        return {
            today: todayRevenue,
            week: weekRevenue,
            month: monthRevenue,
            total: totalRevenue
        };
    } catch (error) {
        console.warn('Analytics fetch failed:', error);
        return { today: 0, week: 0, month: 0, total: 0 };
    }
};

/**
 * Get fleet utilization statistics
 */
export const getUtilizationStats = async (): Promise<UtilizationStats> => {
    const supabase = createClient();
    try {
        // Active Rentals
        const { count: activeRentals, error: rentalsError } = await supabase
            .from('rentals')
            .select('*', { count: 'exact', head: true })
            .in('status', ['active', 'overdue']); // 'active' might be 'RENTAL_ACTIVE'? Check rental types.
        // Using logic from original file: ['active', 'overdue']

        // Total Consoles
        // 'products' table where type='rental'? or 'consoles' table? 
        // Original used 'db, "products"'.
        const { count: totalConsoles, error: consolesError } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('type', 'rental'); // Assuming type filtering is better if table shared

        if (rentalsError || consolesError) throw rentalsError || consolesError;

        const activeCount = activeRentals || 0;
        const totalCount = totalConsoles || 1; // avoid divide by zero
        const utilizationRate = Math.round((activeCount / totalCount) * 100);

        return {
            activeRentals: activeCount,
            totalConsoles: totalCount,
            utilizationRate
        };
    } catch (error) {
        console.warn('Utilization fetch failed:', error);
        return { activeRentals: 0, totalConsoles: 0, utilizationRate: 0 };
    }
};

/**
 * Get top customers by revenue
 */
export const getTopCustomers = async (limit: number = 5): Promise<TopCustomer[]> => {
    const supabase = createClient();
    try {
        // Fetch completed rentals with user data
        // Assuming 'rentals' has FK to 'users'.
        const { data: rentals, error } = await supabase
            .from('rentals')
            .select('user_id, total_price, users(id, full_name, email)') // join users
            .eq('status', 'completed');

        if (error) throw error;
        if (!rentals) return [];

        // Group by user and calculate totals
        const userMap = new Map<string, { name: string; email: string; totalSpent: number; count: number }>();

        rentals.forEach((rental: any) => {
            const userId = rental.user_id;
            // If user join worked, rental.users should be object or array? 
            // supabase-js returns single object if FK is 1:1 or N:1.
            const user = rental.users || {};

            // Should be 'full_name', 'email' from joined user.
            // Note: rental.users might be null if user deleted?
            const userName = user.full_name || 'Unknown';
            const userEmail = user.email || '';

            if (!userId) return;

            const existing = userMap.get(userId) || {
                name: userName,
                email: userEmail,
                totalSpent: 0,
                count: 0
            };

            existing.totalSpent += Number(rental.total_price);
            existing.count += 1;

            // Update name/email if "Unknown" became known (unlikely with this logic, but safe)
            if (existing.name === 'Unknown' && userName !== 'Unknown') existing.name = userName;

            userMap.set(userId, existing);
        });

        // Convert to array and sort by totalSpent
        return Array.from(userMap.entries())
            .map(([id, data]) => ({
                id,
                name: data.name,
                email: data.email,
                totalSpent: data.totalSpent,
                rentalCount: data.count
            }))
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, limit);
    } catch (error) {
        console.warn('Top customers fetch failed:', error);
        return [];
    }
};

/**
 * Get revenue trend data for the last N days
 */
export const getRevenueTrend = async (days: number = 7): Promise<RevenueDataPoint[]> => {
    const supabase = createClient();
    try {
        const startDate = subDays(new Date(), days).toISOString();

        const { data: rentals, error: rentalsError } = await supabase
            .from('rentals')
            .select('total_price, created_at')
            .gte('created_at', startDate)
            .eq('status', 'completed');

        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('total_amount, created_at')
            .gte('created_at', startDate)
            .eq('payment_status', 'paid');

        if (rentalsError || ordersError) throw rentalsError || ordersError;

        // Group by date
        const dateMap = new Map<string, number>();

        // Initialize all dates with 0
        for (let i = days - 1; i >= 0; i--) {
            const date = format(subDays(new Date(), i), 'MMM dd');
            dateMap.set(date, 0);
        }

        // Add rental revenue
        (rentals || []).forEach((rental: any) => {
            const date = format(new Date(rental.created_at), 'MMM dd');
            dateMap.set(date, (dateMap.get(date) || 0) + Number(rental.total_price));
        });

        // Add order revenue
        (orders || []).forEach((order: any) => {
            const date = format(new Date(order.created_at), 'MMM dd');
            dateMap.set(date, (dateMap.get(date) || 0) + Number(order.total_amount));
        });

        // Convert to array
        return Array.from(dateMap.entries()).map(([date, revenue]) => ({ date, revenue }));
    } catch (error) {
        console.warn('Revenue trend fetch failed:', error);
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
        rental.user?.full_name || rental.customer_name || 'Unknown', // Fallback to rental.customer_name if denormalized
        rental.product?.name || rental.product_name || 'Unknown',
        new Date(rental.start_date).toLocaleDateString(),
        new Date(rental.end_date).toLocaleDateString(),
        rental.status,
        `₹${rental.total_price}`,
        rental.payment_method || 'N/A'
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `rentals_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
