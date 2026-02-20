
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || functions.config().stripe?.secret_key);

// Create Payment Intent
exports.createStripePaymentIntent = functions.https.onCall(async (data) => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: data.amount * 100, // cents/paise
            currency: "inr",
            automatic_payment_methods: { enabled: true },
            metadata: {
                orderId: data.orderId
            }
        });

        return { clientSecret: paymentIntent.client_secret };
    } catch (error) {
        console.error("Stripe Intent Failed:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// Webhook Handler
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || functions.config().stripe?.webhook_secret;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata.orderId;

        if (orderId) {
            await admin.firestore().collection("orders")
                .doc(orderId)
                .update({
                    payment_status: "paid",
                    order_status: "confirmed",
                    updated_at: admin.firestore.Timestamp.now()
                });
            console.log(`Order ${orderId} confirmed via Stripe Webhook`);
        }
    }

    res.json({ received: true });
});
