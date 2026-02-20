"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, addMonths, subMonths, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, User, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface RentalCalendarProps {
    rentals: any[];
}

export function RentalCalendar({ rentals }: RentalCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Pfill days for grid alignment (start on Sunday)
    const startDayOfWeek = monthStart.getDay();
    const blankDays = Array(startDayOfWeek).fill(null);

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const getRentalsForDay = (date: Date) => {
        return rentals.filter(r =>
            isWithinInterval(date, {
                start: new Date(r.start_date),
                end: new Date(r.end_date)
            }) || (r.status === 'overdue' && isSameDay(date, new Date())) // Show overdue on today too
        );
    };

    return (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[600px]">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0f0f0f]">
                <h3 className="text-xl font-black uppercase tracking-tight text-white">
                    {format(currentDate, 'MMMM yyyy')}
                </h3>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-3 py-2 text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                        Today
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Grid Header */}
            <div className="grid grid-cols-7 border-b border-white/5 bg-[#050505]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 flex-grow auto-rows-fr bg-[#0a0a0a]">
                {blankDays.map((_, i) => (
                    <div key={`blank-${i}`} className="border-b border-r border-white/5 bg-black/40 min-h-[80px]" />
                ))}

                {daysInMonth.map((day) => {
                    const dayRentals = getRentalsForDay(day);
                    const isCurrentDay = isToday(day);

                    return (
                        <div
                            key={day.toISOString()}
                            className={`border-b border-r border-white/5 p-2 min-h-[80px] relative group transition-colors hover:bg-white/[0.02] ${isCurrentDay ? 'bg-[#8B5CF6]/5' : ''}`}
                        >
                            <div className={`text-xs font-bold mb-2 flex justify-between items-center ${isCurrentDay ? 'text-[#8B5CF6]' : 'text-gray-500'}`}>
                                <span>{format(day, 'd')}</span>
                                {isCurrentDay && <span className="w-1.5 h-1.5 bg-[#8B5CF6] rounded-full"></span>}
                            </div>

                            <div className="space-y-1">
                                {dayRentals.slice(0, 3).map(rental => (
                                    <div
                                        key={rental.id}
                                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate flex items-center gap-1 border ${rental.status === 'overdue'
                                                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                : rental.status === 'completed'
                                                    ? 'bg-green-500/10 text-green-500 border-green-500/20 opacity-50'
                                                    : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                            }`}
                                    >
                                        {rental.status === 'overdue' && <AlertTriangle size={8} />}
                                        {rental.product?.name}
                                    </div>
                                ))}
                                {dayRentals.length > 3 && (
                                    <div className="text-[9px] text-gray-500 font-bold pl-1">
                                        +{dayRentals.length - 3} more
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
