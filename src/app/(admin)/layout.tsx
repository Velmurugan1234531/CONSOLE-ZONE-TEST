"use client";

import React, { useEffect, useState, useRef } from "react";
import { Inter } from "next/font/google";
import "../globals.css";
import QueryProvider from "../../providers/QueryProvider";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";
import { VisualsProvider } from "@/context/visuals-context";
import PageBackground from "@/components/layout/PageBackground";

const inter = Inter({ subsets: ["latin"] });

import { AuthProvider, useAuth } from "@/context/AuthContext";

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
    const { user, userDocument, loading, hasAdminAccess, signOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user) {
            router.push(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
        }
    }, [user, loading, router, pathname]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white">
                <Loader2 className="animate-spin text-[#A855F7]" size={32} />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mt-4">Establishing Secure Uplink...</p>
            </div>
        );
    }

    if (!user) return null;

    if (!hasAdminAccess) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#050505] text-white">
                <div className="max-w-md w-full p-8 text-center space-y-6 border border-white/5 rounded-3xl bg-white/[0.02] backdrop-blur-3xl">
                    <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500">
                        <ShieldAlert size={32} />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-black uppercase tracking-tighter italic">NEURAL ACCESS DENIED</h1>
                        <p className="text-gray-500 text-[10px] font-bold uppercase leading-relaxed tracking-wider">
                            Insufficient clearance levels or account restricted.
                            <br />
                            Required: [STAFF_LEVEL_CLEARANCE]
                        </p>
                    </div>
                    <div className="pt-4">
                        <button
                            onClick={() => signOut()}
                            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            Return to Login Portal
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

export default function AdminRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/admin/login";

    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.className} antialiased`}>
                <AuthProvider>
                    <QueryProvider>
                        <VisualsProvider>
                            {isLoginPage ? (
                                children
                            ) : (
                                <AdminAuthGuard>
                                    {children}
                                </AdminAuthGuard>
                            )}
                        </VisualsProvider>
                    </QueryProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
