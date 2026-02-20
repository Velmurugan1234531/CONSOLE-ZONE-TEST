export type Role = 'customer' | 'admin' | 'seller';
export type ProductCategory = 'PS5' | 'Xbox' | 'PS4' | 'VR' | 'Handheld' | 'Accessory' | 'Game';
export type ProductType = 'rent' | 'buy' | 'trade-in';
export type ProductStatus = 'available' | 'rented' | 'maintenance' | 'sold' | 'hidden';
export type RentalStatus = 'pending' | 'active' | 'completed' | 'overdue' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'failed';
export type KYCStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type DeliveryStatus = 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Profile {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    role: Role;
    phone?: string;
    kyc_status: KYCStatus;
    kyc_document_url?: string;
    kyc_submitted_at?: string;
    rejection_reason?: string;
    aadhar_number?: string;
    address?: string;
    secondary_address?: string;
    location_lat?: number;
    location_lng?: number;
    id_card_front_url?: string;
    id_card_back_url?: string;
    selfie_url?: string;
    secondary_phone?: string;
    trust_score?: number;
    wallet_balance: number;
    neural_sync_xp: number;
    created_at: string;
    updated_at?: string;
}

export interface Product {
    id: string;
    name: string;
    description?: string;
    category: ProductCategory;
    type: ProductType;
    status: ProductStatus;
    price: number; // Daily rate for rent, Full price for buy
    stock: number;
    stock_warning_level?: number;
    images?: string[];
    image?: string;
    features?: string[];
    specs?: Record<string, string>;
    seller_id?: string;
    created_at: string;
}

export interface Rental {
    id: string;
    user_id: string;
    product_id: string;
    plan_id?: string;
    start_date: string;
    end_date: string;
    total_price: number;
    status: RentalStatus;
    payment_status: PaymentStatus;
    payment_method?: 'cash' | 'card' | 'upi';
    deposit_amount: number;
    damage_reported: boolean;
    notes?: string;
    addons?: RentalAddon[];
    created_at: string;
    // Joins
    product?: Product;
    user?: Profile;
    console_id?: string;
    console?: any; // Avoiding circular dependency for now, or import Device if possible
}

export interface RentalAddon {
    id: string; // e.g., 'extra-controller'
    name: string;
    quantity: number;
    price: number; // Total price for this addon
}

export interface Order {
    id: string;
    user_id: string;
    total_amount: number;
    payment_status: PaymentStatus;
    delivery_status: DeliveryStatus;
    shipping_address?: string;
    created_at: string;
    // Joins
    items?: OrderItem[];
    user?: Profile;
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string;
    quantity: number;
    price_at_purchase: number;
    product?: Product;
}

export interface KYCDocument {
    id: string;
    user_id: string;
    document_type: string;
    document_url: string;
    status: KYCStatus;
    admin_notes?: string;
    uploaded_at: string;
}

export interface AdminLog {
    id: string;
    admin_id: string;
    action: string;
    target_resource: string;
    target_id?: string;
    details?: string;
    created_at: string;
}

export interface ServiceItem {
    id: string;
    name: string;
    category: 'Repair' | 'Maintenance' | 'Modification' | 'Other';
    price: number;
    duration: string;
    status: 'Active' | 'Inactive';
    description?: string;
    created_at?: string;
}

export interface SaleItem {
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
    total: number;
}

export interface SaleRecord {
    id: string;
    user_id?: string;
    items: SaleItem[];
    total_amount: number;
    payment_method: 'cash' | 'card' | 'upi';
    status: 'completed' | 'refunded';
    date: string;
    timestamp: number;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
    id: string;
    user_id?: string;
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
    metadata?: Record<string, any>;
}

export interface Device {
    id: string;
    serialNumber: string;
    model: string;
    category: string;
    status: 'Ready' | 'Rented' | 'Maintenance' | 'Under-Repair' | 'Lost';
    currentUser?: string;
    lastService?: string;
    health: number;
    notes?: string;
    purchaseDate?: string;
    warrantyExpiry?: string;
    maintenance_status?: 'Operational' | 'Due-Soon' | 'Overdue' | 'Critical' | 'In-Repair';
    cost?: number; // Add Cost
    supplier?: string; // Add Supplier
    usage_metrics?: {
        total_rentals: number;
        total_days_rented: number;
        last_service_date: string | null;
        service_count: number;
    };
    connectors?: string[];
    asset_records?: string[];
    controllers?: number; // Add Controllers
    storage_gb?: number; // Add Storage
    firmware_version?: string; // Add Firmware
}

export interface MaintenancePolicy {
    id: string;
    name: string;
    description?: string;
    interval_days?: number;
    interval_rentals?: number;
    is_active: boolean;
}

export interface WorkOrder {
    id: string;
    device_id: string;
    technician_id?: string;
    status: 'Open' | 'In-Progress' | 'Waiting-Parts' | 'Completed' | 'Cancelled';
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    title: string;
    description?: string;
    notes?: string;
    cost: number;
    parts_used: any[];
    created_at: string;
    completed_at?: string;
}

export interface QCRecord {
    id: string;
    device_id: string;
    checklist_id?: string;
    inspector_id?: string;
    result: 'Pass' | 'Fail' | 'Pass-With-Notes';
    data: any;
    notes?: string;
    created_at: string;
}

export interface ServiceBooking {
    id: string;
    user_id: string;
    service_id: string;
    device_model: string;
    serial_number?: string;
    issue_description: string;
    preferred_date: string;
    status: 'Pending' | 'Confirmed' | 'In-Progress' | 'Completed' | 'Cancelled';
    contact_phone?: string;
    contact_name?: string;
    contact_email?: string;
    created_at: string;
    // Joins
    service?: ServiceItem;
    user?: Profile;
}
