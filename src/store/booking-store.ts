import { create } from 'zustand';
import { PLANS } from '@/constants';

interface BookingState {
    // User Context
    userContext: {
        isLoggedIn: boolean;
        isKycVerified: boolean;
        bookingCount: number;
        userId?: number;
    };

    // Booking Draft
    bookingDraft: {
        category: string; // 'PS5', 'Xbox'
        planId: string; // 'daily', 'weekly'
        startDate: Date | null;
        endDate: Date | null;
        addons: Record<string, number>; // { 'controller': 2 }
        deliveryType: 'DELIVERY' | 'PICKUP';
        address: string;
    };

    // Actions
    setUserContext: (ctx: Partial<BookingState['userContext']>) => void;
    setCategory: (category: string) => void;
    setPlan: (planId: string) => void;
    setDates: (start: Date, end: Date) => void;
    setAddon: (id: string, qty: number) => void;
    setDelivery: (type: 'DELIVERY' | 'PICKUP', address?: string) => void;
    resetDraft: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
    userContext: {
        isLoggedIn: false,
        isKycVerified: false,
        bookingCount: 0
    },
    bookingDraft: {
        category: 'PS5',
        planId: 'DAILY',
        startDate: new Date(),
        endDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
        addons: {},
        deliveryType: 'DELIVERY',
        address: ''
    },

    setUserContext: (ctx) => set((state) => ({ userContext: { ...state.userContext, ...ctx } })),
    setCategory: (category) => set((state) => ({ bookingDraft: { ...state.bookingDraft, category } })),

    setPlan: (planId) => set((state) => {
        // Auto-adjust duration if weekly
        const startDate = state.bookingDraft.startDate;
        let endDate = state.bookingDraft.endDate;

        const plan = PLANS[planId as keyof typeof PLANS];
        if (startDate && plan && (plan.type === 'WEEKLY' || planId === 'WEEKLY')) {
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + plan.duration);
        }

        return {
            bookingDraft: { ...state.bookingDraft, planId, endDate }
        };
    }),

    setDates: (start, end) => set((state) => ({ bookingDraft: { ...state.bookingDraft, startDate: start, endDate: end } })),

    setAddon: (id, qty) => set((state) => ({
        bookingDraft: {
            ...state.bookingDraft,
            addons: { ...state.bookingDraft.addons, [id]: qty }
        }
    })),

    setDelivery: (type, address) => set((state) => ({
        bookingDraft: {
            ...state.bookingDraft,
            deliveryType: type,
            address: address || state.bookingDraft.address
        }
    })),

    resetDraft: () => set((state) => ({
        bookingDraft: {
            category: 'PS5',
            planId: 'DAILY',
            startDate: new Date(),
            endDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
            addons: {},
            deliveryType: 'DELIVERY',
            address: ''
        }
    }))
}));
