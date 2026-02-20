import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, writeBatch } from "firebase/firestore";
import { safeGetDocs } from "@/utils/firebase-utils";

export async function GET(req: Request) {
    try {
        // 1. Check for overdue rentals
        const now = new Date().toISOString();
        const rentalsRef = collection(db, "rentals");
        const q = query(
            rentalsRef,
            where("status", "==", "active"),
            where("end_date", "<", now)
        );

        const snapshot = await safeGetDocs(q);

        if (!snapshot.empty) {
            const batch = writeBatch(db);
            snapshot.docs.forEach((item) => {
                const docRef = doc(db, "rentals", item.id);
                batch.update(docRef, { status: "overdue" });
            });

            await batch.commit();

            // In a real app, send emails here
            // await sendOverdueEmails(snapshot.docs.map(d => d.id));
        }

        return NextResponse.json({
            success: true,
            processed: snapshot.size || 0,
            message: "Automation checks completed."
        });

    } catch (error) {
        console.error("Cron Error:", error);
        return NextResponse.json({ success: false, error: 'Automation failed' }, { status: 500 });
    }
}
