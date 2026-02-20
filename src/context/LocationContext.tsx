"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import LocationModal from "@/components/location/LocationModal";
import { io, Socket } from "socket.io-client";
import { createClient } from "@/lib/supabase/client";

interface LocationContextType {
    coords: GeolocationCoordinates | null;
    status: "idle" | "requesting" | "denied" | "granted";
    error: string | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
    const [coords, setCoords] = useState<GeolocationCoordinates | null>(null);
    const [status, setStatus] = useState<"idle" | "requesting" | "denied" | "granted">("idle");
    const [error, setError] = useState<string | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Check for existing permissions on mount
    useEffect(() => {
        if (typeof window !== "undefined" && navigator.permissions) {
            navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {
                if (permissionStatus.state === 'granted') {
                    requestLocation();
                } else if (permissionStatus.state === 'denied') {
                    setStatus("denied");
                }

                permissionStatus.onchange = () => {
                    if (permissionStatus.state === 'granted') {
                        requestLocation();
                    } else if (permissionStatus.state === 'prompt') {
                        setStatus("idle");
                    } else if (permissionStatus.state === 'denied') {
                        setStatus("denied");
                    }
                };
            });
        }
    }, []);

    // Socket.IO Initialization
    useEffect(() => {
        if (status === "granted" && user) {
            // Use environment variable for socket connection
            const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
            // Get session token for socket auth
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session) {
                    const socketInstance = io(socketUrl, {
                        auth: { token: session.access_token } // Use Supabase access token
                    });
                    setSocket(socketInstance);
                }
            });

            return () => {
                if (socket) socket.disconnect();
            };
        }
    }, [status, user]);

    const requestLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            setStatus("denied");
            return;
        }

        setStatus("requesting");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoords(position.coords);
                setStatus("granted");
                startContinuousTracking();
            },
            (err) => {
                // User denied or geolocation unavailable - this is expected behavior
                console.warn("Geolocation permission not granted:", err.message || "User denied location access");
                setStatus("denied");
                setError(err.message);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const startContinuousTracking = () => {
        navigator.geolocation.watchPosition(
            (position) => {
                setCoords(position.coords);
                // Socket emission logic handled in a separate useEffect triggered by coords change
            },
            (err) => console.warn("Location tracking update failed:", err.message || "Unable to track location"),
            {
                enableHighAccuracy: false, // Battery optimized
                maximumAge: 10000,
                timeout: 10000,
            }
        );
    };

    const [lastSentCoords, setLastSentCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [lastSentTime, setLastSentTime] = useState<number>(0);

    // Calculate distance between two points in meters
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // Earth radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    // Emit updates via Socket.IO
    useEffect(() => {
        if (!socket || !coords || !user) return;

        const now = Date.now();
        const lat = coords.latitude;
        const lng = coords.longitude;

        if (!lastSentCoords) {
            // First update
            socket.emit("customer_location_update", {
                lat, lng, speed: coords.speed, heading: coords.heading, timestamp: now, userId: user.id
            });
            setLastSentCoords({ lat, lng });
            setLastSentTime(now);
            return;
        }

        const distance = calculateDistance(lat, lng, lastSentCoords.lat, lastSentCoords.lng);
        const timeElapsed = now - lastSentTime;

        // Rules: 5 seconds minimum OR 15 meters moved
        if (timeElapsed >= 5000 || distance >= 15) {
            socket.emit("customer_location_update", {
                lat, lng, speed: coords.speed, heading: coords.heading, timestamp: now, userId: user.id
            });
            setLastSentCoords({ lat, lng });
            setLastSentTime(now);
        }
    }, [coords, socket, user, lastSentCoords, lastSentTime]);

    return (
        <LocationContext.Provider value={{ coords, status, error }}>
            {status !== "granted" && <LocationModal onEnable={requestLocation} status={status} error={error || undefined} />}
            {children}
        </LocationContext.Provider>
    );
}


export function useLocation() {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error("useLocation must be used within a LocationProvider");
    }
    return context;
}

