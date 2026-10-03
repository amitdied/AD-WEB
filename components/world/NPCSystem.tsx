"use client";

import React, { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { NPCCharacter, NPCActivityState } from "./NPCCharacter";

export interface FriendNPCData {
  id: string;
  name: string;
  dialogue: string[];
  position: [number, number, number];
}

export interface NPCData {
  id: string;
  name: string;
  isFriend: boolean;
  colorShirt: string;
  colorPants: string;
  colorShoes: string;
  colorSkin?: string;
  shirtGraphicColor?: string;
  hasHeadphones?: boolean;
  hasCap?: boolean;
  modelUrl?: string;
  waypoints: [number, number, number][];
  speed: number;
  pauseTime: number; // in seconds
  dialogue?: string[];
}

export const FRIENDS_LIST: NPCData[] = [
  {
    id: "FRIEND_SAHIL",
    name: "SAHIL",
    isFriend: true,
    modelUrl: "/models/characters/sahil.glb",
    colorShirt: "#09090b",
    colorPants: "#18181b",
    colorShoes: "#f8fafc",
    colorSkin: "#334155",
    shirtGraphicColor: "#f59e0b",
    hasCap: true,
    waypoints: [
      [-10.0, 1.65, 48.0],
      [-2.0, 1.65, 50.0],
      [6.0, 1.65, 52.0],
      [0.0, 1.65, 45.0],
    ],
    speed: 1.2,
    pauseTime: 4.5,
    dialogue: [
      "Yo.",
      "You finally made it outside.",
      "This park is the only quiet spot left in the district.",
    ],
  },
  {
    id: "FRIEND_CHIKU",
    name: "CHIKU",
    isFriend: true,
    modelUrl: "/models/characters/chiku.glb",
    colorShirt: "#0d9488",
    colorPants: "#1e1b4b",
    colorShoes: "#cbd5e1",
    colorSkin: "#334155",
    shirtGraphicColor: "#5eead4",
    waypoints: [
      [-18.0, 1.65, 52.0],
      [-28.0, 1.65, 58.0],
      [-20.0, 1.65, 66.0],
      [-12.0, 1.65, 56.0],
    ],
    speed: 1.1,
    pauseTime: 5.0,
    dialogue: [
      "Been chilling here for a while.",
      "The beats from the bunker sound insane even out here.",
      "Catch you later.",
    ],
  },
  {
    id: "FRIEND_ADDY",
    name: "ADDY",
    isFriend: true,
    modelUrl: "/models/characters/addy.glb",
    colorShirt: "#4c1d95",
    colorPants: "#09090b",
    colorShoes: "#06b6d4",
    colorSkin: "#334155",
    shirtGraphicColor: "#c084fc",
    hasHeadphones: true,
    waypoints: [
      [3.5, 1.65, 55.0],
      [-3.5, 1.65, 55.0],
      [0.0, 1.65, 58.5],
      [4.0, 1.65, 53.0],
    ],
    speed: 1.0,
    pauseTime: 6.0,
    dialogue: [
      "Listen to that.",
      "The whole place reacts to the music.",
      "Check out the sound monument.",
    ],
  },
];

export const GENERIC_NPCS: NPCData[] = [
  {
    id: "GENERIC_01",
    name: "CITIZEN_01",
    isFriend: false,
    colorShirt: "#334155",
    colorPants: "#1e293b",
    colorShoes: "#94a3b8",
    waypoints: [
      [-15.0, 1.65, 42.0],
      [15.0, 1.65, 42.0],
    ],
    speed: 0.9,
    pauseTime: 3.0,
  },
  {
    id: "GENERIC_02",
    name: "CITIZEN_02",
    isFriend: false,
    colorShirt: "#475569",
    colorPants: "#0f172a",
    colorShoes: "#e2e8f0",
    hasCap: true,
    waypoints: [
      [8.0, 1.65, 48.0],
      [12.0, 1.65, 56.0],
      [8.0, 1.65, 48.0],
    ],
    speed: 0.85,
    pauseTime: 4.0,
  },
  {
    id: "GENERIC_03",
    name: "CITIZEN_03",
    isFriend: false,
    colorShirt: "#1d4ed8",
    colorPants: "#1e1b4b",
    colorShoes: "#cbd5e1",
    waypoints: [
      [-32.0, 1.65, 44.0],
      [-32.0, 1.65, 70.0],
    ],
    speed: 1.0,
    pauseTime: 3.5,
  },
  {
    id: "GENERIC_04",
    name: "CITIZEN_04",
    isFriend: false,
    colorShirt: "#be123c",
    colorPants: "#18181b",
    colorShoes: "#f4f4f5",
    waypoints: [
      [32.0, 1.65, 44.0],
      [32.0, 1.65, 70.0],
    ],
    speed: 0.95,
    pauseTime: 4.0,
  },
  {
    id: "GENERIC_05",
    name: "CITIZEN_05",
    isFriend: false,
    colorShirt: "#047857",
    colorPants: "#064e3b",
    colorShoes: "#e2e8f0",
    waypoints: [
      [18.0, 1.65, 62.0],
      [28.0, 1.65, 50.0],
    ],
    speed: 0.9,
    pauseTime: 3.0,
  },
  {
    id: "GENERIC_06",
    name: "CITIZEN_06",
    isFriend: false,
    colorShirt: "#b45309",
    colorPants: "#292524",
    colorShoes: "#fafaf9",
    hasCap: true,
    waypoints: [
      [-8.0, 1.65, 68.0],
      [8.0, 1.65, 68.0],
    ],
    speed: 0.8,
    pauseTime: 5.0,
  },
];

export const ALL_NPCS: NPCData[] = [...FRIENDS_LIST, ...GENERIC_NPCS];

/** Single NPC Instance Controller in 3D Scene */
function SingleNPC({
  data,
  posRef,
  playerPosition,
  onNearbyFriend,
}: {
  data: NPCData;
  posRef?: React.MutableRefObject<THREE.Vector3>;
  playerPosition?: THREE.Vector3;
  onNearbyFriend?: (friend: FriendNPCData | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  // Motion state kept in refs to avoid React rerenders
  const waypointIdxRef = useRef(0);
  const currentPosRef = useRef(new THREE.Vector3(...data.waypoints[0]));
  const targetPosRef = useRef(
    new THREE.Vector3(...(data.waypoints[1] || data.waypoints[0]))
  );
  const stateRef = useRef<NPCActivityState>("WALKING");
  const waitTimerRef = useRef(0);
  const walkCycleRef = useRef(0);
  const isNearbyRef = useRef(false);

  const [npcState, setNpcState] = useState<NPCActivityState>("IDLE");

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (stateRef.current !== npcState) {
      setNpcState(stateRef.current);
    }

    const safeDelta = Math.min(delta, 0.1);
    const curr = currentPosRef.current;
    const target = targetPosRef.current;

    // 1. STATE MACHINE & WAYPOINT MOVEMENT
    if (stateRef.current === "WALKING") {
      const dir = new THREE.Vector3().subVectors(target, curr);
      const dist = dir.length();

      if (dist < 0.25) {
        // Arrived at waypoint
        stateRef.current = "IDLE";
        waitTimerRef.current = data.pauseTime;
        // Advance waypoint
        const nextIdx = (waypointIdxRef.current + 1) % data.waypoints.length;
        waypointIdxRef.current = nextIdx;
        const nextWaypoint = data.waypoints[nextIdx];
        targetPosRef.current.set(...nextWaypoint);
      } else {
        // Step towards target
        dir.normalize();
        const step = data.speed * safeDelta;
        curr.addScaledVector(dir, step);

        // Face movement direction
        const angle = Math.atan2(dir.x, dir.z);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
          groupRef.current.rotation.y,
          angle,
          0.1
        );

        // Walk cycle animation
        walkCycleRef.current += safeDelta * 6.5;
        const swing = Math.sin(walkCycleRef.current) * 0.45;

        if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
        if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
        if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.8;
        if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.8;
      }
    } else if (stateRef.current === "IDLE") {
      waitTimerRef.current -= safeDelta;

      // Subtle breathing / idle sway
      const idleSway = Math.sin(Date.now() * 0.002) * 0.04;
      if (headRef.current) {
        headRef.current.rotation.y = idleSway;
        if (data.hasHeadphones) {
          // Subtle audio bounce for Addy
          headRef.current.rotation.x = Math.sin(Date.now() * 0.008) * 0.08;
        }
      }

      // Reset arm and leg rotation
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
      if (rightArmRef.current) rightArmRef.current.rotation.x = 0;

      if (waitTimerRef.current <= 0) {
        stateRef.current = "WALKING";
      }
    }

    // Update group position
    groupRef.current.position.set(curr.x, curr.y - 1.65, curr.z);

    // 2. FRIEND PROXIMITY CHECK FOR DIALOGUE INTERACTION
    const pPos = posRef?.current || playerPosition;
    if (data.isFriend && pPos) {
      const distanceToPlayer = curr.distanceTo(pPos);
      const PROXIMITY_RADIUS = 3.2;

      if (distanceToPlayer < PROXIMITY_RADIUS) {
        if (!isNearbyRef.current) {
          isNearbyRef.current = true;
          onNearbyFriend?.({
            id: data.id,
            name: data.name,
            dialogue: data.dialogue || ["Yo."],
            position: [curr.x, curr.y, curr.z],
          });
        }
      } else {
        if (isNearbyRef.current) {
          isNearbyRef.current = false;
          onNearbyFriend?.(null);
        }
      }
    }
  });

  return (
    <group ref={groupRef} position={data.waypoints[0]}>
      <NPCCharacter
        modelUrl={data.modelUrl}
        colorShirt={data.colorShirt}
        colorPants={data.colorPants}
        colorShoes={data.colorShoes}
        colorSkin={data.colorSkin}
        shirtGraphicColor={data.shirtGraphicColor}
        hasHeadphones={data.hasHeadphones}
        hasCap={data.hasCap}
        isFriend={data.isFriend}
        name={data.name}
        activityState={npcState}
      />
    </group>
  );
}

/** Environmental Activity Props near NPC areas */
function EnvironmentalProps() {
  return (
    <group>
      {/* 1. Sahil's Area: Skateboard leaning near Park Bench */}
      <group position={[-1.6, 0.25, 49.5]} rotation={[0.2, 0.4, -0.6]}>
        {/* Deck */}
        <mesh>
          <boxGeometry args={[0.2, 0.02, 0.75]} />
          <meshStandardMaterial color="#ef4444" roughness={0.5} />
        </mesh>
        {/* Wheels */}
        <mesh position={[0.1, -0.03, 0.25]}>
          <cylinderGeometry args={[0.03, 0.03, 0.04, 8]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
        <mesh position={[-0.1, -0.03, 0.25]}>
          <cylinderGeometry args={[0.03, 0.03, 0.04, 8]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
        <mesh position={[0.1, -0.03, -0.25]}>
          <cylinderGeometry args={[0.03, 0.03, 0.04, 8]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
        <mesh position={[-0.1, -0.03, -0.25]}>
          <cylinderGeometry args={[0.03, 0.03, 0.04, 8]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
      </group>

      {/* 2. Addy's Area: Portable Bluetooth Boombox Speaker near Monument */}
      <group position={[1.8, 0.25, 54.2]} rotation={[0, -0.3, 0]}>
        <mesh>
          <boxGeometry args={[0.42, 0.22, 0.22]} />
          <meshStandardMaterial color="#09090b" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Glowing Speaker Grille */}
        <mesh position={[0, 0, 0.115]}>
          <planeGeometry args={[0.34, 0.16]} />
          <meshStandardMaterial color="#06b6d4" emissive="#0284c7" emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* 3. Chiku's Area: Streetwear Backpack near Residential Path */}
      <group position={[-17.2, 0.22, 51.5]} rotation={[0, 0.5, 0]}>
        <mesh>
          <boxGeometry args={[0.32, 0.42, 0.22]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        {/* Front Pocket */}
        <mesh position={[0, -0.08, 0.12]}>
          <boxGeometry args={[0.24, 0.2, 0.08]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
      </group>

      {/* 4. Drink Can near Park Bench */}
      <group position={[-2.4, 0.55, 49.8]}>
        <mesh>
          <cylinderGeometry args={[0.04, 0.04, 0.12, 12]} />
          <meshStandardMaterial color="#38bdf8" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

export interface NPCSystemProps {
  posRef?: React.MutableRefObject<THREE.Vector3>;
  playerPosition?: THREE.Vector3;
  onNearbyFriendChange?: (friend: FriendNPCData | null) => void;
}

/**
 * Reusable NPC System Rendering 3 Friends + 6 Generic NPCs
 */
export function NPCSystem({ posRef, playerPosition, onNearbyFriendChange }: NPCSystemProps) {
  const nearbyFriendRef = useRef<string | null>(null);

  const handleNearbyFriend = (friend: FriendNPCData | null) => {
    const friendKey = friend ? friend.id : null;
    if (nearbyFriendRef.current !== friendKey) {
      nearbyFriendRef.current = friendKey;
      onNearbyFriendChange?.(friend);
    }
  };

  return (
    <group name="NPC_SYSTEM">
      {/* 1. Environmental Activity Props */}
      <EnvironmentalProps />

      {/* 2. All 9 NPCs (3 Friends + 6 Generics) */}
      {ALL_NPCS.map((npc) => (
        <SingleNPC
          key={npc.id}
          data={npc}
          posRef={posRef}
          playerPosition={playerPosition}
          onNearbyFriend={handleNearbyFriend}
        />
      ))}
    </group>
  );
}

export default NPCSystem;
