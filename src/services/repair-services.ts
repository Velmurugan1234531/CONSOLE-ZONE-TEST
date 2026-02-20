import { db } from "@/lib/firebase";
import {
    collection,
    query,
    orderBy,
    getDocs,
    doc,
    addDoc,
    updateDoc,
    deleteDoc
} from "firebase/firestore";
import { safeGetDocs } from "@/utils/firebase-utils";
import { ServiceItem } from "@/types";

const COLLECTION = 'repair_services';

export const getServices = async (): Promise<ServiceItem[]> => {
    try {
        const servicesRef = collection(db, COLLECTION);
        const q = query(servicesRef, orderBy('name', 'asc'));
        const snapshot = await safeGetDocs(q);

        if (snapshot.empty) {
            return getFallbackServices();
        }

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as ServiceItem[];
    } catch (error) {
        console.warn("Firestore service fetch failed. Returning mock data.", error);
        return getFallbackServices();
    }
};

const getFallbackServices = (): ServiceItem[] => [
    {
        id: 'mock-1',
        name: 'HDMI Port Replacement (Mock)',
        category: 'Repair',
        price: 2499,
        duration: '24h',
        status: 'Active',
        description: 'Fixing broken or loose HDMI ports.'
    },
    {
        id: 'mock-2',
        name: 'Thermal Paste Re-application (Mock)',
        category: 'Maintenance',
        price: 999,
        duration: '4h',
        status: 'Active',
        description: 'High-performance cooling solution.'
    }
];

export const createService = async (data: Partial<ServiceItem>) => {
    try {
        await addDoc(collection(db, COLLECTION), {
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
    } catch (error: any) {
        throw new Error(`Firestore insert failed: ${error.message}`);
    }
};

export const updateService = async (id: string, data: Partial<ServiceItem>) => {
    try {
        const serviceRef = doc(db, COLLECTION, id);
        await updateDoc(serviceRef, {
            ...data,
            updated_at: new Date().toISOString()
        });
    } catch (error: any) {
        throw new Error(`Firestore update failed: ${error.message}`);
    }
};

export const deleteService = async (id: string) => {
    try {
        await deleteDoc(doc(db, COLLECTION, id));
    } catch (error: any) {
        throw new Error(`Firestore delete failed: ${error.message}`);
    }
};
