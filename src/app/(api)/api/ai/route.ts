import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { safeGetDocs } from "@/utils/firebase-utils";

export async function POST(req: Request) {
    try {
        const { query: userQuery } = await req.json();
        const lowerQuery = userQuery.toLowerCase();

        let responseText = "I'm not sure how to help with that. Try asking about 'revenue', 'active rentals', or 'stock'.";

        if (lowerQuery.includes("sales") || lowerQuery.includes("revenue") || lowerQuery.includes("income")) {
            const ordersRef = collection(db, "orders");
            const q = query(ordersRef, where("payment_status", "==", "paid"));
            const snapshot = await safeGetDocs(q);

            const total = snapshot.docs.reduce((sum, doc) => sum + (Number(doc.data().total_amount) || 0), 0) || 0;
            responseText = `Total revenue from sales is ₹${total.toLocaleString()}.`;

        } else if (lowerQuery.includes("rental") || lowerQuery.includes("booking")) {
            const rentalsRef = collection(db, "rentals");
            const q = query(rentalsRef, where("status", "==", "active"));
            const snapshot = await safeGetDocs(q);
            responseText = `There are currently ${snapshot.size || 0} active rentals.`;

        } else if (lowerQuery.includes("stock") || lowerQuery.includes("inventory")) {
            const productsRef = collection(db, "products");
            const totalSnap = await safeGetDocs(productsRef);

            const lowStockQ = query(productsRef, where("stock", "<", 5));
            const lowStockSnap = await safeGetDocs(lowStockQ);

            responseText = `We have ${totalSnap.size || 0} total items in inventory. ${lowStockSnap.size || 0} items are low on stock.`;

        } else if (lowerQuery.includes("user") || lowerQuery.includes("customer")) {
            const usersRef = collection(db, "users");
            const snapshot = await safeGetDocs(usersRef);
            responseText = `We have ${snapshot.size || 0} registered users.`;

        } else if (lowerQuery.includes("overdue")) {
            const rentalsRef = collection(db, "rentals");
            const q = query(rentalsRef, where("status", "==", "overdue"));
            const snapshot = await safeGetDocs(q);

            responseText = (snapshot.size || 0) > 0
                ? `Alert: There are ${snapshot.size} overdue rentals requiring attention.`
                : "Good news! There are no overdue rentals at the moment.";
        }

        return NextResponse.json({ response: responseText });

    } catch (error) {
        console.error("AI Error:", error);
        return NextResponse.json({ response: "My internal systems are experiencing an error." }, { status: 500 });
    }
}
