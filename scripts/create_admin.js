
const { initializeApp } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword } = require("firebase/auth");
const { getFirestore, doc, setDoc, serverTimestamp } = require("firebase/firestore");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log("🔥 Initializing Firebase with project:", firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function diagnose() {
    console.log("🔍 Diagnostic: Attempting to read a test document...");
    try {
        // Just try to read any document. If DB is missing, this will throw.
        const docRef = doc(db, "diagnostics", "connection_test");
        const snap = await require("firebase/firestore").getDoc(docRef);
        console.log("✅ Diagnostic Read Success. Exists:", snap.exists());
    } catch (e) {
        console.error("❌ Diagnostic Read Failed:");
        console.error("   Code:", e.code);
        console.error("   Message:", e.message);
        if (e.code === 'unimplemented') {
            console.error("   NOTE: 'unimplemented' often means the Firestore database does not exist or the project has no active database.");
        }
    }
}

async function createAdmin() {
    await diagnose();

    // ... rest of code
    const email = "admin@console.zone";
    const password = "Password123!";

    console.log(`👤 Creating user: ${email}`);

    try {
        // 1. Create User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("✅ Auth User Created:", user.uid);

        // 2. Create Admin Profile
        console.log("📝 Creating Firestore Profile...");
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: user.email,
            fullName: "Super Admin",
            role: "super_admin",
            isActive: true,
            createdAt: serverTimestamp(),
            loginAttempts: 0,
            emailVerified: true
        });

        console.log("✅ Super Admin Profile Created!");
        console.log("-----------------------------------");
        console.log("🎉 ACCOUNT READY");
        console.log(`📧 Email:    ${email}`);
        console.log(`🔑 Password: ${password}`);
        console.log("-----------------------------------");
        process.exit(0);
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            console.log("⚠️  User already exists. Attempting to promote existing user...");
            // If we can't get the UID easily without signing in, we might just fail here.
            // But let's try to sign in to get the UID.
            try {
                const { signInWithEmailAndPassword } = require("firebase/auth");
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                console.log("🔄 Updating existing user role...");
                await setDoc(doc(db, "users", user.uid), {
                    role: "super_admin",
                    isActive: true
                }, { merge: true });

                console.log("✅ Existing user successfully promoted to Super Admin!");
                console.log("-----------------------------------");
                console.log("🎉 ACCOUNT READY");
                console.log(`📧 Email:    ${email}`);
                console.log(`🔑 Password: ${password}`);
                console.log("-----------------------------------");
                process.exit(0);
            } catch (loginError) {
                console.error("❌ Could not login to promote existing user (wrong password?):", loginError.message);
                process.exit(1);
            }
        } else {
            console.error("❌ Error creating admin:", error);
            process.exit(1);
        }
    }
}

createAdmin();
