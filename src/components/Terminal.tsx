"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

type TerminalVariant = "boot" | "hacker" | "dev" | "setup";

interface TerminalProps {
    variant?: TerminalVariant;
    title?: string;
    className?: string;
}

const VARIANTS: Record<TerminalVariant, string[]> = {
    setup: [
        "> npm install -g @core/system-utils",
        "[..................] \\ fetchMetadata: sil-logic: http fetch 200",
        "+ @core/system-utils@4.12.0",
        "added 48 packages from 32 contributors in 4.2s",
        "",
        "> sudo apt-get update",
        "Hit:1 http://us.archive.ubuntu.com/ubuntu focal InRelease",
        "Get:2 http://us.archive.ubuntu.com/ubuntu focal-updates InRelease [114 kB]",
        "Get:3 http://security.ubuntu.com/ubuntu focal-security InRelease [114 kB]",
        "Fetched 228 kB in 1s (256 kB/s)",
        "Reading package lists... Done",
        "Building dependency tree... Done",
    ],
    hacker: [
        "user@mainframe:~$ ping -c 4 192.168.0.1",
        "PING 192.168.0.1 (192.168.0.1) 56(84) bytes of data.",
        "64 bytes from 192.168.0.1: icmp_seq=1 ttl=64 time=0.042 ms",
        "64 bytes from 192.168.0.1: icmp_seq=2 ttl=64 time=0.038 ms",
        "",
        "user@mainframe:~$ netstat -an | grep :80",
        "tcp        0      0 0.0.0.0:80              0.0.0.0:* LISTEN",
        "tcp        0      0 192.168.1.5:54322       104.21.55.2:80          ESTABLISHED",
        "",
        "> _initiating handshake... [OK]",
        "> _bypassing proxy... [SUCCESS]",
        "> _uploading packet_data.enc",
    ],
    dev: [
        "dev@local:~/projects/webapp$ git status",
        "On branch main",
        "Your branch is up to date with 'origin/main'.",
        "",
        "Changes not staged for commit:",
        '  (use "git add <file>..." to update what will be committed)',
        "  modified:   src/App.js",
        "  modified:   src/components/Login.tsx",
        "",
        "dev@local:~/projects/webapp$ ls -la",
        "drwxr-xr-x   7 dev  staff   224 Jan 29 10:00 .",
        "drwxr-xr-x   5 dev  staff   160 Jan 28 14:22 ..",
        "-rw-r--r--   1 dev  staff  1024 Jan 29 09:15 README.md",
    ],
    boot: [
        "[  OK  ] Started User Manager for UID 1000.",
        "[  OK  ] Started Session c2 of user root.",
        "         Starting Update UTMP about System Runlevel Changes...",
        "[  OK  ] Started Update UTMP about System Runlevel Changes.",
        "[ INFO ] CPU: 0 PID: 1 Comm: systemd Not tainted 5.4.0-42-generic",
        "[ WARN ] ACPI: Warning: SystemIO range 0x0000000000000428-0x000000000000042f conflicts with OpRegion",
    ],
};

const COLORS: Record<TerminalVariant, string> = {
    boot: "text-[#06B6D4]", // Blue/Cyan
    hacker: "text-[#39ff14]", // Green
    dev: "text-[#D500F9]", // Purple
    setup: "text-white", // White
};

export default function Terminal({ variant = "boot", title = "Console Zone Terminal", className = "" }: TerminalProps) {
    const [lines, setLines] = useState<string[]>([]);
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    const allLines = VARIANTS[variant];

    useEffect(() => {
        if (currentLineIndex < allLines.length) {
            const timeout = setTimeout(() => {
                setLines((prev) => [...prev, allLines[currentLineIndex]]);
                setCurrentLineIndex((prev) => prev + 1);
            }, Math.random() * 300 + 100); // Random delay between 100ms and 400ms

            return () => clearTimeout(timeout);
        }
    }, [currentLineIndex, allLines, variant]);

    useEffect(() => {
        // Reset when variant changes
        setLines([]);
        setCurrentLineIndex(0);
    }, [variant]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [lines]);

    return (
        <div className={`font-mono text-sm leading-relaxed overflow-hidden rounded-lg bg-[#080012]/90 border border-white/10 shadow-[0_0_20px_rgba(213,0,249,0.1)] backdrop-blur-sm ${className}`}>
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-widest">{title}</div>
                <div className="w-12" /> {/* Spacer for centering */}
            </div>

            {/* Terminal Body */}
            <div ref={scrollRef} className={`p-4 h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 hover:scrollbar-thumb-[#D500F9]/50 transition-colors ${COLORS[variant]}`}>
                {lines.map((line, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mb-1 break-words"
                    >
                        <span className="opacity-50 mr-2">$</span>
                        {line}
                    </motion.div>
                ))}
                <motion.div
                    animate={{ opacity: [0, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="inline-block w-2 H-4 bg-current ml-1 align-bottom"
                />
            </div>
        </div>
    );
}
