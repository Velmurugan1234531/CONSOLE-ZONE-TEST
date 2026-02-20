"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, LogOut, User, Mail, Shield, Gamepad2, Zap, TrendingUp, Calendar, Package, Wrench, DollarSign, CheckCircle2, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import PageHero from "@/components/layout/PageHero";
import { useVisuals } from "@/context/visuals-context";
import { getUserRentals } from "@/services/rentals";
import { getUserServiceBookings } from "@/services/service-booking";
import { getUserTradeInRequests } from "@/services/tradeins";
import { getUserSales } from "@/services/sales";
import KYCForm from "@/components/KYCForm";
import { format } from "date-fns";
import { safeGetDoc } from "@/utils/firebase-utils";

export default function ProfilePage() {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [rentals, setRentals] = useState<any[]>([]);
    const [serviceBookings, setServiceBookings] = useState<any[]>([]);
    const [tradeIns, setTradeIns] = useState<any[]>([]);
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'transactions' | 'kyc'>('overview');

    const router = useRouter();
    const { settings } = useVisuals();

    useEffect(() => {
        const fetchUserData = async (uid: string) => {
            try {
                // Fetch Profile from Firestore
                const userDocRef = doc(db, "users", uid);
                const userSnap = await safeGetDoc(userDocRef);

                if (userSnap.exists()) {
                    setProfile(userSnap.data());
                } else {
                    setProfile({ kyc_status: 'NOT_SUBMITTED', neural_sync_xp: 0 });
                }

                const [rentalData, serviceData, tradeInData, salesData] = await Promise.all([
                    getUserRentals(uid).catch(err => {
                        console.error("Profile: Failed to load rentals", err);
                        return [];
                    }),
                    getUserServiceBookings(uid).catch(err => {
                        console.error("Profile: Failed to load service bookings", err);
                        return [];
                    }),
                    getUserTradeInRequests(uid).catch(err => {
                        console.error("Profile: Failed to load trade-ins", err);
                        return [];
                    }),
                    getUserSales(uid).catch(err => {
                        console.error("Profile: Failed to load sales", err);
                        return [];
                    })
                ]);

                setRentals(rentalData);
                setServiceBookings(serviceData);
                setTradeIns(tradeInData);
                setSales(salesData);
            } catch (e) {
                console.error("Profile: Critical error in data loading sequence", e);
            } finally {
                setLoading(false);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                fetchUserData(currentUser.uid);
            } else {
                const demoUser = localStorage.getItem('DEMO_USER_SESSION');
                if (demoUser) {
                    const parsed = JSON.parse(demoUser);
                    setUser(parsed);
                    setProfile({ kyc_status: 'APPROVED', neural_sync_xp: 750 });
                    fetchUserData(parsed.id || parsed.uid || 'demo-user-123');
                } else {
                    router.push("/login");
                }
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleSignOut = async () => {
        setLoading(true);
        try {
            await signOut(auth);
            localStorage.removeItem('DEMO_USER_SESSION');
            router.push("/");
            router.refresh();
        } catch (error) {
            console.error("Logout error:", error);
            setLoading(false);
        }
    };

    if (loading && !user) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#A855F7]" size={40} />
            </div>
        );
    }

    const activeRentals = rentals.filter(r => ['active', 'overdue', 'shipped'].includes(r.status));
    const totalSpent = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const totalEarned = tradeIns.filter(t => t.status === 'approved').reduce((sum, t) => sum + (t.offered_credit || 0), 0);

    return (
        <div className="min-h-screen bg-[#050505] font-display">
            <PageHero
                title="MY PROFILE"
                subtitle="Account Dashboard & Activity"
                images={settings?.pageBackgrounds?.profile || []}
                height="60vh"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-20 pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-[#A855F7] to-[#7C3AED] rounded-3xl p-8 mb-8 shadow-2xl shadow-purple-500/20"
                >
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white/20 shadow-xl shrink-0">
                            {user?.photoURL || (user as any)?.user_metadata?.avatar_url ? (
                                <img src={user?.photoURL || (user as any)?.user_metadata?.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                    <User size={40} className="text-white/60" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-3xl font-black text-white mb-2">
                                {user?.displayName || (user as any)?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Gamer'}
                            </h1>
                            <p className="text-white/80 text-sm mb-4">{user?.email}</p>

                            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                {profile?.kyc_status === 'APPROVED' ? (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                                        <Shield size={16} className="text-emerald-400" />
                                        <span className="text-xs font-bold text-white uppercase tracking-wide">Verified</span>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setActiveTab('kyc')}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full border border-white/20 transition-all"
                                    >
                                        <Shield size={16} className="text-yellow-400" />
                                        <span className="text-xs font-bold text-white uppercase tracking-wide">
                                            {profile?.kyc_status === 'PENDING' ? 'Verification Pending' : 'Complete KYC'}
                                        </span>
                                    </button>
                                )}

                                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                                    <Zap size={16} className="text-yellow-400" />
                                    <span className="text-xs font-bold text-white uppercase tracking-wide">{profile?.neural_sync_xp || (profile as any)?.xp || 0} XP</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSignOut}
                            className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl border border-white/20 text-white font-bold text-sm flex items-center gap-2 transition-all"
                        >
                            <LogOut size={18} />
                            Sign Out
                        </button>
                    </div>
                </motion.div>

                <div className="mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <Gamepad2 size={20} className="text-purple-500" />
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Active Rentals</span>
                        </div>
                        <p className="text-3xl font-black text-white">{activeRentals.length}</p>
                    </motion.div>
                </div>

                <div className="flex gap-2 mb-6 bg-[#0a0a0a] border border-white/10 rounded-2xl p-2">
                    {(['overview', 'activity', 'transactions', 'kyc'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 px-6 rounded-xl font-bold uppercase text-sm tracking-wide transition-all ${activeTab === tab
                                ? 'bg-[#A855F7] text-white shadow-lg shadow-purple-500/20'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                                <h2 className="text-xl font-black text-white mb-4 uppercase tracking-tight flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Active Rentals
                                </h2>
                                {activeRentals.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No active rentals</p>
                                ) : (
                                    <div className="space-y-4">
                                        {activeRentals.map((rental) => (
                                            <div key={rental.id} className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:bg-white/10 transition-all">
                                                <img
                                                    src={rental.product?.image || rental.product?.images?.[0] || "/images/products/ps5.png"}
                                                    className="w-16 h-16 rounded-lg object-cover"
                                                />
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-white">{rental.product?.name}</h3>
                                                    <p className="text-xs text-gray-400">
                                                        {rental.start_date && format(new Date(rental.start_date), 'MMM dd')} - {rental.end_date && format(new Date(rental.end_date), 'MMM dd')}
                                                    </p>
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${rental.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                                                    rental.status === 'overdue' ? 'bg-red-500/10 text-red-500' :
                                                        'bg-blue-500/10 text-blue-500'
                                                    }`}>
                                                    {rental.status}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'activity' && (
                        <motion.div
                            key="activity"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6"
                        >
                            <h2 className="text-lg font-black text-white mb-4 uppercase tracking-tight flex items-center gap-2">
                                <Wrench size={18} className="text-cyan-500" />
                                Active Services
                            </h2>
                            {serviceBookings.length === 0 ? (
                                <p className="text-gray-500 text-center py-8 text-sm">No services booked</p>
                            ) : (
                                <div className="space-y-3">
                                    {serviceBookings.slice(0, 5).map((svc) => (
                                        <div key={svc.id} className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                                            <div>
                                                <h4 className="font-bold text-white text-sm mb-1">{svc.service_type}</h4>
                                                <p className="text-xs text-gray-400">{svc.console_model} • {svc.created_at && format(new Date(svc.created_at), 'MMM dd, yyyy')}</p>
                                            </div>
                                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${svc.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-500' :
                                                svc.status === 'Cancelled' ? 'bg-red-500/20 text-red-500' :
                                                    'bg-orange-500/20 text-orange-500'
                                                }`}>{svc.status}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'transactions' && (
                        <motion.div
                            key="transactions"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid md:grid-cols-2 gap-6"
                        >
                            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                                <h2 className="text-lg font-black text-white mb-4 uppercase tracking-tight flex items-center gap-2">
                                    <Package size={18} className="text-purple-500" />
                                    Purchases
                                </h2>
                                {sales.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8 text-sm">No purchases yet</p>
                                ) : (
                                    <div className="space-y-3">
                                        {sales.map((sale) => (
                                            <div key={sale.id} className="bg-white/5 rounded-lg p-3">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-bold text-white text-sm">{sale.items?.[0]?.product_name || "Product"}</h4>
                                                    <span className="text-xs font-bold text-white">₹{(sale.total_amount || 0).toLocaleString()}</span>
                                                </div>
                                                <p className="text-xs text-gray-400">{sale.date && format(new Date(sale.date), 'MMM dd, yyyy')}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                                <h2 className="text-lg font-black text-white mb-4 uppercase tracking-tight flex items-center gap-2">
                                    <TrendingUp size={18} className="text-yellow-500" />
                                    Trade-Ins
                                </h2>
                                {tradeIns.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8 text-sm">No trade-ins yet</p>
                                ) : (
                                    <div className="space-y-3">
                                        {tradeIns.map((trade) => (
                                            <div key={trade.id} className="bg-white/5 rounded-lg p-3">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-bold text-white text-sm">{trade.item_name}</h4>
                                                    <span className="text-xs font-bold text-yellow-500">+₹{(trade.offered_credit || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <p className="text-xs text-gray-400">{trade.created_at && format(new Date(trade.created_at), 'MMM dd, yyyy')}</p>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${trade.status === 'approved' ? 'bg-emerald-500/20 text-emerald-500' :
                                                        trade.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                                                            'bg-orange-500/20 text-orange-500'
                                                        }`}>{trade.status}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'kyc' && (
                        <motion.div
                            key="kyc"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8"
                        >
                            <div className="max-w-2xl mx-auto">
                                <div className="mb-6 text-center">
                                    <Shield size={48} className={`mx-auto mb-4 ${profile?.kyc_status === 'APPROVED' ? 'text-emerald-500' :
                                        profile?.kyc_status === 'PENDING' ? 'text-yellow-500' :
                                            profile?.kyc_status === 'REJECTED' ? 'text-red-500' :
                                                'text-gray-500'
                                        }`} />
                                    <h2 className="text-2xl font-black text-white mb-2">KYC Verification</h2>

                                    {profile?.kyc_status === 'APPROVED' && (
                                        <div className="flex items-center justify-center gap-2 mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                            <CheckCircle2 size={20} className="text-emerald-500" />
                                            <span className="text-emerald-500 font-bold">Your account is verified!</span>
                                        </div>
                                    )}

                                    {profile?.kyc_status === 'PENDING' && (
                                        <div className="flex items-center justify-center gap-2 mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                                            <Clock size={20} className="text-yellow-500" />
                                            <span className="text-yellow-500 font-bold">Verification pending review</span>
                                        </div>
                                    )}

                                    {profile?.kyc_status === 'REJECTED' && (
                                        <div className="flex items-center justify-center gap-2 mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                            <XCircle size={20} className="text-red-500" />
                                            <span className="text-red-500 font-bold">Verification rejected. Please resubmit.</span>
                                        </div>
                                    )}

                                    {(!profile?.kyc_status || profile.kyc_status === 'NOT_SUBMITTED') && (
                                        <p className="text-gray-400 text-sm">Complete verification to unlock full access</p>
                                    )}
                                </div>

                                {(!profile?.kyc_status || profile.kyc_status === 'NOT_SUBMITTED' || profile.kyc_status === 'REJECTED') && (
                                    <KYCForm onSuccess={() => {
                                        setProfile({ ...profile, kyc_status: 'PENDING' });
                                        alert("KYC Submitted Successfully! We'll review it shortly.");
                                    }} />
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
