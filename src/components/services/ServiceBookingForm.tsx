"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Check, ChevronRight, Cpu, User, Wrench, AlertTriangle, Loader2 } from "lucide-react";
import { ServiceItem } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { createServiceBooking } from "@/services/service-booking";
import { useRouter } from "next/navigation";

interface ServiceBookingFormProps {
    preselectedServiceId?: string;
    services: ServiceItem[];
}

export default function ServiceBookingForm({ preselectedServiceId, services }: ServiceBookingFormProps) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();

    const [formData, setFormData] = useState({
        serviceId: preselectedServiceId || "",
        deviceModel: "",
        serialNumber: "",
        issueDescription: "",
        date: "",
        contactName: "",
        contactPhone: "",
        contactEmail: ""
    });

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (currentUser) {
                setUser(currentUser);

                // Fetch Profile from Supabase
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', currentUser.id)
                    .single();

                if (profile) {
                    setFormData(prev => ({
                        ...prev,
                        contactName: profile.full_name || "",
                        contactEmail: profile.email || currentUser.email || "",
                        contactPhone: profile.phone || ""
                    }));
                }
            }
        };

        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                setUser(session.user);
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profile) {
                    setFormData(prev => ({
                        ...prev,
                        contactName: profile.full_name || "",
                        contactEmail: profile.email || session.user.email || "",
                        contactPhone: profile.phone || ""
                    }));
                }
            } else {
                setUser(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            if (!user) {
                // Formatting data for guest if needed, currently we assume login or guest flow is handled by service
            }

            const bookingData: any = {
                user_id: user?.id || null, // Supabase uses 'id' not 'uid'
                service_id: formData.serviceId,
                device_model: formData.deviceModel,
                serial_number: formData.serialNumber,
                issue_description: formData.issueDescription,
                preferred_date: formData.date,
                status: 'Pending',
                contact_phone: formData.contactPhone,
                contact_name: formData.contactName,
                contact_email: formData.contactEmail
            };

            await createServiceBooking(bookingData);
            setStep(5); // Success Step
        } catch (error: any) {
            console.error("Booking failed:", error);
            const errorMessage = error.message || "Unknown error";
            alert(`Failed to submit booking: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const steps = [
        { id: 1, title: "Choose Service", icon: Wrench },
        { id: 2, title: "Device Details", icon: Cpu },
        { id: 3, title: "Schedule", icon: Calendar },
        { id: 4, title: "Contact Info", icon: User },
    ];

    return (
        <div className="w-full max-w-4xl mx-auto bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[600px]">
            {/* Sidebar Steps */}
            <div className="w-full md:w-1/3 bg-white/5 p-8 border-b md:border-b-0 md:border-r border-white/10">
                <h2 className="text-2xl font-black text-white italic tracking-tighter mb-8">
                    BOOKING <span className="text-[#06B6D4]">PROTOCOL</span>
                </h2>
                <div className="space-y-6">
                    {steps.map((s, i) => (
                        <div key={s.id} className={`flex items-center gap-4 ${step === s.id ? 'opacity-100' : 'opacity-40'} transition-opacity`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${step === s.id ? 'bg-[#06B6D4] border-[#06B6D4] text-black' : step > s.id ? 'bg-green-500 border-green-500 text-black' : 'border-white/20 text-white'}`}>
                                {step > s.id ? <Check size={20} /> : <s.icon size={20} />}
                            </div>
                            <div>
                                <div className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">Step 0{s.id}</div>
                                <div className="text-sm font-bold text-white">{s.title}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Form Area */}
            <div className="flex-1 p-8 md:p-12 relative">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col">
                            <h3 className="text-xl font-bold text-white mb-6">Select a Service Package</h3>
                            <div className="grid gap-4 overflow-y-auto max-h-[400px] pr-2">
                                {services.map(service => (
                                    <button
                                        key={service.id}
                                        onClick={() => setFormData({ ...formData, serviceId: service.id })}
                                        className={`p-4 rounded-xl border text-left transition-all ${formData.serviceId === service.id ? 'bg-[#06B6D4]/10 border-[#06B6D4]' : 'bg-white/5 border-white/10 hover:border-white/30'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-white">{service.name}</span>
                                            <span className="text-[#06B6D4] font-mono">₹{service.price}</span>
                                        </div>
                                        <p className="text-sm text-gray-400 line-clamp-2">{service.description}</p>
                                    </button>
                                ))}
                            </div>
                            <button
                                disabled={!formData.serviceId}
                                onClick={nextStep}
                                className="mt-auto w-full py-4 bg-[#06B6D4] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0891b2] text-black font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                Next Step <ChevronRight size={18} />
                            </button>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col">
                            <h3 className="text-xl font-bold text-white mb-6">Device Diagnostics</h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs uppercase font-bold text-gray-500 block mb-2">Console Model</label>
                                    <select
                                        value={formData.deviceModel}
                                        onChange={(e) => setFormData({ ...formData, deviceModel: e.target.value })}
                                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#06B6D4] outline-none"
                                    >
                                        <option value="">Select Console...</option>
                                        <option value="PS5">PlayStation 5</option>
                                        <option value="PS4">PlayStation 4 / Pro</option>
                                        <option value="Xbox Series X">Xbox Series X</option>
                                        <option value="Xbox Series S">Xbox Series S</option>
                                        <option value="Switch">Nintendo Switch</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs uppercase font-bold text-gray-500 block mb-2">Serial Number (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.serialNumber}
                                        onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#06B6D4] outline-none"
                                        placeholder="Found on the back of device"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs uppercase font-bold text-gray-500 block mb-2">Issue Description</label>
                                    <textarea
                                        value={formData.issueDescription}
                                        onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#06B6D4] outline-none h-32 resize-none"
                                        placeholder="Please describe the problem you're experiencing..."
                                    />
                                </div>
                            </div>
                            <div className="mt-auto flex gap-4">
                                <button onClick={prevStep} className="px-6 py-4 rounded-xl border border-white/10 text-white hover:bg-white/5 font-bold">Back</button>
                                <button
                                    disabled={!formData.deviceModel || !formData.issueDescription}
                                    onClick={nextStep}
                                    className="flex-1 py-4 bg-[#06B6D4] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0891b2] text-black font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    Next Step <ChevronRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col">
                            <h3 className="text-xl font-bold text-white mb-6">Select Drop-off Date</h3>
                            <div className="flex-1">
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#06B6D4] outline-none text-lg"
                                    min={new Date().toISOString().split('T')[0]}
                                />
                                <div className="mt-8 p-6 bg-[#06B6D4]/10 border border-[#06B6D4]/30 rounded-xl flex items-start gap-4">
                                    <AlertTriangle className="text-[#06B6D4] shrink-0" />
                                    <div>
                                        <h4 className="text-[#06B6D4] font-bold mb-1">Important Note</h4>
                                        <p className="text-sm text-gray-400">
                                            Please bring your device to our service center on the selected date. Do not include cables or controllers unless they are part of the issue.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-auto flex gap-4">
                                <button onClick={prevStep} className="px-6 py-4 rounded-xl border border-white/10 text-white hover:bg-white/5 font-bold">Back</button>
                                <button
                                    disabled={!formData.date}
                                    onClick={nextStep}
                                    className="flex-1 py-4 bg-[#06B6D4] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0891b2] text-black font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    Next Step <ChevronRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 4 && (
                        <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col">
                            <h3 className="text-xl font-bold text-white mb-6">Contact Information</h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs uppercase font-bold text-gray-500 block mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.contactName}
                                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#06B6D4] outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs uppercase font-bold text-gray-500 block mb-2">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={formData.contactPhone}
                                            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                            className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#06B6D4] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs uppercase font-bold text-gray-500 block mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            value={formData.contactEmail}
                                            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                            className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#06B6D4] outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto flex gap-4">
                                <button onClick={prevStep} className="px-6 py-4 rounded-xl border border-white/10 text-white hover:bg-white/5 font-bold">Back</button>
                                <button
                                    disabled={!formData.contactName || !formData.contactPhone || !formData.contactEmail || loading}
                                    onClick={handleSubmit}
                                    className="flex-1 py-4 bg-green-500 hover:bg-green-600 text-black font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(34,197,94,0.3)]"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : "CONFIRM BOOKING"}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 5 && (
                        <motion.div key="step5" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center">
                            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-6">
                                <Check size={48} />
                            </div>
                            <h2 className="text-3xl font-black text-white italic tracking-tighter mb-4">BOOKING CONFIRMED</h2>
                            <p className="text-gray-400 max-w-md mb-8">
                                Your service request for <span className="text-white font-bold">{formData.deviceModel}</span> has been registered. We'll verify the details and contact you shortly.
                            </p>
                            <button
                                onClick={() => router.push('/services')}
                                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl uppercase tracking-widest transition-all"
                            >
                                Return to Lab
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

