import { ClipboardList, Hammer, CheckSquare, Search } from "lucide-react";

export const WorkBench = () => {
    // Mock Data for Active Tickets
    const tickets = [
        { id: "WO-101", title: "Drifting Analog Stick", device: "DualSense-04", status: "In-Progress", priority: "Medium" },
        { id: "WO-102", title: "Overheating Check", device: "PS5-001", status: "Waiting-Parts", priority: "High" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                    <Hammer className="text-emerald-500" />
                    Technician Workbench
                </h2>

                <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
                    <Search className="text-gray-500" size={14} />
                    <input type="text" placeholder="Search Work Orders..." className="bg-transparent text-xs text-white outline-none w-48" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Active Ticket List */}
                <div className="bg-[#0f0f0f] rounded-2xl p-4 border border-white/5 space-y-4">
                    <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">Open Tickets</h3>

                    {tickets.map(ticket => (
                        <div key={ticket.id} className="bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-all cursor-pointer group border-l-2 border-transparent hover:border-emerald-500">
                            <div className="flex justify-between mb-2">
                                <span className="text-[10px] uppercase font-mono text-emerald-400">{ticket.id}</span>
                                <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded ${ticket.priority === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                    {ticket.priority}
                                </span>
                            </div>
                            <h4 className="font-bold text-sm text-white">{ticket.title}</h4>
                            <p className="text-xs text-gray-400 uppercase mt-1">{ticket.device}</p>

                            <div className="mt-3 flex justify-between items-center">
                                <span className="text-[10px] text-gray-500 uppercase">{ticket.status}</span>
                                <button className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] uppercase font-bold text-emerald-500 hover:text-white">
                                    Open
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* QC Form Placeholder */}
                <div className="bg-[#0f0f0f] rounded-2xl p-6 border border-white/5 flex flex-col items-center justify-center text-center opacity-50">
                    <CheckSquare size={32} className="text-gray-600 mb-2" />
                    <p className="text-sm font-bold text-gray-400">Select a ticket to begin QC</p>
                    <p className="text-xs text-gray-600 mt-1 uppercase tracking-wider">No active session</p>
                </div>
            </div>
        </div>
    );
};
