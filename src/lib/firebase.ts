
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIza-placeholder-key',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'placeholder-project.firebaseapp.com',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'placeholder-project',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'placeholder-project.appspot.com',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000000000',
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID_NEW || 'G-XXXXXXXXXX'
};

// Initialize Firebase
let app: any;
try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
} catch (error) {
    console.warn("⚠️ Firebase initialization failed. Falling back to dummy app.", error);
    app = { name: '[dummy-app]' } as any;
}

// Initialize services with resilience
let auth: any;
try {
    auth = getAuth(app);
} catch (e) {
    console.warn("⚠️ Firebase Auth failed to initialize.");
    auth = { onAuthStateChanged: () => () => { } } as any;
}

// Initialize Firestore with default settings (WebSockets preferred)
// Using try-catch to handle HMR or multiple initializations safely
let db: ReturnType<typeof getFirestore>;
try {
    db = getFirestore(app);
} catch (e) {
    db = initializeFirestore(app, {
        // experimentalForceLongPolling: true, // Commented out to test standard connection
    });
}

// Troubleshooting: Log config to ensure env vars are loaded (masking sensitive data)
if (typeof window !== 'undefined') {
    console.log("🔥 Firebase Config Loaded:", {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        storageBucket: firebaseConfig.storageBucket,
        mode: "Long Polling Forced"
    });
}

let analytics = null;
if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

export { app, auth, db, analytics };
