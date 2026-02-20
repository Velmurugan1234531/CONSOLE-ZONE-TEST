import { describe, it, expect, vi } from 'vitest';
import { getAdminStats } from '@/services/admin';

// Mock Supabase (if needed)

// Mock Supabase if necessary

describe('Admin Service', () => {
    it('should return initial stats when no data', async () => {
        const stats = await getAdminStats();
        expect(stats.rentals).toEqual({
            active: 0,
            dueToday: 0,
            late: 0
        });
        expect(stats.shop).toEqual({
            totalSales: 0,
            newOrders: 0,
            outOfStock: 0
        });
        expect(stats.services).toEqual({
            activeTickets: 0,
            pendingAppointments: 0
        });
    });
});
