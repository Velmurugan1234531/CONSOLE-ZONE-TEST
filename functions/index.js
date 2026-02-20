
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// Razorpay Modules
exports.createRazorpayOrder = require("./razorpay").createRazorpayOrder;
exports.razorpayWebhook = require("./razorpay").razorpayWebhook;

// Stripe Modules
exports.createStripePaymentIntent = require("./stripe").createStripePaymentIntent;
exports.stripeWebhook = require("./stripe").stripeWebhook;

// AI Risk Engine
exports.aiAutoApproval = require("./aiApproval").aiAutoApproval;
