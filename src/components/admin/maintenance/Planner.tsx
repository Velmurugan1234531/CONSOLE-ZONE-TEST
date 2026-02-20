import { Calendar, Clock, PenTool } from "lucide-react";

export const ServicePlanner = () => {
    // Mock Data for now - would come from 'work_orders' table
    const scheduledServices = [
        { id: 1, device: "PS5-004", date: "Today", type: "HDMI Repair", tech: "J. Doe" },
        { id: 2, device: "VR-002", date: "Tomorrow", type: "Lens Polish", tech: "A. Smith" },
        { id: 3, device: "XBOX-009", date: "Feb 15", type: "Deep Clean", tech: "Pending" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                    <Calendar className="text-blue-500" />
                    Service Schedule
                </h2>
                <button className="px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-lg shadow-purple-500/20">
                    + Schedule Service
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scheduledServices.map(service => (
                    <div key={service.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4 hover:border-blue-500/50 transition-all group">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-black uppercase bg-white/10 px-2 py-1 rounded text-gray-400">{service.date}</span>
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                        </div>

                        <div>
                            <h3 className="font-bold text-white uppercase tracking-wider">{service.device}</h3>
                            <p className="text-xs text-blue-400 font-mono mt-1">{service.type}</p>
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-bold">
                                {service.tech.charAt(0)}
                            </div>
                            <span className="text-[10px] uppercase font-bold text-gray-500">{service.tech}</span>
                        </div>
                    </div>
                ))}

                {/* Empty Slot Placeholder */}
                <div className="border-2 border-dashed border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-2 hover:bg-white/5 transition-all cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-[#8B5CF6]/20 transition-all">
                        <PenTool size={18} className="text-gray-600 group-hover:text-[#8B5CF6]" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-gray-600 group-hover:text-gray-400">Add Maintenance Slot</span>
                </div>
            </div>
        </div>
    );
};
