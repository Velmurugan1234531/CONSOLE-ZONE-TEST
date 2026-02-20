import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function ForbiddenPage() {
    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
            <div className="text-center space-y-6 max-w-md w-full">
                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-red-500/20 animate-pulse">
                    <ShieldAlert size={48} className="text-red-500" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-white tracking-tighter">ACCESS DENIED</h1>
                    <p className="text-gray-400 font-medium">
                        Your neural signature is not authorized for this sector. <br />
                        This incident has been logged.
                    </p>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                    <Link
                        href="/"
                        className="w-full py-3 bg-[#8B5CF6] hover:bg-[#7c3aed] text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-purple-900/20"
                    >
                        Return to Base
                    </Link>
                    <Link
                        href="/login"
                        className="w-full py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-xl transition-all active:scale-95"
                    >
                        Switch Operative
                    </Link>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5">
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest font-mono">
                        ERROR CODE: 403_FORBIDDEN
                    </p>
                </div>
            </div>
        </div>
    );
}
