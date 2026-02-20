import { db } from "../lib/firebase";
import {
    collection,
    query,
    limit,
    getDocs,
    addDoc,
    doc,
    deleteDoc,
    serverTimestamp
} from "firebase/firestore";
import { safeGetDocs } from "../utils/firebase-utils";
import dotenv from "dotenv";
import path from "path";

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function runDebug() {
    console.log("--- DEBUGGING DEVICES COLLECTION (FIRESTORE) ---");

    try {
        // 1. Inspect existing documents to see fields
        const devicesRef = collection(db, 'devices');
        const q = query(devicesRef, limit(1));
        const snapshot = await safeGetDocs(q);

        if (!snapshot.empty) {
            const firstDoc = snapshot.docs[0];
            console.log("Existing Doc ID:", firstDoc.id);
            console.log("Existing Doc Fields:", Object.keys(firstDoc.data()));
            console.log("Sample Doc Data:", firstDoc.data());
        } else {
            console.log("No devices found in Firestore to inspect.");
        }

        // 2. Try Standard Insert (Minimal)
        console.log("\n--- TEST: Minimal Insert ---");
        const serial1 = `TEST-MIN-${Date.now()}`;
        const docRef1 = await addDoc(devicesRef, {
            serial_number: serial1,
            status: 'AVAILABLE',
            created_at: new Date().toISOString()
        });

        console.log("Minimal Insert Success. ID:", docRef1.id);

        // Clean up
        await deleteDoc(docRef1);
        console.log("Cleaned up Minimal Insert.");

        // 3. Try Nested Metadata Insert
        console.log("\n--- TEST: Metadata Insert ---");
        const serial2 = `TEST-META-${Date.now()}`;
        const docRef2 = await addDoc(devicesRef, {
            serial_number: serial2,
            status: 'AVAILABLE',
            metadata: { model: 'Test Model', foo: 'bar' },
            created_at: new Date().toISOString()
        });

        console.log("Metadata Insert Success. ID:", docRef2.id);

        // Clean up
        await deleteDoc(docRef2);
        console.log("Cleaned up Metadata Insert.");

    } catch (error) {
        console.error("Debug Script Failed:", error);
    }
}

runDebug().catch(console.error);
