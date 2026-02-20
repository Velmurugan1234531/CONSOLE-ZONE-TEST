export const calculateRentalProgress = (startDate: string, endDate: string): number => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();

    if (now <= start) return 0;
    if (now >= end) return 100;

    const total = end - start;
    const elapsed = now - start;

    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
};

export const formatTimeRemaining = (endDate: string): string => {
    const now = new Date().getTime();
    const target = new Date(endDate).getTime();
    const difference = target - now;

    if (difference <= 0) return "MISSION_EXPIRED";

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((difference % (1000 * 60)) / 1000);

    if (days > 0) return `${days}D ${hours}H ${mins}M`;
    if (hours > 0) return `${hours}H ${mins}M ${secs}S`;
    return `${mins}M ${secs}S`;
};
