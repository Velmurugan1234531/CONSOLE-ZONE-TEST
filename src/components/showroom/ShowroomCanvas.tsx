"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
    Float,
    PerspectiveCamera,
    useGLTF,
    Environment,
    ContactShadows,
    OrbitControls,
    Html,
    Clone
} from "@react-three/drei";
import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

interface HotspotProps {
    position: [number, number, number];
    label: string;
    description: string;
}

function Hotspot({ position, label, description }: HotspotProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Html position={position} center distanceFactor={10}>
            <div className="relative group">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-6 h-6 bg-purple-600/80 hover:bg-purple-500 rounded-full border-2 border-white/50 backdrop-blur-sm shadow-lg shadow-purple-500/20 transition-all transform hover:scale-110 flex items-center justify-center animate-pulse"
                >
                    <div className="w-2 h-2 bg-white rounded-full" />
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 10 }}
                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 p-3 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl pointer-events-none"
                        >
                            <h4 className="text-white font-bold text-sm mb-1">{label}</h4>
                            <p className="text-white/60 text-xs leading-relaxed">{description}</p>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black/80" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Html>
    );
}

function ConsoleModel({ finish, exploded }: { finish: string; exploded: boolean }) {
    const meshRef = useRef<THREE.Group>(null);
    const { scene } = useGLTF("/models/ps5body.glb");

    useEffect(() => {
        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (mesh.material) {
                    const applyToMaterial = (mat: THREE.Material) => {
                        const material = mat.clone() as THREE.MeshStandardMaterial;

                        // Apply Material Swap
                        if (finish === "stealth") {
                            material.color.setHex(0x111111);
                            material.roughness = 0.8;
                        } else if (finish === "chrome") {
                            material.color.setHex(0xffffff);
                            material.roughness = 0.1;
                            material.metalness = 1.0;
                        } else {
                            // Original
                            material.color.setHex(0xffffff);
                            material.roughness = 0.5;
                            material.metalness = 0.2;
                        }
                        material.needsUpdate = true;
                        return material;
                    };

                    if (Array.isArray(mesh.material)) {
                        mesh.material = mesh.material.map(applyToMaterial);
                    } else {
                        mesh.material = applyToMaterial(mesh.material);
                    }
                }
            }
        });
    }, [scene, finish]);

    useFrame((state) => {
        if (meshRef.current && !exploded) {
            meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
        }
    });

    return (
        <group ref={meshRef} position={[0, -2, 0]} rotation={[0, -0.5, 0]}>
            <Float speed={2} rotationIntensity={0.1} floatIntensity={0.5}>
                <Clone object={scene} scale={22} />
            </Float>

            {/* Debug Cube - Read Box to confirm rendering */}
            <mesh position={[4, 2, 0]}>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.5} />
            </mesh>

            {/* Hotspots */}
            <Hotspot
                position={[0.5, 4.5, 0.2]}
                label="Disc Slot"
                description="Precision-engineered Ultra HD Blu-ray drive for immersive physical gaming."
            />
            <Hotspot
                position={[-1.2, 2.5, 0.5]}
                label="USB-C Port"
                description="High-speed data transfer and charging for your DualSense controllers."
            />
            <Hotspot
                position={[0, 6, -0.5]}
                label="Ventilation System"
                description="Advanced thermal management for sustained peak performance."
            />
        </group>
    );
}

// Preload the model
useGLTF.preload("/models/ps5body.glb");

export default function ShowroomCanvas({ preset, finish }: { preset: string; finish: string }) {
    return (
        <div className="h-full w-full relative z-0">
            <Canvas shadows gl={{ antialias: true, alpha: true }}>
                <PerspectiveCamera makeDefault position={[0, 2, 12]} />

                {/* Dynamic Lighting Presets */}
                <ambientLight intensity={preset === "minimal" ? 0.3 : 0.8} />

                {preset === "cyberpunk" && (
                    <>
                        <pointLight position={[-10, 5, -5]} intensity={50} color="#ff00ff" />
                        <pointLight position={[10, -5, 5]} intensity={50} color="#00ffff" />
                        <spotLight position={[5, 15, 5]} angle={0.15} intensity={100} color="#ffffff" castShadow />
                    </>
                )}

                {preset === "studio" && (
                    <>
                        <spotLight position={[10, 20, 10]} angle={0.15} penumbra={1} intensity={150} color="#ffffff" castShadow />
                        <pointLight position={[-10, 10, -10]} intensity={50} color="#ffffff" />
                        <pointLight position={[0, -10, 5]} intensity={20} color="#8B5CF6" />
                    </>
                )}

                {preset === "minimal" && (
                    <spotLight position={[0, 20, 0]} angle={0.2} penumbra={1} intensity={200} color="#ffffff" />
                )}

                <ConsoleModel finish={finish} exploded={false} />

                <ContactShadows
                    resolution={1024}
                    scale={20}
                    blur={2.5}
                    opacity={0.5}
                    far={10}
                    color="#000000"
                />

                <Environment preset="city" />

                <OrbitControls
                    enableZoom={true}
                    autoRotate={false}
                    enablePan={false}
                    minDistance={5}
                    maxDistance={20}
                />
            </Canvas>
        </div>
    );
}
