"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, PerspectiveCamera, useGLTF, Environment, ContactShadows, OrbitControls } from "@react-three/drei";
import { useRef, useEffect } from "react";
import * as THREE from "three";

function ControllerModel() {
    const meshRef = useRef<THREE.Group>(null);
    // Note: The file is in public/models/controller.glb
    const { scene } = useGLTF("/models/controller.glb");

    // Apply matte finish to materials
    useEffect(() => {
        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (mesh.material) {
                    // Force matte plastic look
                    const material = mesh.material as THREE.MeshStandardMaterial;
                    material.roughness = 0.8; // Matte
                    material.metalness = 0.1; // Less metallic
                    material.envMapIntensity = 0.5; // Reduce reflections
                    material.needsUpdate = true;
                }
            }
        });
    }, [scene]);

    useFrame((state, delta) => {
        if (meshRef.current) {
            // Dynamic multi-axis rotation to show all sides
            meshRef.current.rotation.y += delta * 0.5;
            meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
            meshRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.3) * 0.1;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.2} floatIntensity={1} floatingRange={[-0.1, 0.1]}>
            <primitive
                object={scene}
                ref={meshRef}
                scale={50} // Doubled scale as requested
                rotation={[0.4, -0.5, 0]}
                position={[0, 0, 0]}
            />
        </Float>
    );
}

export default function ThreeController() {
    return (
        <div className="h-[500px] w-full relative z-0">
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 0, 8]} />
                <ambientLight intensity={0.5} />

                {/* Key Lights for dramatic shape definition */}
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={10} color="#ffffff" castShadow />
                <pointLight position={[-5, 0, -5]} intensity={20} color="#8B5CF6" distance={10} />
                <pointLight position={[5, 0, 5]} intensity={20} color="#39ff14" distance={10} />

                <ControllerModel />

                <ContactShadows resolution={1024} scale={20} blur={2} opacity={0.4} far={10} color="#000000" />
                <Environment preset="city" />
                <OrbitControls enableZoom={true} autoRotate={false} enablePan={false} />
            </Canvas>
        </div>
    );
}
