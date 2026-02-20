"use client";

import { useEffect, useState } from "react";
import { differenceInSeconds, intervalToDuration, formatDuration } from "date-fns";
import { Clock, AlertTriangle } from "lucide-react";

interface RentalTimerProps {
    dueDate: Date;
    status: string;
}

export function RentalTimer({ dueDate, status }: RentalTimerProps) {
    const [timeLeft, setTimeLeft] = useState<{ str: string; urgent: boolean }>({ str: "--", urgent: false });

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const diff = differenceInSeconds(dueDate, now);
            const isOverdue = diff < 0;
            const absDiff = Math.abs(diff);

            const days = Math.floor(absDiff / (3600 * 24));
            const hours = Math.floor((absDiff % (3600 * 24)) / 3600);
            const minutes = Math.floor((absDiff % 3600) / 60);
            const seconds = absDiff % 60;

            let timeStr = "";
            if (days > 0) timeStr += `${days}d `;
            timeStr += `${hours}h ${minutes}m ${seconds}s`;

            setTimeLeft({
                str: timeStr,
                urgent: !isOverdue && diff < 3600 * 4 // Urgent if < 4 hours remaining
            });
        };

        const interval = setInterval(updateTimer, 1000);
        updateTimer();
        return () => clearInterval(interval);
    }, [dueDate]);

    if (status === 'completed') return <span className="text-green-500 font-mono text-xs">RETURNED</span>;

    const isOverdue = new Date() > new Date(dueDate);

    return (
        <div className={`font-mono font-bold text-xs flex items-center gap-2 ${isOverdue ? "text-red-500" : timeLeft.urgent ? "text-orange-500 animate-pulse" : "text-blue-500"
            }`}>
            {isOverdue ? <AlertTriangle size={14} /> : <Clock size={14} />}
            <span>{isOverdue ? `Overdue: ${timeLeft.str}` : `Due in: ${timeLeft.str}`}</span>
        </div>
    );
}
