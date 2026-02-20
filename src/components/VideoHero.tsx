"use client";

export default function VideoHero() {
    return (
        <div className="h-[500px] w-full relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(139,92,246,0.2)] group">
            <div className="absolute inset-0 bg-[#0a0a0a] z-0" />

            <video
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700"
                autoPlay
                loop
                muted
                playsInline
            >
                <source src="/videos/hero.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent pointer-events-none" />

            {/* Decorative Cyberpunk Elements */}
            <div className="absolute bottom-4 right-4 flex gap-2">
                <div className="w-2 h-2 bg-[#39ff14] animate-pulse rounded-full" />
                <span className="text-[10px] text-[#39ff14] font-mono tracking-widest">LIVE FEED</span>
            </div>
        </div>
    );
}
