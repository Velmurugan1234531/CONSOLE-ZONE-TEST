"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin, Loader2, Navigation } from "lucide-react";

// Fix for Leaflet marker icons in Next.js
let icon: L.Icon<L.IconOptions> | undefined;

if (typeof window !== "undefined") {
    icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
    });
}


interface LocationPickerProps {
    onLocationSelect: (lat: number, lng: number, address: string) => void;
    initialLat?: number;
    initialLng?: number;
    initialAddress?: string;
}

function LocationMarker({
    position,
    setPosition,
    onLocationSelect
}: {
    position: L.LatLng | null,
    setPosition: (pos: L.LatLng) => void,
    onLocationSelect: (lat: number, lng: number, address: string) => void
}) {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            map.flyTo(e.latlng, map.getZoom());

            // Fetch address from coordinates
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`)
                .then(res => res.json())
                .then(data => {
                    onLocationSelect(e.latlng.lat, e.latlng.lng, data.display_name || '');
                })
                .catch(() => {
                    onLocationSelect(e.latlng.lat, e.latlng.lng, '');
                });
        },
    });

    return position === null ? null : (
        <Marker position={position} icon={icon} />
    );
}

export default function LocationPicker({ onLocationSelect, initialLat, initialLng, initialAddress }: LocationPickerProps) {
    const [mounted, setMounted] = useState(false);
    const [position, setPosition] = useState<L.LatLng | null>(
        initialLat && initialLng ? L.latLng(initialLat, initialLng) : null
    );
    const [isLocating, setIsLocating] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const latlng = L.latLng(latitude, longitude);
                setPosition(latlng);

                // Reverse geocode
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
                    .then(res => res.json())
                    .then(data => {
                        onLocationSelect(latitude, longitude, data.display_name || '');
                        setIsLocating(false);
                    })
                    .catch(() => {
                        onLocationSelect(latitude, longitude, '');
                        setIsLocating(false);
                    });
            },
            (error) => {
                // User denied or geolocation unavailable - this is expected behavior
                console.warn("Geolocation unavailable:", error.message || "User denied location access");
                alert("Unable to retrieve your location. Please ensure location permissions are enabled.");
                setIsLocating(false);
            },
            { enableHighAccuracy: true }
        );
    };

    if (!mounted) {
        return (
            <div className="w-full h-[300px] bg-[#0A0A0A] border border-white/10 rounded-xl flex items-center justify-center">
                <Loader2 className="animate-spin text-[#A855F7]" />
            </div>
        );
    }

    const startPosition: [number, number] = initialLat && initialLng ? [initialLat, initialLng] : [20.5937, 78.9629]; // Default to India center

    return (
        <div className="w-full h-[400px] flex flex-col gap-4">
            <div className="w-full h-[320px] rounded-xl overflow-hidden border border-white/10 z-0 relative shadow-2xl">
                <MapContainer center={startPosition} zoom={position ? 15 : 5} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker
                        position={position}
                        setPosition={setPosition}
                        onLocationSelect={onLocationSelect}
                    />
                </MapContainer>

                {/* Overlay Controls */}
                <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                    <button
                        onClick={handleUseCurrentLocation}
                        disabled={isLocating}
                        className="bg-black/80 backdrop-blur-md border border-white/10 p-3 rounded-xl hover:bg-white/10 transition-all text-white shadow-xl flex items-center gap-2 group"
                    >
                        {isLocating ? (
                            <Loader2 size={18} className="animate-spin text-[#8B5CF6]" />
                        ) : (
                            <Navigation size={18} className="text-[#8B5CF6] group-hover:scale-110 transition-transform" />
                        )}
                        <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">
                            {isLocating ? "Locating..." : "Use Current Location"}
                        </span>
                    </button>
                </div>

                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white text-[10px] px-4 py-2 rounded-lg border border-white/5 z-[1000] pointer-events-none uppercase font-black tracking-widest italic">
                    Tap on map to refine position
                </div>
            </div>

            <button
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="w-full py-4 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-xl text-[#8B5CF6] text-xs font-black uppercase tracking-[0.2em] hover:bg-[#8B5CF6]/20 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
                {isLocating ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : (
                    <Navigation size={16} />
                )}
                {isLocating ? "Synchronizing Coordinates..." : "Autofill via GPS Link"}
            </button>
        </div>
    );
}
