"use client";

import { useState, useEffect } from "react";
import { X, Search, CheckCircle2, HardDrive, AlertCircle } from "lucide-react";
import { getAllDevices, updateRental, updateDeviceStatus } from "@/services/admin";
import { Device } from "@/types";

interface AssignUnitModalProps {
    rental: any;
    onClose: () => void;
    onAssign: () => void;
}

export function AssignUnitModal({ rental, onClose, onAssign }: AssignUnitModalProps) {
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadAvailableDevices();
    }, []);

    const loadAvailableDevices = async () => {
        try {
            const allDevices = await getAllDevices();
            // Filter for devices that are 'Ready' and match the rental category if possible
            // We assume rental.product.category maps to device.category
            const readyDevices = allDevices.filter((d: Device) => d.status === 'Ready');
            setDevices(readyDevices);
        } catch (error) {
            console.error("Failed to load devices", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedDevice) return;
        setIsSubmitting(true);
        try {
            // 1. Update Rental with console_id
            await updateRental(rental.id, {
                console_id: selectedDevice.id,
                status: 'active' // Ensure it's active
            });

            // 2. Update Device Status to Rented
            // We need to pass the user info too ideally, but for now status update triggers the UI change
            await updateDeviceStatus(selectedDevice.id, 'Rented');

            onAssign();
            onClose();
        } catch (error) {
            console.error("Assignment failed", error);
            alert("Failed to assign unit. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter devices based on search and basic compatibility matching
    const filteredDevices = devices.filter(d => {
        const matchesSearch = d.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());

        // Optional: Prioritize or filter by category match
        // const matchesCategory = rental.product?.category ? d.category === rental.product.category : true;

        return matchesSearch;
    });

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">

                {/* Header */}
                <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0f0f0f]">
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-white">Assign Asset</h2>
                        <p className="text-[10px] text-gray-500 font-mono">Rental ID: {rental.id.slice(0, 8)} • {rental.product?.name}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-4">

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            placeholder="Find available unit by Serial or Model..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-[#8B5CF6] transition-all"
                        />
                    </div>

                    {/* Device List */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="text-center py-10 text-xs text-gray-500 animate-pulse uppercase tracking-widest">Scanning inventory...</div>
                        ) : filteredDevices.length === 0 ? (
                            <div className="text-center py-10 text-gray-500 flex flex-col items-center gap-2">
                                <AlertCircle size={24} />
                                <span className="text-xs uppercase tracking-widest">No Ready Units Found</span>
                            </div>
                        ) : (
                            filteredDevices.map(device => (
                                <button
                                    key={device.id}
                                    onClick={() => setSelectedDevice(device)}
                                    className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between group ${selectedDevice?.id === device.id
                                        ? 'bg-[#8B5CF6]/10 border-[#8B5CF6] shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                                        : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedDevice?.id === device.id ? 'bg-[#8B5CF6] text-white' : 'bg-black text-gray-500'}`}>
                                            <HardDrive size={20} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className={`text-xs font-black uppercase tracking-wide ${selectedDevice?.id === device.id ? 'text-white' : 'text-gray-300'}`}>{device.model}</h3>
                                            <p className="text-[10px] text-gray-500 font-mono">SN: {device.serialNumber}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                            {device.status}
                                        </span>
                                        {selectedDevice?.id === device.id && (
                                            <CheckCircle2 size={16} className="text-[#8B5CF6]" />
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-[#0f0f0f] flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={!selectedDevice || isSubmitting}
                        className="px-8 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSubmitting ? 'Linking...' : 'Confirm Assignment'}
                    </button>
                </div>
            </div>
        </div>
    );
}
