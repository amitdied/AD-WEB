"use client";

import { useRef } from "react";
import * as THREE from "three";

export type NPCActivityState = "IDLE" | "WALKING" | "SITTING" | "LOOKING";

export interface NPCCharacterProps {
  colorShirt?: string;
  colorPants?: string;
  colorShoes?: string;
  colorSkin?: string;
  shirtGraphicColor?: string;
  hasHeadphones?: boolean;
  hasCap?: boolean;
  isFriend?: boolean;
  name?: string;
}

/**
 * Procedural 3D Streetwear NPC Character
 * - Oversized dark/graphic t-shirt
 * - Baggy pants
 * - Chunky sneakers
 * - Optional headphones / caps / accessories
 * Low-poly R3F geometry for high performance.
 */
export function NPCCharacter({
  colorShirt = "#1e293b",
  colorPants = "#0f172a",
  colorShoes = "#e2e8f0",
  colorSkin = "#334155",
  shirtGraphicColor = "#ef4444",
  hasHeadphones = false,
  hasCap = false,
}: NPCCharacterProps) {
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  return (
    <group>
      {/* 1. HEAD & ACCESSORIES */}
      <group ref={headRef} position={[0, 1.52, 0]}>
        {/* Head Base */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.15, 12, 12]} />
          <meshStandardMaterial color={colorSkin} roughness={0.7} />
        </mesh>

        {/* Optional Cap */}
        {hasCap && (
          <group position={[0, 0.05, 0]}>
            <mesh position={[0, 0.04, -0.01]} rotation={[-0.1, 0, 0]}>
              <sphereGeometry args={[0.16, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
              <meshStandardMaterial color="#09090b" roughness={0.8} />
            </mesh>
            {/* Cap Visor / Brim */}
            <mesh position={[0, 0.01, 0.18]} rotation={[0.2, 0, 0]}>
              <boxGeometry args={[0.18, 0.02, 0.12]} />
              <meshStandardMaterial color="#09090b" roughness={0.8} />
            </mesh>
          </group>
        )}

        {/* Optional Studio Headphones */}
        {hasHeadphones && (
          <group position={[0, 0, 0]}>
            {/* Headband */}
            <mesh position={[0, 0.12, 0]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.16, 0.02, 8, 16, Math.PI]} />
              <meshStandardMaterial color="#020617" roughness={0.3} metalness={0.8} />
            </mesh>
            {/* Left Ear Cup */}
            <mesh position={[-0.16, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 0.04, 12]} />
              <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.6} />
            </mesh>
            {/* Right Ear Cup */}
            <mesh position={[0.16, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 0.04, 12]} />
              <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.6} />
            </mesh>
          </group>
        )}
      </group>

      {/* 2. OVERSIZED STREETWEAR T-SHIRT (TORSO) */}
      <group position={[0, 1.05, 0]}>
        {/* Main Tee Body (Wide Box / Cylinder Silhouette) */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.48, 0.62, 0.32]} />
          <meshStandardMaterial color={colorShirt} roughness={0.85} />
        </mesh>
        {/* Front Graphic Logo / Accent */}
        {shirtGraphicColor && (
          <mesh position={[0, 0.08, 0.165]}>
            <planeGeometry args={[0.22, 0.22]} />
            <meshStandardMaterial
              color={shirtGraphicColor}
              emissive={shirtGraphicColor}
              emissiveIntensity={0.5}
              roughness={0.5}
            />
          </mesh>
        )}
        {/* Lower Hem Droop */}
        <mesh position={[0, -0.32, 0]}>
          <boxGeometry args={[0.5, 0.08, 0.33]} />
          <meshStandardMaterial color={colorShirt} roughness={0.9} />
        </mesh>
      </group>

      {/* 3. ARMS (SLEEVES + FOREARMS) */}
      {/* Left Arm */}
      <group name="leftArm" ref={leftArmRef} position={[-0.28, 1.25, 0]}>
        {/* Oversized Sleeve */}
        <mesh position={[-0.04, -0.12, 0]} rotation={[0, 0, 0.1]}>
          <boxGeometry args={[0.14, 0.28, 0.22]} />
          <meshStandardMaterial color={colorShirt} roughness={0.85} />
        </mesh>
        {/* Forearm */}
        <mesh position={[-0.04, -0.32, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.22, 8]} />
          <meshStandardMaterial color={colorSkin} roughness={0.7} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group name="rightArm" ref={rightArmRef} position={[0.28, 1.25, 0]}>
        {/* Oversized Sleeve */}
        <mesh position={[0.04, -0.12, 0]} rotation={[0, 0, -0.1]}>
          <boxGeometry args={[0.14, 0.28, 0.22]} />
          <meshStandardMaterial color={colorShirt} roughness={0.85} />
        </mesh>
        {/* Forearm */}
        <mesh position={[0.04, -0.32, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.22, 8]} />
          <meshStandardMaterial color={colorSkin} roughness={0.7} />
        </mesh>
      </group>

      {/* 4. LEGS & BAGGY PANTS */}
      {/* Left Leg */}
      <group name="leftLeg" ref={leftLegRef} position={[-0.13, 0.72, 0]}>
        {/* Baggy Pants Upper/Lower */}
        <mesh position={[0, -0.28, 0]}>
          <boxGeometry args={[0.18, 0.58, 0.22]} />
          <meshStandardMaterial color={colorPants} roughness={0.9} />
        </mesh>
        {/* Chunky Sneaker */}
        <mesh position={[0, -0.62, 0.06]}>
          <boxGeometry args={[0.17, 0.12, 0.32]} />
          <meshStandardMaterial color={colorShoes} roughness={0.4} metalness={0.2} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group name="rightLeg" ref={rightLegRef} position={[0.13, 0.72, 0]}>
        {/* Baggy Pants Upper/Lower */}
        <mesh position={[0, -0.28, 0]}>
          <boxGeometry args={[0.18, 0.58, 0.22]} />
          <meshStandardMaterial color={colorPants} roughness={0.9} />
        </mesh>
        {/* Chunky Sneaker */}
        <mesh position={[0, -0.62, 0.06]}>
          <boxGeometry args={[0.17, 0.12, 0.32]} />
          <meshStandardMaterial color={colorShoes} roughness={0.4} metalness={0.2} />
        </mesh>
      </group>
    </group>
  );
}
