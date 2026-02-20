"use client";

import { motion } from "framer-motion";

export default function JoystickLoader() {
    return (
        <div className="flex flex-col items-center justify-center gap-2">
            <div className="relative w-12 h-12 bg-gray-800 rounded-full border-4 border-gray-700 shadow-xl overflow-hidden">
                {/* Joystick Stick */}
                <motion.div
                    className="absolute top-1/2 left-1/2 w-6 h-6 bg-[#8B5CF6] rounded-full shadow-[0_0_10px_#8B5CF6] border-2 border-white/20"
                    style={{ x: "-50%", y: "-50%" }}
                    animate={{
                        x: ["-50%", "-20%", "-50%", "-80%", "-50%", "-50%", "-50%"],
                        y: ["-50%", "-50%", "-80%", "-50%", "-20%", "-50%", "-50%"]
                    }}
                    transition={{
                        duration: 2,
                        ease: "easeInOut",
                        times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                        repeat: Infinity
                    }}
                >
                    <div className="absolute top-1 left-1 w-2 h-2 bg-white/40 rounded-full" />
                </motion.div>
            </div>
            <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Checking...</span>
        </div>
    );
}
