import { db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    orderBy,
    doc,
    updateDoc,
    getDoc
} from "firebase/firestore";
import { safeGetDocs, safeGetDoc } from "@/utils/firebase-utils";

// Types based on usage in component
export interface RentalRequest {
    id: string;
    status: string;
    total_price: number;
    start_date: string;
    end_date: string;
    user: {
        full_name: string;
        email: string;
        phone?: string;
        avatar_url?: string;
    };
    product: {
        name: string;
        images?: string[];
    };
    duration_plan?: string;
    created_at?: string;
}

export const getRentalRequests = async (showAll = false): Promise<RentalRequest[]> => {
    try {
        const rentalsRef = collection(db, "rentals");
        let q = query(rentalsRef, orderBy("created_at", "desc"));

        if (!showAll) {
            q = query(rentalsRef, where("status", "==", "Pending"), orderBy("created_at", "desc"));
        }

        const snapshot = await safeGetDocs(q);

        if (snapshot.empty) {
            console.log("No rentals found in Firestore. Using Mock Data.");
            return getMockRentals(showAll);
        }

        const rentals = await Promise.all(snapshot.docs.map(async (rentalDoc) => {
            const rental = rentalDoc.data();

            // Fetch User Details
            let userData: RentalRequest['user'] = { full_name: "Unknown", email: "" };
            if (rental.user_id) {
                const userSnap = await safeGetDoc(doc(db, "users", rental.user_id));
                if (userSnap.exists()) {
                    const u = userSnap.data();
                    userData = {
                        full_name: u.full_name || u.display_name || u.email || "Unknown",
                        email: u.email || "",
                        phone: u.phone || u.metadata?.phone,
                        avatar_url: u.avatar_url || u.metadata?.avatar_url
                    };
                }
            }

            // Fetch Product Details
            let productData = { name: "Unknown Product", images: [] };
            if (rental.product_id) {
                const productSnap = await safeGetDoc(doc(db, "products", rental.product_id));
                if (productSnap.exists()) {
                    const p = productSnap.data();
                    productData = {
                        name: p.name || "Unknown Product",
                        images: p.images || []
                    };
                }
            }

            return {
                id: rentalDoc.id,
                status: rental.status,
                total_price: rental.total_price,
                start_date: rental.start_date,
                end_date: rental.end_date,
                duration_plan: rental.duration_plan || rental.plan_id,
                created_at: rental.created_at,
                user: userData,
                product: productData
            } as RentalRequest;
        }));

        return rentals;

    } catch (error) {
        console.warn("getRentalRequests Firestore failed. Using Mock Data.", error);
        return getMockRentals(showAll);
    }
};

const getMockRentals = (showAll: boolean): RentalRequest[] => {
    const mockData = [
        {
            id: 'demo-pending-1',
            status: 'Pending',
            total_price: 2499,
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 86400000 * 3).toISOString(),
            product: { name: 'PS5 Digital Mission Control', images: [] },
            user: { full_name: 'Alex "Nexus" Chen', email: 'alex@neuro.zone' },
            duration_plan: '3 Days'
        },
        {
            id: 'demo-active-1',
            status: 'active',
            total_price: 4999,
            start_date: new Date(Date.now() - 86400000 * 2).toISOString(),
            end_date: new Date(Date.now() + 86400000 * 5).toISOString(),
            product: { name: 'Xbox Series X "Black-Site"', images: [] },
            user: { full_name: 'Sarah Cyber', email: 'sarah@matrix.net' },
            duration_plan: 'Weekly'
        }
    ];
    return showAll ? mockData : mockData.filter(r => r.status === 'Pending');
};

export const approveRental = async (id: string, adminId?: string) => {
    try {
        const rentalRef = doc(db, "rentals", id);
        await updateDoc(rentalRef, {
            status: 'active',
            updated_at: new Date().toISOString()
        });
    } catch (error) {
        console.warn("approveRental Firestore failed.", error);
    }
};

export const rejectRental = async (id: string, adminId?: string) => {
    try {
        const rentalRef = doc(db, "rentals", id);
        await updateDoc(rentalRef, {
            status: 'cancelled',
            updated_at: new Date().toISOString()
        });
    } catch (error) {
        console.warn("rejectRental Firestore failed.", error);
    }
};
