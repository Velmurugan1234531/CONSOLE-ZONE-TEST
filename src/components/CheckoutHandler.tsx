"use client";

import { useEffect, useState } from "react";

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface CheckoutHandlerProps {
    onSuccess: (response: any) => void;
    onError: (error: any) => void;
}

export default function CheckoutHandler() {
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => setIsScriptLoaded(true);
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const initializePayment = async (amount: number, orderData: any) => {
        if (!isScriptLoaded || !window.Razorpay) {
            console.error("Razorpay SDK not loaded");
            return;
        }

        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Use public key for frontend
            amount: orderData.amount,
            currency: orderData.currency,
            name: "Console Zone",
            description: "Gaming Gear Rental/Purchase",
            order_id: orderData.id,
            handler: function (response: any) {
                // This is the success callback
                console.log("Payment Successful:", response);
                // In a real app, you'd verify this signature on the backend
            },
            prefill: {
                name: "User Name",
                email: "user@example.com",
            },
            theme: {
                color: "#8B5CF6",
            },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    return null; // This is a utility component
}

// Function to call from CartPanel
export const handleCheckout = async (totalPrice: number, addItem?: any) => {
    try {
        const response = await fetch("/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: totalPrice }),
        });

        const orderData = await response.json();

        if (orderData.error) {
            throw new Error(orderData.error);
        }

        return orderData;
    } catch (error) {
        console.error("Checkout Initialization Error:", error);
        throw error;
    }
};
