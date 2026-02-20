"use client";

import { RentalRequestsTable } from "@/components/admin/RentalRequestsTable";

export default function AdminRentalRequestsPage() {
    return (
        <div className="max-w-[1600px] mx-auto space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white italic tracking-tighter mb-2">
                        RENTAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] to-[#D8B4FE]">REQUESTS</span>
                    </h1>
                    <p className="text-gray-400 max-w-xl">
                        Approve or reject incoming rental bookings.
                    </p>
                </div>
            </header>

            <RentalRequestsTable />
        </div>
    );
}
