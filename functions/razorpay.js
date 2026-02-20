
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// Initialize Razorpay with config
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || functions.config().razorpay?.key_id || "test_key",
    key_secret: process.env.RAZORPAY_KEY_SECRET || functions.config().razorpay?.key_secret || "test_secret"
});

// Create Razorpay Order
exports.createRazorpayOrder = functions.https.onCall(async (data, context) => {
    try {
        const options = {
            amount: data.amount * 100, // Amount in lowest denomination (paise)
            currency: "INR",
            receipt: "receipt_" + Date.now(),
            notes: {
                orderId: data.orderId
            }
        };

        const order = await razorpay.orders.create(options);
        return order;
    } catch (error) {
        console.error("Razorpay Order Creation Failed:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// Webhook Handler
exports.razorpayWebhook = functions.https.onRequest(async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || functions.config().razorpay?.webhook_secret;

    if (!secret) {
        console.error("Missing webhook secret");
        return res.status(500).send("Configuration Error");
    }

    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (digest === req.headers["x-razorpay-signature"]) {
        const payment = req.body.payload.payment.entity;
        const orderId = payment.notes.orderId;

        if (orderId) {
            await admin.firestore().collection("orders").doc(orderId).update({
                payment_status: "paid",
                order_status: "confirmed",
                updated_at: admin.firestore.Timestamp.now()
            });
            console.log(`Order ${orderId} confirmed via Webhook`);
        }

        res.status(200).send("OK");
    } else {
        console.warn("Invalid Signature");
        res.status(400).send("Invalid signature");
    }
});
