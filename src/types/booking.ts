import { Profile, Product } from './index';

export type BookingStatus =
    | 'BOOKING_PENDING'
    | 'PAYMENT_PROCESSING'
    | 'PAYMENT_SUCCESS'
    | 'UNDER_REVIEW'
    | 'APPROVED'
    | 'REJECTED'
    | 'ASSIGNED'
    | 'OUT_FOR_DELIVERY'
    | 'RENTAL_ACTIVE'
    | 'EXTENSION_REQUESTED'
    | 'RETURN_REQUESTED'
    | 'INSPECTION_PENDING'
    | 'REFUND_PROCESSING'
    | 'COMPLETED'
    | 'CANCELLED';

export interface Booking {
    id: string;
    booking_id: string; // Internal formatted ID
    user_id: string;
    product_id: string;
    console_id?: string;
    rental_start: string;
    rental_end: string;
    total_amount: number;
    deposit_amount: number;
    gst_amount: number;
    payment_status: 'unpaid' | 'paid' | 'refunded' | 'failed' | 'processing';
    booking_status: BookingStatus;
    assigned_rider_id?: string;
    tracking_active: boolean;
    risk_score: number;
    device_fingerprint?: string;
    location_mismatch: boolean;
    kyc_verified: boolean;
    payment_behavior_score: number;
    rental_history_score: number;
    created_at: string;
    updated_at: string;
    // Joins
    user?: Profile;
    product?: Product;
}

export interface RentalExtension {
    id: string;
    booking_id: string;
    extended_days: number;
    extension_amount: number;
    payment_status: 'pending' | 'paid';
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

export interface RentalReturn {
    id: string;
    booking_id: string;
    return_date: string;
    inspection_status: 'pending' | 'passed' | 'failed' | 'damage_detected';
    damage_notes?: string;
    damage_penalty?: number;
    created_at: string;
}

export interface RefundRecord {
    id: string;
    booking_id: string;
    payment_id: string;
    amount: number;
    reason: string;
    status: 'pending' | 'processed' | 'failed';
    processed_at?: string;
    created_at: string;
}

export interface TrackingLog {
    id: string;
    booking_id: string;
    latitude: number;
    longitude: number;
    speed?: number;
    timestamp: string;
}

export interface AdminActionLog {
    id: string;
    booking_id: string;
    admin_id: string;
    action: string;
    previous_status: BookingStatus;
    new_status: BookingStatus;
    notes?: string;
    timestamp: string;
}

export interface GSTInvoice {
    id: string;
    booking_id: string;
    invoice_number: string;
    hsn_code: string;
    subtotal: number;
    gst_rate: number; // e.g. 18
    gst_amount: number;
    total_amount: number;
    customer_gstin?: string;
    company_gstin: string;
    created_at: string;
}
