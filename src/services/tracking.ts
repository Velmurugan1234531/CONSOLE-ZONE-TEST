import { NeuralSync } from './realtime-sync';
import { BookingPersistence } from './booking-persistence';

export const TrackingService = {
    /**
     * Request location permission and start broadcasting
     */
    async startTracking(bookingId: string) {
        if (!navigator.geolocation) {
            console.error("Geolocation is not supported by this browser.");
            return;
        }

        console.log(`[TRACKING] Starting live uplink for ${bookingId}`);

        // Request Permission
        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log("[TRACKING] Permission Granted. Active Coordinates:", position.coords);

                // Continuous Watch
                const watchId = navigator.geolocation.watchPosition(
                    (pos) => {
                        const payload = {
                            booking_id: bookingId,
                            latitude: pos.coords.latitude,
                            longitude: pos.coords.longitude,
                            timestamp: new Date().toISOString()
                        };

                        // 1. Persist to local logs
                        BookingPersistence.addTrackingLog(payload as any);

                        // 2. Broadcast via WebSocket simulation
                        NeuralSync.broadcast('live-location', payload);
                    },
                    (err) => console.warn("[TRACKING] Connection lost:", err),
                    { enableHighAccuracy: true }
                );

                // Store watchId if we need to stop later
                (window as any)[`tracking_${bookingId}`] = watchId;
            },
            (err) => console.error("[TRACKING] Permission Denied:", err)
        );
    },

    /**
     * Stop tracking automatically when rental completed
     */
    stopTracking(bookingId: string) {
        const watchId = (window as any)[`tracking_${bookingId}`];
        if (watchId) {
            navigator.geolocation.clearWatch(watchId);
            delete (window as any)[`tracking_${bookingId}`];
            console.log(`[TRACKING] Uplink Terminated for ${bookingId}`);
        }
    }
};
