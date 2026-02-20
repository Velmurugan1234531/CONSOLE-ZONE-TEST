"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users as UsersIcon, Loader2, User as UserIcon, Mail, Calendar } from "lucide-react";
import { UserDocument } from "@/types/auth";

export default function TeamMembersSection() {
    const [users, setUsers] = useState<UserDocument[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const { db } = await import("@/lib/firebase");
            const { collection, query, orderBy } = await import("firebase/firestore");
            const { safeGetDocs } = await import("@/utils/firebase-utils");

            const usersRef = collection(db, "users");
            const q = query(usersRef, orderBy("createdAt", "desc"));
            const snapshot = await safeGetDocs(q);

            const usersData = snapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data()
            })) as UserDocument[];

            setUsers(usersData);
        } catch (error) {
            console.error("Failed to load users from Firestore:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp: string) => {
        if (!timestamp) return "N/A";
        return new Date(timestamp).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-[#A855F7]" size={32} />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                    Team Members <span className="text-[#A855F7]">({users.length})</span>
                </h2>
                <p className="text-gray-500 text-sm mt-2">
                    View all registered users in the platform
                </p>
            </div>

            {/* Users Grid */}
            {users.length === 0 ? (
                <div className="text-center py-20">
                    <UsersIcon className="mx-auto text-gray-600 mb-4" size={48} />
                    <p className="text-gray-500 font-bold uppercase tracking-wider">No team members yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map((user, index) => (
                        <motion.div
                            key={user.uid}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="
                                bg-white/5 border border-white/10 rounded-xl p-6
                                hover:bg-white/10 hover:border-[#A855F7]/50
                                transition-all
                            "
                        >
                            {/* Avatar */}
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-[#A855F7]/20 border border-[#A855F7]/40 flex items-center justify-center overflow-hidden">
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt={user.fullName || 'User'} className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon className="text-[#A855F7]" size={24} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-white font-bold truncate">
                                        {user.fullName || "Unknown User"}
                                    </h3>
                                    {user.isActive && (
                                        <span className="inline-block px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded text-green-500 text-xs font-bold uppercase mt-1">
                                            Verified
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                    <Mail size={14} />
                                    <span className="truncate">{user.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                    <Calendar size={14} />
                                    <span>Joined {formatDate(user.createdAt)}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
