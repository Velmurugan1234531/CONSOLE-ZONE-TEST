"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FileText, StickyNote, Users, Loader2 } from "lucide-react";
import MyFilesSection from "@/components/dashboard/MyFilesSection";
import MyNotesSection from "@/components/dashboard/MyNotesSection";
import TeamMembersSection from "@/components/dashboard/TeamMembersSection";

type TabType = "files" | "notes" | "team";

export default function DashboardPage() {
    const { user, userDocument, loading } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>("files");
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#A855F7]" size={48} />
            </div>
        );
    }

    if (!user) return null;

    const tabs = [
        { id: "files" as TabType, label: "My Files", icon: FileText },
        { id: "notes" as TabType, label: "My Notes", icon: StickyNote },
        { id: "team" as TabType, label: "Team Members", icon: Users }
    ];

    return (
        <div className="min-h-screen bg-[#050505] font-display">
            {/* Header */}
            <div className="bg-gradient-to-b from-[#0A0A0A] to-transparent border-b border-white/10 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase mb-2">
                            Welcome, <span className="text-[#A855F7]">{userDocument?.fullName || user.displayName || user.email?.split('@')[0] || "User"}</span>
                        </h1>
                        <p className="text-gray-500 text-xs font-black uppercase tracking-[0.2em]">
                            Your Personal Command Center
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                <div className="flex gap-2 border-b border-white/10">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 px-6 py-3 font-black uppercase tracking-[0.2em] text-sm
                                    transition-all relative
                                    ${activeTab === tab.id
                                        ? "text-[#A855F7]"
                                        : "text-gray-500 hover:text-white"
                                    }
                                `}
                            >
                                <Icon size={18} />
                                {tab.label}
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#A855F7]"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="py-8">
                    {activeTab === "files" && <MyFilesSection userId={user.uid} />}
                    {activeTab === "notes" && <MyNotesSection userId={user.uid} />}
                    {activeTab === "team" && <TeamMembersSection />}
                </div>
            </div>
        </div>
    );
}
