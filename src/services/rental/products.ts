import { db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc,
    addDoc,
    updateDoc
} from "firebase/firestore";
import { safeGetDoc, safeGetDocs } from "@/utils/firebase-utils";
import { RentalProduct } from "@/types/rental";

const COLLECTION = "products";

export const RentalProductService = {
    /**
     * Fetch all active rental products.
     */
    getAllProducts: async (): Promise<RentalProduct[]> => {
        try {
            const productsRef = collection(db, COLLECTION);
            const q = query(
                productsRef,
                where('type', '==', 'rental'),
                where('status', '==', 'available')
            );

            const snapshot = await safeGetDocs(q);

            return snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    productId: doc.id,
                    name: data.name,
                    description: data.description,
                    rentalPricePerDay: data.price,
                    category: data.category,
                    images: data.images,
                    stockAvailable: data.stock,
                    isActive: data.status === 'available',
                    depositAmount: data.metadata?.depositAmount || 0,
                    gstPercent: data.metadata?.gstPercent || 18,
                    ...data,
                    id: doc.id
                } as unknown as RentalProduct;
            });
        } catch (error) {
            console.error("Error fetching products (Firestore):", error);
            return [];
        }
    },

    /**
     * Get a single product by ID.
     */
    getProductById: async (productId: string): Promise<RentalProduct | null> => {
        try {
            const productSnap = await safeGetDoc(doc(db, COLLECTION, productId));

            if (!productSnap.exists()) {
                return null;
            }

            const data = productSnap.data();
            return {
                productId: productSnap.id,
                name: data.name,
                description: data.description,
                rentalPricePerDay: data.price,
                stockAvailable: data.stock,
                isActive: data.status === 'available',
                depositAmount: data.metadata?.depositAmount || 0,
                gstPercent: data.metadata?.gstPercent || 18,
                category: data.category,
                images: data.images,
                ...data,
                id: productSnap.id
            } as unknown as RentalProduct;
        } catch (error) {
            console.error("Error fetching product (Firestore):", error);
            return null;
        }
    },

    /**
     * Create a new rental product listing.
     */
    createProduct: async (productData: Omit<RentalProduct, 'productId'>): Promise<string> => {
        try {
            const dbData = {
                name: productData.name,
                description: productData.description,
                price: productData.rentalPricePerDay,
                stock: productData.stockAvailable,
                type: 'rental',
                category: productData.category,
                images: productData.images,
                status: productData.isActive ? 'available' : 'disabled',
                metadata: {
                    ...productData
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const docRef = await addDoc(collection(db, COLLECTION), dbData);
            return docRef.id;
        } catch (error) {
            console.error("Error creating product (Firestore):", error);
            throw error;
        }
    },

    /**
     * Update stock or details.
     */
    updateProduct: async (productId: string, updates: Partial<RentalProduct>): Promise<void> => {
        try {
            const productDocRef = doc(db, COLLECTION, productId);
            const dbUpdates: any = {
                updated_at: new Date().toISOString()
            };

            if (updates.name) dbUpdates.name = updates.name;
            if (updates.description) dbUpdates.description = updates.description;
            if (updates.rentalPricePerDay !== undefined) dbUpdates.price = updates.rentalPricePerDay;
            if (updates.stockAvailable !== undefined) dbUpdates.stock = updates.stockAvailable;
            if (updates.isActive !== undefined) dbUpdates.status = updates.isActive ? 'available' : 'disabled';
            if (updates.category) dbUpdates.category = updates.category;
            if (updates.images) dbUpdates.images = updates.images;

            if (updates.depositAmount !== undefined || updates.gstPercent !== undefined) {
                const currentSnap = await safeGetDoc(productDocRef);
                const currentMeta = currentSnap.exists() ? currentSnap.data().metadata : {};
                dbUpdates.metadata = {
                    ...currentMeta,
                    ...(updates.depositAmount !== undefined ? { depositAmount: updates.depositAmount } : {}),
                    ...(updates.gstPercent !== undefined ? { gstPercent: updates.gstPercent } : {})
                };
            }

            await updateDoc(productDocRef, dbUpdates);
        } catch (error) {
            console.error("Error updating product (Firestore):", error);
            throw error;
        }
    }
};
