
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, Navigation, Package } from "lucide-react";
import { useRealtimeTracking } from "@/hooks/rental/useRealtimeTracking";
import "leaflet/dist/leaflet.css";

// Dynamic import for MapContainer to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });

export default function LiveFleetMap() {
    const { activeFleet, loading } = useRealtimeTracking();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || loading) {
        return (
            <div className="h-[400px] w-full bg-[#0a0a0a] rounded-3xl border border-white/5 flex items-center justify-center">
                <Loader2 className="animate-spin text-[#8B5CF6]" />
            </div>
        );
    }

    return (
        <div className="h-[400px] w-full rounded-3xl overflow-hidden border border-white/5 relative group">
            <div className="absolute top-4 left-4 z-[1000] bg-black/80 backdrop-blur px-4 py-2 rounded-xl border border-white/10">
                <div className="flex items-center gap-3">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Live Operations</span>
                        <span className="text-[9px] text-gray-400">{activeFleet.length} Active Missions</span>
                    </div>
                </div>
            </div>

            <MapContainer
                center={[13.0827, 80.2707] as any}
                zoom={10}
                style={{ height: "100%", width: "100%", background: "#050505" }}
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {activeFleet.map(mission => (
                    <div key={mission.bookingId}>
                        {/* Rider Marker */}
                        {mission.riderLocation && (
                            <Marker position={[mission.riderLocation.lat, mission.riderLocation.lng] as any}>
                                <Popup className="custom-popup">
                                    <div className="bg-black text-white p-2 text-xs border border-[#8B5CF6]/50 rounded mb-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Navigation size={12} className="text-[#8B5CF6]" />
                                            <strong className="block uppercase tracking-wider text-[#8B5CF6]">Rider Unit</strong>
                                        </div>
                                        <span className="text-gray-400 text-[10px]">Mission: {mission.bookingId.slice(0, 6)}</span>
                                    </div>
                                </Popup>
                            </Marker>
                        )}

                        {/* Customer Marker */}
                        {mission.customerLocation && (
                            <Marker position={[mission.customerLocation.lat, mission.customerLocation.lng] as any}>
                                <Popup className="custom-popup">
                                    <div className="bg-black text-white p-2 text-xs border border-emerald-500/50 rounded mb-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Package size={12} className="text-emerald-500" />
                                            <strong className="block uppercase tracking-wider text-emerald-500">Drop Zone</strong>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        )}
                    </div>
                ))}
            </MapContainer>
        </div>
    );
}
