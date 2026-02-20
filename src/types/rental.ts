
// Supabase uses ISO 8601 strings for timestamps
export type Timestamp = string;


export type UserRole = 'customer' | 'admin' | 'rider';

export interface FirestoreUser {
    uid: string;
    name: string;
    phone: string;
    email: string;
    role: UserRole;
    isBlocked: boolean;
    createdAt: string; // Supabase ISO String

    riskLevel: number;
    deviceFingerprint?: string;
    fcmToken?: string;
}


export interface RentalProduct {
    productId: string;
    title: string;
    name: string; // Added to match Supabase 'name' column
    description: string; // Added to match Supabase 'description' column
    category: string;
    rentalPricePerDay: number;
    depositAmount: number;
    stockAvailable: number;
    hsnCode: string;
    gstPercent: number;
    isActive: boolean;
    status?: 'available' | 'disabled' | 'out_of_stock'; // Map schema status
    images: string[];
}

export type BookingStatus =
    | 'BOOKING_PENDING'
    | 'PAYMENT_PROCESSING'
    | 'PAYMENT_SUCCESS'
    | 'UNDER_REVIEW'
    | 'APPROVED'
    | 'ASSIGNED'
    | 'OUT_FOR_DELIVERY'
    | 'RENTAL_ACTIVE'
    | 'RETURN_REQUESTED'
    | 'INSPECTION_PENDING'
    | 'REFUND_PROCESSING'
    | 'COMPLETED'
    | 'CANCELLED';

export interface RentalBooking {
    bookingId: string;
    userId: string; // Ensure consistent explicit naming if needed, but 'userId' is fine
    productId: string;
    rentalStart: string;
    rentalEnd: string;
    totalAmount: number;
    depositAmount: number;
    gstAmount: number;
    paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
    bookingStatus: BookingStatus;
    assignedRiderId?: string;
    trackingActive: boolean;
    riskScore: number;
    createdAt: string;
    updatedAt: string;
}

export interface PaymentRecord {
    paymentId: string;
    bookingId: string;
    userId: string;
    gateway: 'RAZORPAY' | 'STRIPE';
    transactionId: string;
    amount: number;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    webhookVerified: boolean;
    createdAt: string;
}
