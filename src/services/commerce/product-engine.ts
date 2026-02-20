import { db } from "@/lib/firebase";
import {
    collection,
    addDoc,
    getDoc,
    updateDoc,
    doc
} from "firebase/firestore";
import { safeGetDoc } from "@/utils/firebase-utils";
import { SaleProduct, ProductStatus } from "@/types/commerce";

const COLLECTION = "products";

export const ProductEngine = {
    /**
     * Create a new product draft
     */
    createProduct: async (data: Omit<SaleProduct, 'productId' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> => {
        try {
            const source = data as any;
            const dbData = {
                name: source.name,
                description: source.description,
                price: Number(source.price),
                stock: Number(source.stockQuantity || source.stock || 0),
                type: 'buy',
                category: source.category,
                images: source.images || [],
                status: 'DRAFT',
                metadata: { ...source },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const docRef = await addDoc(collection(db, COLLECTION), dbData);
            return docRef.id;
        } catch (error) {
            console.error("Error creating sale product (Firestore):", error);
            throw error;
        }
    },

    /**
     * Update product status
     */
    updateStatus: async (productId: string, newStatus: ProductStatus): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION, productId);
            await updateDoc(docRef, {
                status: newStatus,
                updated_at: new Date().toISOString()
            });
        } catch (error) {
            console.error("Error updating product status (Firestore):", error);
            throw error;
        }
    },

    /**
     * Update Stock Quantity
     */
    updateStock: async (productId: string, quantity: number): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION, productId);
            const updates: any = {
                stock: quantity,
                updated_at: new Date().toISOString()
            };

            if (quantity === 0) {
                updates.status = 'OUT_OF_STOCK';
            } else if (quantity > 0) {
                const current = await safeGetDoc(docRef);
                if (current.exists() && current.data().status === 'OUT_OF_STOCK') {
                    updates.status = 'LIVE';
                }
            }

            await updateDoc(docRef, updates);
        } catch (error) {
            console.error("Error updating stock (Firestore):", error);
            throw error;
        }
    }
};
