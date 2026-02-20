
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const checkUser = async (email: string) => {
    // Since we don't know the UID easily without auth admin sdk (which we might not have set up with service account in this context yet, or maybe we do),
    // we will scan all users for the email if we can't find by ID.
    // Actually, let's just list all users and find the admins.
    console.log(`Checking for admin users...`);
};

const listAdmins = async () => {
    console.log("Listing all users in 'users' collection...");
    const querySnapshot = await getDocs(collection(db, "users"));
    let foundAdmin = false;
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`User [${doc.id}]: Email=${data.email}, Role=${data.role}, Status=${data.status}`);
        if (data.role === 'admin') {
            foundAdmin = true;
            console.log("✅ FOUND ADMIN!");
        }
    });

    if (!foundAdmin) {
        console.log("❌ NO ADMIN USERS FOUND IN FIRESTORE.");
    }
};

listAdmins().catch(console.error);
