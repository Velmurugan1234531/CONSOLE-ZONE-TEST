"use client";



import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Check, X, FileText, User, Eye, Loader2, Phone, Shield, Monitor, ShoppingBag, Banknote, Calendar, ChevronRight, MapPin, ExternalLink, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getPendingKYCRequests, updateKYCStatus } from "@/services/admin";
import { format } from "date-fns";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import "leaflet/dist/leaflet.css";

// Dynamic Map for KYC Location
const KYCMap = dynamic(
    () => import("react-leaflet").then((mod) => {
        const { MapContainer, TileLayer, CircleMarker } = mod;
        return function MapComponent({ lat, lng }: { lat: number, lng: number }) {
            return (
                <MapContainer
                    center={[lat, lng]}
                    zoom={13}
                    className="w-full h-full grayscale"
                    style={{ background: '#050505', height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                >
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    <CircleMarker
                        center={[lat, lng]}
                        radius={10}
                        pathOptions={{
                            fillColor: '#8B5CF6',
                            fillOpacity: 0.8,
                            color: '#fff',
                            weight: 2,
                            className: 'animate-pulse'
                        }}
                    />
                </MapContainer>
            );
        };
    }),
    { ssr: false, loading: () => <div className="w-full h-full bg-white/5 animate-pulse flex items-center justify-center text-[10px] text-gray-500 uppercase tracking-widest">Initialising Tactical Map...</div> }
);

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function KYCPage() {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    useEffect(() => {
        loadRequests();
    }, [activeTab]);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const { getKYCRequests } = await import("@/services/admin");
            const data = await getKYCRequests(activeTab);
            setDocuments(data || []);
        } catch (e: any) {
            console.error(`Failed to load KYC requests: ${e?.message || e}`);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
        try {
            setProcessingId(id);
            // If rejected, usually we'd ask for a reason. For now, we'll just set a default reason.
            await updateKYCStatus(id, newStatus, newStatus === 'REJECTED' ? "Document verification failed" : undefined);

            // Remove from list or update status
            setDocuments(prev => prev.filter(d => d.id !== id));

        } catch (error) {
            console.error("Failed to update status:", error);
            alert("Failed to update status");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] p-8 text-white pt-24">
            <div className="w-full max-w-none mx-auto">
                <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] uppercase italic tracking-tighter">
                            KYC VERIFICATION
                        </h1>
                        <p className="text-gray-500 font-mono text-xs uppercase tracking-widest mt-1">Review and approve user identification documents.</p>
                    </div>

                    <div className="flex bg-[#0a0a0a] border border-white/10 p-1 rounded-xl">
                        {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                                    activeTab === tab
                                        ? "bg-[#8B5CF6] text-white shadow-lg"
                                        : "text-gray-500 hover:text-white"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </header>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-[#8B5CF6]" size={40} />
                    </div>
                ) : documents.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <FileText size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No pending verification requests.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {documents.map((doc) => (
                            <motion.div
                                key={doc.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-[#8B5CF6]/50 transition-colors"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-12 h-12 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6] font-bold border-2 border-white/10">
                                        {doc.full_name?.charAt(0) || <User size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-white">{doc.full_name || "Unknown User"}</h3>
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mt-1">
                                            <span className="flex items-center gap-1 text-[#06B6D4] font-bold">
                                                <FileText size={14} /> {doc.aadhar_number}
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Phone size={14} className="opacity-50" /> {doc.phone}
                                                {doc.secondary_phone && (
                                                    <span className="text-gray-600 ml-1">/ {doc.secondary_phone}</span>
                                                )}
                                            </span>
                                            <span>•</span>
                                            <span className="text-[10px]">{doc.kyc_submitted_at ? format(new Date(doc.kyc_submitted_at), 'MMM dd, HH:mm') : 'Recently'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Document Previews */}
                                <div className="flex gap-3">
                                    {doc.id_card_front_url && (
                                        <a href={doc.id_card_front_url} target="_blank" rel="noopener noreferrer" className="block w-20 h-14 bg-white/5 rounded-lg overflow-hidden relative group cursor-pointer border border-white/10 hover:border-[#8B5CF6]">
                                            <img src={doc.id_card_front_url} alt="ID Front" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                                                <Eye size={12} className="text-white" />
                                            </div>
                                            <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-[6px] font-black tracking-tighter text-center text-white p-0.5">FRONT</span>
                                        </a>
                                    )}
                                    {doc.id_card_back_url && (
                                        <a href={doc.id_card_back_url} target="_blank" rel="noopener noreferrer" className="block w-20 h-14 bg-white/5 rounded-lg overflow-hidden relative group cursor-pointer border border-white/10 hover:border-[#8B5CF6]">
                                            <img src={doc.id_card_back_url} alt="ID Back" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                                                <Eye size={12} className="text-white" />
                                            </div>
                                            <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-[6px] font-black tracking-tighter text-center text-white p-0.5">BACK</span>
                                        </a>
                                    )}
                                    {doc.selfie_url && (
                                        <a href={doc.selfie_url} target="_blank" rel="noopener noreferrer" className="block w-16 h-16 bg-white/5 rounded-full overflow-hidden relative group cursor-pointer border border-white/10 hover:border-[#8B5CF6]">
                                            <img src={doc.selfie_url} alt="Selfie" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                                                <Eye size={16} className="text-white" />
                                            </div>
                                        </a>
                                    )}
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className={cn(
                                            "text-[10px] font-black uppercase px-3 py-1 rounded-full border",
                                            doc.kyc_status === 'APPROVED' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                                doc.kyc_status === 'REJECTED' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                    "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                        )}>
                                            {doc.kyc_status || 'PENDING'}
                                        </div>
                                        {doc.rejection_reason && activeTab === 'REJECTED' && (
                                            <p className="text-[9px] text-red-400/60 mt-2 max-w-[150px] italic">
                                                "{doc.rejection_reason}"
                                            </p>
                                        )}
                                    </div>

                                    {activeTab === 'PENDING' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleStatusChange(doc.id, 'REJECTED'); }}
                                                disabled={processingId === doc.id}
                                                className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors border border-transparent hover:border-red-500/50 disabled:opacity-50"
                                                title="Reject"
                                            >
                                                {processingId === doc.id ? <Loader2 size={20} className="animate-spin" /> : <X size={20} />}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleStatusChange(doc.id, 'APPROVED'); }}
                                                disabled={processingId === doc.id}
                                                className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition-colors border border-transparent hover:border-green-500/50 disabled:opacity-50"
                                                title="Approve"
                                            >
                                                {processingId === doc.id ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedUser(doc); }}
                                        className="p-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 hover:text-white transition-all border border-white/5 hover:border-white/20"
                                        title="View Details"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detailed Side Panel */}
            <AnimatePresence>
                {selectedUser && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedUser(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0a0a0a] border-l border-white/10 z-[70] p-8 overflow-y-auto custom-scrollbar shadow-2xl"
                        >
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="absolute right-6 top-6 p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-full transition-all"
                            >
                                <X size={20} />
                            </button>

                            <div className="text-center mb-8 pt-8">
                                <div className="w-24 h-24 rounded-full p-1 border-2 border-[#8B5CF6] mx-auto mb-4 relative">
                                    {selectedUser.avatar_url ? (
                                        <img src={selectedUser.avatar_url} className="w-full h-full rounded-full object-cover shadow-lg shadow-[#8B5CF6]/20" alt="Profile" />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-white/5 flex items-center justify-center text-3xl font-black text-gray-700 italic">
                                            {selectedUser.full_name?.charAt(0) || 'U'}
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 right-0 bg-[#8B5CF6] p-1.5 rounded-full border-2 border-[#0a0a0a] shadow-lg">
                                        <Shield size={12} className="text-white" />
                                    </div>
                                </div>
                                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">{selectedUser.full_name}</h2>
                                <p className="text-gray-500 font-mono text-xs uppercase tracking-widest mt-1">{selectedUser.email}</p>

                                <div className="flex justify-center gap-2 mt-6">
                                    <span className={cn(
                                        "text-[10px] font-black px-3 py-1 rounded-full border",
                                        selectedUser.kyc_status === 'APPROVED' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                            selectedUser.kyc_status === 'REJECTED' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                    )}>
                                        {selectedUser.kyc_status}
                                    </span>
                                    <span className="bg-white/5 text-gray-500 text-[10px] font-black px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest">
                                        ID: #{selectedUser.id.slice(0, 8)}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {/* Trust Matrix */}
                                <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/5 to-transparent pointer-events-none" />
                                    <div className="flex justify-between items-center mb-4 relative z-10">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Trust Index</h4>
                                        <span className="text-lg font-black italic text-[#8B5CF6]">{selectedUser.trust_score || 100}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-black rounded-full overflow-hidden mb-6 relative z-10">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${selectedUser.trust_score || 100}%` }}
                                            className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 relative z-10">
                                        <div className="bg-black/40 p-3 rounded-2xl border border-white/5 text-center">
                                            <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Risk Profile</p>
                                            <p className="text-[10px] font-bold text-emerald-500 italic">LOW_THREAT</p>
                                        </div>
                                        <div className="bg-black/40 p-3 rounded-2xl border border-white/5 text-center">
                                            <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Consistency</p>
                                            <p className="text-[10px] font-bold text-blue-400 italic">STABLE</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Evidence Matrix - NEW SECTION */}
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
                                        <Shield size={10} /> Evidence Matrix
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {selectedUser.id_card_front_url && (
                                            <div className="space-y-1.5 pt-4">
                                                <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Front ID</p>
                                                <a href={selectedUser.id_card_front_url} target="_blank" rel="noopener noreferrer" className="block aspect-[1.6/1] bg-white/5 rounded-2xl overflow-hidden border border-white/10 relative group">
                                                    <img src={selectedUser.id_card_front_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="ID Front" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <ExternalLink size={20} className="text-white" />
                                                    </div>
                                                </a>
                                            </div>
                                        )}
                                        {selectedUser.id_card_back_url && (
                                            <div className="space-y-1.5">
                                                <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Back ID</p>
                                                <a href={selectedUser.id_card_back_url} target="_blank" rel="noopener noreferrer" className="block aspect-[1.6/1] bg-white/5 rounded-2xl overflow-hidden border border-white/10 relative group">
                                                    <img src={selectedUser.id_card_back_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="ID Back" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <ExternalLink size={20} className="text-white" />
                                                    </div>
                                                </a>
                                            </div>
                                        )}
                                        {selectedUser.selfie_url && (
                                            <div className="col-span-2 space-y-1.5">
                                                <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Biometric Selfie</p>
                                                <a href={selectedUser.selfie_url} target="_blank" rel="noopener noreferrer" className="block h-48 bg-white/5 rounded-2xl overflow-hidden border border-white/10 relative group">
                                                    <img src={selectedUser.selfie_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Selfie" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <ExternalLink size={24} className="text-white" />
                                                    </div>
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Geographical Signal - NEW SECTION */}
                                <div className="space-y-4 pt-6">
                                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
                                        <Globe size={10} /> Geographical Signal
                                    </h3>

                                    <div className="bg-white/5 border border-white/5 p-4 rounded-3xl">
                                        <div className="h-40 w-full rounded-2xl overflow-hidden border border-white/10 mb-4 bg-black/40 relative">
                                            {selectedUser.location_lat && selectedUser.location_lng ? (
                                                <KYCMap lat={selectedUser.location_lat} lng={selectedUser.location_lng} />
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-40">
                                                    <MapPin size={32} className="text-[#8B5CF6]" />
                                                    <span className="text-[8px] font-mono tracking-widest uppercase">GPS_COORD: UNAVAILABLE</span>
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Verification Address</p>
                                        <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                                            <p className="text-xs text-gray-300 leading-relaxed italic">{selectedUser.address || 'Physical address data not present in telemetry.'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Metadata Grid */}
                                <div className="grid grid-cols-1 gap-4 pt-6">
                                    <div className="bg-white/5 border border-white/5 p-5 rounded-3xl shadow-inner shadow-white/5">
                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Phone size={10} /> Communication matrix
                                        </p>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center group/p">
                                                <span className="text-[10px] text-gray-400 group-hover/p:text-white transition-colors">Primary Mobile</span>
                                                <span className="text-sm font-black text-[#8B5CF6] tracking-tighter">{selectedUser.phone || 'NO_DATA'}</span>
                                            </div>
                                            {selectedUser.secondary_phone && (
                                                <div className="flex justify-between items-center group/p">
                                                    <span className="text-[10px] text-gray-400 group-hover/p:text-white transition-colors">Emergency Vector</span>
                                                    <span className="text-sm font-black text-gray-300 tracking-tighter">{selectedUser.secondary_phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <FileText size={10} /> Government ID
                                        </p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-400">Aadhaar</span>
                                            <span className="text-xs font-bold text-[#06B6D4] tracking-widest">{selectedUser.aadhar_number || 'NOT_FOUND'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Activity History Placeholder */}
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-2">Operational Logs</h3>

                                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 opacity-50 italic">
                                        <Loader2 size={16} className="text-[#8B5CF6] animate-pulse" />
                                        <span className="text-[10px] text-gray-600 uppercase tracking-widest">Hydrating Rental History...</span>
                                    </div>
                                </div>

                                {selectedUser.kyc_status === 'PENDING' && (
                                    <div className="pt-6 grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => { handleStatusChange(selectedUser.id, 'REJECTED'); setSelectedUser(null); }}
                                            className="py-4 bg-red-500/10 text-red-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-500/20 transition-all border border-red-500/20"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => { handleStatusChange(selectedUser.id, 'APPROVED'); setSelectedUser(null); }}
                                            className="py-4 bg-[#8B5CF6] text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#7C3AED] transition-all shadow-xl shadow-[#8B5CF6]/20"
                                        >
                                            Approve
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
