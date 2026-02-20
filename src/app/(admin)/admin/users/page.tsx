"use client";

import { Users, Search, MoreHorizontal, Mail, Calendar, Shield, X, ChevronRight, ShoppingBag, Monitor, Banknote, Plus, CheckCircle2, Lock } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getUsers } from "@/services/admin";
import { User } from "@/lib/schemas";

export default function UsersPage() {
    const [selectedUser, setSelectedUser] = useState<string | null>(null);

    const { data: users = [], isLoading } = useQuery<User[]>({
        queryKey: ['adminUsers'],
        queryFn: getUsers
    });

    const activeUser = users.find((u: User) => u.id === selectedUser);

    // Mock history data - in a real app this would be another query
    const history = {
        rentals: [
            { id: "RNT-101", product: "PS5 Console", date: "Jan 10 - Jan 17", status: "Returned", cost: "₹3,500" },
            { id: "RNT-102", product: "Meta Quest 2", date: "Dec 15 - Dec 20", status: "Returned", cost: "₹2,000" }
        ],
        sales: [
            { id: "ORD-552", product: "PS5 Controller", date: "Jan 05, 2024", status: "Delivered", cost: "₹5,400" }
        ],
        selling: [
            { id: "SEL-001", product: "Old Xbox One", date: "Nov 20, 2023", status: "Sold to Us", cost: "₹8,000 (Payout)" }
        ]
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#10B981]"></div>
            </div>
        );
    }

    return (
        <div className="flex gap-6 min-h-screen animate-in fade-in duration-500">
            {/* Main User List */}
            <div className={`flex-1 transition-all duration-300 ${selectedUser ? 'w-2/3' : 'w-full'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-l-4 border-[#10B981] pl-6">
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-1 font-display">
                            User <span className="text-[#10B981]">Database</span>
                        </h1>
                        <p className="text-gray-400 font-mono text-xs tracking-widest uppercase">
                            Manage Accounts & Permissions
                        </p>
                    </div>
                    <Link
                        href="/admin/users/add"
                        className="bg-[#10B981] text-black px-6 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-[#059669] transition-all flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Add User
                    </Link>
                </div>

                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-[#050505] text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5">
                            <tr>
                                <th className="p-4 pl-6">User Profile</th>
                                <th className="p-4 hidden md:table-cell">Contact</th>
                                <th className="p-4 hidden md:table-cell">Role</th>
                                <th className="p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map((user: User) => (
                                <tr
                                    key={user.id}
                                    className={`group hover:bg-white/[0.02] transition-colors cursor-pointer ${selectedUser === user.id ? 'bg-white/[0.05]' : ''}`}
                                    onClick={() => setSelectedUser(user.id)}
                                >
                                    <td className="p-4 pl-6">
                                        <div className="flex items-center gap-3">
                                            {user.avatar_url ? (
                                                <img src={user.avatar_url} alt={user.full_name} className="w-10 h-10 rounded-full object-cover border border-white/10 group-hover:border-[#10B981] transition-colors" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-white/10 text-gray-500 font-bold">
                                                    {user.full_name?.charAt(0) || 'U'}
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="text-white font-bold text-sm">{user.full_name || 'Anonymous User'}</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${(user.trust_score || 0) > 90 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : (user.trust_score || 0) > 70 ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>TRUST {user.trust_score || 0}%</span>
                                                    <span className="text-[10px] text-gray-500 font-bold md:hidden">{user.role}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 hidden md:table-cell text-sm text-gray-400">{user.email}</td>
                                    <td className="p-4 hidden md:table-cell">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${user.role === 'admin' ? 'bg-orange-500/10 text-orange-500' : 'bg-gray-800 text-gray-400'
                                            }`}>{user.role}</span>
                                    </td>
                                    <td className="p-4">
                                        <button className="text-xs font-bold text-[#10B981] flex items-center gap-1 hover:gap-2 transition-all">
                                            VIEW <ChevronRight size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detailed Side Panel */}
            {selectedUser && (
                <div className="w-96 bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 fixed right-8 top-28 bottom-8 overflow-y-auto animate-in slide-in-from-right duration-300 shadow-2xl z-50">
                    <button
                        onClick={(e) => { e.stopPropagation(); setSelectedUser(null); }}
                        className="absolute right-4 top-4 text-gray-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="text-center mb-8">
                        <div className="w-24 h-24 rounded-full p-1 border-2 border-[#10B981] mx-auto mb-4 relative">
                            {activeUser?.avatar_url ? (
                                <img
                                    src={activeUser.avatar_url}
                                    className="w-full h-full rounded-full object-cover"
                                    alt="Profile"
                                />
                            ) : (
                                <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-3xl font-bold text-gray-600">
                                    {activeUser?.full_name?.charAt(0) || 'U'}
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 bg-[#10B981] p-1.5 rounded-full border-2 border-[#0a0a0a]">
                                <Shield size={12} className="text-black" />
                            </div>
                        </div>
                        <h2 className="text-xl font-black text-white uppercase">{activeUser?.full_name}</h2>
                        <p className="text-gray-400 text-sm mb-4">{activeUser?.email}</p>

                        {/* Trust Matrix Summary */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Trust Index</span>
                                <span className={`text-sm font-black ${(activeUser?.trust_score || 0) > 90 ? 'text-emerald-500' : 'text-blue-500'}`}>{activeUser?.trust_score || 0}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-black rounded-full overflow-hidden mb-4">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${activeUser?.trust_score || 0}%` }}
                                    className={`h-full ${(activeUser?.trust_score || 0) > 90 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-left bg-black/40 p-2 rounded-lg">
                                    <p className="text-[8px] font-black text-gray-600 uppercase">Payments</p>
                                    <p className="text-[10px] font-bold text-emerald-500">EXCELLENT</p>
                                </div>
                                <div className="text-left bg-black/40 p-2 rounded-lg">
                                    <p className="text-[8px] font-black text-gray-600 uppercase">Handling</p>
                                    <p className="text-[10px] font-bold text-blue-400">GOOD</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center gap-2 mt-4">
                            <span className="bg-[#10B981]/10 text-[#10B981] text-[10px] font-bold px-3 py-1 rounded-full border border-[#10B981]/20">
                                {activeUser?.kyc_status === 'APPROVED' ? 'VERIFIED' : 'PENDING KYC'}
                            </span>
                            <span className="bg-white/5 text-gray-400 text-[10px] font-bold px-3 py-1 rounded-full border border-white/10">ID: #{activeUser?.id.slice(0, 8)}</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Rental History */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Monitor size={14} className="text-[#8B5CF6]" /> Rental History
                            </h3>
                            <div className="space-y-2">
                                {history.rentals.map((item, i) => (
                                    <div key={i} className="bg-white/5 p-3 rounded-xl border border-white/5 text-sm">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-white font-medium">{item.product}</span>
                                            <span className="text-[#8B5CF6] font-bold text-xs">{item.cost}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-gray-500">
                                            <span>{item.date}</span>
                                            <span className="text-green-500">{item.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Order History */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <ShoppingBag size={14} className="text-[#3B82F6]" /> Purchases
                            </h3>
                            <div className="space-y-2">
                                {history.sales.map((item, i) => (
                                    <div key={i} className="bg-white/5 p-3 rounded-xl border border-white/5 text-sm">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-white font-medium">{item.product}</span>
                                            <span className="text-[#3B82F6] font-bold text-xs">{item.cost}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-gray-500">
                                            <span>{item.date}</span>
                                            <span>{item.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Selling History */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Banknote size={14} className="text-[#F59E0B]" /> Selling Assets
                            </h3>
                            <div className="space-y-2">
                                {history.selling.map((item, i) => (
                                    <div key={i} className="bg-white/5 p-3 rounded-xl border border-white/5 text-sm">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-white font-medium">{item.product}</span>
                                            <span className="text-[#F59E0B] font-bold text-xs">{item.cost}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-gray-500">
                                            <span>{item.date}</span>
                                            <span>{item.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Security Profile - Explicit Access Check */}
                        <div className={`mt-6 p-4 rounded-xl border ${activeUser?.role === 'admin' ? 'bg-orange-500/10 border-orange-500/20' : 'bg-red-500/5 border-red-500/10'}`}>
                            <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${activeUser?.role === 'admin' ? 'text-orange-400' : 'text-red-400'}`}>
                                <Shield size={14} /> Security Profile
                            </h3>
                            <div className="bg-[#050505]/50 rounded-lg p-3 space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-500 font-bold">Access Level</span>
                                    <span className={`font-black uppercase tracking-wider ${activeUser?.role === 'admin' ? 'text-orange-500' : 'text-white'}`}>
                                        {activeUser?.role === 'admin' ? 'ADMINISTRATOR' : 'STANDARD CLIENT'}
                                    </span>
                                </div>
                                <div className="h-px bg-white/5 w-full my-1" />
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-500 font-bold">Admin Panel Access</span>
                                    {activeUser?.role === 'admin' ? (
                                        <span className="flex items-center gap-1.5 text-orange-500 font-bold bg-orange-500/10 px-2 py-0.5 rounded text-[10px]">
                                            <CheckCircle2 size={10} /> GRANTED
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-gray-500 font-bold bg-white/5 px-2 py-0.5 rounded text-[10px]">
                                            <Lock size={10} /> RESTRICTED
                                        </span>
                                    )}
                                </div>
                            </div>
                            {activeUser?.role !== 'admin' && (
                                <p className="text-[10px] text-gray-500 mt-2 italic text-center">
                                    This user cannot access administrative controls.
                                </p>
                            )}
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
