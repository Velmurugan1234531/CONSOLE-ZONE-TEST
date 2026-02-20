import { z } from 'zod';

export const userSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    role: z.enum(['user', 'admin', 'moderator']).default('user'),
    phone: z.string().optional(),
    avatar_url: z.string().url().optional(),
    trust_score: z.number().min(0).max(100).default(100),
    kyc_status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
    created_at: z.string().datetime(),
});

export const productSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(3, "Product name is required"),
    description: z.string().optional(),
    base_price: z.number().min(0),
    category: z.string(),
    stock_quantity: z.number().int().min(0),
    images: z.array(z.string().url()).optional(),
    is_active: z.boolean().default(true),
});

export const rentalSchema = z.object({
    id: z.string().optional(),
    user_id: z.string().uuid(),
    device_id: z.string(),
    start_date: z.string().datetime(),
    end_date: z.string().datetime(),
    total_price: z.number().min(0),
    status: z.enum(['active', 'completed', 'overdue', 'cancelled', 'pending']),
});

export type User = z.infer<typeof userSchema>;
export type Product = z.infer<typeof productSchema>;
export type Rental = z.infer<typeof rentalSchema>;

export const ContentSchema = z.object({
    id: z.string().uuid().optional(),
    title: z.string().min(3, "Title must be at least 3 characters"),
    slug: z.string().min(3, "Slug must be at least 3 characters"),
    body: z.string().min(10, "Content body must be at least 10 characters"),
    author_id: z.string().uuid().optional(),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
    type: z.enum(['page', 'post']).default('post'),
    featured_image: z.string().url().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
});

export const DeviceSchema = z.object({
    id: z.string().optional(),
    serialNumber: z.string().min(6, "Serial number must be at least 6 characters"),
    model: z.string().min(3, "Model name is required"),
    category: z.string(),
    status: z.enum(['Ready', 'Rented', 'Maintenance', 'Under-Repair', 'Lost']).default('Ready'),
    health: z.number().int().min(0).max(100).default(100),
    notes: z.string().optional(),
    cost: z.number().min(0).optional(),
    supplier: z.string().optional(),
    purchaseDate: z.string().optional(),
    warrantyExpiry: z.string().optional(),
    connectors: z.array(z.string()).optional(),
    asset_records: z.array(z.string()).optional(),
});

export type Device = z.infer<typeof DeviceSchema>;
export type Content = z.infer<typeof ContentSchema>;
