"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ClipboardList } from "lucide-react";

export default function AdminServiceRequestsPage() {
    const router = useRouter();

    useEffect(() => {
        // Auto-redirect after 2 seconds
        const timer = setTimeout(() => {
            router.push("/admin/services?tab=requests");
        }, 2000);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 flex items-center justify-center min-h-[60vh]">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-12 text-center max-w-2xl">
                <div className="w-16 h-16 bg-[#06B6D4]/10 rounded-full flex items-center justify-center text-[#06B6D4] mx-auto mb-6">
                    <ClipboardList size={32} />
                </div>

                <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-4">
                    Service Requests <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6]">Moved</span>
                </h1>

                <p className="text-gray-400 mb-8 leading-relaxed">
                    Service Requests have been merged into the Services Management page for a unified experience.
                    You'll be automatically redirected in a moment.
                </p>

                <button
                    onClick={() => router.push("/admin/services?tab=requests")}
                    className="inline-flex items-center gap-2 bg-[#06B6D4] text-black font-bold px-6 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all"
                >
                    Go to Services Management <ArrowRight size={18} />
                </button>

                <p className="text-gray-600 text-xs mt-6 font-mono">
                    Redirecting in 2 seconds...
                </p>
            </div>
        </div>
    );
}
