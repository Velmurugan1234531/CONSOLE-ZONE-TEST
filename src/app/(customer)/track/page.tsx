"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Activity, Shield, Box, Globe,
    Signal, Map as MapIcon, ChevronRight,
    Zap, Cpu, Radio
} from "lucide-react";

import { getFleetGeography, type FleetPosition } from "@/services/admin";
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then(mod => mod.CircleMarker), { ssr: false });

export default function TrackingPage() {
    const [userPosition, setUserPosition] = useState<FleetPosition | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadTracking = async () => {
            try {
                const positions = await getFleetGeography();
                // In demo mode, we'll just track the first active unit found or a random one
                const myUnit = positions.find(p => p.status === 'Rented') || positions[0];
                setUserPosition(myUnit);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };

        loadTracking();
        const interval = setInterval(loadTracking, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <Radio size={20} className="text-blue-500 animate-pulse" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Live Mission Uplink</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">
                            Tactical <span className="text-blue-500 underline decoration-blue-500/30 underline-offset-8">Overwrite</span>
                        </h1>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-4 max-w-md leading-relaxed">
                            Geospatial synchronization active. Neural link established with hardware unit in sector {userPosition?.lat.toFixed(1)}N.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] text-right">
                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1">Signal Quality</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black italic text-emerald-500">98.4%</span>
                                <Signal size={12} className="text-emerald-500" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Mission Control Panel */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Unit Status Card */}
                        <div className="p-8 bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/20 rounded-[2.5rem] relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 mb-6 flex items-center gap-2">
                                <Cpu size={14} /> Unit Telemetry
                            </h2>

                            <div className="space-y-6">
                                <div>
                                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Model Identifier</span>
                                    <p className="text-lg font-black italic uppercase leading-tight">{userPosition?.model || "Awaiting Data..."}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <span className="text-[7px] font-black text-gray-500 uppercase">Neural Sync</span>
                                        <p className="text-xs font-black text-blue-400 mt-1">{userPosition?.syncLevel || 450} XP</p>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <span className="text-[7px] font-black text-gray-500 uppercase">Sector</span>
                                        <p className="text-xs font-black text-white mt-1">IND-West</p>
                                    </div>
                                </div>
                            </div>

                            <button className="w-full mt-8 py-4 bg-white/5 hover:bg-blue-500 transition-all rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 hover:border-blue-400 hover:text-black group">
                                <span className="flex items-center justify-center gap-2">
                                    Initiate Remote Diagnostic <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                </span>
                            </button>
                        </div>


                    </div>

                    {/* Tactical Geo-Overlay */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="relative aspect-video rounded-[3rem] overflow-hidden border border-white/10 bg-[#050505]">
                            {/* Map UI Overlay */}
                            <div className="absolute top-8 left-8 z-[1000] p-4 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white">Tracking ACTIVE_UNIT_{userPosition?.serialNumber}</span>
                                </div>
                            </div>

                            {userPosition && typeof window !== 'undefined' && (
                                <MapContainer
                                    center={[userPosition.lat, userPosition.lng]}
                                    zoom={11}
                                    style={{ height: '100%', width: '100%', background: '#050505' }}
                                    className="grayscale-[0.8] contrast-[1.2] invert-[0.05]"
                                    zoomControl={false}
                                >
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                                    <CircleMarker
                                        center={[userPosition.lat, userPosition.lng]}
                                        radius={15}
                                        pathOptions={{
                                            fillColor: '#3b82f6',
                                            fillOpacity: 0.2,
                                            color: '#3b82f6',
                                            weight: 1,
                                            className: 'animate-ping'
                                        }}
                                    />
                                    <CircleMarker
                                        center={[userPosition.lat, userPosition.lng]}
                                        radius={6}
                                        pathOptions={{
                                            fillColor: '#3b82f6',
                                            fillOpacity: 1,
                                            color: 'white',
                                            weight: 2
                                        }}
                                    />
                                </MapContainer>
                            )}

                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-[2000] backdrop-blur-md">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 animate-pulse">Calculating Geo-Sync...</span>
                                    </div>
                                </div>
                            )}

                            {/* Scanlines Effect */}
                            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-[1500]" />
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Latency', value: '4ms', icon: Signal },
                                { label: 'Uplink', value: 'Stable', icon: Globe },
                                { label: 'Encryption', value: 'AES-256', icon: Shield },
                                { label: 'Node', value: 'BOM-01', icon: Box },
                            ].map((stat, i) => (
                                <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-3xl group hover:border-blue-500/30 transition-all">
                                    <stat.icon size={16} className="text-gray-600 mb-4 group-hover:text-blue-500 transition-colors" />
                                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1">{stat.label}</span>
                                    <span className="text-lg font-black uppercase italic text-white group-hover:text-blue-400 transition-colors">{stat.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .leaflet-container {
                    background: #050505 !important;
                }
            `}</style>
        </div>
    );
}
