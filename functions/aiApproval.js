
const functions = require("firebase-functions");
const admin = require("firebase-admin");

/**
 * Advanced AI Risk Scoring Model
 * Triggered on Firestore Order Update (when payment_status changes to 'paid')
 */
exports.aiAutoApproval = functions.firestore
    .document("orders/{orderId}")
    .onUpdate(async (change, context) => {

        const order = change.after.data();
        const previousOrder = change.before.data();

        // Only run if payment just became paid
        if (order.payment_status !== "paid" || previousOrder.payment_status === "paid") return;

        console.log(`🧠 AI Risk Analysis Started for Order: ${context.params.orderId}`);

        let risk = 0;
        const reasons = [];

        // 1. High Amount Risk (Score Weight: 30)
        // Threshold: > 1,00,000 INR
        if (order.total_amount > 100000) {
            risk += 30;
            reasons.push("High Order Value (>1L)");
        }
        else if (order.total_amount > 50000) {
            risk += 15;
        }

        // 2. User History Risk (Score Weight: 20)
        // New user (< 3 orders) is riskier
        try {
            const userDoc = await admin.firestore().collection("users").doc(order.customer_id).get();
            const userData = userDoc.data() || {};

            // Check total orders count (assuming it's tracked on user profile, or we count)
            // If not tracked on user, we query orders
            if (userData.kyc_status !== 'approved') {
                risk += 10;
                reasons.push("KYC Not Approved");
            }

            // Check order history count
            const orderHistory = await admin.firestore()
                .collection("orders")
                .where("customer_id", "==", order.customer_id)
                .count()
                .get();

            const totalOrders = orderHistory.data().count;

            if (totalOrders < 3) {
                risk += 20;
                reasons.push("New User (Less than 3 orders)");
            }
        } catch (e) {
            console.error("Error fetching user history:", e);
            risk += 10; // Penalize for missing data
        }

        // 3. Payment Pattern Risk (Score Weight: 30)
        // Multiple quick orders in last 10 mins
        try {
            const tenMinsAgo = admin.firestore.Timestamp.fromMillis(Date.now() - 600000);
            const recentOrders = await admin.firestore()
                .collection("orders")
                .where("customer_id", "==", order.customer_id)
                .where("created_at", ">", tenMinsAgo)
                .get();

            if (recentOrders.size > 3) {
                risk += 30;
                reasons.push("Velocity Check Failed (>3 orders in 10m)");
            }
        } catch (e) {
            console.error("Error checking velocity:", e);
        }

        // 4. Geo / Device Risk (Placeholder - Score Weight: 20)
        // In real app, check IP distance or Device Fingerprint
        if (order.shipping_address?.city !== "Chennai" && order.total_amount > 20000) {
            // Example heuristic
            risk += 5;
        }

        // --- DECISION ---
        let decision = "APPROVE";
        if (risk > 70) decision = "REJECT";
        else if (risk > 40) decision = "MANUAL_REVIEW";

        console.log(`🧮 Final Risk Score: ${risk} | Decision: ${decision}`);

        // Update Order with AI Decision
        await change.after.ref.update({
            ai_risk_score: risk,
            ai_decision: decision,
            ai_approval: decision === 'APPROVE' ? 'approved' : decision === 'REJECT' ? 'rejected' : 'manual_review',
            'metadata.risk_reasons': reasons,
            updated_at: admin.firestore.Timestamp.now()
        });

        // Auto-Refund Logic if REJECTED
        if (decision === "REJECT") {
            // Call Refund Function (Placeholder)
            console.log(`🚨 Order ${context.params.orderId} Rejected - Initiating Auto-Refund`);
            await change.after.ref.update({
                order_status: 'cancelled',
                payment_status: 'refunded' // logic to trigger refund gateway would go here
            });
        }
    });
