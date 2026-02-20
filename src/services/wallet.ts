import { db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    orderBy,
    limit as firestoreLimit,
    doc,
    getDoc,
    updateDoc,
    addDoc,
    setDoc
} from "firebase/firestore";
import { safeGetDoc, safeGetDocs } from "@/utils/firebase-utils";

export interface WalletTransaction {
    id: string;
    user_id: string;
    amount: number;
    type: 'credit' | 'debit';
    source: 'sell_order' | 'purchase' | 'refund' | 'admin_adjustment';
    reference_id?: string;
    balance_after: number;
    description?: string;
    created_at: string;
}

export interface WalletBalance {
    user_id: string;
    balance: number;
    last_updated: string;
}

/**
 * Get user's current wallet balance
 */
export const getWalletBalance = async (userId: string): Promise<number> => {
    // Demo mode support
    if (userId === 'demo-user-123' || userId === 'u-001') {
        return 5000;
    }

    try {
        const userSnap = await safeGetDoc(doc(db, "users", userId));
        if (!userSnap.exists()) {
            console.warn("User not found for wallet balance check", userId);
            return 0;
        }

        const data = userSnap.data();
        return data?.wallet_balance || 0;
    } catch (error) {
        console.warn("Failed to fetch wallet balance from Firestore", error);
        return 0;
    }
};

/**
 * Add credits to user wallet
 */
export const addCredits = async (
    userId: string,
    amount: number,
    source: WalletTransaction['source'],
    referenceId?: string,
    description?: string
): Promise<WalletTransaction> => {
    try {
        // 1. Get current balance
        const currentBalance = await getWalletBalance(userId);
        const newBalance = currentBalance + amount;

        // 2. Update user balance
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            wallet_balance: newBalance,
            updated_at: new Date().toISOString()
        });

        // 3. Create transaction record
        const txnData = {
            user_id: userId,
            amount,
            type: 'credit',
            source,
            reference_id: referenceId || null,
            balance_after: newBalance,
            description: description || `Credits added from ${source}`,
            created_at: new Date().toISOString()
        };

        const txnRef = await addDoc(collection(db, "wallet_transactions"), txnData);

        return {
            id: txnRef.id,
            ...txnData
        } as WalletTransaction;
    } catch (e: any) {
        console.error("addCredits failed (Firestore):", e);
        throw e;
    }
};

/**
 * Deduct credits from user wallet
 */
export const deductCredits = async (
    userId: string,
    amount: number,
    source: WalletTransaction['source'],
    referenceId?: string,
    description?: string
): Promise<WalletTransaction | null> => {
    try {
        // 1. Get current balance
        const currentBalance = await getWalletBalance(userId);

        if (currentBalance < amount) {
            throw new Error(`Insufficient balance. Current: ₹${currentBalance}, Required: ₹${amount}`);
        }

        const newBalance = currentBalance - amount;

        // 2. Update user balance
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            wallet_balance: newBalance,
            updated_at: new Date().toISOString()
        });

        // 3. Create transaction record
        const txnData = {
            user_id: userId,
            amount,
            type: 'debit',
            source,
            reference_id: referenceId || null,
            balance_after: newBalance,
            description: description || `Credits deducted for ${source}`,
            created_at: new Date().toISOString()
        };

        const txnRef = await addDoc(collection(db, "wallet_transactions"), txnData);

        return {
            id: txnRef.id,
            ...txnData
        } as WalletTransaction;
    } catch (e: any) {
        console.error("deductCredits failed (Firestore):", e);
        throw e;
    }
};

/**
 * Get wallet transaction history
 */
export const getWalletHistory = async (userId: string, limitCount = 50): Promise<WalletTransaction[]> => {
    // Demo mode support
    if (userId === 'demo-user-123' || userId === 'u-001') {
        const demoHistory: WalletTransaction[] = [
            {
                id: 'txn-demo-1',
                user_id: userId,
                amount: 2500,
                type: 'credit',
                source: 'sell_order',
                reference_id: 'sell-001',
                balance_after: 5000,
                description: 'Credits from selling PlayStation 4 Pro',
                created_at: new Date(Date.now() - 86400000 * 2).toISOString()
            },
            {
                id: 'txn-demo-2',
                user_id: userId,
                amount: 1500,
                type: 'debit',
                source: 'purchase',
                reference_id: 'order-abc123',
                balance_after: 2500,
                description: 'Purchase of The Last of Us Part II',
                created_at: new Date(Date.now() - 86400000 * 5).toISOString()
            },
            {
                id: 'txn-demo-3',
                user_id: userId,
                amount: 4000,
                type: 'credit',
                source: 'sell_order',
                reference_id: 'sell-002',
                balance_after: 4000,
                description: 'Credits from selling Xbox One X',
                created_at: new Date(Date.now() - 86400000 * 10).toISOString()
            }
        ];
        return demoHistory;
    }

    try {
        const txnsRef = collection(db, "wallet_transactions");
        const q = query(
            txnsRef,
            where("user_id", "==", userId),
            orderBy("created_at", "desc"),
            firestoreLimit(limitCount)
        );

        const snapshot = await safeGetDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as WalletTransaction[];
    } catch (error) {
        console.error("Failed to fetch wallet history from Firestore", error);
        return [];
    }
};

/**
 * Get wallet statistics
 */
export const getWalletStats = async (userId: string) => {
    const history = await getWalletHistory(userId);
    const balance = await getWalletBalance(userId);

    const totalCreditsEarned = history
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalCreditsSpent = history
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);

    return {
        current_balance: balance,
        total_earned: totalCreditsEarned,
        total_spent: totalCreditsSpent,
        transaction_count: history.length
    };
};


