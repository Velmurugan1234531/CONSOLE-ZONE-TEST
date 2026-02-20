import { db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc
} from "firebase/firestore";
import { safeGetDocs } from "@/utils/firebase-utils";

export interface NoteDocument {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    user_id?: string;
}

const COLLECTION = 'notes';

/**
 * Create a new note
 */
export async function createNote(userId: string, title: string, content: string): Promise<NoteDocument> {
    try {
        const docRef = await addDoc(collection(db, COLLECTION), {
            user_id: userId,
            title,
            content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        return {
            id: docRef.id,
            title,
            content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            user_id: userId
        };
    } catch (error: any) {
        throw new Error(`Failed to create note: ${error.message}`);
    }
}

/**
 * Update an existing note
 */
export async function updateNote(
    userId: string,
    noteId: string,
    title: string,
    content: string
): Promise<void> {
    try {
        const noteRef = doc(db, COLLECTION, noteId);
        await updateDoc(noteRef, {
            title,
            content,
            updated_at: new Date().toISOString()
        });
    } catch (error: any) {
        throw new Error(`Failed to update note: ${error.message}`);
    }
}

/**
 * Delete a note
 */
export async function deleteNote(userId: string, noteId: string): Promise<void> {
    try {
        const noteRef = doc(db, COLLECTION, noteId);
        await deleteDoc(noteRef);
    } catch (error: any) {
        throw new Error(`Failed to delete note: ${error.message}`);
    }
}

/**
 * Get all notes for a user
 */
export async function getUserNotes(userId: string): Promise<NoteDocument[]> {
    try {
        const notesRef = collection(db, COLLECTION);
        const q = query(
            notesRef,
            where('user_id', '==', userId),
            orderBy('updated_at', 'desc')
        );
        const snapshot = await safeGetDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                content: data.content,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
                user_id: data.user_id
            };
        });
    } catch (error: any) {
        throw new Error(`Failed to fetch notes: ${error.message}`);
    }
}

/**
 * Listen to real-time note updates
 */
export function subscribeToNotes(userId: string, callback: (notes: NoteDocument[]) => void): () => void {
    const notesRef = collection(db, COLLECTION);
    const q = query(
        notesRef,
        where('user_id', '==', userId),
        orderBy('updated_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const notes = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                content: data.content,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
                user_id: data.user_id
            };
        });
        callback(notes);
    }, (error) => {
        console.error("Firestore subscription error:", error);
    });

    return unsubscribe;
}
