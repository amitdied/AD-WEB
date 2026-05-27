'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Box, Plane } from '@react-three/drei';

export function MusicSystem({ progress = 0 }: { progress?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      // System comes from bottom as progress increases
      groupRef.current.position.y = THREE.MathUtils.lerp(-10, -1, progress);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(-Math.PI / 8, 0, progress);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main Body */}
      <Box args={[6, 2, 3]} position={[0, 0, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.4} />
      </Box>
      
      {/* Dashboard Face */}
      <Box args={[5.8, 1.8, 0.2]} position={[0, 0, 1.5]} receiveShadow>
        <meshStandardMaterial color="#0a0a0a" roughness={0.8} />
      </Box>
      
      {/* CD Tray */}
      <Box args={[4.2, 0.2, 0.4]} position={[0, 0.2, 1.6]}>
        <meshStandardMaterial color="#050505" />
      </Box>
      
      {/* Equalizer display */}
      <group position={[0, -0.4, 1.62]}>
        <Plane args={[3, 0.6]}>
          <meshBasicMaterial color="#000" />
        </Plane>
        {Array.from({ length: 15 }).map((_, i) => (
          <EQBar key={i} index={i} total={15} progress={progress} />
        ))}
      </group>
      
      {/* Glowing Buttons */}
      <Box args={[0.3, 0.3, 0.2]} position={[-2.4, -0.4, 1.6]}>
        <meshStandardMaterial color={progress > 0.8 ? "#ff0000" : "#440000"} emissive={progress > 0.8 ? "#ff0000" : "#000"} emissiveIntensity={2} />
      </Box>
      <Box args={[0.3, 0.3, 0.2]} position={[2.4, -0.4, 1.6]}>
        <meshStandardMaterial color="#222" />
      </Box>
    </group>
  );
}

function EQBar({ index, total, progress }: { index: number; total: number; progress: number }) {
  const barRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (barRef.current && progress > 0.8) {
      // Animate equalize bars rapidly if CD is in (progress high)
      const scaleY = 0.2 + Math.abs(Math.sin((state.clock.elapsedTime * 10) + index)) * 0.8;
      barRef.current.scale.y = scaleY;
      barRef.current.position.y = (scaleY * 0.4) / 2 - 0.2;
    } else if (barRef.current) {
      barRef.current.scale.y = 0.1;
      barRef.current.position.y = -0.15;
    }
  });

  return (
    <mesh ref={barRef} position={[-1.3 + (index * 0.18), -0.15, 0.02]} scale={[1, 0.1, 1]}>
      <planeGeometry args={[0.1, 0.4]} />
      <meshBasicMaterial color="#ff0044" />
    </mesh>
  );
}
