"use client";

import React, { useState, useEffect } from "react";
import { QrCode, Scan, Search, HardDrive, ArrowLeft, Monitor, AlertCircle, Camera, User } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Html5QrcodeScanner } from "html5-qrcode";
import { getAllDevices } from "@/services/admin";
import { Device } from "@/types";

export default function QRScannerPage() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [scannedResult, setScannedResult] = useState<string | null>(null);
    const [matchingDevice, setMatchingDevice] = useState<Device | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadDevices = async () => {
        try {
            const data = await getAllDevices();
            setDevices(data);
        } catch (error) {
            console.error("Failed to load devices:", error);
        }
    };

    useEffect(() => {
        loadDevices();
    }, []);

    const startScanner = () => {
        setIsScanning(true);
        setScannedResult(null);
        setMatchingDevice(null);
        setError(null);

        // Delay slightly to ensure DOM element is ready
        setTimeout(() => {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                false
            );

            scanner.render(
                (result) => {
                    setScannedResult(result);
                    const match = devices.find(d => d.serialNumber === result || d.id === result);
                    if (match) {
                        setMatchingDevice(match);
                    } else {
                        setError("No matching asset found in the matrix.");
                    }
                    scanner.clear();
                    setIsScanning(false);
                },
                (err) => {
                    // console.warn(err);
                }
            );
        }, 100);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 lg:p-10 space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <Link href="/admin" className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                            <Scan className="text-[#8B5CF6]" />
                            Hardware <span className="text-gray-500">Scanner</span>
                        </h1>
                    </div>
                    <p className="text-gray-500 text-sm font-medium ml-12">Identify assets and verify serial authenticity in real-time.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Scanner Section */}
                <div className="space-y-6">
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#8B5CF6]/5 blur-[80px] -z-10"></div>

                        {!isScanning && !scannedResult && (
                            <div className="flex flex-col items-center justify-center py-20 space-y-6">
                                <div className="p-6 bg-white/5 rounded-full border border-white/10 group-hover:bg-[#8B5CF6]/10 group-hover:border-[#8B5CF6]/20 transition-all duration-500">
                                    <Camera size={48} className="text-gray-600 group-hover:text-[#8B5CF6] transition-colors" />
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-xl font-black uppercase tracking-tight">Initialize Optics</h3>
                                    <p className="text-sm text-gray-500 max-w-xs mx-auto">Authorize camera access to scan physical asset tags and verify hardware integrity.</p>
                                </div>
                                <button
                                    onClick={startScanner}
                                    className="px-8 py-4 bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-[0_4px_20px_rgba(139,92,246,0.3)] active:scale-95"
                                >
                                    Start Camera
                                </button>
                            </div>
                        )}

                        <div id="reader" className={`${!isScanning ? 'hidden' : ''} rounded-2xl overflow-hidden border border-white/10 bg-black`}></div>

                        <AnimatePresence>
                            {scannedResult && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">Scan Result</h3>
                                        <button onClick={() => setScannedResult(null)} className="text-[10px] font-black uppercase text-[#8B5CF6] hover:underline">Clear</button>
                                    </div>
                                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10 font-mono text-center">
                                        <span className="text-2xl font-bold tracking-tighter text-[#8B5CF6]">{scannedResult}</span>
                                    </div>

                                    {matchingDevice ? (
                                        <motion.div
                                            initial={{ scale: 0.95 }}
                                            animate={{ scale: 1 }}
                                            className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 space-y-4"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-emerald-500/20 rounded-2xl">
                                                    <HardDrive className="text-emerald-400" size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-lg uppercase tracking-tight text-white">{matchingDevice.model}</h4>
                                                    <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Asset Authenticated</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-emerald-500/10">
                                                <div className="space-y-1">
                                                    <span className="text-[8px] font-black text-emerald-500/60 uppercase block">Current Operator</span>
                                                    <div className="flex items-center gap-2">
                                                        <User size={12} className="text-gray-400" />
                                                        <span className="text-xs font-bold text-white uppercase">{matchingDevice.currentUser || "Idle"}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[8px] font-black text-emerald-500/60 uppercase block">Integrity Vitals</span>
                                                    <span className="text-xs font-bold text-white tracking-widest">{matchingDevice.health}% HEALTH</span>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[8px] font-black text-emerald-500/60 uppercase block">Last Service</span>
                                                    <span className="text-xs font-bold text-white uppercase">{matchingDevice.lastService ? new Date(matchingDevice.lastService).toLocaleDateString() : "No Record"}</span>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[8px] font-black text-emerald-500/60 uppercase block">Category</span>
                                                    <span className="text-xs font-bold text-white uppercase">{matchingDevice.category}</span>
                                                </div>
                                            </div>

                                            <div className="pt-4 space-y-3">
                                                <span className="text-[8px] font-black text-emerald-500/60 uppercase block mb-1">Status Directives</span>
                                                <div className="flex gap-2">
                                                    <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5 transition-all">Maintenance</button>
                                                    <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5 transition-all">Calibrate</button>
                                                </div>
                                                <Link
                                                    href={`/admin/fleet?serial=${matchingDevice.serialNumber}`}
                                                    className="block w-full text-center py-3 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
                                                >
                                                    Deploy to Matrix Dashboard
                                                </Link>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-3">
                                            <AlertCircle className="text-red-500" size={32} />
                                            <div className="space-y-1">
                                                <h4 className="font-black uppercase tracking-tight text-white">Identity Mismatch</h4>
                                                <p className="text-xs text-gray-500">{error || "This serial number is not registered in the active matrix."}</p>
                                            </div>
                                            <button
                                                onClick={startScanner}
                                                className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-white transition-colors"
                                            >
                                                Scan Again
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Device List for quick identification */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-500">Recent Assets</h2>
                        <Link href="/admin/rentals?view=fleet" className="text-[10px] font-black uppercase text-[#8B5CF6] hover:underline">View All</Link>
                    </div>

                    <div className="space-y-3">
                        {devices.slice(0, 6).map((device) => (
                            <div
                                key={device.id}
                                className="bg-[#0a0a0a] border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-[#8B5CF6]/30 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-white/5 rounded-xl group-hover:bg-[#8B5CF6]/10 transition-colors">
                                        <HardDrive size={16} className="text-gray-500 group-hover:text-[#8B5CF6]" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-200 uppercase">{device.model}</h4>
                                        <p className="text-[9px] font-mono text-gray-600">{device.serialNumber}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`w-1.5 h-1.5 rounded-full ${device.status === 'Ready' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                    <span className="text-[9px] font-black text-gray-600">{device.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 bg-[#8B5CF6]/5 border border-[#8B5CF6]/10 rounded-[2rem] space-y-4">
                        <h4 className="text-[#8B5CF6] text-xs font-black uppercase tracking-widest flex items-center gap-2">
                            <Monitor size={14} />
                            Scanner Instructions
                        </h4>
                        <ul className="text-[10px] space-y-2 text-gray-400 font-medium">
                            <li className="flex items-start gap-2">
                                <span className="text-[#8B5CF6] font-black tracking-tighter">01.</span>
                                Point camera at the asset tag on the bottom or side of the console unit.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#8B5CF6] font-black tracking-tighter">02.</span>
                                Ensure lighting is sufficient for serial recognition.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#8B5CF6] font-black tracking-tighter">03.</span>
                                If identified, the system will pull the live maintenance and booking logs.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
