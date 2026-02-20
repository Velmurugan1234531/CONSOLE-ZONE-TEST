
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, getCountFromServer } from "firebase/firestore";
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

const checkDevices = async () => {
    console.log("Checking 'devices' collection...");
    try {
        const coll = collection(db, "devices");
        const snapshot = await getCountFromServer(coll);
        console.log(`count: ${snapshot.data().count}`);

        if (snapshot.data().count > 0) {
            const docs = await getDocs(coll);
            console.log("First device:", docs.docs[0].data());
        } else {
            console.log("Collection is empty.");
        }
    } catch (e) {
        console.error("Error:", e);
    }
};

checkDevices();
