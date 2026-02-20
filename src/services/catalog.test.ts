import { describe, it, expect, vi } from 'vitest';
import { calculatePriceFromSettings, CatalogSettings } from '@/services/catalog';

const mockSettings: CatalogSettings = {
    id: 'test-1',
    device_category: 'PS5',
    is_enabled: true,
    is_featured: true,
    max_controllers: 4,
    extra_controller_enabled: true,
    daily_rate: 100, // Explicit test value
    weekly_rate: 500,
    monthly_rate: 1500,
    controller_daily_rate: 50,
    controller_weekly_rate: 200,
    controller_monthly_rate: 600,
    display_order: 1
};

// Mock Supabase (if needed, but for now we just remove the broken firebase mock)

// Mock Supabase if necessary

describe('Catalog Service - Pricing', () => {
    it('should calculate daily rate correctly', () => {
        const price = calculatePriceFromSettings(mockSettings, 3, 0);
        // 3 days * 100 = 300
        expect(price.total).toBe(300);
        expect(price.basePrice).toBe(300);
    });

    it('should calculate weekly rate correctly for 1 week', () => {
        const price = calculatePriceFromSettings(mockSettings, 7, 0);
        // 1 week * 500 = 500
        expect(price.total).toBe(500);
    });

    it('should calculate weekly rate correctly for 10 days (2 weeks)', () => {
        // 10 days -> ceil(10/7) = 2 weeks
        // 2 * 500 = 1000
        const price = calculatePriceFromSettings(mockSettings, 10, 0);
        expect(price.total).toBe(1000);
    });

    it('should calculate monthly rate correctly', () => {
        const price = calculatePriceFromSettings(mockSettings, 30, 0);
        // 30 days >= 28 -> Monthly rate
        // 1500
        expect(price.total).toBe(1500);
    });

    it('should include extra controller costs', () => {
        // 1 day, 2 controllers
        // Base: 100
        // Controllers: 2 * 50 * 1 = 100
        // Total: 200
        const price = calculatePriceFromSettings(mockSettings, 1, 2);
        expect(price.basePrice).toBe(100);
        expect(price.controllerPrice).toBe(100);
        expect(price.total).toBe(200);
    });
});
