import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

// Temporary simulation to populate DB for the demo
export const GPSSimulator = {
    startSimulation: (bookingId: string) => {
        let lat = 13.0827;
        let lng = 80.2707;

        console.log(`📡 Starting GPS Simulation for ${bookingId} (Firestore)`);

        const interval = setInterval(async () => {
            // Random movement
            lat += (Math.random() - 0.5) * 0.001;
            lng += (Math.random() - 0.5) * 0.001;

            try {
                const trackingRef = doc(db, 'tracking', bookingId);
                await setDoc(trackingRef, {
                    booking_id: bookingId,
                    rider_location: { lat, lng },
                    customer_location: { lat: 13.0850, lng: 80.2750 },
                    status: "MOVING",
                    updated_at: new Date().toISOString()
                }, { merge: true });
            } catch (error) {
                console.error("GPSSimulator error (Firestore):", error);
            }
        }, 5000); // Update every 5 seconds

        return () => clearInterval(interval);
    }
};
