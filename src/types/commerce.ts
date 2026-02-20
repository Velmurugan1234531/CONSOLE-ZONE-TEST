// Supabase uses ISO 8601 strings for timestamps
export type Timestamp = string;


export type ProductStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'LIVE' | 'OUT_OF_STOCK' | 'DISABLED';

export type PaymentMethod = 'UPI' | 'CARD' | 'COD';
export type PaymentStatus = 'PENDING_PAYMENT' | 'PAID' | 'FAILED' | 'REFUNDED';

export type OrderStatus =
    | 'CREATED'
    | 'CONFIRMED'
    | 'PROCESSING'
    | 'PACKED'
    | 'READY_TO_SHIP'
    | 'SHIPPED'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'RETURN_REQUESTED'
    | 'RETURN_APPROVED'
    | 'PICKUP_COMPLETED'
    | 'REFUND_INITIATED'
    | 'REFUND_COMPLETED'
    | 'CANCELLED';

export interface SaleUser {
    userId: string;
    role: 'customer' | 'seller' | 'admin';
    name: string;
    email: string;
    phone: string;
    kyc_status: 'pending' | 'approved' | 'rejected';
    wallet_balance: number;
    is_active: boolean;
    created_at: Timestamp;
}

export interface SaleProduct {
    productId: string;
    seller_id: string;
    name: string;
    description: string;
    category: string;
    price: number;
    offer_price: number;
    gst_percent: number;
    stock: number;
    images: string[];
    status: 'draft' | 'pending' | 'live' | 'disabled';
    total_sales: number;
    rating: number;
    created_at: Timestamp;
}

export interface SaleOrder {
    orderId: string;
    customer_id: string;
    seller_id: string;
    product_id: string;
    quantity: number;
    price: number;
    gst: number;
    discount: number;
    total_amount: number;
    payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
    order_status: 'created' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    delivery_status: 'not_assigned' | 'assigned' | 'out_for_delivery' | 'delivered';
    tracking_id?: string;
    shipping_address: {
        name: string;
        phone: string;
        address: string;
    };
    ai_approval: 'pending' | 'approved' | 'manual_review';
    items: Array<{
        productId: string;
        quantity: number;
    }>;
    created_at: Timestamp;
    updated_at: Timestamp;
}

export interface CommercePayment {
    paymentId: string;
    order_id: string;
    gateway: 'razorpay' | 'stripe';
    payment_intent_id?: string;
    razorpay_order_id?: string;
    status: 'created' | 'success' | 'failed' | 'refunded';
    amount: number;
    currency: string;
    webhook_verified: boolean;
    created_at: Timestamp;
}

export interface Shipment {
    shipmentId: string;
    order_id: string;
    delivery_partner: string;
    tracking_id: string;
    status: 'assigned' | 'picked' | 'in_transit' | 'delivered';
    live_location: {
        lat: number;
        lng: number;
    };
}
