import { Booking, BookingStatus, AdminActionLog, TrackingLog, GSTInvoice, RentalExtension, RentalReturn, RefundRecord } from '../types/booking';

const STORAGE_KEYS = {
    BOOKINGS: 'cz_advanced_bookings_v1',
    ADMIN_LOGS: 'cz_admin_action_logs_v1',
    TRACKING: 'cz_tracking_logs_v1',
    INVOICES: 'cz_gst_invoices_v1',
    EXTENSIONS: 'cz_rental_extensions_v1',
    RETURNS: 'cz_rental_returns_v1',
    REFUNDS: 'cz_refund_records_v1'
};

// Generic helper for localStorage
const getFromStorage = <T>(key: string, defaultValue: T[]): T[] => {
    if (typeof window === 'undefined') return defaultValue;
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    try {
        return JSON.parse(stored);
    } catch {
        return defaultValue;
    }
};

const saveToStorage = <T>(key: string, data: T[]) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(data));
    }
};

export const BookingPersistence = {
    // BOOKINGS
    getBookings: (): Booking[] => getFromStorage(STORAGE_KEYS.BOOKINGS, []),
    saveBookings: (bookings: Booking[]) => saveToStorage(STORAGE_KEYS.BOOKINGS, bookings),
    addBooking: (booking: Booking) => {
        const current = BookingPersistence.getBookings();
        current.unshift(booking);
        BookingPersistence.saveBookings(current);
    },
    updateBooking: (id: string, updates: Partial<Booking>) => {
        const current = BookingPersistence.getBookings();
        const index = current.findIndex(b => b.id === id);
        if (index !== -1) {
            current[index] = { ...current[index], ...updates, updated_at: new Date().toISOString() };
            BookingPersistence.saveBookings(current);
        }
    },

    // ADMIN LOGS
    getAdminLogs: (): AdminActionLog[] => getFromStorage(STORAGE_KEYS.ADMIN_LOGS, []),
    addAdminLog: (log: AdminActionLog) => {
        const current = BookingPersistence.getAdminLogs();
        current.unshift(log);
        BookingPersistence.saveToStorage(STORAGE_KEYS.ADMIN_LOGS, current);
    },

    // TRACKING
    getTrackingLogs: (bookingId: string): TrackingLog[] => {
        const all = getFromStorage<TrackingLog>(STORAGE_KEYS.TRACKING, []);
        return all.filter(l => l.booking_id === bookingId);
    },
    addTrackingLog: (log: TrackingLog) => {
        const current = getFromStorage<TrackingLog>(STORAGE_KEYS.TRACKING, []);
        current.push(log);
        saveToStorage(STORAGE_KEYS.TRACKING, current);
    },

    // INVOICES
    getInvoices: (): GSTInvoice[] => getFromStorage(STORAGE_KEYS.INVOICES, []),
    addInvoice: (invoice: GSTInvoice) => {
        const current = BookingPersistence.getInvoices();
        current.unshift(invoice);
        saveToStorage(STORAGE_KEYS.INVOICES, current);
    },

    // EXTENSIONS
    getExtensions: (bookingId?: string): RentalExtension[] => {
        const all = getFromStorage<RentalExtension>(STORAGE_KEYS.EXTENSIONS, []);
        return bookingId ? all.filter(e => e.booking_id === bookingId) : all;
    },
    addExtension: (ext: RentalExtension) => {
        const current = BookingPersistence.getExtensions();
        current.unshift(ext);
        saveToStorage(STORAGE_KEYS.EXTENSIONS, current);
    },

    // INTERNAL HELPER
    saveToStorage
};
