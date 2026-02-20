import { db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    orderBy,
    addDoc,
    updateDoc,
    doc,
    getDoc,
    getDocs
} from "firebase/firestore";
import { safeGetDoc, safeGetDocs } from "@/utils/firebase-utils";

export type RepairStatus = 'pending' | 'diagnosing' | 'awaiting_parts' | 'repairing' | 'testing' | 'ready' | 'completed' | 'cancelled';
export type RepairPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface RepairTicket {
    id: string;
    user_id?: string;
    customer_name: string;
    customer_phone: string;
    device_name: string;
    serial_number?: string;
    issue_description: string;
    status: RepairStatus;
    priority: RepairPriority;
    estimated_cost: number;
    technician_name?: string;
    created_at: string;
    updated_at: string;
    images?: string[];
}

const MOCK_REPAIRS: RepairTicket[] = [
    {
        id: "REP-001",
        customer_name: "Rahul Sharma",
        customer_phone: "+91 98765 43210",
        device_name: "PlayStation 5",
        serial_number: "G912345678",
        issue_description: "HDMI port damaged, no output on TV.",
        status: "repairing",
        priority: "high",
        estimated_cost: 4500,
        technician_name: "Vikram S.",
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date().toISOString(),
        images: ["https://images.unsplash.com/photo-1622233020087-0b1652414704?q=80&w=600"]
    },
    {
        id: "REP-002",
        customer_name: "Ananya Iyer",
        customer_phone: "+91 91234 56789",
        device_name: "DualSense Controller",
        issue_description: "Stick drift on left analog stick.",
        status: "pending",
        priority: "medium",
        estimated_cost: 1200,
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        updated_at: new Date().toISOString()
    }
];

const REPAIRS_STORAGE_KEY = 'console_zone_repairs_mock_v1';

const getMockRepairs = (): RepairTicket[] => {
    if (typeof window === 'undefined') return MOCK_REPAIRS;
    const stored = localStorage.getItem(REPAIRS_STORAGE_KEY);
    if (!stored) {
        localStorage.setItem(REPAIRS_STORAGE_KEY, JSON.stringify(MOCK_REPAIRS));
        return MOCK_REPAIRS;
    }
    try {
        return JSON.parse(stored);
    } catch {
        return MOCK_REPAIRS;
    }
};

const saveMockRepairs = (tickets: RepairTicket[]) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(REPAIRS_STORAGE_KEY, JSON.stringify(tickets));
    }
};

export const getRepairTickets = async (): Promise<RepairTicket[]> => {
    try {
        const repairsRef = collection(db, 'repair_tickets');
        const q = query(repairsRef, orderBy('created_at', 'desc'));
        const snapshot = await safeGetDocs(q);

        if (snapshot.empty) {
            return getMockRepairs();
        }

        const tickets = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        } as RepairTicket));

        saveMockRepairs(tickets);
        return tickets;
    } catch (error) {
        console.warn("Repairs service: Firestore fetch failed, returning mocks", error);
        return getMockRepairs();
    }
};

export const updateRepairStatus = async (id: string, status: RepairStatus, technician?: string): Promise<void> => {
    try {
        const ticketRef = doc(db, 'repair_tickets', id);
        const updates: any = {
            status,
            updated_at: new Date().toISOString()
        };
        if (technician) updates.technician_name = technician;

        await updateDoc(ticketRef, updates);

        // Notification logic
        try {
            const ticketSnap = await safeGetDoc(ticketRef);
            if (ticketSnap.exists()) {
                const ticket = ticketSnap.data();
                if (ticket.user_id) {
                    const { sendNotification } = await import("./notifications");
                    await sendNotification({
                        user_id: ticket.user_id,
                        type: status === 'ready' ? 'success' : status === 'cancelled' ? 'error' : 'info',
                        title: `Repair Update: ${status.toUpperCase()}`,
                        message: status === 'ready'
                            ? `Great news! Your ${ticket.device_name} is ready for pickup.`
                            : `Your ${ticket.device_name} repair status has been updated to ${status}.`
                    });
                }
            }
        } catch (e: any) {
            console.warn(`Failed to send repair notification Firestore: ${e?.message || e}`);
        }

    } catch (error: any) {
        console.warn(`Repairs service: Firestore update failure for ${id}`, error);
        // Fallback update local mock
        const current = getMockRepairs();
        const index = current.findIndex(t => t.id === id);
        if (index !== -1) {
            current[index] = {
                ...current[index],
                status,
                technician_name: technician || current[index].technician_name,
                updated_at: new Date().toISOString()
            };
            saveMockRepairs(current);
        }
    }
};

export const createRepairTicket = async (ticket: Partial<RepairTicket>): Promise<void> => {
    const payload = {
        ...ticket,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: ticket.status || 'pending',
        priority: ticket.priority || 'medium'
    };

    try {
        await addDoc(collection(db, 'repair_tickets'), payload);

        if (ticket.user_id) {
            try {
                const { sendNotification } = await import("./notifications");
                await sendNotification({
                    user_id: ticket.user_id,
                    type: 'info',
                    title: 'Repair Ticket Opened',
                    message: `Your repair ticket for ${ticket.device_name} has been created.`
                });
            } catch (e) { console.warn("Notification error Firestore", e); }
        }
        return;
    } catch (error) {
        console.error("createRepairTicket Firestore failed:", error);
        // Fallback if DB is not available
        const current = getMockRepairs();
        current.push({ ...payload, id: `REP-DEMO-${Date.now()}` } as RepairTicket);
        saveMockRepairs(current);
    }
};
