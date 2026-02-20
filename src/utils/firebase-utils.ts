
import {
    getDocs,
    getDoc,
    Query,
    DocumentReference,
    DocumentSnapshot,
    QuerySnapshot
} from "firebase/firestore";

// Global state to track connectivity health
// If true, we skip network attempts and fail fast
let globalOfflineMode = false;
const TIMEOUT_MS = 5000; // Increased to 5s for slower networks

// Auto-recovery timer
let recoveryTimer: NodeJS.Timeout | null = null;

const tryRecover = () => {
    if (globalOfflineMode) {
        console.log("🔄 Attempting to recover network status...");
        globalOfflineMode = false;
        recoveryTimer = null;
    }
};

export const isSystemOffline = () => globalOfflineMode;

export const setSystemOffline = (status: boolean) => {
    if (globalOfflineMode !== status) {
        console.warn(`⚠️ System Network Status Changed: ${status ? 'OFFLINE' : 'ONLINE'}`);
        globalOfflineMode = status;

        if (status) {
            // Try to auto-recover after 30 seconds
            if (recoveryTimer) clearTimeout(recoveryTimer);
            recoveryTimer = setTimeout(tryRecover, 30000);
        }
    }
};

export class OfflineError extends Error {
    constructor(msg?: string) {
        super(msg || "Network timeout or offline mode active");
        this.name = "OfflineError";
    }
}

/**
 * Wraps getDocs with a timeout and offline check.
 * Fails fast if globalOfflineMode is true.
 */
export async function safeGetDocs<T>(q: Query<T>): Promise<QuerySnapshot<T>> {
    if (globalOfflineMode) {
        // Silent fail path? No, caller usually expects to catch.
        throw new OfflineError("Offline Mode Active (Fast Fail)");
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new OfflineError("Operation Timed Out")), TIMEOUT_MS);
    });

    try {
        const result = await Promise.race([getDocs(q), timeoutPromise]);
        return result;
    } catch (error: any) {
        // If it's our timeout or a connection error, set offline mode
        const isOffline = error instanceof OfflineError ||
            error.code === 'unavailable' ||
            (error.message && error.message.includes('offline'));

        if (isOffline) {
            setSystemOffline(true);
        }
        throw error;
    }
}

/**
 * Wraps getDoc with a timeout and offline check.
 */
export async function safeGetDoc<T>(ref: DocumentReference<T>): Promise<DocumentSnapshot<T>> {
    if (globalOfflineMode) {
        throw new OfflineError("Offline Mode Active (Fast Fail)");
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new OfflineError("Operation Timed Out")), TIMEOUT_MS);
    });

    try {
        const result = await Promise.race([getDoc(ref), timeoutPromise]);
        return result;
    } catch (error: any) {
        const isOffline = error instanceof OfflineError ||
            error.code === 'unavailable' ||
            (error.message && error.message.includes('offline'));

        if (isOffline) {
            setSystemOffline(true);
        }
        throw error;
    }
}
