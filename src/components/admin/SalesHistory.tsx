"use client";

import { useEffect, useState } from "react";
import { getSales, getDailyRevenue, getMonthlyRevenue } from "@/services/sales";
import { SaleRecord } from "@/types";
import { DollarSign, Calendar, TrendingUp, Search, Clock } from "lucide-react";

export function SalesHistory() {
    const [sales, setSales] = useState<SaleRecord[]>([]);
    const [dailyRevenue, setDailyRevenue] = useState(0);
    const [monthlyRevenue, setMonthlyRevenue] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [salesData, daily, monthly] = await Promise.all([
                getSales(),
                getDailyRevenue(),
                getMonthlyRevenue()
            ]);
            setSales(salesData);
            setDailyRevenue(daily);
            setMonthlyRevenue(monthly);
        } catch (error) {
            console.error("SalesHistory loadData failed:", error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    const filteredSales = sales.filter(sale =>
        sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.items.some(item => item.product_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header / Stats */}
            <div className="flex flex-col md:flex-row gap-6 shrink-0">
                <div className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-[#06B6D4]/10 text-[#06B6D4]">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Daily Revenue</p>
                            <h2 className="text-3xl font-black text-white mt-1">₹{dailyRevenue.toLocaleString()}</h2>
                        </div>
                    </div>
                </div>

                <div className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6]">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Monthly Revenue</p>
                            <h2 className="text-3xl font-black text-white mt-1">₹{monthlyRevenue.toLocaleString()}</h2>
                        </div>
                    </div>
                </div>

                <div className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-[#10B981]/10 text-[#10B981]">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Total Transactions</p>
                            <h2 className="text-3xl font-black text-white mt-1">{sales.length}</h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden flex flex-col min-h-0">
                <div className="p-6 border-b border-white/10 flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Transaction History</h2>
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
                        <Search size={16} className="text-gray-500" />
                        <input
                            placeholder="Search ID or Item..."
                            className="bg-transparent text-white text-sm outline-none w-48"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-[#0a0a0a] z-10">
                            <tr className="border-b border-white/5 text-gray-500 text-xs uppercase bg-white/5">
                                <th className="p-4 font-bold">Transaction ID</th>
                                <th className="p-4 font-bold">Items</th>
                                <th className="p-4 font-bold">Date</th>
                                <th className="p-4 font-bold">Method</th>
                                <th className="p-4 font-bold text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredSales.map((sale) => (
                                <tr key={sale.id} className="hover:bg-white/5 transition-colors group cursor-default">
                                    <td className="p-4">
                                        <span className="font-mono text-gray-400 text-xs bg-white/5 px-2 py-1 rounded border border-white/10">{sale.id}</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            {sale.items.map((item, i) => (
                                                <div key={i} className="text-sm text-gray-300">
                                                    <span className="text-[#06B6D4] font-bold">{item.quantity}x</span> {item.product_name}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} />
                                            {formatDate(sale.date)}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-xs font-bold uppercase px-2 py-1 rounded inline-flex items-center gap-1 ${sale.payment_method === 'cash' ? 'bg-green-500/10 text-green-500' :
                                            sale.payment_method === 'card' ? 'bg-blue-500/10 text-blue-500' :
                                                'bg-purple-500/10 text-purple-500'
                                            }`}>
                                            {sale.payment_method}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className="text-white font-black text-lg">₹{sale.total_amount}</span>
                                    </td>
                                </tr>
                            ))}
                            {filteredSales.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-500 text-sm">No transactions found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
