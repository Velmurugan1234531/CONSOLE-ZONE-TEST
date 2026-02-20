"use client";

import { useState } from "react";
import { Users, Mail, Lock, User, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AddUserPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState("");

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        role: "customer"
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus('idle');
        setErrorMessage("");

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to create user");
            }

            // Mock Persistence for Demo Mode
            if (data.user && data.user.id.startsWith('demo-user-')) {
                const storedUsers = localStorage.getItem('DEMO_ADDED_USERS');
                const users = storedUsers ? JSON.parse(storedUsers) : [];
                users.push({
                    ...data.user,
                    full_name: formData.fullName, // Ensure profile fields are mapped
                    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.fullName.replace(' ', '')}`,
                    trust_score: 95,
                    kyc_status: 'APPROVED'
                });
                localStorage.setItem('DEMO_ADDED_USERS', JSON.stringify(users));
            }

            setStatus('success');
            setTimeout(() => {
                router.push('/admin/users');
            }, 2000);
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen text-white bg-[#050505] p-6 lg:p-12">
            <div className="max-w-2xl mx-auto">
                <Link href="/admin" className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors">
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </Link>

                <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#8B5CF6]/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-[#8B5CF6]/20 rounded-xl flex items-center justify-center border border-[#8B5CF6]/20">
                                <Users size={24} className="text-[#8B5CF6]" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black uppercase tracking-tighter">Add User</h1>
                                <p className="text-gray-400">Create a new account manually</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        type="text"
                                        required
                                        placeholder="John Doe"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:border-[#8B5CF6] outline-none transition-all placeholder:text-gray-600 font-bold"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        type="email"
                                        required
                                        placeholder="user@example.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:border-[#8B5CF6] outline-none transition-all placeholder:text-gray-600 font-bold"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        minLength={6}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:border-[#8B5CF6] outline-none transition-all placeholder:text-gray-600 font-bold"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Security Tier</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'customer' })}
                                        className={`relative p-4 rounded-xl border text-left transition-all group overflow-hidden ${formData.role === 'customer'
                                            ? 'bg-[#10B981]/10 border-[#10B981] shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <div className={`absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity ${formData.role === 'customer' ? 'text-[#10B981]' : 'text-gray-500'}`}>
                                            <CheckCircle2 size={40} />
                                        </div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`p-2 rounded-lg ${formData.role === 'customer' ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-gray-800 text-gray-400'}`}>
                                                <User size={20} />
                                            </div>
                                            <span className={`font-black uppercase tracking-wider text-sm ${formData.role === 'customer' ? 'text-white' : 'text-gray-400'}`}>Standard Client</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-medium leading-relaxed pr-8">
                                            Regular user account with access to renting, buying, and selling. No administrative privileges.
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'admin' })}
                                        className={`relative p-4 rounded-xl border text-left transition-all group overflow-hidden ${formData.role === 'admin'
                                            ? 'bg-red-500/10 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                                            : 'bg-white/5 border-white/10 hover:bg-red-500/5 hover:border-red-500/30'
                                            }`}
                                    >
                                        <div className={`absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity ${formData.role === 'admin' ? 'text-red-500' : 'text-gray-500'}`}>
                                            <Shield size={40} />
                                        </div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`p-2 rounded-lg ${formData.role === 'admin' ? 'bg-red-500/20 text-red-500' : 'bg-gray-800 text-gray-400'}`}>
                                                <Lock size={20} />
                                            </div>
                                            <span className={`font-black uppercase tracking-wider text-sm ${formData.role === 'admin' ? 'text-white' : 'text-gray-400'}`}>Admin Access</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-medium leading-relaxed pr-8">
                                            <span className="text-red-400 font-bold block mb-1">⚠️ HIGH CLEARANCE</span>
                                            Full access to dashboard, user management, and system configuration.
                                        </p>
                                    </button>
                                </div>
                            </div>

                            {status === 'error' && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-500 text-sm font-bold">
                                    <AlertCircle size={20} />
                                    {errorMessage}
                                </div>
                            )}

                            {status === 'success' && (
                                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3 text-green-500 text-sm font-bold">
                                    <CheckCircle2 size={20} />
                                    User created successfully! Redirecting...
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || status === 'success'}
                                className="w-full bg-white text-black font-black uppercase tracking-wider py-4 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : "Create User Assessment"}
                            </button>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
