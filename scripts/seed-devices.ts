
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, Timestamp } from "firebase/firestore";
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

const devices = [
    {
        name: "PlayStation 5 Disc Edition",
        serial_number: "PS5-8829-XJ",
        category: "PS5",
        status: "Ready",
        health: 100,
        notes: "Brand new unit",
        cost: 49990,
        purchase_date: new Date().toISOString(),
        warranty_expiry: new Date(Date.now() + 31536000000).toISOString(),
        supplier: "Sony India",
        created_at: new Date().toISOString()
    },
    {
        name: "Xbox Series X",
        serial_number: "XBX-9921-KL",
        category: "Xbox",
        status: "Ready",
        health: 98,
        notes: "Slight scratch on side panel",
        cost: 48990,
        purchase_date: new Date().toISOString(),
        warranty_expiry: new Date(Date.now() + 31536000000).toISOString(),
        supplier: "Microsoft India",
        created_at: new Date().toISOString()
    },
    {
        name: "Nintendo Switch OLED",
        serial_number: "NSW-7729-MM",
        category: "Switch",
        status: "MAINTENANCE",
        health: 85,
        notes: "Joycon drift suspected",
        cost: 32990,
        purchase_date: new Date().toISOString(),
        warranty_expiry: new Date(Date.now() + 31536000000).toISOString(),
        supplier: "Nintendo Imports",
        created_at: new Date().toISOString()
    }
];

const seedDevices = async () => {
    console.log("Seeding 'devices' collection...");
    try {
        const coll = collection(db, "devices");
        for (const device of devices) {
            await addDoc(coll, device);
            console.log(`Added ${device.name}`);
        }
        console.log("Seeding complete.");
    } catch (e) {
        console.error("Error seeding devices:", e);
    }
};

seedDevices();
