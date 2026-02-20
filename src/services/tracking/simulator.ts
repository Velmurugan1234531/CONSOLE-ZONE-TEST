import { createClient } from "@/lib/supabase/client";

// Temporary simulation to populate DB for the demo
export const GPSSimulator = {
    startSimulation: (bookingId: string) => {
        const supabase = createClient();
        let lat = 13.0827;
        let lng = 80.2707;

        console.log(`📡 Starting GPS Simulation for ${bookingId}`);

        const interval = setInterval(async () => {
            // Random movement
            lat += (Math.random() - 0.5) * 0.001;
            lng += (Math.random() - 0.5) * 0.001;

            const trackingData = {
                booking_id: bookingId, // PK
                rider_location: { lat, lng },
                customer_location: { lat: 13.0850, lng: 80.2750 },
                status: "MOVING",
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('tracking')
                .upsert(trackingData);

            if (error) console.error("Sim error:", error);
        }, 5000); // Update every 5 seconds

        return () => clearInterval(interval);
    }
};

