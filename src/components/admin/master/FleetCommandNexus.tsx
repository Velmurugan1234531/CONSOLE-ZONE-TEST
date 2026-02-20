"use client";

import { useState, useEffect } from "react";
import React from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
    Crosshair, Zap, Shield, AlertTriangle,
    Globe, Radio, Activity, Search,
    Terminal as TerminalIcon, Cpu, Satellite, Layers
} from "lucide-react";
import { getFleetGeography, type FleetPosition } from "@/services/admin";
import { CommandNexusCard } from "../CommandNexusCard";

// Custom dark theme for Leaflet
const tileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

function MapAutoCenter({ positions }: { positions: FleetPosition[] }) {
    const map = useMap();

    useEffect(() => {
        if (positions.length > 0) {
            const bounds = L.latLngBounds(positions.map(p => [p.lat, p.lng]));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
        }
    }, [positions, map]);

    return null;
}

function LiveTerminal() {
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        const events = [
            "Initializing satellite link...",
            "Decrypting node signals...",
            "Mumbai Hub: Unit 84X active",
            "Atmospheric interference: 0.02%",
            "Signal strength optimized",
            "Delhi Hub: Maintenance cycle complete",
            "Neural sync established with sector 7",
            "Incoming telemetry from remote units...",
            "Ping: Bangalore Node - 12ms",
            "Fleet integrity: 98.4%",
            "Security protocols active",
            "Global overwatch synchronized"
        ];

        const interval = setInterval(() => {
            setLogs(prev => {
                const newLog = events[Math.floor(Math.random() * events.length)];
                return [...prev.slice(-7), `[${new Date().toLocaleTimeString()}] ${newLog}`];
            });
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 font-mono text-[8px] text-emerald-500/80 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
                <TerminalIcon size={12} />
            </div>
            <div className="space-y-1">
                {logs.length === 0 && <p className="animate-pulse">Establishing uplink...</p>}
                {logs.map((log, i) => (
                    <p key={i} className="leading-tight animate-in slide-in-from-left-1 duration-300">
                        {log}
                    </p>
                ))}
                <div className="w-1.5 h-3 bg-emerald-500/50 animate-pulse inline-block align-middle ml-1" />
            </div>
        </div>
    );
}

export function FleetCommandNexus() {
    const [positions, setPositions] = useState<FleetPosition[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ active: 0, hub: 0, alert: 0 });
    const [showPaths, setShowPaths] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await getFleetGeography();
            setPositions(data);

            setStats({
                active: data.filter(p => p.status === 'Rented').length,
                hub: data.filter(p => p.status === 'Ready').length,
                alert: data.filter(p => p.status === 'Maintenance' || p.status === 'Under-Repair').length
            });
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Rented': return '#3B82F6'; // Blue
            case 'Ready': return '#10B981'; // Emerald
            default: return '#EF4444'; // Red
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* HUD Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 bg-black/40 border border-blue-500/20 rounded-[2rem] flex items-center justify-between group overflow-hidden relative shadow-[0_0_30px_rgba(59,130,246,0.05)]">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
                            <Radio size={80} className="text-blue-500" />
                        </div>
                        <div className="relative z-10">
                            <span className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em] flex items-center gap-2">
                                <Satellite size={10} className="animate-pulse" />
                                Active Deployments
                            </span>
                            <div className="text-4xl font-black italic mt-1 text-white tracking-tighter">{stats.active} <span className="text-xs font-normal text-blue-400/60 not-italic">units</span></div>
                            <div className="flex items-center gap-1.5 mt-2">
                                <div className="w-1 h-1 rounded-full bg-blue-500 animate-ping" />
                                <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">Live Neural Uplink</span>
                            </div>
                        </div>
                        <Activity className="text-blue-500/30 animate-pulse" />
                    </div>

                    <div className="p-6 bg-black/40 border border-emerald-500/20 rounded-[2rem] flex items-center justify-between group overflow-hidden relative shadow-[0_0_30px_rgba(16,185,129,0.05)]">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
                            <Shield size={80} className="text-emerald-500" />
                        </div>
                        <div className="relative z-10">
                            <span className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em] flex items-center gap-2">
                                <Cpu size={10} />
                                Hub Availability
                            </span>
                            <div className="text-4xl font-black italic mt-1 text-white tracking-tighter">{stats.hub} <span className="text-xs font-normal text-emerald-400/60 not-italic">nodes</span></div>
                            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-2 block">Stock Ready for Launch</span>
                        </div>
                        <Zap className="text-emerald-500/30" />
                    </div>

                    <div className="p-6 bg-black/40 border border-red-500/20 rounded-[2rem] flex items-center justify-between group overflow-hidden relative shadow-[0_0_30px_rgba(239,68,68,0.05)]">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
                            <AlertTriangle size={80} className="text-red-500" />
                        </div>
                        <div className="relative z-10">
                            <span className="text-[10px] font-black uppercase text-red-500 tracking-[0.2em] flex items-center gap-2">
                                <AlertTriangle size={10} className="animate-bounce" />
                                Sector Alerts
                            </span>
                            <div className="text-4xl font-black italic mt-1 text-white tracking-tighter">{stats.alert} <span className="text-xs font-normal text-red-400/60 not-italic">active</span></div>
                            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-2 block">Maintenance Required</span>
                        </div>
                        <AlertTriangle className="text-red-500/30 animate-pulse" />
                    </div>
                </div>

                {/* Cyber Terminal Sidecar */}
                <div className="hidden md:block">
                    <LiveTerminal />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[600px]">
                {/* Global Overwatch Map */}
                <div className="lg:col-span-3 relative h-full">
                    <CommandNexusCard title="Tactical Command Overlay" subtitle="Localized geospatial transmission sync" icon={Globe} statusColor="blue">
                        <div className="w-full h-[500px] rounded-3xl overflow-hidden border border-white/10 mt-6 relative bg-[#050505] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                            {/* Map HUD Overlays */}
                            <div className="absolute top-6 left-6 z-[1000] pointer-events-none">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                        <span className="text-[9px] font-mono text-white tracking-widest uppercase">COORD_SYNC: ONLINE</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/5 opacity-60">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className="text-[9px] font-mono text-white tracking-widest uppercase">NET_LATENCY: 12ms</span>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute top-6 right-6 z-[1000] flex gap-2">
                                <button
                                    onClick={() => setShowPaths(!showPaths)}
                                    className={`p-2 backdrop-blur-md border rounded-xl transition-all flex items-center gap-2 ${showPaths ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-black/60 border-white/10 text-gray-500'}`}
                                >
                                    <Layers size={14} />
                                    <span className="text-[9px] font-black uppercase tracking-widest pr-1">Signal Paths</span>
                                </button>
                            </div>

                            {isLoading ? (
                                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 animate-pulse">Syncing Satellite Feed...</span>
                                    </div>
                                </div>
                            ) : (
                                <MapContainer
                                    center={[20, 78]}
                                    zoom={4}
                                    className="h-full w-full grayscale-[0.8] contrast-[1.2] invert-[0.05]"
                                    style={{ background: '#050505' }}
                                >
                                    <TileLayer url={tileUrl} />
                                    <MapAutoCenter positions={positions} />

                                    {positions.map((pos) => (
                                        <React.Fragment key={pos.id}>
                                            {showPaths && (
                                                <Polyline
                                                    positions={[
                                                        [pos.hubLat, pos.hubLng],
                                                        [pos.lat, pos.lng]
                                                    ]}
                                                    pathOptions={{
                                                        color: getStatusColor(pos.status),
                                                        weight: 1,
                                                        opacity: 0.2,
                                                        dashArray: '5, 10',
                                                        className: 'animate-dash'
                                                    }}
                                                />
                                            )}

                                            <CircleMarker
                                                center={[pos.lat, pos.lng]}
                                                radius={8}
                                                pathOptions={{
                                                    fillColor: getStatusColor(pos.status),
                                                    fillOpacity: 0.6,
                                                    color: getStatusColor(pos.status),
                                                    weight: 2,
                                                    className: 'animate-pulse'
                                                }}
                                            >
                                                <Popup className="neural-popup">
                                                    <div className="bg-[#0a0a0a] border border-white/10 p-3 rounded-xl min-w-[200px] text-white shadow-2xl backdrop-blur-md">
                                                        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                                                            <span className="text-[8px] font-black uppercase text-blue-400 tracking-widest">ASSET_TRACE // {pos.serialNumber}</span>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(pos.status) === '#EF4444' ? 'animate-ping' : 'animate-pulse'}`} style={{ backgroundColor: getStatusColor(pos.status) }} />
                                                        </div>
                                                        <h4 className="text-[12px] font-black uppercase italic mb-1 text-white">{pos.model}</h4>
                                                        <p className="text-[9px] text-gray-400 uppercase font-black tracking-tighter mb-3">{pos.label}</p>

                                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                                            <div className="p-1.5 bg-white/5 rounded border border-white/5 flex flex-col gap-0.5">
                                                                <span className="text-[7px] text-gray-500 uppercase font-bold">Latency</span>
                                                                <span className="text-[9px] font-mono text-emerald-400">{Math.floor(Math.random() * 20) + 10}ms</span>
                                                            </div>
                                                            <div className="p-1.5 bg-white/5 rounded border border-white/5 flex flex-col gap-0.5">
                                                                <span className="text-[7px] text-gray-500 uppercase font-bold">Signal</span>
                                                                <span className="text-[9px] font-mono text-blue-400">98% UP</span>
                                                            </div>
                                                        </div>

                                                        {pos.status === 'Rented' && (
                                                            <div className="mb-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg relative overflow-hidden group/pop">
                                                                <div className="absolute inset-0 bg-blue-500/5 group-hover/pop:bg-blue-500/10 transition-colors" />
                                                                <div className="relative z-10">
                                                                    <div className="flex justify_between text-[7px] uppercase font-bold text-blue-400/80 mb-1">
                                                                        <span>Operator</span>
                                                                        <span className="text-white">DEPLOYED_USER</span>
                                                                    </div>
                                                                    <div className="flex justify_between text-[8px] font-mono text-white/90">
                                                                        <span>UPLINK</span>
                                                                        <span>{pos.end_date ? new Date(pos.end_date).toLocaleDateString() : 'ACTIVE'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {pos.syncLevel !== undefined && (
                                                            <div className="pt-2 border-t border-white/5 flex flex-col gap-1">
                                                                <div className="flex justify-between text-[8px] uppercase font-black text-gray-500 tracking-widest">
                                                                    <span>Neural Sync</span>
                                                                    <span className="text-blue-400">{pos.syncLevel} XP</span>
                                                                </div>
                                                                <div className="h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                                                                        style={{ width: `${Math.min((pos.syncLevel / 2000) * 100, 100)}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </Popup>
                                            </CircleMarker>
                                        </React.Fragment>
                                    ))}
                                </MapContainer>
                            )}

                            {/* Scanline Effect Overlay */}
                            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-[1001]" />

                            {/* Bottom Controls */}
                            <div className="absolute bottom-6 left-6 z-[1000]">
                                <div className="flex items-center gap-3 bg-black/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 group">
                                    <div className="w-2 h-2 rounded-sm bg-blue-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-white/80 tracking-widest uppercase italic">Sector Overwatch Active</span>
                                </div>
                            </div>

                            <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2">
                                <button onClick={loadData} className="p-3 bg-black/80 border border-white/10 rounded-2xl hover:bg-blue-500/20 hover:border-blue-500/50 transition-all group backdrop-blur-md shadow-2xl">
                                    <RefreshCw size={14} className="text-gray-400 group-hover:text-blue-400 transition-colors" />
                                </button>
                                <button className="p-3 bg-black/80 border border-white/10 rounded-2xl hover:bg-blue-500/20 hover:border-blue-500/50 transition-all group backdrop-blur-md shadow-2xl">
                                    <Search size={14} className="text-gray-400 group-hover:text-blue-400 transition-colors" />
                                </button>
                            </div>
                        </div>
                    </CommandNexusCard>
                </div>

                {/* Regional Hotspots - Upgrade with futuristic visuals */}
                <div className="space-y-6">
                    <CommandNexusCard title="Node Transmission" subtitle="Localized signal node quality matrix" icon={Radio} statusColor="purple">
                        <div className="space-y-4 mt-6">
                            {[
                                { name: "Mumbai Node", strength: 98, load: 45, ping: 12 },
                                { name: "Delhi Node", strength: 84, load: 72, ping: 24 },
                                { name: "Bangalore Node", strength: 92, load: 28, ping: 8 },
                                { name: "Chennai Node", strength: 71, load: 55, ping: 32 }
                            ].map((node, i) => (
                                <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors group/node">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white group-hover/node:text-purple-400 transition-colors">{node.name}</span>
                                            <span className="text-[7px] text-gray-500 font-mono uppercase tracking-widest">Latency: {node.ping}ms</span>
                                        </div>
                                        <span className="text-[10px] font-mono text-purple-400 font-black">{node.strength}%</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-600 to-blue-500 group-hover/node:shadow-[0_0_10px_rgba(168,85,247,0.5)] transition-all"
                                            style={{ width: `${node.strength}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center justify_between mt-2">
                                        <div className="flex gap-2">
                                            <div className={`w-1 h-3 rounded-full bg-purple-500/20 ${node.load > 30 ? 'bg-purple-500/80' : ''}`} />
                                            <div className={`w-1 h-3 rounded-full bg-purple-500/20 ${node.load > 60 ? 'bg-purple-500/80' : ''}`} />
                                            <div className={`w-1 h-3 rounded-full bg-purple-500/20 ${node.load > 80 ? 'bg-purple-500/80 animate-pulse' : ''}`} />
                                        </div>
                                        <div className={`w-1.5 h-1.5 rounded-full ${node.strength > 90 ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CommandNexusCard>

                    <div className="p-8 bg-gradient-to-br from-blue-500/10 via-black to-purple-500/5 border border-blue-500/20 rounded-[2.5rem] relative overflow-hidden group shadow-2xl">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
                            <Crosshair size={120} className="text-blue-500" />
                        </div>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent animate-scan" />

                        <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            <Crosshair size={12} />
                            Precision Sync
                        </h4>
                        <div className="flex items-end gap-2 text-white">
                            <span className="text-4xl font-black italic tracking-tighter uppercase">Sync_X</span>
                            <span className="text-xs font-black text-emerald-500 mb-1 font-mono">0.02ms</span>
                        </div>
                        <p className="text-[9px] text-gray-500 mt-4 uppercase font-bold tracking-widest leading-relaxed border-t border-white/5 pt-4">
                            Global satellite synchronization verified. Neural packet loss minimal across all active sectors.
                        </p>
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
                @keyframes dash {
                    to {
                        stroke-dashoffset: 0;
                    }
                }
                .animate-dash {
                    stroke-dasharray: 10, 15;
                    animation: dash 20s linear infinite;
                }
                @keyframes scan {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-scan {
                    animation: scan 3s linear infinite;
                }
            `}</style>
        </div>
    );
}

function RefreshCw({ size, className }: { size: number, className: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
        </svg>
    );
}
