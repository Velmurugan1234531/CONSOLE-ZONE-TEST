
import {
    getDocs,
    getDoc,
    Query,
    DocumentReference,
    DocumentSnapshot,
    QuerySnapshot
} from "firebase/firestore";

// Global state to track connectivity health
let globalOfflineMode = false;
const TIMEOUT_MS = 8000;         // Normal timeout
const RETRY_TIMEOUT_MS = 3000;   // Short retry when already "offline"

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
            // Try to auto-recover after 15 seconds (was 30s)
            if (recoveryTimer) clearTimeout(recoveryTimer);
            recoveryTimer = setTimeout(tryRecover, 15000);
        }
    }
};

export const resetOfflineMode = () => {
    if (recoveryTimer) clearTimeout(recoveryTimer);
    globalOfflineMode = false;
    recoveryTimer = null;
};

export class OfflineError extends Error {
    constructor(msg?: string) {
        super(msg || "Network timeout or offline mode active");
        this.name = "OfflineError";
    }
}

const isOfflineError = (error: any): boolean => {
    return (
        error instanceof OfflineError ||
        error.code === 'unavailable' ||
        (error.message && (
            error.message.includes('offline') ||
            error.message.includes('Offline') ||
            error.message.includes('timed out') ||
            error.message.includes('Timed Out')
        ))
    );
};

/**
 * Wraps getDocs with a timeout and offline check.
 * When in offline mode, still tries with a shorter timeout to allow recovery.
 */
export async function safeGetDocs<T>(q: Query<T>): Promise<QuerySnapshot<T>> {
    // Use shorter timeout if we think we're offline (give it a chance to recover)
    const timeoutDuration = globalOfflineMode ? RETRY_TIMEOUT_MS : TIMEOUT_MS;

    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new OfflineError("Operation Timed Out")), timeoutDuration);
    });

    try {
        const result = await Promise.race([getDocs(q), timeoutPromise]);
        // If we succeeded, we are online
        if (globalOfflineMode) setSystemOffline(false);
        return result;
    } catch (error: any) {
        if (isOfflineError(error)) {
            setSystemOffline(true);
        }
        throw error;
    }
}

/**
 * Wraps getDoc with a timeout and offline check.
 * When in offline mode, still tries with a shorter timeout to allow recovery.
 */
export async function safeGetDoc<T>(ref: DocumentReference<T>): Promise<DocumentSnapshot<T>> {
    // Use shorter timeout if we think we're offline (give it a chance to recover)
    const timeoutDuration = globalOfflineMode ? RETRY_TIMEOUT_MS : TIMEOUT_MS;

    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new OfflineError("Operation Timed Out")), timeoutDuration);
    });

    try {
        const result = await Promise.race([getDoc(ref), timeoutPromise]);
        // If we succeeded, we are online
        if (globalOfflineMode) setSystemOffline(false);
        return result;
    } catch (error: any) {
        if (isOfflineError(error)) {
            setSystemOffline(true);
        }
        throw error;
    }
}
