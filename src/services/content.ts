import { db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    getDoc,
    doc,
    setDoc,
    addDoc,
    deleteDoc
} from "firebase/firestore";
import { safeGetDocs, safeGetDoc } from "@/utils/firebase-utils";
import { Content, ContentSchema } from "@/lib/schemas";

const COLLECTION = 'content';

export const getContent = async (type?: 'page' | 'post') => {
    try {
        const contentRef = collection(db, COLLECTION);
        let q = query(contentRef, orderBy('updated_at', 'desc'));

        if (type) {
            q = query(q, where('type', '==', type));
        }

        const snapshot = await safeGetDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Content[];
    } catch (error) {
        console.warn("Firestore getContent failed:", error);
        return [];
    }
};

export const getContentBySlug = async (slug: string) => {
    try {
        const contentRef = collection(db, COLLECTION);
        const q = query(contentRef, where('slug', '==', slug));
        const snapshot = await safeGetDocs(q);

        if (snapshot.empty) {
            return null;
        }

        const docSnap = snapshot.docs[0];
        return {
            id: docSnap.id,
            ...docSnap.data()
        } as Content;
    } catch (error) {
        console.warn("Firestore getContentBySlug failed:", error);
        return null;
    }
};

export const saveContent = async (content: Partial<Content>) => {
    const validated = ContentSchema.parse(content);
    const now = new Date().toISOString();

    try {
        if (validated.id) {
            // Update
            const docRef = doc(db, COLLECTION, validated.id);
            await setDoc(docRef, {
                ...validated,
                updated_at: now
            }, { merge: true });

            const updatedSnap = await getDoc(docRef);
            return { id: updatedSnap.id, ...updatedSnap.data() } as Content;
        } else {
            // Insert
            const docRef = await addDoc(collection(db, COLLECTION), {
                ...validated,
                created_at: now,
                updated_at: now
            });

            const newSnap = await getDoc(docRef);
            return { id: newSnap.id, ...newSnap.data() } as Content;
        }
    } catch (error) {
        console.error("Firestore saveContent failed:", error);
        throw error;
    }
};

export const deleteContent = async (id: string) => {
    try {
        await deleteDoc(doc(db, COLLECTION, id));
    } catch (error) {
        console.error("Firestore deleteContent failed:", error);
        throw error;
    }
};
