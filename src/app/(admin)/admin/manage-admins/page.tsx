"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUserRole, AdminUser, UserRole, resetLoginAttempts } from "@/services/admin-auth";
import { logAdminAction } from "@/services/admin-logs";
import { useAuth, useRequireRole } from "@/context/AuthContext";
import { motion } from "framer-motion";
import {
    Users,
    UserPlus,
    Shield,
    Loader2,
    Search,
    AlertCircle,
    UserCheck,
    UserX,
    RefreshCw
} from "lucide-react";

export default function ManageAdminsPage() {
    useRequireRole("admin");
    const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [processing, setProcessing] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            // Get current user
            const userData = await getCurrentUserRole(user.id);
            setCurrentUser(userData);

            // Get all admin users from Supabase
            const { data: admins, error } = await supabase
                .from('users')
                .select('*')
                .in('role', ["super_admin", "admin", "sub_admin", "staff"]);

            if (error) throw error;

            // Map snake_case to camelCase
            const mappedAdmins = admins.map((a: any) => ({
                id: a.id,
                uid: a.id, // compatibility
                email: a.email,
                fullName: a.full_name || a.display_name || "New User",
                role: a.role,
                isActive: a.is_active,
                createdAt: a.created_at,
                createdBy: a.created_by,
                lastLogin: a.last_login,
                lastLoginIP: a.last_login_ip,
                loginAttempts: a.login_attempts,
                emailVerified: a.email_verified,
                metadata: a.metadata
            })) as AdminUser[];

            setAdminUsers(mappedAdmins);
        } catch (error) {
            console.error("Failed to load admins:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (targetUser: AdminUser) => {
        if (!currentUser) return;

        // Only super_admin can toggle active status
        if (currentUser.role !== "super_admin") {
            alert("Only super_admin can enable/disable accounts");
            return;
        }

        // Cannot disable yourself
        if (targetUser.id === currentUser.id) {
            alert("You cannot disable your own account");
            return;
        }

        if (!confirm(`Are you sure you want to ${targetUser.isActive ? "disable" : "enable"} ${targetUser.email}?`)) {
            return;
        }

        setProcessing(targetUser.id);

        try {
            const { error } = await supabase
                .from('users')
                .update({ is_active: !targetUser.isActive })
                .eq('id', targetUser.id);

            if (error) throw error;

            // Log action
            await logAdminAction({
                adminId: currentUser.id,
                adminEmail: currentUser.email,
                action: targetUser.isActive ? "disable_user" : "enable_user",
                targetUserId: targetUser.id,
                targetUserEmail: targetUser.email,
                ipAddress: "client-ip", // In real app, fetch from API or headers
                details: { previousState: targetUser.isActive }
            });

            // Reload data
            await loadData();
        } catch (error) {
            console.error("Failed to toggle user status:", error);
            alert("Failed to update user status");
        } finally {
            setProcessing(null);
        }
    };

    const handleResetAttempts = async (targetUser: AdminUser) => {
        if (!currentUser) return;

        // Only super_admin can reset attempts
        if (currentUser.role !== "super_admin") {
            alert("Only super_admin can reset login attempts");
            return;
        }

        if (!confirm(`Reset login attempts for ${targetUser.email}?`)) {
            return;
        }

        setProcessing(targetUser.id);

        try {
            await resetLoginAttempts(targetUser.id, currentUser.id);

            // Log action
            await logAdminAction({
                adminId: currentUser.id,
                adminEmail: currentUser.email,
                action: "reset_login_attempts",
                targetUserId: targetUser.id,
                targetUserEmail: targetUser.email,
                ipAddress: "client-ip",
                details: { previousAttempts: targetUser.loginAttempts }
            });

            // Reload data
            await loadData();
        } catch (error) {
            console.error("Failed to reset login attempts:", error);
            alert("Failed to reset login attempts");
        } finally {
            setProcessing(null);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case "super_admin":
                return "bg-purple-500/20 border-purple-500/40 text-purple-500";
            case "admin":
                return "bg-blue-500/20 border-blue-500/40 text-blue-500";
            case "sub_admin":
                return "bg-cyan-500/20 border-cyan-500/40 text-cyan-500";
            case "staff":
                return "bg-green-500/20 border-green-500/40 text-green-500";
            default:
                return "bg-gray-500/20 border-gray-500/40 text-gray-500";
        }
    };

    const filteredAdmins = adminUsers.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isSuperAdmin = currentUser?.role === "super_admin";

    return (
        <div className="min-h-screen bg-[#050505] font-display">
            {/* Header */}
            <div className="bg-gradient-to-b from-[#0A0A0A] to-transparent border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-500/20 border border-purple-500/40 rounded-xl">
                                <Users className="text-purple-500" size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">
                                    Manage Admins
                                </h1>
                                <p className="text-gray-500 text-xs font-black uppercase tracking-[0.2em]">
                                    Admin Account Management
                                </p>
                            </div>
                        </div>

                        {isSuperAdmin && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-2">
                                <p className="text-yellow-500 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    Create via Supabase Auth
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Info alert for Cloud Functions */}
                {isSuperAdmin && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-6 bg-blue-500/10 border border-blue-500/30 rounded-xl"
                    >
                        <div className="flex items-start gap-3">
                            <Shield className="text-blue-500 flex-shrink-0 mt-1" size={24} />
                            <div>
                                <h3 className="text-blue-500 font-black uppercase tracking-tight mb-2">Admin Creation via Supabase Auth</h3>
                                <p className="text-gray-400 text-sm mb-3">
                                    Admin accounts should be created via Supabase Invite functionality or by signing up and elevating role via database.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Search */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by email, name, or role..."
                            className="
                  w-full bg-white/5 border border-white/10 rounded-xl
                  py-3 pl-12 pr-4 text-white placeholder:text-gray-600
                  focus:outline-none focus:border-[#A855F7]/50
                  transition-all
                "
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total Admins</p>
                        <p className="text-white font-black text-2xl">{adminUsers.length}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Active</p>
                        <p className="text-green-500 font-black text-2xl">{adminUsers.filter(u => u.isActive).length}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Disabled</p>
                        <p className="text-red-500 font-black text-2xl">{adminUsers.filter(u => !u.isActive).length}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Locked Out</p>
                        <p className="text-yellow-500 font-black text-2xl">{adminUsers.filter(u => u.loginAttempts >= 5).length}</p>
                    </div>
                </div>

                {/* Admin list */}
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <Loader2 className="animate-spin text-[#A855F7] mx-auto mb-3" size={32} />
                            <p className="text-gray-500 font-bold uppercase tracking-wider text-sm">Loading admins...</p>
                        </div>
                    ) : filteredAdmins.length === 0 ? (
                        <div className="p-12 text-center">
                            <Users className="text-gray-600 mx-auto mb-3" size={48} />
                            <p className="text-gray-500 font-bold uppercase tracking-wider text-sm">No admins found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/10">
                            {filteredAdmins.map((user, index) => (
                                <motion.div
                                    key={user.uid}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="p-5 hover:bg-white/5 transition-all"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-white font-bold">{user.fullName}</h3>
                                                <span className={`px-3 py-1 rounded-lg border text-xs font-bold uppercase tracking-wider ${getRoleBadgeColor(user.role)}`}>
                                                    {user.role.replace("_", " ")}
                                                </span>
                                                {!user.isActive && (
                                                    <span className="px-3 py-1 rounded-lg border text-xs font-bold uppercase tracking-wider bg-red-500/20 border-red-500/40 text-red-500">
                                                        Disabled
                                                    </span>
                                                )}
                                                {user.loginAttempts >= 5 && (
                                                    <span className="px-3 py-1 rounded-lg border text-xs font-bold uppercase tracking-wider bg-yellow-500/20 border-yellow-500/40 text-yellow-500">
                                                        Locked
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-gray-500 text-sm">{user.email}</p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                                                <span>Failed Attempts: <span className="text-white font-bold">{user.loginAttempts}</span></span>
                                                <span>Last IP: <span className="text-white font-mono">{user.lastLoginIP || "N/A"}</span></span>
                                            </div>
                                        </div>

                                        {/* Actions (super_admin only) */}
                                        {isSuperAdmin && user.uid !== currentUser?.uid && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleToggleActive(user)}
                                                    disabled={processing === user.uid}
                                                    className={`
                               flex items-center gap-2 px-4 py-2 rounded-lg border font-bold text-xs uppercase tracking-wider transition-all
                               disabled:opacity-50 disabled:cursor-not-allowed
                               ${user.isActive
                                                            ? "bg-red-500/20 hover:bg-red-500/30 border-red-500/30 text-red-500"
                                                            : "bg-green-500/20 hover:bg-green-500/30 border-green-500/30 text-green-500"
                                                        }
                             `}
                                                >
                                                    {processing === user.uid ? (
                                                        <Loader2 className="animate-spin" size={14} />
                                                    ) : user.isActive ? (
                                                        <UserX size={14} />
                                                    ) : (
                                                        <UserCheck size={14} />
                                                    )}
                                                    {user.isActive ? "Disable" : "Enable"}
                                                </button>

                                                {user.loginAttempts > 0 && (
                                                    <button
                                                        onClick={() => handleResetAttempts(user)}
                                                        disabled={processing === user.uid}
                                                        className="
                                 flex items-center gap-2 px-4 py-2 rounded-lg border font-bold text-xs uppercase tracking-wider transition-all
                                 bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30 text-blue-500
                                 disabled:opacity-50 disabled:cursor-not-allowed
                               "
                                                    >
                                                        <RefreshCw size={14} />
                                                        Reset
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
