"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import ServiceBookingForm from "@/components/services/ServiceBookingForm";
import PageHero from "@/components/layout/PageHero";
import { getServices } from "@/services/repair-services";
import { ServiceItem } from "@/types";

function ServiceBookingContent() {
    const searchParams = useSearchParams();
    const serviceId = searchParams.get("serviceId");
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getServices();
                setServices(data.filter(s => s.status === 'Active'));
            } catch (error) {
                console.error("Failed to load services", error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="text-[#06B6D4] font-mono animate-pulse">LOADING SECURE FORM...</div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-20 relative z-20 -mt-20">
            <ServiceBookingForm preselectedServiceId={serviceId || undefined} services={services} />
        </div>
    );
}

export default function ServiceBookingPage() {
    return (
        <div className="min-h-screen relative bg-[#050505]">
            <PageHero
                title="SERVICE RESERVATION"
                subtitle="Secure Your Slot in the Repair Bay"
                height="50vh"
                images={[]}
            />
            <Suspense fallback={<div className="text-center text-white py-20">Loading...</div>}>
                <ServiceBookingContent />
            </Suspense>
        </div>
    );
}
