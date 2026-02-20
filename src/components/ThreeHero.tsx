"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, PerspectiveCamera, useGLTF, Environment, ContactShadows, OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function ConsoleModel() {
    const meshRef = useRef<THREE.Group>(null);
    const { scene } = useGLTF("/models/ps5body.glb");

    useFrame((state, delta) => {
        if (meshRef.current) {
            // Gentle rotation
            meshRef.current.rotation.y += delta * 0.2;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.2} floatIntensity={1} floatingRange={[-0.1, 0.1]}>
            <primitive
                object={scene}
                ref={meshRef}
                scale={18} // Scale for Hero section
                rotation={[0.2, -0.5, 0]}
                position={[0, -2, 0]}
            />
        </Float>
    );
}

// Preload the model
useGLTF.preload("/models/ps5body.glb");

export default function ThreeHero() {
    return (
        <div className="h-full w-full relative z-0">
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 0, 10]} />
                <ambientLight intensity={0.8} />

                {/* Studio Lighting for Product */}
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={15} color="#ffffff" castShadow />
                <pointLight position={[-10, 5, -5]} intensity={15} color="#ffffff" distance={20} />
                <pointLight position={[5, -5, 5]} intensity={10} color="#8B5CF6" distance={10} /> {/* Subtle Purple Rim */}

                <ConsoleModel />

                <ContactShadows resolution={1024} scale={20} blur={2} opacity={0.4} far={10} color="#000000" />
                <Environment preset="city" />
                <OrbitControls enableZoom={false} autoRotate={false} enablePan={false} />
            </Canvas>
        </div>
    );
}
