"use client";

import { useState, useEffect, useRef } from "react";
import React from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { io, Socket } from "socket.io-client";
import {
    Crosshair, Zap, Shield, AlertTriangle,
    Globe, Radio, Activity, Search,
    Terminal as TerminalIcon, Cpu, Satellite, Layers,
    User, MapPin, Clock
} from "lucide-react";
import { CommandNexusCard } from "../CommandNexusCard";

// Custom dark theme for Leaflet
const tileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

interface LiveTracker {
    userId: string;
    lat: number;
    lng: number;
    timestamp: number;
    lastUpdate: Date;
    speed?: number;
    heading?: number;
}

function MapAutoCenter({ positions }: { positions: LiveTracker[] }) {
    const map = useMap();

    useEffect(() => {
        if (positions.length > 0) {
            const bounds = L.latLngBounds(positions.map(p => [p.lat, p.lng]));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
        }
    }, [positions, map]);

    return null;
}

export function LiveTrackingNexus() {
    const [trackers, setTrackers] = useState<Record<string, LiveTracker>>({});
    const [logs, setLogs] = useState<string[]>([]);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        // Connect to Socket.IO server using environment variable
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
        const socket = io(socketUrl);
        socketRef.current = socket;

        socket.on("connect", () => {
            addLog("Uplink established with tracking server.");
            // Join the riders room to receive live updates
            socket.emit("join_room", "riders");
        });

        socket.on("rider_location_sync", (data: any) => {
            const { userId, lat, lng, timestamp } = data;

            setTrackers(prev => ({
                ...prev,
                [userId]: {
                    userId,
                    lat,
                    lng,
                    timestamp,
                    lastUpdate: new Date()
                }
            }));

            addLog(`Signal received: User_${userId.slice(0, 8)} moving to [${lat.toFixed(4)}, ${lng.toFixed(4)}]`);
        });

        socket.on("disconnect", () => {
            addLog("Uplink severed. Attempting reconnect...");
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 19)]);
    };

    const trackerList = Object.values(trackers);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-6 bg-black/40 border border-blue-500/20 rounded-[2rem] flex items-center justify-between group overflow-hidden relative shadow-[0_0_30px_rgba(59,130,246,0.05)]">
                    <div className="absolute -right-4 -bottom-4 opacity-5">
                        <Satellite size={80} className="text-blue-500" />
                    </div>
                    <div className="relative z-10">
                        <span className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em] flex items-center gap-2">
                            <Radio size={10} className="animate-pulse" />
                            Active Trackers
                        </span>
                        <div className="text-4xl font-black italic mt-1 text-white tracking-tighter">
                            {trackerList.length} <span className="text-xs font-normal text-blue-400/60 not-italic">units</span>
                        </div>
                    </div>
                    <Activity className="text-blue-500/30 animate-pulse" />
                </div>

                <div className="md:col-span-3 p-4 bg-black/60 border border-white/5 rounded-[2rem] font-mono text-[10px] text-emerald-500/80 overflow-hidden h-[96px] relative">
                    <div className="absolute top-2 right-4 text-[8px] uppercase tracking-widest text-emerald-500/40">Live Telemetry Log</div>
                    <div className="space-y-1">
                        {logs.length === 0 ? (
                            <p className="animate-pulse">Waiting for signals...</p>
                        ) : (
                            logs.slice(0, 3).map((log, i) => (
                                <p key={i} className="truncate">{log}</p>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[600px]">
                {/* Map View */}
                <div className="lg:col-span-3 relative h-full">
                    <CommandNexusCard title="Live Geospatial Overlay" subtitle="Real-time customer movement synchronization" icon={Globe} statusColor="blue">
                        <div className="w-full h-[500px] rounded-3xl overflow-hidden border border-white/10 mt-6 relative bg-[#050505]">
                            <MapContainer
                                center={[20, 78]}
                                zoom={4}
                                className="h-full w-full grayscale-[0.8] contrast-[1.2] invert-[0.05]"
                                style={{ background: '#050505' }}
                            >
                                <TileLayer url={tileUrl} />
                                <MapAutoCenter positions={trackerList} />

                                {trackerList.map((tracker) => (
                                    <CircleMarker
                                        key={tracker.userId}
                                        center={[tracker.lat, tracker.lng]}
                                        radius={10}
                                        pathOptions={{
                                            fillColor: '#8B5CF6',
                                            fillOpacity: 0.8,
                                            color: '#A855F7',
                                            weight: 2,
                                            className: 'animate-pulse'
                                        }}
                                    >
                                        <Popup className="neural-popup">
                                            <div className="bg-[#0a0a0a] border border-white/10 p-4 rounded-2xl min-w-[220px] text-white shadow-2xl backdrop-blur-md">
                                                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                                                    <span className="text-[9px] font-black uppercase text-purple-400 tracking-widest">Live Signal</span>
                                                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                                                </div>
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="p-2 bg-purple-500/10 rounded-lg">
                                                        <User size={16} className="text-purple-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-black uppercase tracking-tight">User_{tracker.userId.slice(0, 8)}</h4>
                                                        <p className="text-[8px] text-gray-500 font-mono tracking-tighter">ID: {tracker.userId}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-[8px] uppercase font-bold text-gray-400">
                                                        <span className="flex items-center gap-1.5"><MapPin size={10} /> Lat/Lng</span>
                                                        <span className="text-white">{tracker.lat.toFixed(4)}, {tracker.lng.toFixed(4)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[8px] uppercase font-bold text-gray-400">
                                                        <span className="flex items-center gap-1.5"><Clock size={10} /> Last Sync</span>
                                                        <span className="text-white">{tracker.lastUpdate.toLocaleTimeString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                ))}
                            </MapContainer>

                            {/* HUD Overlays */}
                            <div className="absolute top-6 left-6 z-[1000] pointer-events-none space-y-2">
                                <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-white/90 tracking-widest uppercase italic font-mono">Satellite Feed Active</span>
                                </div>
                            </div>
                        </div>
                    </CommandNexusCard>
                </div>

                {/* Tracker List Sidecar */}
                <div className="space-y-6 overflow-y-auto custom-scrollbar">
                    <CommandNexusCard title="Signal Matrix" subtitle="Active tracking nodes" icon={Radio} statusColor="purple">
                        <div className="space-y-3 mt-6">
                            {trackerList.length === 0 ? (
                                <div className="text-center py-10 opacity-40">
                                    <Activity size={32} className="mx-auto mb-4" />
                                    <p className="text-[10px] uppercase font-black tracking-widest">No Active Nodes</p>
                                </div>
                            ) : (
                                trackerList.map((tracker) => (
                                    <div key={tracker.userId} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-black uppercase text-purple-400">User_{tracker.userId.slice(0, 8)}</span>
                                            <span className="text-[8px] font-mono text-gray-500 uppercase tracking-tighter">{tracker.lastUpdate.toLocaleTimeString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-purple-500/60 animate-pulse" style={{ width: '100%' }} />
                                            </div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CommandNexusCard>

                    {/* Log Terminal Overlay */}
                    <div className="bg-black/60 border border-white/5 rounded-3xl p-6 h-[250px] flex flex-col">
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                            <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] flex items-center gap-2">
                                <TerminalIcon size={12} />
                                Transmission Feed
                            </h4>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                            {logs.map((log, i) => (
                                <p key={i} className="text-[9px] font-mono text-emerald-500/60 leading-tight">
                                    <span className="text-emerald-500/20">{'>'}</span> {log}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .neural-popup .leaflet-popup-content-wrapper {
                    background: transparent !important;
                    padding: 0 !important;
                    box-shadow: none !important;
                }
                .neural-popup .leaflet-popup-tip {
                    background: #0a0a0a !important;
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .neural-popup .leaflet-popup-content {
                    margin: 0 !important;
                }
            `}</style>
        </div>
    );
}

export default LiveTrackingNexus;
