import { Device, Profile } from "@/types";

export const DEMO_DEVICES: Device[] = [
    // ... existing devices ...
    {
        id: "demo-6",
        serialNumber: "SN-000006",
        model: "PS5 Spiderman Edition",
        category: "PS5",
        status: "Rented",
        health: 98,
        notes: "Premium limited edition unit",
        currentUser: "Ananya Iyer",
        lastService: "Feb 1, 2026",
        cost: 55000,
        purchaseDate: "2026-01-20",
        warrantyExpiry: "2027-01-20",
        supplier: "Sony India"
    }
];

export const DEMO_PROFILES: Profile[] = [
    {
        id: "demo-user-1",
        email: "rahul@example.com",
        full_name: "Rahul Sharma",
        phone: "+91 98765 43210",
        role: "customer",
        kyc_status: "APPROVED",
        wallet_balance: 5000,
        neural_sync_xp: 1200,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: "demo-user-2",
        email: "ananya@example.com",
        full_name: "Ananya Iyer",
        phone: "+91 87654 32109",
        role: "customer",
        kyc_status: "APPROVED",
        wallet_balance: 7500,
        neural_sync_xp: 2500,
        created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: "demo-user-pending-1",
        email: "vikram.mehta@example.com",
        full_name: "Vikram Mehta",
        phone: "+91 91234 56789",
        role: "customer",
        kyc_status: "PENDING",
        aadhar_number: "XXXX-XXXX-1234",
        address: "Plot 42, Hitech City, Hyderabad, Telangana 500081",
        location_lat: 17.4483,
        location_lng: 78.3915,
        id_card_front_url: "https://images.unsplash.com/photo-1557053910-d9eadeed1c58?q=80&w=200",
        id_card_back_url: "https://images.unsplash.com/photo-1557053910-d9eadeed1c58?q=80&w=200",
        selfie_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=100",
        wallet_balance: 0,
        neural_sync_xp: 0,
        kyc_submitted_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: "demo-user-pending-2",
        email: "priya.das@example.com",
        full_name: "Priya Das",
        phone: "+91 99887 76655",
        role: "customer",
        kyc_status: "PENDING",
        aadhar_number: "XXXX-XXXX-9876",
        address: "12th Cross, Indiranagar, Bangalore, Karnataka 560038",
        location_lat: 12.9784,
        location_lng: 77.6408,
        id_card_front_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200",
        id_card_back_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200",
        selfie_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100",
        wallet_balance: 0,
        neural_sync_xp: 0,
        kyc_submitted_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: "demo-user-rejected-1",
        email: "amit.kumar@example.com",
        full_name: "Amit Kumar",
        phone: "+91 90000 11111",
        role: "customer",
        kyc_status: "REJECTED",
        aadhar_number: "XXXX-XXXX-5555",
        rejection_reason: "Blurred ID document. Please upload a clear photo of your Aadhaar card.",
        wallet_balance: 0,
        neural_sync_xp: 0,
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: "demo-user-3",
        email: "admin@consolezone.in",
        full_name: "Admin User",
        role: "admin",
        kyc_status: "APPROVED",
        wallet_balance: 0,
        neural_sync_xp: 9999,
        created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
    }
];

export const DEMO_RENTALS = [
    {
        id: "rental-demo-1",
        user_id: "demo-user-123",
        product: {
            name: "PlayStation 5 Spiderman 2 Limited Edition",
            images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?q=80&w=300"]
        },
        console: {
            name: "PS5 Spiderman Edition",
            serial_number: "SN-000006",
            category: "PS5"
        },
        status: "active",
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: "rental-demo-2",
        user_id: "demo-user-123",
        product: {
            name: "Xbox Series X",
            images: ["/images/products/xbox.png"]
        },
        console: {
            name: "Xbox Series X",
            serial_number: "XB-778899",
            category: "XBOX"
        },
        status: "completed",
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: "rental-demo-3",
        user_id: "demo-user-123",
        product: {
            name: "PlayStation VR2 Horizon Pack",
            images: ["/images/products/psvr2.png"]
        },
        console: {
            name: "PS VR2 Unit 04",
            serial_number: "VR-992211",
            category: "VR"
        },
        status: "overdue",
        start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Expired yesterday
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    }
];
export const DEMO_SERVICE_BOOKINGS = [
    {
        id: "svc-demo-1",
        user_id: "demo-user-123",
        service_type: "Cleaning & Maintenance",
        console_model: "PlayStation 5",
        status: "Completed",
        created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: "svc-demo-2",
        user_id: "demo-user-123",
        service_type: "HDMI Port Repair",
        console_model: "Xbox Series X",
        status: "In Progress",
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    }
];
