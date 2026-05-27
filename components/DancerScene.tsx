'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Box } from '@react-three/drei';

export function DancerScene({ progress = 0 }: { progress?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const torsoRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  
  // A stylized abstract dancer made of blocks
  
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    
    if (groupRef.current) {
      // Appear from distance as progress goes from 1 to 2
      // Let's say progress for this scene is 0 to 1
      const normalizedP = Math.max(0, Math.min(1, progress));
      
      groupRef.current.position.z = THREE.MathUtils.lerp(-20, 0, normalizedP);
      groupRef.current.position.y = THREE.MathUtils.lerp(-10, 0, Math.pow(normalizedP, 2));
      groupRef.current.rotation.y = t * 0.2; // Slow rotation
    }

    if (progress > 0.1) {
      // Bobbing motion (dancing)
      const bounce = Math.sin(t * 8) * 0.2;
      
      if (torsoRef.current) torsoRef.current.position.y = bounce;
      if (headRef.current) {
        headRef.current.position.y = 1.8 + bounce * 1.2;
        headRef.current.rotation.z = Math.sin(t * 4) * 0.2;
        headRef.current.rotation.x = Math.sin(t * 8) * 0.2;
      }
      
      if (leftArmRef.current) {
        leftArmRef.current.position.y = 0.5 + bounce;
        leftArmRef.current.rotation.z = Math.sin(t * 4) * 0.5;
        leftArmRef.current.rotation.x = Math.cos(t * 8) * 0.5;
      }
      if (rightArmRef.current) {
        rightArmRef.current.position.y = 0.5 + bounce;
        rightArmRef.current.rotation.z = -Math.sin(t * 4 + Math.PI) * 0.5;
        rightArmRef.current.rotation.x = Math.cos(t * 8 + Math.PI) * 0.5;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh ref={headRef} position={[0, 1.8, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshPhysicalMaterial color="#ff2222" emissive="#550000" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Torso */}
      <mesh ref={torsoRef} position={[0, 0, 0]}>
        <boxGeometry args={[1, 1.5, 0.5]} />
        <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.8, 0.5, 0]}>
        <mesh position={[0, -0.6, 0]}>
          <boxGeometry args={[0.3, 1.2, 0.3]} />
          <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
      
      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.8, 0.5, 0]}>
        <mesh position={[0, -0.6, 0]}>
           <boxGeometry args={[0.3, 1.2, 0.3]} />
           <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
      
      {/* Legs (static abstract base for now) */}
      <mesh position={[-0.3, -1.2, 0]}>
        <boxGeometry args={[0.4, 1.5, 0.4]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
      <mesh position={[0.3, -1.2, 0]}>
        <boxGeometry args={[0.4, 1.5, 0.4]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
    </group>
  );
}
