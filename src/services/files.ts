import { db, storage } from "@/lib/firebase";
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "firebase/storage";
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    getDocs,
    doc,
    deleteDoc
} from "firebase/firestore";
import { safeGetDocs } from "@/utils/firebase-utils";

export interface FileDocument {
    id: string;
    userId: string;
    name: string;
    url: string;
    size: number;
    type: string;
    storagePath: string;
    createdAt: string;
}

const COLLECTION = 'file_records';

export const uploadFile = async (userId: string, file: File, bucket: string = 'media') => {
    try {
        // 1. Storage Upload
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;
        const storageRef = ref(storage, `${bucket}/${filePath}`);

        await uploadBytes(storageRef, file);
        const publicUrl = await getDownloadURL(storageRef);

        // 2. Database Record
        await addDoc(collection(db, COLLECTION), {
            user_id: userId,
            name: file.name,
            url: publicUrl,
            size: file.size,
            type: file.type,
            storage_path: filePath,
            bucket,
            created_at: new Date().toISOString()
        });

        return publicUrl;
    } catch (error: any) {
        console.error("Upload failed (Firebase):", error);
        throw new Error(`Upload failed: ${error.message}`);
    }
};

export const listUserFiles = async (userId: string, bucket: string = 'media'): Promise<FileDocument[]> => {
    try {
        const filesRef = collection(db, COLLECTION);
        const q = query(
            filesRef,
            where('user_id', '==', userId),
            orderBy('created_at', 'desc')
        );
        const snapshot = await safeGetDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                userId: data.user_id,
                name: data.name,
                url: data.url,
                size: data.size,
                type: data.type,
                storagePath: data.storage_path,
                createdAt: data.created_at
            };
        });
    } catch (error) {
        console.error("Error fetching files (Firestore):", error);
        return [];
    }
};

export const listFiles = async (bucket: string = 'media'): Promise<FileDocument[]> => {
    try {
        const filesRef = collection(db, COLLECTION);
        const q = query(filesRef, orderBy('created_at', 'desc'));
        const snapshot = await safeGetDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                userId: data.user_id,
                name: data.name,
                url: data.url,
                size: data.size,
                type: data.type,
                storagePath: data.storage_path,
                createdAt: data.created_at
            };
        });
    } catch (error) {
        console.error("Error fetching all files (Firestore):", error);
        return [];
    }
};

export const subscribeToFiles = (userId: string, callback: (files: FileDocument[]) => void) => {
    const filesRef = collection(db, COLLECTION);
    const q = query(
        filesRef,
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const files = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                userId: data.user_id,
                name: data.name,
                url: data.url,
                size: data.size,
                type: data.type,
                storagePath: data.storage_path,
                createdAt: data.created_at
            };
        });
        callback(files);
    });

    return unsubscribe;
};

export const deleteFile = async (userId: string, fileId: string, storagePath: string, bucket: string = 'media') => {
    try {
        // 1. Storage Delete
        const storageRef = ref(storage, `${bucket}/${storagePath}`);
        await deleteObject(storageRef).catch(e => console.warn("Storage item already gone or access denied:", e));

        // 2. Database Record Delete
        await deleteDoc(doc(db, COLLECTION, fileId));

    } catch (error: any) {
        console.error("Delete failed (Firebase):", error);
        throw new Error(`Delete failed: ${error.message}`);
    }
};
