"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  WorldInteractable,
  ALL_WORLD_INTERACTABLES,
  WALKABLE_BOUNDS,
  OBSTACLE_BOUNDS,
} from "./worldData";
import {
  createStencilTexture,
  createCctvMonitorTexture,
  createCinemaProjectionTexture,
} from "./proceduralTextures";

export interface WorldSceneProps {
  onHoverInteractable: (item: WorldInteractable | null) => void;
  onInteract: (item: WorldInteractable) => void;
  reducedMotion: boolean;
  projectorActive: boolean;
  onToggleProjector: () => void;
  isCctvTerminalOpen?: boolean;
  isCinemaTerminalOpen?: boolean;
  cinemaScreenState?: "offline" | "idle" | "projecting";
  discoveredArtifactIds?: string[];
  discoveredSecretIds?: string[];
  isNode04Unlocked?: boolean;
  isNode04DoorOpen?: boolean;
  onPlayerPositionChange?: (pos: [number, number, number], yaw: number) => void;
  teleportTarget?: [number, number, number] | null;
  onTeleportHandled?: () => void;
}

interface ControllerProps {
  onHoverInteractable: (item: WorldInteractable | null) => void;
  onInteract: (item: WorldInteractable) => void;
  reducedMotion: boolean;
  onToggleProjector: () => void;
  onPlayerPositionChange?: (pos: [number, number, number], yaw: number) => void;
  teleportTarget?: [number, number, number] | null;
  onTeleportHandled?: () => void;
}

function FirstPersonController({
  onHoverInteractable,
  onInteract,
  reducedMotion,
  onToggleProjector,
  onPlayerPositionChange,
  teleportTarget,
  onTeleportHandled,
}: ControllerProps) {
  const { camera, gl } = useThree();

  const pos = useRef(new THREE.Vector3(0, 1.65, 2.5));
  const vel = useRef(new THREE.Vector3(0, 0, 0));
  const yaw = useRef(0);
  const pitch = useRef(0);
  const isLocked = useRef(false);
  const walkTimer = useRef(0);

  const frameCount = useRef(0);
  const lastReportedPos = useRef<[number, number, number]>([0, 1.65, 2.5]);
  const lastReportedYaw = useRef<number>(0);

  // Handle programmatic teleportation from map / fast travel
  useEffect(() => {
    if (teleportTarget) {
      pos.current.set(teleportTarget[0], teleportTarget[1] ?? 1.65, teleportTarget[2]);
      vel.current.set(0, 0, 0);
      camera.position.set(teleportTarget[0], teleportTarget[1] ?? 1.65, teleportTarget[2]);
      lastReportedPos.current = [teleportTarget[0], teleportTarget[1] ?? 1.65, teleportTarget[2]];
      onPlayerPositionChange?.([teleportTarget[0], teleportTarget[1] ?? 1.65, teleportTarget[2]], yaw.current);
      onTeleportHandled?.();
    }
  }, [teleportTarget, camera, onPlayerPositionChange, onTeleportHandled]);

  // Initial report on mount
  useEffect(() => {
    onPlayerPositionChange?.([pos.current.x, pos.current.y, pos.current.z], yaw.current);
  }, [onPlayerPositionChange]);

  const keys = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
  });

  const lastSpacePressed = useRef(false);
  const hoveredRef = useRef<WorldInteractable | null>(null);

  useEffect(() => {
    const dom = gl.domElement;

    const onPointerDown = () => {
      if (!isLocked.current) {
        dom.requestPointerLock?.();
      }
    };

    const onLockChange = () => {
      isLocked.current = document.pointerLockElement === dom;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isLocked.current) return;
      const sensitivity = 0.0022;
      yaw.current -= e.movementX * sensitivity;
      pitch.current -= e.movementY * sensitivity;

      const maxPitch = Math.PI / 2.15;
      pitch.current = Math.max(-maxPitch, Math.min(maxPitch, pitch.current));
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code.toLowerCase();
      if (code === "keyw") keys.current.w = true;
      if (code === "keys") keys.current.s = true;
      if (code === "keya") keys.current.a = true;
      if (code === "keyd") keys.current.d = true;
      if (code === "space") {
        keys.current.space = true;
        if (!lastSpacePressed.current && hoveredRef.current) {
          if (hoveredRef.current.id === "CINEMA_PROJECTOR") {
            onToggleProjector();
          }
          onInteract(hoveredRef.current);
        }
        lastSpacePressed.current = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const code = e.code.toLowerCase();
      if (code === "keyw") keys.current.w = false;
      if (code === "keys") keys.current.s = false;
      if (code === "keya") keys.current.a = false;
      if (code === "keyd") keys.current.d = false;
      if (code === "space") {
        keys.current.space = false;
        lastSpacePressed.current = false;
      }
    };

    dom.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointerlockchange", onLockChange);
    document.addEventListener("mousemove", onMouseMove);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      dom.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      if (document.pointerLockElement === dom) {
        document.exitPointerLock?.();
      }
    };
  }, [gl, onInteract, onToggleProjector]);

  // Spatial Navigation & Collision Check
  const isPointWalkable = (x: number, z: number): boolean => {
    // 1. Must be inside at least one walkable room/corridor bounding box
    const inWalkable = WALKABLE_BOUNDS.some(
      (b) => x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ
    );
    if (!inWalkable) return false;

    // 2. Must NOT be inside any solid obstacle
    const inObstacle = OBSTACLE_BOUNDS.some(
      (b) => x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ
    );
    return !inObstacle;
  };

  useFrame((_, delta) => {
    const forwardX = -Math.sin(yaw.current);
    const forwardZ = -Math.cos(yaw.current);
    const rightX = Math.cos(yaw.current);
    const rightZ = -Math.sin(yaw.current);

    let moveX = 0;
    let moveZ = 0;

    if (keys.current.w) {
      moveX += forwardX;
      moveZ += forwardZ;
    }
    if (keys.current.s) {
      moveX -= forwardX;
      moveZ -= forwardZ;
    }
    if (keys.current.d) {
      moveX += rightX;
      moveZ += rightZ;
    }
    if (keys.current.a) {
      moveX -= rightX;
      moveZ -= rightZ;
    }

    const moveLength = Math.hypot(moveX, moveZ);
    if (moveLength > 0.001) {
      moveX = (moveX / moveLength) * 3.8;
      moveZ = (moveZ / moveLength) * 3.8;
      walkTimer.current += delta * 7;
    } else {
      walkTimer.current = 0;
    }

    const smoothFactor = 1 - Math.exp(-delta * 10);
    vel.current.x += (moveX - vel.current.x) * smoothFactor;
    vel.current.z += (moveZ - vel.current.z) * smoothFactor;

    const currX = pos.current.x;
    const currZ = pos.current.z;
    const nextX = currX + vel.current.x * delta;
    const nextZ = currZ + vel.current.z * delta;

    // Smooth wall sliding collision
    let finalX = currX;
    let finalZ = currZ;

    if (isPointWalkable(nextX, nextZ)) {
      finalX = nextX;
      finalZ = nextZ;
    } else if (isPointWalkable(nextX, currZ)) {
      finalX = nextX;
    } else if (isPointWalkable(currX, nextZ)) {
      finalZ = nextZ;
    }

    pos.current.x = finalX;
    pos.current.z = finalZ;

    // Head bob
    let bobY = 0;
    let bobX = 0;
    if (!reducedMotion && moveLength > 0.001) {
      bobY = Math.sin(walkTimer.current * 1.5) * 0.022;
      bobX = Math.cos(walkTimer.current * 0.75) * 0.012;
    }

    camera.position.set(pos.current.x + bobX, pos.current.y + bobY, pos.current.z);
    camera.rotation.set(pitch.current, yaw.current, 0, "YXZ");

    // Interaction Raycast Check across all 5 rooms
    const lookDir = new THREE.Vector3();
    camera.getWorldDirection(lookDir);

    let nearestItem: WorldInteractable | null = null;
    let nearestDist = 999;

    for (const item of ALL_WORLD_INTERACTABLES) {
      const itemPos = new THREE.Vector3(...item.position);
      const toItem = itemPos.clone().sub(camera.position);
      const dist = toItem.length();

      if (dist <= item.radius) {
        toItem.normalize();
        const dot = lookDir.dot(toItem);
        if (dot > 0.62 && dist < nearestDist) {
          nearestDist = dist;
          nearestItem = item;
        }
      }
    }

    // Report live position updates to Minimap / HUD
    frameCount.current += 1;
    if (frameCount.current % 3 === 0) {
      const currPosTuple: [number, number, number] = [pos.current.x, pos.current.y, pos.current.z];
      const dx = Math.abs(currPosTuple[0] - lastReportedPos.current[0]);
      const dz = Math.abs(currPosTuple[2] - lastReportedPos.current[2]);
      const dyaw = Math.abs(yaw.current - lastReportedYaw.current);
      if (dx > 0.03 || dz > 0.03 || dyaw > 0.03 || frameCount.current % 18 === 0) {
        lastReportedPos.current = currPosTuple;
        lastReportedYaw.current = yaw.current;
        onPlayerPositionChange?.(currPosTuple, yaw.current);
      }
    }

    if (hoveredRef.current?.id !== nearestItem?.id) {
      hoveredRef.current = nearestItem;
      onHoverInteractable(nearestItem);
    }
  });

  return null;
}

// ============================================================================
// REUSABLE VISIBLE LIGHT FIXTURE PRIMITIVES
// ============================================================================

/** Industrial ceiling fixture with visible housing, emissive diffuser and point light */
function CeilingLightPanel({
  position,
  color = "#f8fafc",
  intensity = 2.8,
  distance = 14,
  size = [1.6, 0.08, 0.45] as [number, number, number],
}: {
  position: [number, number, number];
  color?: string;
  intensity?: number;
  distance?: number;
  size?: [number, number, number];
}) {
  return (
    <group position={position}>
      {/* Dark Steel Fixture Frame */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[size[0] + 0.12, 0.06, size[2] + 0.12]} />
        <meshStandardMaterial color="#222730" metalness={0.8} roughness={0.4} />
      </mesh>
      {/* High-Emissive Diffuser Glow Panel */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={3.2} />
      </mesh>
      {/* Practical Downward Illumination */}
      <pointLight position={[0, -0.25, 0]} color={color} intensity={intensity} distance={distance} />
    </group>
  );
}

/** Visible wall-mounted emergency / accent lamp */
function WallLampFixture({
  position,
  rotation = [0, 0, 0] as [number, number, number],
  color = "#ef4444",
  intensity = 2.4,
  distance = 10,
  lightRef,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  intensity?: number;
  distance?: number;
  lightRef?: React.RefObject<THREE.PointLight | null>;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Wall Bracket */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[0.18, 0.28, 0.1]} />
        <meshStandardMaterial color="#222730" metalness={0.8} />
      </mesh>
      {/* Glowing Bulb Housing */}
      <mesh position={[0, 0, 0.08]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={3.6} />
      </mesh>
      {/* Point Light */}
      <pointLight ref={lightRef} position={[0, 0, 0.25]} color={color} intensity={intensity} distance={distance} />
    </group>
  );
}

// ============================================================================
// 1. MAIN STUDIO HUB (Center 0, 0, 0)
// ============================================================================
function MainStudioHub() {
  const leftConeRef = useRef<THREE.Mesh>(null);
  const rightConeRef = useRef<THREE.Mesh>(null);
  const redLightRef = useRef<THREE.PointLight>(null);
  const crtLightRef = useRef<THREE.PointLight>(null);

  const stencilTex = useMemo(
    () => createStencilTexture("AMITDIED // NODE 01", "FACILITY LEVEL -2 • MAIN STUDIO HUB"),
    []
  );

  useFrame(() => {
    if (typeof document !== "undefined") {
      const rawBass = document.documentElement.style.getPropertyValue("--audio-bass-scale");
      const rawCrt = document.documentElement.style.getPropertyValue("--audio-crt-opacity");
      const bassScale = parseFloat(rawBass) || 1.0;
      const crtOpacity = parseFloat(rawCrt) || 0.20;

      // Speaker woofer subtle excursion to bass
      const excursion = (bassScale - 1.0) * 0.45;
      if (leftConeRef.current) leftConeRef.current.position.z = 0.165 + excursion;
      if (rightConeRef.current) rightConeRef.current.position.z = 0.165 + excursion;

      // Lights pulse slightly above readable baseline
      if (redLightRef.current) redLightRef.current.intensity = 2.6 + (bassScale - 1) * 12;
      if (crtLightRef.current) crtLightRef.current.intensity = 1.8 + (crtOpacity - 0.2) * 2.5;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Floor & Ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#252a34" roughness={0.82} metalness={0.2} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.6, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#1a1e26" roughness={0.9} />
      </mesh>

      {/* Walls with Doorways */}
      {/* South Wall (Solid with Stencil) */}
      <mesh position={[0, 1.8, 5]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[10, 3.6]} />
        <meshStandardMaterial color="#202530" roughness={0.85} />
      </mesh>
      {/* Painted Wall Stencil */}
      <mesh position={[0, 2.2, 4.96]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[4.2, 1.05]} />
        <meshBasicMaterial map={stencilTex} transparent opacity={0.85} />
      </mesh>

      {/* North Wall with Hallway Opening (to Cinema) */}
      <mesh position={[-3.1, 1.8, -5]}>
        <planeGeometry args={[3.8, 3.6]} />
        <meshStandardMaterial color="#202530" />
      </mesh>
      <mesh position={[3.1, 1.8, -5]}>
        <planeGeometry args={[3.8, 3.6]} />
        <meshStandardMaterial color="#202530" />
      </mesh>
      <mesh position={[0, 3.2, -5]}>
        <planeGeometry args={[2.4, 0.8]} />
        <meshStandardMaterial color="#202530" />
      </mesh>

      {/* West Wall with Doorway (to Beat Room) */}
      <mesh position={[-5, 1.8, -3.1]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[3.8, 3.6]} />
        <meshStandardMaterial color="#202530" />
      </mesh>
      <mesh position={[-5, 1.8, 3.1]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[3.8, 3.6]} />
        <meshStandardMaterial color="#202530" />
      </mesh>
      <mesh position={[-5, 3.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2.4, 0.8]} />
        <meshStandardMaterial color="#202530" />
      </mesh>

      {/* East Wall with Doorway (to CCTV Room) */}
      <mesh position={[5, 1.8, -3.1]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[3.8, 3.6]} />
        <meshStandardMaterial color="#202530" />
      </mesh>
      <mesh position={[5, 1.8, 3.1]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[3.8, 3.6]} />
        <meshStandardMaterial color="#202530" />
      </mesh>
      <mesh position={[5, 3.2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[2.4, 0.8]} />
        <meshStandardMaterial color="#202530" />
      </mesh>

      {/* ======================================================== */}
      {/* VISIBLE INDUSTRIAL CEILING LIGHT FIXTURES */}
      {/* ======================================================== */}
      {/* 1. Center Overhead Panel */}
      <CeilingLightPanel position={[0, 3.55, 0]} color="#f8fafc" intensity={3.0} distance={14} size={[1.8, 0.08, 0.45]} />
      {/* 2. North Overhead Panel directly illuminating workstation & desk */}
      <CeilingLightPanel position={[0, 3.55, -2.4]} color="#f1f5f9" intensity={2.8} distance={12} size={[2.2, 0.08, 0.45]} />
      {/* 3. South Overhead Panel illuminating entryway & stencil */}
      <CeilingLightPanel position={[0, 3.55, 2.4]} color="#f8fafc" intensity={2.5} distance={12} size={[1.8, 0.08, 0.45]} />

      {/* Visible Wall-Mounted Red Accent Lamp */}
      <WallLampFixture
        position={[-4.85, 2.7, -4.6]}
        rotation={[0, Math.PI / 4, 0]}
        color="#ff2233"
        intensity={2.6}
        distance={10}
        lightRef={redLightRef}
      />

      {/* STUDIO DESK & RIG */}
      <group position={[0, 0, -2.4]}>
        {/* Soft fill light across desk controls */}
        <pointLight position={[0, 1.3, 0.2]} color="#cbd5e1" intensity={1.5} distance={6} />

        {/* Table Top */}
        <mesh position={[0, 0.75, 0]}>
          <boxGeometry args={[3.0, 0.08, 1.3]} />
          <meshStandardMaterial color="#2a2e38" roughness={0.7} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.95, -0.35]}>
          <boxGeometry args={[2.6, 0.05, 0.38]} />
          <meshStandardMaterial color="#222630" roughness={0.8} />
        </mesh>
        {/* Legs */}
        <mesh position={[-1.35, 0.375, 0.45]}>
          <boxGeometry args={[0.08, 0.75, 0.08]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
        <mesh position={[1.35, 0.375, 0.45]}>
          <boxGeometry args={[0.08, 0.75, 0.08]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>

        {/* CRT Computer on Shelf */}
        <group position={[0, 1.22, -0.35]}>
          <mesh>
            <boxGeometry args={[0.7, 0.5, 0.48]} />
            <meshStandardMaterial color="#2b313c" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0, 0.245]}>
            <planeGeometry args={[0.6, 0.42]} />
            <meshStandardMaterial color="#06241b" emissive="#10b981" emissiveIntensity={2.0} />
          </mesh>
          <pointLight ref={crtLightRef} position={[0, 0, 0.4]} color="#34d399" intensity={1.8} distance={5.0} />
        </group>

        {/* Left & Right Studio Monitors with Audio-reactive Woofer excursion */}
        <group position={[-1.1, 1.25, -0.35]} rotation={[0, 0.22, 0]}>
          <mesh>
            <boxGeometry args={[0.28, 0.46, 0.3]} />
            <meshStandardMaterial color="#1a1c22" roughness={0.6} />
          </mesh>
          <mesh ref={leftConeRef} position={[0, -0.07, 0.155]}>
            <circleGeometry args={[0.085, 16]} />
            <meshStandardMaterial color="#dc2626" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.12, 0.155]}>
            <circleGeometry args={[0.038, 16]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
        </group>

        <group position={[1.1, 1.25, -0.35]} rotation={[0, -0.22, 0]}>
          <mesh>
            <boxGeometry args={[0.28, 0.46, 0.3]} />
            <meshStandardMaterial color="#1a1c22" roughness={0.6} />
          </mesh>
          <mesh ref={rightConeRef} position={[0, -0.07, 0.155]}>
            <circleGeometry args={[0.085, 16]} />
            <meshStandardMaterial color="#dc2626" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.12, 0.155]}>
            <circleGeometry args={[0.038, 16]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
        </group>

        {/* Mixer console */}
        <group position={[0, 0.82, 0.2]} rotation={[-0.12, 0, 0]}>
          <mesh>
            <boxGeometry args={[1.15, 0.06, 0.52]} />
            <meshStandardMaterial color="#252a35" roughness={0.6} metalness={0.4} />
          </mesh>
          <mesh position={[0, 0.035, 0]}>
            <boxGeometry args={[1.05, 0.01, 0.44]} />
            <meshStandardMaterial color="#111" emissive="#991b1b" emissiveIntensity={0.35} />
          </mesh>
        </group>
      </group>

      {/* Producer Chair */}
      <group position={[0, 0, -1.0]}>
        <mesh position={[0, 0.48, 0]}>
          <boxGeometry args={[0.52, 0.08, 0.52]} />
          <meshStandardMaterial color="#282c35" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.85, -0.24]}>
          <boxGeometry args={[0.48, 0.62, 0.06]} />
          <meshStandardMaterial color="#22262e" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.24, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.48, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
      </group>

      {/* Equipment Racks & Flight cases */}
      <group position={[-4.2, 0.35, -3.8]}>
        <mesh>
          <boxGeometry args={[1.1, 0.7, 0.85]} />
          <meshStandardMaterial color="#20242c" roughness={0.6} metalness={0.4} />
        </mesh>
      </group>

      {/* Flight cases & Secret 01 Hidden Patch Bay */}
      <group position={[3.8, 0.45, -3.2]}>
        <mesh>
          <boxGeometry args={[1.0, 0.9, 0.8]} />
          <meshStandardMaterial color="#20242c" roughness={0.6} metalness={0.4} />
        </mesh>
        {/* Hidden Patch Bay behind case */}
        <mesh position={[0, 0.2, 0.42]}>
          <boxGeometry args={[0.6, 0.35, 0.05]} />
          <meshStandardMaterial color="#27221f" />
        </mesh>
        <mesh position={[0.2, 0.25, 0.46]}>
          <sphereGeometry args={[0.022, 12, 12]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={3.0} />
        </mesh>
      </group>
    </group>
  );
}

// ============================================================================
// 2. BEAT ROOM (West Room at X: -14, Z: 0)
// ============================================================================
function BeatRoom({ discoveredArtifactIds = [] }: { discoveredArtifactIds?: string[] }) {
  const beatLightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (typeof document !== "undefined" && beatLightRef.current) {
      const rawBass = document.documentElement.style.getPropertyValue("--audio-bass-scale");
      const bassScale = parseFloat(rawBass) || 1.0;
      // Warm red ambient glow pulses with bass (baseline 3.0)
      beatLightRef.current.intensity = 3.0 + (bassScale - 1.0) * 14;
    }
  });

  return (
    <group position={[-14, 0, 0]}>
      {/* Floor & Ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#2d2222" roughness={0.85} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.6, 0]}>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#201818" roughness={0.92} />
      </mesh>

      {/* Walls */}
      {/* West Wall */}
      <mesh position={[-5, 1.8, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[8, 3.6]} />
        <meshStandardMaterial color="#241a1a" />
      </mesh>
      {/* North Wall */}
      <mesh position={[0, 1.8, -4]}>
        <planeGeometry args={[10, 3.6]} />
        <meshStandardMaterial color="#241a1a" />
      </mesh>
      {/* South Wall */}
      <mesh position={[0, 1.8, 4]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[10, 3.6]} />
        <meshStandardMaterial color="#241a1a" />
      </mesh>
      {/* East Wall with Doorway to Corridor */}
      <mesh position={[5, 1.8, -2.6]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[2.8, 3.6]} />
        <meshStandardMaterial color="#241a1a" />
      </mesh>
      <mesh position={[5, 1.8, 2.6]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[2.8, 3.6]} />
        <meshStandardMaterial color="#241a1a" />
      </mesh>
      <mesh position={[5, 3.2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[2.4, 0.8]} />
        <meshStandardMaterial color="#241a1a" />
      </mesh>

      {/* ======================================================== */}
      {/* VISIBLE CEILING STRIP LIGHTS & PRACTICALS */}
      {/* ======================================================== */}
      {/* 1. West Ceiling Strip Fixture */}
      <CeilingLightPanel position={[-2.0, 3.55, 0]} color="#fef3c7" intensity={3.2} distance={14} size={[0.4, 0.08, 4.8]} />
      {/* 2. East Ceiling Strip Fixture */}
      <CeilingLightPanel position={[2.0, 3.55, 0]} color="#fef3c7" intensity={3.2} distance={14} size={[0.4, 0.08, 4.8]} />

      {/* Visible Red Sconce Lamp on South Wall */}
      <WallLampFixture
        position={[0, 2.8, 3.9]}
        rotation={[0, Math.PI, 0]}
        color="#ef4444"
        intensity={3.0}
        distance={12}
        lightRef={beatLightRef}
      />

      {/* Shelves & Collectibles Illumination Fill */}
      <pointLight position={[0, 2.0, -2.8]} color="#fde68a" intensity={2.0} distance={8} />

      {/* Shelving Units with Vinyl Records & Tapes */}
      {/* North Shelves */}
      <group position={[0, 0, -3.4]}>
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[4.2, 2.4, 0.4]} />
          <meshStandardMaterial color="#352828" roughness={0.8} />
        </mesh>
        {/* Record Crates */}
        {[-1.4, 0, 1.4].map((x, i) => (
          <mesh key={i} position={[x, 0.4, 0.4]}>
            <boxGeometry args={[0.9, 0.45, 0.45]} />
            <meshStandardMaterial color="#4a2c2c" roughness={0.7} />
          </mesh>
        ))}
      </group>

      {/* BEAT ARCHIVE TERMINAL WORKSTATION */}
      <group position={[0, 0, 0.2]}>
        {/* Localized warm equipment illumination */}
        <pointLight position={[0, 1.3, 0]} color="#fef3c7" intensity={1.8} distance={6} />

        {/* Table Top */}
        <mesh position={[0, 0.75, 0]}>
          <boxGeometry args={[2.8, 0.08, 1.2]} />
          <meshStandardMaterial color="#2d2222" roughness={0.7} />
        </mesh>
        <mesh position={[-1.2, 0.375, 0.4]}>
          <boxGeometry args={[0.08, 0.75, 0.08]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
        <mesh position={[1.2, 0.375, 0.4]}>
          <boxGeometry args={[0.08, 0.75, 0.08]} />
          <meshStandardMaterial color="#475569" />
        </mesh>

        {/* CRT Monitor Unit */}
        <group position={[-0.4, 1.15, -0.2]}>
          <mesh>
            <boxGeometry args={[0.65, 0.48, 0.45]} />
            <meshStandardMaterial color="#2b2d35" roughness={0.7} />
          </mesh>
          {/* Green Phosphor CRT Screen Face */}
          <mesh position={[0, 0, 0.23]}>
            <planeGeometry args={[0.55, 0.38]} />
            <meshStandardMaterial color="#062215" emissive="#10b981" emissiveIntensity={2.0} />
          </mesh>
          <pointLight position={[0, 0, 0.35]} color="#10b981" intensity={2.0} distance={5.0} />
        </group>

        {/* Terminal Keyboard */}
        <group position={[-0.4, 0.81, 0.2]}>
          <mesh>
            <boxGeometry args={[0.52, 0.03, 0.2]} />
            <meshStandardMaterial color="#2d3138" />
          </mesh>
        </group>

        {/* Small Mixer / Drum Sampler on Table */}
        <group position={[0.65, 0.84, 0]} rotation={[-0.08, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.7, 0.08, 0.5]} />
            <meshStandardMaterial color="#382828" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.045, 0.08]}>
            <boxGeometry args={[0.6, 0.01, 0.3]} />
            <meshStandardMaterial color="#450a0a" emissive="#dc2626" emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[0, 0.045, -0.14]}>
            <planeGeometry args={[0.28, 0.09]} />
            <meshStandardMaterial color="#166534" emissive="#22c55e" emissiveIntensity={1.8} />
          </mesh>
        </group>

        {/* Red Status LED on Table edge */}
        <mesh position={[-1.2, 0.81, 0.4]}>
          <sphereGeometry args={[0.024, 12, 12]} />
          <meshStandardMaterial color="#ff1122" emissive="#ff1122" emissiveIntensity={3.5} />
        </mesh>
        <pointLight position={[-1.2, 0.83, 0.4]} color="#ff1122" intensity={1.0} distance={3.0} />

        {/* Cable Coils running to floor */}
        <mesh position={[-0.4, 0.3, -0.45]}>
          <cylinderGeometry args={[0.018, 0.018, 0.65, 8]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[0.6, 0.3, -0.45]}>
          <cylinderGeometry args={[0.018, 0.018, 0.65, 8]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* 8 PHYSICAL COLLECTIBLE OBJECTS (HIGHLIGHT IF COLLECTED) */}
      {/* ======================================================== */}
      {/* Vinyl 1 */}
      <group position={[1.5, 0.85, -3.2]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.28, 0.28, 0.015, 24]} />
          <meshStandardMaterial color="#111" roughness={0.2} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.09, 16]} />
          <meshStandardMaterial
            color={discoveredArtifactIds.includes("VINYL_001") ? "#22c55e" : "#dc2626"}
            emissive={discoveredArtifactIds.includes("VINYL_001") ? "#22c55e" : "#dc2626"}
            emissiveIntensity={discoveredArtifactIds.includes("VINYL_001") ? 2.0 : 0.6}
          />
        </mesh>
      </group>

      {/* Vinyl 2 */}
      <group position={[-1.8, 0.85, -3.2]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.28, 0.28, 0.015, 24]} />
          <meshStandardMaterial color="#111" roughness={0.2} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.09, 16]} />
          <meshStandardMaterial
            color={discoveredArtifactIds.includes("VINYL_002") ? "#22c55e" : "#f97316"}
            emissive={discoveredArtifactIds.includes("VINYL_002") ? "#22c55e" : "#f97316"}
            emissiveIntensity={discoveredArtifactIds.includes("VINYL_002") ? 2.0 : 0.6}
          />
        </mesh>
      </group>

      {/* Vinyl 3 */}
      <group position={[-3.2, 0.85, 1.8]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.28, 0.28, 0.015, 24]} />
          <meshStandardMaterial color="#111" roughness={0.2} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.09, 16]} />
          <meshStandardMaterial
            color={discoveredArtifactIds.includes("VINYL_003") ? "#22c55e" : "#e11d48"}
            emissive={discoveredArtifactIds.includes("VINYL_003") ? "#22c55e" : "#e11d48"}
            emissiveIntensity={discoveredArtifactIds.includes("VINYL_003") ? 2.0 : 0.6}
          />
        </mesh>
      </group>

      {/* Cassette 1 */}
      <group position={[3.2, 0.85, -1.8]}>
        <mesh>
          <boxGeometry args={[0.18, 0.03, 0.12]} />
          <meshStandardMaterial
            color={discoveredArtifactIds.includes("TAPE_001") ? "#166534" : "#4a2a2a"}
            emissive={discoveredArtifactIds.includes("TAPE_001") ? "#22c55e" : "#7f1d1d"}
            emissiveIntensity={discoveredArtifactIds.includes("TAPE_001") ? 1.8 : 0.4}
            roughness={0.5}
          />
        </mesh>
      </group>

      {/* Cassette 2 */}
      <group position={[0.4, 0.85, 3.2]}>
        <mesh>
          <boxGeometry args={[0.18, 0.03, 0.12]} />
          <meshStandardMaterial
            color={discoveredArtifactIds.includes("TAPE_002") ? "#166534" : "#2b2b3a"}
            emissive={discoveredArtifactIds.includes("TAPE_002") ? "#22c55e" : "#3b82f6"}
            emissiveIntensity={discoveredArtifactIds.includes("TAPE_002") ? 1.8 : 0.4}
            roughness={0.5}
          />
        </mesh>
      </group>

      {/* Cassette 3 */}
      <group position={[-1.8, 0.85, 3.2]}>
        <mesh>
          <boxGeometry args={[0.18, 0.03, 0.12]} />
          <meshStandardMaterial
            color={discoveredArtifactIds.includes("TAPE_003") ? "#166534" : "#4a2828"}
            emissive={discoveredArtifactIds.includes("TAPE_003") ? "#22c55e" : "#b91c1c"}
            emissiveIntensity={discoveredArtifactIds.includes("TAPE_003") ? 1.8 : 0.4}
            roughness={0.5}
          />
        </mesh>
      </group>

      {/* CD 1 */}
      <group position={[2.8, 0.85, 2.4]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.008, 20]} />
          <meshStandardMaterial
            color={discoveredArtifactIds.includes("CD_001") ? "#86efac" : "#e2e8f0"}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* CD 2 */}
      <group position={[-0.2, 0.88, -0.6]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.008, 20]} />
          <meshStandardMaterial
            color={discoveredArtifactIds.includes("CD_002") ? "#86efac" : "#f1f5f9"}
            metalness={0.95}
            roughness={0.1}
          />
        </mesh>
      </group>
    </group>
  );
}

// ============================================================================
// 3. CCTV SURVEILLANCE ROOM (East Room at X: 14, Z: 0)
// ============================================================================
function CctvRoom({ isCctvTerminalOpen }: { isCctvTerminalOpen?: boolean }) {
  const cctvLightRef = useRef<THREE.PointLight>(null);

  // Monitor Bank Screen Textures
  const screen1 = useMemo(() => createCctvMonitorTexture("01 [STUDIO]", "ONLINE // 1080P", true), []);
  const screen2 = useMemo(() => createCctvMonitorTexture("02 [VAULT]", "NO SIGNAL", false), []);
  const screen3 = useMemo(() => createCctvMonitorTexture("03 [HALLWAY]", "CAMERA OFFLINE", false), []);
  const screen4 = useMemo(() => createCctvMonitorTexture("04 [CINEMA]", "LIVE FEED", true), []);
  const screen5 = useMemo(() => createCctvMonitorTexture("05 [PERIMETER]", "ACTIVE SCAN", true), []);
  const screen6 = useMemo(() => createCctvMonitorTexture("06 [ARCHIVE]", "ACCESS RESTRICTED", false), []);

  useFrame(({ clock }) => {
    if (typeof document !== "undefined" && cctvLightRef.current) {
      const rawCrt = document.documentElement.style.getPropertyValue("--audio-crt-opacity");
      const crtOpacity = parseFloat(rawCrt) || 0.20;
      const baseIntensity = isCctvTerminalOpen ? 3.6 : 3.0;
      const flicker = isCctvTerminalOpen ? Math.sin(clock.getElapsedTime() * 16) * 0.15 : 0;
      // High-frequency monitor flicker / cyan pulse (baseline 3.0)
      cctvLightRef.current.intensity = baseIntensity + (crtOpacity - 0.20) * 3.0 + flicker;
    }
  });

  return (
    <group position={[14, 0, 0]}>
      {/* Floor & Ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#1e2733" roughness={0.82} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.6, 0]}>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#141c26" roughness={0.92} />
      </mesh>

      {/* Walls */}
      <mesh position={[0, 1.8, -4]}>
        <planeGeometry args={[10, 3.6]} />
        <meshStandardMaterial color="#18202a" />
      </mesh>
      <mesh position={[0, 1.8, 4]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[10, 3.6]} />
        <meshStandardMaterial color="#18202a" />
      </mesh>
      {/* West Wall with Doorway to Corridor */}
      <mesh position={[-5, 1.8, -2.6]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2.8, 3.6]} />
        <meshStandardMaterial color="#18202a" />
      </mesh>
      <mesh position={[-5, 1.8, 2.6]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2.8, 3.6]} />
        <meshStandardMaterial color="#18202a" />
      </mesh>
      <mesh position={[-5, 3.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2.4, 0.8]} />
        <meshStandardMaterial color="#18202a" />
      </mesh>
      {/* East Solid Wall (Monitor Bank Wall) */}
      <mesh position={[5, 1.8, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[8, 3.6]} />
        <meshStandardMaterial color="#141c24" />
      </mesh>

      {/* ======================================================== */}
      {/* VISIBLE COOL WHITE/CYAN CEILING LIGHT PANELS */}
      {/* ======================================================== */}
      {/* 1. North Ceiling Panel */}
      <CeilingLightPanel position={[-1.2, 3.55, -1.8]} color="#e0f2fe" intensity={3.0} distance={14} size={[2.2, 0.08, 0.45]} />
      {/* 2. South Ceiling Panel */}
      <CeilingLightPanel position={[-1.2, 3.55, 1.8]} color="#e0f2fe" intensity={3.0} distance={14} size={[2.2, 0.08, 0.45]} />

      {/* Monitor Bank Glow onto surrounding walls & geometry */}
      <pointLight ref={cctvLightRef} position={[3.5, 2.0, 0]} color="#38bdf8" intensity={3.0} distance={14} />

      {/* West wall ambient bounce */}
      <pointLight position={[-3.0, 2.6, 0]} color="#0284c7" intensity={1.8} distance={10} />

      {/* ======================================================== */}
      {/* 6 CRT SCREENS ON EAST WALL */}
      {/* ======================================================== */}
      <group position={[4.85, 1.8, 0]} rotation={[0, -Math.PI / 2, 0]}>
        {/* Screen Grid: 2 rows of 3 screens */}
        {/* Row 1 Top */}
        <mesh position={[-1.8, 0.65, 0]}>
          <planeGeometry args={[1.4, 0.95]} />
          <meshBasicMaterial map={screen1} />
        </mesh>
        <mesh position={[0, 0.65, 0]}>
          <planeGeometry args={[1.4, 0.95]} />
          <meshBasicMaterial map={screen2} />
        </mesh>
        <mesh position={[1.8, 0.65, 0]}>
          <planeGeometry args={[1.4, 0.95]} />
          <meshBasicMaterial map={screen3} />
        </mesh>

        {/* Row 2 Bottom */}
        <mesh position={[-1.8, -0.65, 0]}>
          <planeGeometry args={[1.4, 0.95]} />
          <meshBasicMaterial map={screen4} />
        </mesh>
        <mesh position={[0, -0.65, 0]}>
          <planeGeometry args={[1.4, 0.95]} />
          <meshBasicMaterial map={screen5} />
        </mesh>
        <mesh position={[1.8, -0.65, 0]}>
          <planeGeometry args={[1.4, 0.95]} />
          <meshBasicMaterial map={screen6} />
        </mesh>
      </group>

      {/* Surveillance Desk & Control Terminal */}
      <group position={[2.5, 0, 0]}>
        {/* Soft fill across surveillance workstation */}
        <pointLight position={[0, 1.3, 0]} color="#38bdf8" intensity={2.0} distance={6} />

        <mesh position={[0, 0.75, 0]}>
          <boxGeometry args={[1.4, 0.08, 3.0]} />
          <meshStandardMaterial color="#252d38" roughness={0.7} />
        </mesh>
        {/* Terminal Keyboard & Controls */}
        <mesh position={[-0.2, 0.81, 0]}>
          <boxGeometry args={[0.6, 0.04, 1.2]} />
          <meshStandardMaterial color="#1e293b" emissive="#0284c7" emissiveIntensity={0.6} />
        </mesh>
        {/* Terminal Network Sync LED */}
        <mesh position={[-0.2, 0.84, 0.5]}>
          <sphereGeometry args={[0.024, 12, 12]} />
          <meshStandardMaterial
            color={isCctvTerminalOpen ? "#22d3ee" : "#ef4444"}
            emissive={isCctvTerminalOpen ? "#22d3ee" : "#ef4444"}
            emissiveIntensity={3.5}
          />
        </mesh>
      </group>
    </group>
  );
}

// ============================================================================
// 4. CINEMA / PROJECTION ROOM (North at X: 0, Z: -16)
// ============================================================================
function CinemaRoom({
  projectorActive,
  isCinemaTerminalOpen,
  cinemaScreenState,
}: {
  projectorActive: boolean;
  isCinemaTerminalOpen?: boolean;
  cinemaScreenState?: "offline" | "idle" | "projecting";
}) {
  const isPowered = projectorActive || isCinemaTerminalOpen;
  const currentScreenState = cinemaScreenState || (isPowered ? "idle" : "offline");

  const projectionTex = useMemo(
    () => createCinemaProjectionTexture(currentScreenState),
    [currentScreenState]
  );

  const beamRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (beamRef.current && isPowered) {
      // Subtle optical flicker in projection beam
      beamRef.current.rotation.z += delta * 0.05;
    }
  });

  return (
    <group position={[0, 0, -16]}>
      {/* Floor & Ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial color="#22222a" roughness={0.88} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4.0, 0]}>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial color="#16161f" roughness={0.92} />
      </mesh>

      {/* East & West Walls */}
      <mesh position={[-6, 2.0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[10, 4.0]} />
        <meshStandardMaterial color="#1c1c24" />
      </mesh>
      <mesh position={[6, 2.0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[10, 4.0]} />
        <meshStandardMaterial color="#1c1c24" />
      </mesh>

      {/* South Wall with Entry Hallway Opening */}
      <mesh position={[-3.8, 2.0, 5]}>
        <planeGeometry args={[4.4, 4.0]} />
        <meshStandardMaterial color="#1c1c24" />
      </mesh>
      <mesh position={[3.8, 2.0, 5]}>
        <planeGeometry args={[4.4, 4.0]} />
        <meshStandardMaterial color="#1c1c24" />
      </mesh>
      <mesh position={[0, 3.4, 5]}>
        <planeGeometry args={[3.2, 1.2]} />
        <meshStandardMaterial color="#1c1c24" />
      </mesh>

      {/* North Wall with Exit Doorway to Archive */}
      <mesh position={[-3.8, 2.0, -5]}>
        <planeGeometry args={[4.4, 4.0]} />
        <meshStandardMaterial color="#1c1c24" />
      </mesh>
      <mesh position={[3.8, 2.0, -5]}>
        <planeGeometry args={[4.4, 4.0]} />
        <meshStandardMaterial color="#1c1c24" />
      </mesh>
      <mesh position={[0, 3.4, -5]}>
        <planeGeometry args={[3.2, 1.2]} />
        <meshStandardMaterial color="#1c1c24" />
      </mesh>

      {/* ======================================================== */}
      {/* VISIBLE CINEMA CEILING FIXTURES & AISLE PRACTICALS */}
      {/* ======================================================== */}
      {/* 1. Left Ceiling Downlight Panel */}
      <CeilingLightPanel position={[-2.8, 3.95, 0]} color="#f1f5f9" intensity={2.2} distance={12} size={[1.4, 0.08, 0.4]} />
      {/* 2. Right Ceiling Downlight Panel */}
      <CeilingLightPanel position={[2.8, 3.95, 0]} color="#f1f5f9" intensity={2.2} distance={12} size={[1.4, 0.08, 0.4]} />

      {/* Aisle Amber Safety Step Lights */}
      {[-3.4, 3.4].map((x) =>
        [-1.5, 1.5].map((z) => (
          <group key={`${x}-${z}`} position={[x, 0.15, z]}>
            <mesh>
              <boxGeometry args={[0.08, 0.08, 0.08]} />
              <meshStandardMaterial color="#ffffff" emissive="#f59e0b" emissiveIntensity={3.0} />
            </mesh>
            <pointLight position={[0, 0.1, 0]} color="#f59e0b" intensity={0.9} distance={4} />
          </group>
        ))
      )}

      {/* ======================================================== */}
      {/* LARGE PROJECTION SCREEN ON NORTH WALL (Z: -4.8) */}
      {/* ======================================================== */}
      <group position={[0, 2.2, -4.75]}>
        {/* Screen Frame */}
        <mesh position={[0, 0, -0.05]}>
          <boxGeometry args={[6.4, 3.8, 0.1]} />
          <meshStandardMaterial color="#252a35" roughness={0.8} />
        </mesh>
        {/* Projected Canvas */}
        <mesh>
          <planeGeometry args={[6.2, 3.6]} />
          <meshBasicMaterial map={projectionTex} />
        </mesh>
        {/* Glow from screen into the room */}
        <pointLight
          position={[0, 0, 1.2]}
          color={isPowered ? (currentScreenState === "projecting" ? "#ff4444" : "#38bdf8") : "#ef4444"}
          intensity={isPowered ? 3.8 : 1.8}
          distance={14}
        />
      </group>

      {/* Projector Unit (South side pointing North) */}
      <group position={[0, 2.2, 3.5]}>
        <mesh>
          <boxGeometry args={[0.65, 0.35, 0.7]} />
          <meshStandardMaterial color="#302d2c" roughness={0.7} />
        </mesh>
        {/* Lens with visible practical glow */}
        <mesh position={[0, 0, -0.38]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.12, 16]} />
          <meshStandardMaterial
            color="#fff"
            emissive={isPowered ? "#f87171" : "#cbd5e1"}
            emissiveIntensity={isPowered ? 3.0 : 1.0}
          />
        </mesh>
        <pointLight
          position={[0, 0, -0.5]}
          color={isPowered ? "#fee2e2" : "#cbd5e1"}
          intensity={isPowered ? 4.0 : 1.5}
          distance={14}
        />
      </group>

      {/* Optical Projector Light Cone Beam */}
      {isPowered && (
        <mesh ref={beamRef} position={[0, 2.2, -0.6]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[2.8, 0.15, 8.2, 16, 1, true]} />
          <meshBasicMaterial
            color="#fee2e2"
            transparent
            opacity={0.10}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Projection Control Console Desk underneath Projector */}
      <group position={[0, 0, 3.5]}>
        {/* Desk Table */}
        <mesh position={[0, 0.75, 0]}>
          <boxGeometry args={[1.5, 0.08, 0.8]} />
          <meshStandardMaterial color="#2c2727" roughness={0.7} />
        </mesh>
        <mesh position={[-0.65, 0.375, 0.6]}>
          <boxGeometry args={[0.08, 0.75, 0.6]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
        <mesh position={[0.65, 0.375, 0.6]}>
          <boxGeometry args={[0.08, 0.75, 0.6]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
        {/* Control Surface with Switches & LEDs */}
        <mesh position={[0, 0.82, -0.1]}>
          <boxGeometry args={[0.8, 0.05, 0.35]} />
          <meshStandardMaterial color="#2d333e" roughness={0.6} />
        </mesh>
        {/* Projector Power Status LED */}
        <mesh position={[0.3, 0.86, -0.1]}>
          <sphereGeometry args={[0.024, 12, 12]} />
          <meshStandardMaterial
            color={isPowered ? "#22c55e" : "#ef4444"}
            emissive={isPowered ? "#22c55e" : "#ef4444"}
            emissiveIntensity={3.5}
          />
        </mesh>
      </group>

      {/* Secret 03: Concealed Optical Breaker Box */}
      <group position={[-5.85, 1.4, 2.5]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[0.3, 0.45, 0.1]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.05, 0.06]}>
          <boxGeometry args={[0.08, 0.16, 0.04]} />
          <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={3.0} />
        </mesh>
      </group>

      {/* Cinema Benches / Seats (Rows) */}
      {[-0.5, 1.5].map((z, rowIdx) => (
        <group key={rowIdx} position={[0, 0, z]}>
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[5.2, 0.08, 0.65]} />
            <meshStandardMaterial color="#451e23" roughness={0.8} />
          </mesh>
          <mesh position={[-2.4, 0.2, 0]}>
            <boxGeometry args={[0.1, 0.4, 0.5]} />
            <meshStandardMaterial color="#2d323c" />
          </mesh>
          <mesh position={[2.4, 0.2, 0]}>
            <boxGeometry args={[0.1, 0.4, 0.5]} />
            <meshStandardMaterial color="#2d323c" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ============================================================================
// 5. ARCHIVE / UNKNOWN MYSTERY AREA (North at X: 0, Z: -30)
// ============================================================================
function ArchiveArea({
  isNode04Unlocked = false,
  isNode04DoorOpen = false,
  discoveredArtifactIds = [],
}: {
  isNode04Unlocked?: boolean;
  isNode04DoorOpen?: boolean;
  discoveredArtifactIds?: string[];
}) {
  const flickerLightRef = useRef<THREE.PointLight>(null);
  const lockColor = isNode04Unlocked
    ? "#22c55e"
    : (discoveredArtifactIds?.length || 0) >= 4
    ? "#f59e0b"
    : "#ef4444";

  const doorSignTex = useMemo(
    () =>
      createStencilTexture(
        "NODE 04",
        isNode04Unlocked ? "ACCESS GRANTED // LEVEL 04" : "HIGH VOLTAGE // DO NOT OPEN",
        isNode04Unlocked ? "#22c55e" : "#dc2626"
      ),
    [isNode04Unlocked]
  );

  useFrame(({ clock }) => {
    if (flickerLightRef.current) {
      // Eerie intermittent fluorescent flicker (baseline 2.0 to 2.8)
      const t = clock.getElapsedTime();
      const flicker = Math.sin(t * 18) * Math.cos(t * 7);
      flickerLightRef.current.intensity = flicker > 0.4 ? 2.8 : 2.0;
    }
  });

  return (
    <group position={[0, 0, -30]}>
      {/* Floor & Ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 9]} />
        <meshStandardMaterial color="#22222a" roughness={0.88} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.6, 0]}>
        <planeGeometry args={[8, 9]} />
        <meshStandardMaterial color="#16161f" roughness={0.92} />
      </mesh>

      {/* East & West Solid Narrow Walls */}
      <mesh position={[-4, 1.8, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[9, 3.6]} />
        <meshStandardMaterial color="#1c1c26" />
      </mesh>
      <mesh position={[4, 1.8, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[9, 3.6]} />
        <meshStandardMaterial color="#1c1c26" />
      </mesh>

      {/* South Wall with Entry from Cinema */}
      <mesh position={[-2.6, 1.8, 4.5]}>
        <planeGeometry args={[2.8, 3.6]} />
        <meshStandardMaterial color="#1c1c26" />
      </mesh>
      <mesh position={[2.6, 1.8, 4.5]}>
        <planeGeometry args={[2.8, 3.6]} />
        <meshStandardMaterial color="#1c1c26" />
      </mesh>
      <mesh position={[0, 3.2, 4.5]}>
        <planeGeometry args={[2.4, 0.8]} />
        <meshStandardMaterial color="#1c1c26" />
      </mesh>

      {/* North Wall: Heavy Reinforced Locked Blast Door: NODE 04 */}
      <mesh position={[-2.6, 1.8, -4.5]}>
        <planeGeometry args={[2.8, 3.6]} />
        <meshStandardMaterial color="#1c1c26" />
      </mesh>
      <mesh position={[2.6, 1.8, -4.5]}>
        <planeGeometry args={[2.8, 3.6]} />
        <meshStandardMaterial color="#1c1c26" />
      </mesh>
      <mesh position={[0, 3.2, -4.5]}>
        <planeGeometry args={[2.4, 0.8]} />
        <meshStandardMaterial color="#1c1c26" />
      </mesh>

      {/* ======================================================== */}
      {/* VISIBLE INDUSTRIAL OVERHEAD LIGHT FIXTURES */}
      {/* ======================================================== */}
      {/* 1. South Overhead Fixture */}
      <CeilingLightPanel position={[0, 3.55, 2.2]} color="#f8fafc" intensity={2.8} distance={12} size={[1.6, 0.08, 0.4]} />
      {/* 2. North Overhead Flickering Fluorescent Tube Fixture */}
      <group position={[0, 3.55, -2.0]}>
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[1.7, 0.06, 0.5]} />
          <meshStandardMaterial color="#222730" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.5, 0.08, 0.38]} />
          <meshStandardMaterial color="#ffffff" emissive="#fee2e2" emissiveIntensity={3.2} />
        </mesh>
        <pointLight ref={flickerLightRef} position={[0, -0.25, 0]} color="#fee2e2" intensity={2.4} distance={12} />
      </group>

      {/* Visible Red Emergency Wall Sconce */}
      <WallLampFixture
        position={[-3.85, 2.6, 0]}
        rotation={[0, Math.PI / 2, 0]}
        color="#ef4444"
        intensity={2.2}
        distance={9}
      />

      {/* BLAST DOOR PROPS (SLIDES OPEN UPWARDS WHEN UNLOCKED) */}
      <group position={[0, isNode04DoorOpen ? 4.2 : 1.5, -4.42]}>
        <mesh>
          <boxGeometry args={[2.2, 3.0, 0.12]} />
          <meshStandardMaterial color="#302424" roughness={0.6} metalness={0.7} />
        </mesh>
        {/* Door Signage */}
        <mesh position={[0, 0.6, 0.07]}>
          <planeGeometry args={[1.8, 0.5]} />
          <meshBasicMaterial map={doorSignTex} transparent />
        </mesh>
        {/* Electronic Keypad Lock */}
        <mesh position={[0.85, 0, 0.09]}>
          <boxGeometry args={[0.18, 0.32, 0.05]} />
          <meshStandardMaterial color="#1e242d" />
        </mesh>
        <mesh position={[0.85, 0.08, 0.12]}>
          <boxGeometry args={[0.05, 0.05, 0.02]} />
          <meshStandardMaterial color={lockColor} emissive={lockColor} emissiveIntensity={3.5} />
        </mesh>
        <pointLight position={[0.85, 0.08, 0.3]} color={lockColor} intensity={1.8} distance={5.0} />
      </group>

      {/* Rusty Metal Storage Shelves & Crates along West Wall */}
      <group position={[-2.8, 0, 0]}>
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[0.8, 2.4, 3.6]} />
          <meshStandardMaterial color="#2d323c" roughness={0.9} metalness={0.5} />
        </mesh>
        {/* Storage Crates */}
        <mesh position={[0.6, 0.45, -0.6]}>
          <boxGeometry args={[0.9, 0.9, 0.9]} />
          <meshStandardMaterial color="#42322a" roughness={0.8} />
        </mesh>
        <mesh position={[0.6, 0.35, 0.8]}>
          <boxGeometry args={[0.7, 0.7, 0.8]} />
          <meshStandardMaterial color="#382b24" roughness={0.8} />
        </mesh>
      </group>

      {/* Secret 04: Concealed Data Canister on lower shelf */}
      <group position={[3.2, 0.45, -1.5]}>
        <mesh>
          <cylinderGeometry args={[0.12, 0.12, 0.35, 16]} />
          <meshStandardMaterial color="#3a1e1e" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.08, 16]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={3.0} />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* 6. NODE 04 SECRET VAULT CHAMBER (Behind Blast Door at Z: -34.5 to -41.5) */}
      {/* ======================================================== */}
      {isNode04DoorOpen && (
        <group position={[0, 0, -8.0]}>
          {/* Floor & Ceiling */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[7.2, 7.0]} />
            <meshStandardMaterial color="#261e24" roughness={0.85} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.6, 0]}>
            <planeGeometry args={[7.2, 7.0]} />
            <meshStandardMaterial color="#1a1418" />
          </mesh>

          {/* East, West, North Walls */}
          <mesh position={[-3.6, 1.8, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[7.0, 3.6]} />
            <meshStandardMaterial color="#221a20" />
          </mesh>
          <mesh position={[3.6, 1.8, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[7.0, 3.6]} />
            <meshStandardMaterial color="#221a20" />
          </mesh>
          <mesh position={[0, 1.8, -3.5]}>
            <planeGeometry args={[7.2, 3.6]} />
            <meshStandardMaterial color="#221a20" />
          </mesh>

          {/* Vault Overhead Light Fixture */}
          <CeilingLightPanel position={[0, 3.55, -1.5]} color="#f8fafc" intensity={3.0} distance={12} size={[1.6, 0.08, 0.45]} />

          {/* Eerie Vault Ambient Red & Cyan Pulse */}
          <pointLight position={[0, 2.6, -1.5]} color="#ef4444" intensity={3.2} distance={10} />
          <pointLight position={[0, 1.4, -2.8]} color="#06b6d4" intensity={2.0} distance={8} />

          {/* Center Mainframe Workstation Table */}
          <group position={[0, 0, -1.5]}>
            <mesh position={[0, 0.75, 0]}>
              <boxGeometry args={[2.4, 0.08, 1.2]} />
              <meshStandardMaterial color="#2f252c" roughness={0.7} />
            </mesh>
            <mesh position={[-1.0, 0.375, 0.4]}>
              <boxGeometry args={[0.08, 0.75, 0.08]} />
              <meshStandardMaterial color="#475569" />
            </mesh>
            <mesh position={[1.0, 0.375, 0.4]}>
              <boxGeometry args={[0.08, 0.75, 0.08]} />
              <meshStandardMaterial color="#475569" />
            </mesh>

            {/* NODE 04 CRT Mainframe Monitor */}
            <group position={[-0.3, 1.15, -0.2]}>
              <mesh>
                <boxGeometry args={[0.65, 0.48, 0.45]} />
                <meshStandardMaterial color="#322830" roughness={0.7} />
              </mesh>
              <mesh position={[0, 0, 0.23]}>
                <planeGeometry args={[0.55, 0.38]} />
                <meshStandardMaterial color="#062215" emissive="#10b981" emissiveIntensity={2.4} />
              </mesh>
              <pointLight position={[0, 0, 0.35]} color="#10b981" intensity={2.4} distance={6} />
            </group>

            {/* Vintage Reel-to-Reel Tape Machine */}
            <group position={[0.55, 0.95, -0.15]}>
              <mesh>
                <boxGeometry args={[0.6, 0.35, 0.35]} />
                <meshStandardMaterial color="#42302a" metalness={0.6} />
              </mesh>
              {/* Dual Tape Reels */}
              <mesh position={[-0.15, 0.08, 0.18]} rotation={[-Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.9} />
              </mesh>
              <mesh position={[0.15, 0.08, 0.18]} rotation={[-Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.9} />
              </mesh>
            </group>
          </group>
        </group>
      )}
    </group>
  );
}

// ============================================================================
// CONNECTING CORRIDORS WITH REPEATING CEILING LIGHT POOLS
// ============================================================================
function Corridors() {
  return (
    <group>
      {/* ======================================================== */}
      {/* 1. WEST CORRIDOR (Main Studio to Beat Room, X: -5 to -9, Z: 0) */}
      {/* ======================================================== */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-7, 0, 0]}>
        <planeGeometry args={[4, 2.4]} />
        <meshStandardMaterial color="#282222" roughness={0.85} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[-7, 3.6, 0]}>
        <planeGeometry args={[4, 2.4]} />
        <meshStandardMaterial color="#1a1414" />
      </mesh>
      <mesh position={[-7, 1.8, -1.2]}>
        <planeGeometry args={[4, 3.6]} />
        <meshStandardMaterial color="#221818" />
      </mesh>
      <mesh position={[-7, 1.8, 1.2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[4, 3.6]} />
        <meshStandardMaterial color="#221818" />
      </mesh>

      {/* 2 Repeating Ceiling Lights along West Corridor */}
      <CeilingLightPanel position={[-6.0, 3.55, 0]} color="#f8fafc" intensity={2.6} distance={9} size={[0.8, 0.08, 0.35]} />
      <CeilingLightPanel position={[-8.0, 3.55, 0]} color="#ef4444" intensity={2.6} distance={9} size={[0.8, 0.08, 0.35]} />

      {/* Secret 02: Wall Cipher Stencil */}
      <group position={[-7, 1.6, 1.15]}>
        <mesh rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.2, 0.4]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.8} />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* 2. EAST CORRIDOR (Main Studio to CCTV Room, X: 5 to 9, Z: 0) */}
      {/* ======================================================== */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[7, 0, 0]}>
        <planeGeometry args={[4, 2.4]} />
        <meshStandardMaterial color="#202733" roughness={0.85} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[7, 3.6, 0]}>
        <planeGeometry args={[4, 2.4]} />
        <meshStandardMaterial color="#141a24" />
      </mesh>
      <mesh position={[7, 1.8, -1.2]}>
        <planeGeometry args={[4, 3.6]} />
        <meshStandardMaterial color="#1a202a" />
      </mesh>
      <mesh position={[7, 1.8, 1.2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[4, 3.6]} />
        <meshStandardMaterial color="#1a202a" />
      </mesh>

      {/* 2 Repeating Ceiling Lights along East Corridor */}
      <CeilingLightPanel position={[6.0, 3.55, 0]} color="#f8fafc" intensity={2.6} distance={9} size={[0.8, 0.08, 0.35]} />
      <CeilingLightPanel position={[8.0, 3.55, 0]} color="#38bdf8" intensity={2.6} distance={9} size={[0.8, 0.08, 0.35]} />

      {/* ======================================================== */}
      {/* 3. NORTH HALLWAY 1 (Main Studio to Cinema, Z: -5 to -11, X: 0) */}
      {/* ======================================================== */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
        <planeGeometry args={[2.4, 6]} />
        <meshStandardMaterial color="#222730" roughness={0.85} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.6, -8]}>
        <planeGeometry args={[2.4, 6]} />
        <meshStandardMaterial color="#161a22" />
      </mesh>
      <mesh position={[-1.2, 1.8, -8]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[6, 3.6]} />
        <meshStandardMaterial color="#1c202a" />
      </mesh>
      <mesh position={[1.2, 1.8, -8]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[6, 3.6]} />
        <meshStandardMaterial color="#1c202a" />
      </mesh>

      {/* 3 Continuous Repeating Ceiling Lights along North Hallway 1 */}
      <CeilingLightPanel position={[0, 3.55, -6.5]} color="#f8fafc" intensity={2.5} distance={9} size={[1.2, 0.08, 0.35]} />
      <CeilingLightPanel position={[0, 3.55, -8.0]} color="#f8fafc" intensity={2.5} distance={9} size={[1.2, 0.08, 0.35]} />
      <CeilingLightPanel position={[0, 3.55, -9.5]} color="#f8fafc" intensity={2.5} distance={9} size={[1.2, 0.08, 0.35]} />

      {/* ======================================================== */}
      {/* 4. NORTH HALLWAY 2 (Cinema to Archive, Z: -21 to -25.5, X: 0) */}
      {/* ======================================================== */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -23.25]}>
        <planeGeometry args={[2.4, 4.5]} />
        <meshStandardMaterial color="#242228" roughness={0.88} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.6, -23.25]}>
        <planeGeometry args={[2.4, 4.5]} />
        <meshStandardMaterial color="#18161d" />
      </mesh>
      <mesh position={[-1.2, 1.8, -23.25]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[4.5, 3.6]} />
        <meshStandardMaterial color="#1e1c24" />
      </mesh>
      <mesh position={[1.2, 1.8, -23.25]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[4.5, 3.6]} />
        <meshStandardMaterial color="#1e1c24" />
      </mesh>

      {/* 2 Repeating Ceiling Lights along North Hallway 2 */}
      <CeilingLightPanel position={[0, 3.55, -22.2]} color="#fee2e2" intensity={2.5} distance={9} size={[1.2, 0.08, 0.35]} />
      <CeilingLightPanel position={[0, 3.55, -24.5]} color="#ef4444" intensity={2.5} distance={9} size={[1.2, 0.08, 0.35]} />
    </group>
  );
}

// ============================================================================
// MAIN EXPORTED WORLD SCENE
// ============================================================================
export function WorldScene({
  onHoverInteractable,
  onInteract,
  reducedMotion,
  projectorActive,
  onToggleProjector,
  isCctvTerminalOpen,
  isCinemaTerminalOpen,
  cinemaScreenState,
  discoveredArtifactIds = [],
  discoveredSecretIds = [],
  isNode04Unlocked = false,
  isNode04DoorOpen = false,
  onPlayerPositionChange,
  teleportTarget,
  onTeleportHandled,
}: WorldSceneProps) {
  return (
    <div className="absolute inset-0 w-full h-full cursor-crosshair">
      <Canvas
        camera={{ fov: 72, position: [0, 1.65, 2.5] }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.25,
        }}
        dpr={[1, 1.5]}
      >
        {/* Global Balanced Ambient Base and Soft Hemisphere Fill */}
        <ambientLight intensity={0.55} color="#475569" />
        <hemisphereLight args={["#64748b", "#334155", 0.45]} />

        {/* 1. Main Studio (Central Hub) */}
        <MainStudioHub />

        {/* 2. Beat Room (West) */}
        <BeatRoom discoveredArtifactIds={discoveredArtifactIds} />

        {/* 3. CCTV Room (East) */}
        <CctvRoom isCctvTerminalOpen={isCctvTerminalOpen} />

        {/* 4. Cinema Room (North) */}
        <CinemaRoom
          projectorActive={projectorActive}
          isCinemaTerminalOpen={isCinemaTerminalOpen}
          cinemaScreenState={cinemaScreenState}
        />

        {/* 5. Archive Mystery Area (Far North) */}
        <ArchiveArea
          isNode04Unlocked={isNode04Unlocked}
          isNode04DoorOpen={isNode04DoorOpen}
          discoveredArtifactIds={discoveredArtifactIds}
        />

        {/* Connecting Corridors */}
        <Corridors />

        {/* First-Person Controller with Multi-Room Physics & Interaction Raycasting */}
        <FirstPersonController
          onHoverInteractable={onHoverInteractable}
          onInteract={onInteract}
          reducedMotion={reducedMotion}
          onToggleProjector={onToggleProjector}
          onPlayerPositionChange={onPlayerPositionChange}
          teleportTarget={teleportTarget}
          onTeleportHandled={onTeleportHandled}
        />
      </Canvas>
    </div>
  );
}

export default WorldScene;
