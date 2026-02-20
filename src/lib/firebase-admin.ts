import * as admin from "firebase-admin";

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "consolezonev001",
            // For server-side, you'd usually use a service account for full power,
            // but for simple Auth/Firestore, the ADC or projectId often suffices in some environments.
            // However, for admin.auth().createUser, we usually need proper credentials.
            // We'll rely on environment variables (GOOGLE_APPLICATION_CREDENTIALS) or manual config if present.
        });
        console.log("Firebase Admin initialized successfully.");
    } catch (error) {
        console.error("Firebase Admin initialization error:", error);
    }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
export { admin };
