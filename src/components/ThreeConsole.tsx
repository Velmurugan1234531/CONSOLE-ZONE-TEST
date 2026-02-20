"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, PerspectiveCamera, useGLTF, Environment, ContactShadows, OrbitControls } from "@react-three/drei";
import { useRef, useEffect } from "react";
import * as THREE from "three";

function ConsoleModel() {
    const meshRef = useRef<THREE.Group>(null);
    // Loading the new PS5 Body model
    const { scene } = useGLTF("/models/ps5body.glb");

    // Apply matte finish to materials
    useEffect(() => {
        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (mesh.material) {
                    const material = mesh.material as THREE.MeshStandardMaterial;
                    material.roughness = 0.5; // Smooth but not mirror
                    material.metalness = 0.2; // Slight metallic sheen for white plastic
                    material.envMapIntensity = 0.8;
                    material.needsUpdate = true;
                }
            }
        });
    }, [scene]);

    useFrame((state, delta) => {
        if (meshRef.current) {
            // Gentle rotation to show off curves
            meshRef.current.rotation.y += delta * 0.2;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.2} floatIntensity={1} floatingRange={[-0.1, 0.1]}>
            <primitive
                object={scene}
                ref={meshRef}
                scale={20} // Adjusted scale for console body
                rotation={[0, -0.5, 0]}
                position={[0, -3, 0]} // Lowered based on user request
            />
        </Float>
    );
}

export default function ThreeConsole() {
    return (
        <div className="h-full w-full relative z-0">
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 0, 8]} />
                <ambientLight intensity={0.5} />

                {/* Cyberpunk Lighting */}
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={10} color="#ffffff" castShadow />
                <pointLight position={[-5, 2, -5]} intensity={20} color="#8B5CF6" distance={10} /> {/* Purple */}
                <pointLight position={[5, -2, 5]} intensity={20} color="#39ff14" distance={10} />  {/* Green */}

                <ConsoleModel />

                <ContactShadows resolution={1024} scale={20} blur={2} opacity={0.4} far={10} color="#000000" />
                <Environment preset="city" />
                <OrbitControls enableZoom={true} autoRotate={false} enablePan={false} />
            </Canvas>
        </div>
    );
}
