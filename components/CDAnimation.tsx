'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function CDAnimation({ progress = 0 }: { progress?: number }) {
  const cdRef = useRef<THREE.Group>(null);
  
  // Custom iridescence shader material for the CD surface could be complex, 
  // we'll use MeshPhysicalMaterial for a premium look
  
  useFrame((state, delta) => {
    if (cdRef.current) {
      // Continuous slow rotation + scroll-based rotation
      cdRef.current.rotation.y += delta * 0.5;
      cdRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      
      // Affect position based on scroll progress (0 to 1)
      // As progress goes 0 -> 1, CD moves down and tilts
      cdRef.current.position.y = THREE.MathUtils.lerp(2, -2, progress);
      cdRef.current.rotation.x = THREE.MathUtils.lerp(0, Math.PI / 2.5, progress);
    }
  });

  return (
    <group ref={cdRef} scale={[1.5, 1.5, 1.5]}>
      {/* Outer Disc */}
      <mesh receiveShadow castShadow>
        <cylinderGeometry args={[2, 2, 0.05, 64]} />
        <meshPhysicalMaterial 
          color="#111" 
          metalness={0.8} 
          roughness={0.2} 
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          iridescence={1.0}
          iridescenceIOR={1.5}
        />
      </mesh>
      
      {/* Inner Hole Cutout (visually represented as black for now) */}
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.06, 32]} />
        <meshBasicMaterial color="#000" />
      </mesh>
      
      {/* CD Label Area */}
      <mesh position={[0, 0.026, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.01, 32]} />
        <meshStandardMaterial color="#880000" roughness={0.7} />
      </mesh>
      
      {/* Center Ring */}
      <mesh position={[0, 0.03, 0]}>
        <torusGeometry args={[0.3, 0.02, 16, 32]} />
        <meshStandardMaterial color="#555" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}
