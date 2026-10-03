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
import { NPCSystem, FriendNPCData } from "./NPCSystem";
import {
  createStencilTexture,
  createCctvMonitorTexture,
  createCinemaProjectionTexture,
} from "./proceduralTextures";

export type CameraMode = "FPP" | "TPP";

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
  cameraMode?: CameraMode;
  onCameraModeChange?: (mode: CameraMode) => void;
  onZoneTransition?: (zoneName: string) => void;
  onNearbyFriendChange?: (friend: FriendNPCData | null) => void;
}

// ============================================================================
// PROCEDURAL STREETWEAR PLAYER CHARACTER (FOR TPP VIEW)
// ============================================================================
function PlayerCharacter({
  posRef,
  yawRef,
  isMovingRef,
  walkTimerRef,
  visible,
}: {
  posRef: React.MutableRefObject<THREE.Vector3>;
  yawRef: React.MutableRefObject<number>;
  isMovingRef: React.MutableRefObject<boolean>;
  walkTimerRef: React.MutableRefObject<number>;
  visible: boolean;
}) {
  const charGroupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!charGroupRef.current) return;
    charGroupRef.current.position.set(posRef.current.x, posRef.current.y - 1.65, posRef.current.z);
    charGroupRef.current.rotation.y = yawRef.current;

    if (visible) {
      const swing = isMovingRef.current ? Math.sin(walkTimerRef.current * 1.5) * 0.45 : 0;
      const armSwing = isMovingRef.current ? Math.sin(walkTimerRef.current * 1.5) * 0.35 : 0;

      if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -armSwing;
      if (rightArmRef.current) rightArmRef.current.rotation.x = armSwing;
    }
  });

  if (!visible) return null;

  return (
    <group ref={charGroupRef}>
      {/* 1. HEAD & HOODIE / BEANIE SILHOUETTE */}
      <group position={[0, 1.52, 0]}>
        {/* Head Base */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshStandardMaterial color="#334155" roughness={0.7} />
        </mesh>
        {/* Oversized Beanie Hat */}
        <mesh position={[0, 0.06, -0.02]} rotation={[-0.15, 0, 0]}>
          <cylinderGeometry args={[0.17, 0.19, 0.16, 16]} />
          <meshStandardMaterial color="#09090b" roughness={0.9} />
        </mesh>
        {/* Beanie Woven Label Tag */}
        <mesh position={[0, 0.02, 0.165]}>
          <boxGeometry args={[0.06, 0.04, 0.01]} />
          <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={1.2} />
        </mesh>
        {/* Studio Headphones resting around neck */}
        <group position={[0, -0.12, 0]}>
          <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.18, 0.025, 8, 24, Math.PI * 1.6]} />
            <meshStandardMaterial color="#18181b" roughness={0.5} />
          </mesh>
          <mesh position={[-0.18, 0, 0.02]}>
            <cylinderGeometry args={[0.045, 0.045, 0.05, 12]} />
            <meshStandardMaterial color="#ef4444" roughness={0.4} />
          </mesh>
          <mesh position={[0.18, 0, 0.02]}>
            <cylinderGeometry args={[0.045, 0.045, 0.05, 12]} />
            <meshStandardMaterial color="#ef4444" roughness={0.4} />
          </mesh>
        </group>
      </group>

      {/* 2. OVERSIZED STREETWEAR T-SHIRT / TORSO */}
      <group position={[0, 1.05, 0]}>
        {/* Boxy Heavyweight T-Shirt */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.56, 0.68, 0.34]} />
          <meshStandardMaterial color="#121214" roughness={0.88} />
        </mesh>
        {/* Chest AMITDIED Stencil Graphic */}
        <mesh position={[0, 0.12, 0.172]}>
          <planeGeometry args={[0.26, 0.16]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#dc2626"
            emissiveIntensity={1.2}
            roughness={0.4}
          />
        </mesh>
        {/* Back Stencil Graphic */}
        <mesh position={[0, 0.08, -0.172]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.34, 0.32]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#b91c1c"
            emissiveIntensity={0.8}
            roughness={0.5}
          />
        </mesh>
      </group>

      {/* 3. ARMS WITH OVERSIZED DROP-SHOULDER SLEEVES */}
      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.34, 1.32, 0]}>
        {/* Dropped Sleeve */}
        <mesh position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.1, 0.11, 0.26, 12]} />
          <meshStandardMaterial color="#121214" roughness={0.88} />
        </mesh>
        {/* Forearm */}
        <mesh position={[0, -0.32, 0]}>
          <cylinderGeometry args={[0.065, 0.055, 0.28, 12]} />
          <meshStandardMaterial color="#334155" roughness={0.7} />
        </mesh>
        {/* Wristband */}
        <mesh position={[0, -0.42, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.04, 12]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.34, 1.32, 0]}>
        {/* Dropped Sleeve */}
        <mesh position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.1, 0.11, 0.26, 12]} />
          <meshStandardMaterial color="#121214" roughness={0.88} />
        </mesh>
        {/* Forearm */}
        <mesh position={[0, -0.32, 0]}>
          <cylinderGeometry args={[0.065, 0.055, 0.28, 12]} />
          <meshStandardMaterial color="#334155" roughness={0.7} />
        </mesh>
      </group>

      {/* 4. BAGGY CARGO PANTS & LEGS */}
      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.15, 0.72, 0]}>
        <mesh position={[0, -0.34, 0]}>
          <cylinderGeometry args={[0.13, 0.12, 0.68, 12]} />
          <meshStandardMaterial color="#1c1917" roughness={0.9} />
        </mesh>
        {/* Side Cargo Pocket */}
        <mesh position={[-0.11, -0.28, 0]}>
          <boxGeometry args={[0.06, 0.16, 0.14]} />
          <meshStandardMaterial color="#292524" roughness={0.9} />
        </mesh>
        {/* Left Sneaker */}
        <group position={[0, -0.68, 0.05]}>
          {/* Thick Midsole */}
          <mesh position={[0, 0.02, 0]}>
            <boxGeometry args={[0.14, 0.05, 0.26]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </mesh>
          {/* Upper Sneaker Body */}
          <mesh position={[0, 0.07, -0.01]}>
            <boxGeometry args={[0.13, 0.07, 0.23]} />
            <meshStandardMaterial color="#09090b" roughness={0.7} />
          </mesh>
          {/* Red Accent Trim */}
          <mesh position={[0, 0.06, 0.08]}>
            <boxGeometry args={[0.11, 0.04, 0.06]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
        </group>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.15, 0.72, 0]}>
        <mesh position={[0, -0.34, 0]}>
          <cylinderGeometry args={[0.13, 0.12, 0.68, 12]} />
          <meshStandardMaterial color="#1c1917" roughness={0.9} />
        </mesh>
        {/* Side Cargo Pocket */}
        <mesh position={[0.11, -0.28, 0]}>
          <boxGeometry args={[0.06, 0.16, 0.14]} />
          <meshStandardMaterial color="#292524" roughness={0.9} />
        </mesh>
        {/* Right Sneaker */}
        <group position={[0, -0.68, 0.05]}>
          {/* Thick Midsole */}
          <mesh position={[0, 0.02, 0]}>
            <boxGeometry args={[0.14, 0.05, 0.26]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </mesh>
          {/* Upper Sneaker Body */}
          <mesh position={[0, 0.07, -0.01]}>
            <boxGeometry args={[0.13, 0.07, 0.23]} />
            <meshStandardMaterial color="#09090b" roughness={0.7} />
          </mesh>
          {/* Red Accent Trim */}
          <mesh position={[0, 0.06, 0.08]}>
            <boxGeometry args={[0.11, 0.04, 0.06]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// ============================================================================
// FIRST-PERSON / THIRD-PERSON INTEGRATED CONTROLLER
// ============================================================================
interface ControllerProps {
  onHoverInteractable: (item: WorldInteractable | null) => void;
  onInteract: (item: WorldInteractable) => void;
  reducedMotion: boolean;
  onToggleProjector: () => void;
  onPlayerPositionChange?: (pos: [number, number, number], yaw: number) => void;
  teleportTarget?: [number, number, number] | null;
  onTeleportHandled?: () => void;
  cameraMode: CameraMode;
  onCameraModeToggle: () => void;
  onZoneTransition?: (zoneName: string) => void;
  onNearbyFriendChange?: (friend: FriendNPCData | null) => void;
}

function IntegratedCameraController({
  onHoverInteractable,
  onInteract,
  reducedMotion,
  onToggleProjector,
  onPlayerPositionChange,
  teleportTarget,
  onTeleportHandled,
  cameraMode,
  onCameraModeToggle,
  onZoneTransition,
  onNearbyFriendChange,
}: ControllerProps) {
  const { gl } = useThree();

  const pos = useRef(new THREE.Vector3(0, 1.65, 2.5));
  const vel = useRef(new THREE.Vector3(0, 0, 0));
  const yaw = useRef(0);
  const pitch = useRef(0);
  const isLocked = useRef(false);
  const walkTimer = useRef(0);
  const isMoving = useRef(false);

  const frameCount = useRef(0);
  const lastReportedPos = useRef<[number, number, number]>([0, 1.65, 2.5]);
  const lastReportedYaw = useRef<number>(0);
  const currentZoneRef = useRef<"underground" | "outdoor">("underground");

  // Handle programmatic teleportation from map / fast travel
  useEffect(() => {
    if (teleportTarget) {
      pos.current.set(teleportTarget[0], teleportTarget[1] ?? 1.65, teleportTarget[2]);
      vel.current.set(0, 0, 0);
      lastReportedPos.current = [teleportTarget[0], teleportTarget[1] ?? 1.65, teleportTarget[2]];
      onPlayerPositionChange?.([teleportTarget[0], teleportTarget[1] ?? 1.65, teleportTarget[2]], yaw.current);
      onTeleportHandled?.();
    }
  }, [teleportTarget, onPlayerPositionChange, onTeleportHandled]);

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

      const maxPitch = cameraMode === "TPP" ? Math.PI / 2.8 : Math.PI / 2.15;
      const minPitch = cameraMode === "TPP" ? -Math.PI / 3.2 : -Math.PI / 2.15;
      pitch.current = Math.max(minPitch, Math.min(maxPitch, pitch.current));
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code.toLowerCase();
      if (code === "keyw") keys.current.w = true;
      if (code === "keys") keys.current.s = true;
      if (code === "keya") keys.current.a = true;
      if (code === "keyd") keys.current.d = true;
      if (code === "keyv") {
        // Toggle FPP / TPP camera
        onCameraModeToggle();
      }
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
  }, [gl, onInteract, onToggleProjector, cameraMode, onCameraModeToggle]);

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

  useFrame((state, delta) => {
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
      moveX = (moveX / moveLength) * 4.0;
      moveZ = (moveZ / moveLength) * 4.0;
      walkTimer.current += delta * 7;
      isMoving.current = true;
    } else {
      walkTimer.current = 0;
      isMoving.current = false;
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

    // ========================================================
    // SEAMLESS UNDERGROUND ↔ OUTDOOR TRANSITION TRIGGERS
    // ========================================================
    // 1. Walking out to surface through Exit Corridor Portal (at Z: ~9.2)
    if (currZ < 15 && finalZ >= 9.2) {
      finalX = 0;
      finalZ = 25.5;
      yaw.current = 0; // Face South into park
      currentZoneRef.current = "outdoor";
      onZoneTransition?.("SURFACE // AMITDIED OUTDOOR DISTRICT");
    }
    // 2. Walking into underground facility through Bunker Portal (at Z: ~23.0)
    else if (currZ >= 15 && finalZ <= 23.0) {
      finalX = 0;
      finalZ = 7.8;
      yaw.current = Math.PI; // Face North into facility
      currentZoneRef.current = "underground";
      onZoneTransition?.("FACILITY // LEVEL -2 UNDERGROUND");
    }

    pos.current.x = finalX;
    pos.current.z = finalZ;

    // ========================================================
    // CAMERA POSITIONING (FPP vs TPP with Anti-Clipping)
    // ========================================================
    if (cameraMode === "FPP") {
      // First Person View (Direct eye level + subtle bob)
      let bobY = 0;
      let bobX = 0;
      if (!reducedMotion && moveLength > 0.001) {
        bobY = Math.sin(walkTimer.current * 1.5) * 0.022;
        bobX = Math.cos(walkTimer.current * 0.75) * 0.012;
      }
      state.camera.position.set(pos.current.x + bobX, pos.current.y + bobY, pos.current.z);
      state.camera.rotation.set(pitch.current, yaw.current, 0, "YXZ");
    } else {
      // Third Person Follow View
      const idealDist = 2.8;
      const heightOffset = 0.25;

      const cosP = Math.cos(pitch.current);
      const sinP = Math.sin(pitch.current);
      const sinY = Math.sin(yaw.current);
      const cosY = Math.cos(yaw.current);

      // Camera direction from player head
      const dirX = sinY * cosP;
      const dirY = -sinP;
      const dirZ = cosY * cosP;

      const headX = pos.current.x;
      const headY = pos.current.y + heightOffset;
      const headZ = pos.current.z;

      // Obstacle & Wall clipping detection: Raycast step from head to camera
      let safeDist = idealDist;
      const steps = 10;
      for (let i = 1; i <= steps; i++) {
        const d = (idealDist * i) / steps;
        const testX = headX + dirX * d;
        const testZ = headZ + dirZ * d;
        if (!isPointWalkable(testX, testZ)) {
          safeDist = Math.max(0.6, d - 0.25);
          break;
        }
      }

      const targetCamX = headX + dirX * safeDist;
      const targetCamY = Math.max(0.4, headY + dirY * safeDist);
      const targetCamZ = headZ + dirZ * safeDist;

      // Smooth camera interpolation
      const camLerp = 1 - Math.exp(-delta * 14);
      state.camera.position.x += (targetCamX - state.camera.position.x) * camLerp;
      state.camera.position.y += (targetCamY - state.camera.position.y) * camLerp;
      state.camera.position.z += (targetCamZ - state.camera.position.z) * camLerp;
      state.camera.rotation.set(pitch.current, yaw.current, 0, "YXZ");
    }

    // Interaction Raycast Check across all facility & outdoor interactables
    const lookDir = new THREE.Vector3();
    state.camera.getWorldDirection(lookDir);

    let nearestItem: WorldInteractable | null = null;
    let nearestDist = 999;

    for (const item of ALL_WORLD_INTERACTABLES) {
      const itemPos = new THREE.Vector3(...item.position);
      const toItem = itemPos.clone().sub(pos.current);
      const dist = toItem.length();

      if (dist <= item.radius) {
        toItem.normalize();
        const dot = lookDir.dot(toItem);
        if (dot > 0.58 && dist < nearestDist) {
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

  return (
    <>
      <PlayerCharacter
        posRef={pos}
        yawRef={yaw}
        isMovingRef={isMoving}
        walkTimerRef={walkTimer}
        visible={cameraMode === "TPP"}
      />
      <NPCSystem posRef={pos} onNearbyFriendChange={onNearbyFriendChange} />
    </>
  );
}

// ============================================================================
// REUSABLE VISIBLE LIGHT FIXTURE PRIMITIVES
// ============================================================================
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
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[size[0] + 0.12, 0.06, size[2] + 0.12]} />
        <meshStandardMaterial color="#1e242d" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[size[0], size[1], size[2]]} />
        <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={3.2} />
      </mesh>
      <pointLight position={[0, -0.3, 0]} color={color} intensity={intensity} distance={distance} />
    </group>
  );
}

function WallLampFixture({
  position,
  rotation = [0, 0, 0] as [number, number, number],
  color = "#ef4444",
  intensity = 2.4,
  distance = 10,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  intensity?: number;
  distance?: number;
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.16, 0.22, 0.12]} />
        <meshStandardMaterial color="#1e242d" metalness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.1]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={3.8} />
      </mesh>
      <pointLight position={[0, 0, 0.25]} color={color} intensity={intensity} distance={distance} />
    </group>
  );
}

// ============================================================================
// 1. MAIN STUDIO (Central Hub at X: 0, Z: 0)
// ============================================================================
function MainStudioHub() {
  const redLightRef = useRef<THREE.PointLight>(null);
  const crtLightRef = useRef<THREE.PointLight>(null);

  const albumPosterTex = useMemo(
    () => createStencilTexture("AMITDIED", "UNRELEASED 2024 MASTER", "#dc2626"),
    []
  );

  useFrame(() => {
    if (typeof document !== "undefined") {
      const rootStyle = getComputedStyle(document.documentElement);
      const rawBass = parseFloat(rootStyle.getPropertyValue("--audio-bass") || "0");
      const rawMid = parseFloat(rootStyle.getPropertyValue("--audio-mid") || "0");

      const bassScale = 1 + (isNaN(rawBass) ? 0 : rawBass) * 0.12;
      const crtOpacity = 0.2 + (isNaN(rawMid) ? 0 : rawMid) * 0.45;

      if (redLightRef.current) redLightRef.current.intensity = 2.6 + (bassScale - 1) * 12;
      if (crtLightRef.current) crtLightRef.current.intensity = 2.0 + (crtOpacity - 0.2) * 2.5;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Floor & Ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#262b35" roughness={0.8} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.6, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#1a1e27" roughness={0.9} />
      </mesh>

      {/* North Wall with Open Archway to Cinema */}
      <mesh position={[-3.6, 1.8, -5]}>
        <planeGeometry args={[2.8, 3.6]} />
        <meshStandardMaterial color="#202530" />
      </mesh>
      <mesh position={[3.6, 1.8, -5]}>
        <planeGeometry args={[2.8, 3.6]} />
        <meshStandardMaterial color="#202530" />
      </mesh>
      <mesh position={[0, 3.2, -5]}>
        <planeGeometry args={[4.4, 0.8]} />
        <meshStandardMaterial color="#202530" />
      </mesh>

      {/* South Wall with Open Archway to Facility Exit */}
      <mesh position={[-3.6, 1.8, 5]}>
        <planeGeometry args={[2.8, 3.6]} />
        <meshStandardMaterial color="#202530" />
      </mesh>
      <mesh position={[3.6, 1.8, 5]}>
        <planeGeometry args={[2.8, 3.6]} />
        <meshStandardMaterial color="#202530" />
      </mesh>
      <mesh position={[0, 3.2, 5]}>
        <planeGeometry args={[4.4, 0.8]} />
        <meshStandardMaterial color="#202530" />
      </mesh>

      {/* East & West Walls with Door Openings */}
      <mesh position={[-5, 1.8, -3.6]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2.8, 3.6]} />
        <meshStandardMaterial color="#202530" />
      </mesh>
      <mesh position={[-5, 1.8, 3.6]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2.8, 3.6]} />
        <meshStandardMaterial color="#202530" />
      </mesh>
      <mesh position={[-5, 3.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[4.4, 0.8]} />
        <meshStandardMaterial color="#202530" />
      </mesh>

      <mesh position={[5, 1.8, -3.6]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[2.8, 3.6]} />
        <meshStandardMaterial color="#202530" />
      </mesh>
      <mesh position={[5, 1.8, 3.6]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[2.8, 3.6]} />
        <meshStandardMaterial color="#202530" />
      </mesh>
      <mesh position={[5, 3.2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[4.4, 0.8]} />
        <meshStandardMaterial color="#202530" />
      </mesh>

      {/* Visible Overhead Industrial Light Panels */}
      <CeilingLightPanel position={[-2.0, 3.55, -2.0]} color="#f8fafc" intensity={3.0} distance={12} />
      <CeilingLightPanel position={[2.0, 3.55, -2.0]} color="#f8fafc" intensity={3.0} distance={12} />
      <CeilingLightPanel position={[0, 3.55, 2.0]} color="#f8fafc" intensity={2.8} distance={12} />

      {/* Studio Wall Red Practical Lamp with Audio Pulse */}
      <WallLampFixture position={[-4.85, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} color="#ef4444" intensity={2.6} distance={10} />
      <pointLight ref={redLightRef} position={[-4.5, 2.5, 0]} color="#ef4444" intensity={2.6} distance={10} />

      {/* Central Studio Mixing Console & CRT */}
      <group position={[0, 0, -2.5]}>
        <mesh position={[0, 0.82, 0]}>
          <boxGeometry args={[3.2, 0.08, 1.4]} />
          <meshStandardMaterial color="#1e232c" roughness={0.6} />
        </mesh>
        <mesh position={[-1.4, 0.41, 0.5]}>
          <boxGeometry args={[0.08, 0.82, 0.08]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
        <mesh position={[1.4, 0.41, 0.5]}>
          <boxGeometry args={[0.08, 0.82, 0.08]} />
          <meshStandardMaterial color="#475569" />
        </mesh>

        {/* Studio CRT Monitor */}
        <group position={[0, 1.25, -0.3]}>
          <mesh>
            <boxGeometry args={[0.8, 0.6, 0.5]} />
            <meshStandardMaterial color="#181c22" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0, 0.26]}>
            <planeGeometry args={[0.7, 0.5]} />
            <meshStandardMaterial color="#082f1e" emissive="#10b981" emissiveIntensity={2.4} />
          </mesh>
          <pointLight ref={crtLightRef} position={[0, 0, 0.4]} color="#10b981" intensity={2.2} distance={6} />
        </group>

        {/* Nearfield Studio Monitors (Speakers) */}
        <mesh position={[-1.2, 1.15, -0.2]}>
          <boxGeometry args={[0.3, 0.45, 0.35]} />
          <meshStandardMaterial color="#181c22" />
        </mesh>
        <mesh position={[1.2, 1.15, -0.2]}>
          <boxGeometry args={[0.3, 0.45, 0.35]} />
          <meshStandardMaterial color="#181c22" />
        </mesh>
      </group>

      {/* Poster on West Wall */}
      <mesh position={[-4.9, 2.0, 1.8]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.4, 1.8]} />
        <meshBasicMaterial map={albumPosterTex} />
      </mesh>
    </group>
  );
}

// ============================================================================
// 2. BEAT ROOM (West at X: -14, Z: 0)
// ============================================================================
function BeatRoom({ discoveredArtifactIds = [] }: { discoveredArtifactIds?: string[] }) {
  return (
    <group position={[-14, 0, 0]}>
      {/* Floor & Ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#2d2218" roughness={0.82} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.6, 0]}>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#1f1812" />
      </mesh>

      {/* North, South, West Solid Walls */}
      <mesh position={[0, 1.8, -4]}>
        <planeGeometry args={[10, 3.6]} />
        <meshStandardMaterial color="#261c14" />
      </mesh>
      <mesh position={[0, 1.8, 4]}>
        <planeGeometry args={[10, 3.6]} />
        <meshStandardMaterial color="#261c14" />
      </mesh>
      <mesh position={[-5, 1.8, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[8, 3.6]} />
        <meshStandardMaterial color="#261c14" />
      </mesh>

      {/* East Wall with Opening to Studio */}
      <mesh position={[5, 1.8, -2.6]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[2.8, 3.6]} />
        <meshStandardMaterial color="#261c14" />
      </mesh>
      <mesh position={[5, 1.8, 2.6]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[2.8, 3.6]} />
        <meshStandardMaterial color="#261c14" />
      </mesh>
      <mesh position={[5, 3.2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[2.4, 0.8]} />
        <meshStandardMaterial color="#261c14" />
      </mesh>

      {/* Visible Overhead Light Panels (Warm Amber Illumination) */}
      <CeilingLightPanel position={[-2.2, 3.55, 0]} color="#fef3c7" intensity={3.0} distance={12} />
      <CeilingLightPanel position={[2.2, 3.55, 0]} color="#fef3c7" intensity={3.0} distance={12} />

      {/* Red Accent Sconce on West Wall */}
      <WallLampFixture position={[-4.85, 2.4, 0]} rotation={[0, Math.PI / 2, 0]} color="#ef4444" intensity={2.6} distance={10} />

      {/* Center Sampler & Drum Machine Workstation */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.85, 0]}>
          <boxGeometry args={[3.2, 0.08, 1.6]} />
          <meshStandardMaterial color="#3b2b1e" roughness={0.7} />
        </mesh>
        {/* Analog Sampler Pads */}
        <mesh position={[-0.6, 0.92, 0]}>
          <boxGeometry args={[0.8, 0.06, 0.6]} />
          <meshStandardMaterial color="#1c1917" />
        </mesh>
        {/* Glowing Amber Pad LEDs */}
        <mesh position={[-0.6, 0.96, 0]}>
          <boxGeometry args={[0.6, 0.02, 0.4]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={2.5} />
        </mesh>
        <pointLight position={[-0.6, 1.2, 0]} color="#f59e0b" intensity={2.0} distance={5} />

        {/* Beat Archive Terminal CRT */}
        <group position={[0.7, 1.25, -0.2]}>
          <mesh>
            <boxGeometry args={[0.7, 0.55, 0.45]} />
            <meshStandardMaterial color="#1c1917" />
          </mesh>
          <mesh position={[0, 0, 0.23]}>
            <planeGeometry args={[0.6, 0.45]} />
            <meshStandardMaterial color="#451a03" emissive="#f59e0b" emissiveIntensity={2.8} />
          </mesh>
          <pointLight position={[0, 0, 0.35]} color="#f59e0b" intensity={2.2} distance={6} />
        </group>
      </group>

      {/* Vinyl Crate Displays Along South Wall */}
      <group position={[0, 0, 3.2]}>
        {[-3, -1, 1, 3].map((x, idx) => {
          const isCollected = discoveredArtifactIds.includes(`VINYL_00${idx + 1}`);
          return (
            <group key={idx} position={[x, 0.45, 0]}>
              <mesh>
                <boxGeometry args={[0.8, 0.9, 0.6]} />
                <meshStandardMaterial color="#451a03" roughness={0.8} />
              </mesh>
              {/* Vinyl Records protruding */}
              <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[0.7, 0.2, 0.5]} />
                <meshStandardMaterial
                  color={isCollected ? "#22c55e" : "#09090b"}
                  emissive={isCollected ? "#15803d" : "#ef4444"}
                  emissiveIntensity={isCollected ? 1.5 : 0.8}
                />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}

// ============================================================================
// 3. CCTV SURVEILLANCE ROOM (East at X: 14, Z: 0)
// ============================================================================
function CctvRoom({ isCctvTerminalOpen }: { isCctvTerminalOpen?: boolean }) {
  const cctvLightRef = useRef<THREE.PointLight>(null);

  const screen1 = useMemo(() => createCctvMonitorTexture("01 [STUDIO]", "ONLINE // 1080P", true), []);
  const screen2 = useMemo(() => createCctvMonitorTexture("02 [BEAT]", "ONLINE // 1080P", true), []);
  const screen3 = useMemo(() => createCctvMonitorTexture("03 [CINEMA]", "ONLINE // 1080P", true), []);
  const screen4 = useMemo(() => createCctvMonitorTexture("04 [OUTDOOR]", "LIVE // SURFACE", true), []);

  return (
    <group position={[14, 0, 0]}>
      {/* Floor & Ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.82} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.6, 0]}>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* North, South, East Solid Walls */}
      <mesh position={[0, 1.8, -4]}>
        <planeGeometry args={[10, 3.6]} />
        <meshStandardMaterial color="#131d2e" />
      </mesh>
      <mesh position={[0, 1.8, 4]}>
        <planeGeometry args={[10, 3.6]} />
        <meshStandardMaterial color="#131d2e" />
      </mesh>
      <mesh position={[5, 1.8, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[8, 3.6]} />
        <meshStandardMaterial color="#131d2e" />
      </mesh>

      {/* West Wall with Opening from Studio */}
      <mesh position={[-5, 1.8, -2.6]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2.8, 3.6]} />
        <meshStandardMaterial color="#131d2e" />
      </mesh>
      <mesh position={[-5, 1.8, 2.6]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2.8, 3.6]} />
        <meshStandardMaterial color="#131d2e" />
      </mesh>
      <mesh position={[-5, 3.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2.4, 0.8]} />
        <meshStandardMaterial color="#131d2e" />
      </mesh>

      {/* Visible Overhead Light Panels (Cool Cyan Illumination) */}
      <CeilingLightPanel position={[-2.2, 3.55, 0]} color="#bae6fd" intensity={3.0} distance={12} />
      <CeilingLightPanel position={[2.2, 3.55, 0]} color="#bae6fd" intensity={3.0} distance={12} />

      {/* Surveillance Console & High-Tech Desk */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.85, 0]}>
          <boxGeometry args={[3.6, 0.08, 1.6]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
        {/* CCTV Operator Terminal */}
        <group position={[0, 1.25, -0.2]}>
          <mesh>
            <boxGeometry args={[0.9, 0.6, 0.45]} />
            <meshStandardMaterial color="#020617" />
          </mesh>
          <mesh position={[0, 0, 0.23]}>
            <planeGeometry args={[0.8, 0.5]} />
            <meshStandardMaterial color="#0c4a6e" emissive="#38bdf8" emissiveIntensity={2.8} />
          </mesh>
          <pointLight ref={cctvLightRef} position={[0, 0, 0.4]} color="#38bdf8" intensity={2.5} distance={7} />
        </group>
      </group>

      {/* Wall Surveillance Multi-Monitor Bank (East Wall) */}
      <group position={[4.85, 2.0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh position={[-1.6, 0.6, 0]}>
          <planeGeometry args={[1.5, 1.0]} />
          <meshBasicMaterial map={screen1} />
        </mesh>
        <mesh position={[1.6, 0.6, 0]}>
          <planeGeometry args={[1.5, 1.0]} />
          <meshBasicMaterial map={screen2} />
        </mesh>
        <mesh position={[-1.6, -0.6, 0]}>
          <planeGeometry args={[1.5, 1.0]} />
          <meshBasicMaterial map={screen3} />
        </mesh>
        <mesh position={[1.6, -0.6, 0]}>
          <planeGeometry args={[1.5, 1.0]} />
          <meshBasicMaterial map={screen4} />
        </mesh>
        <pointLight position={[0, 0, 0.6]} color="#38bdf8" intensity={2.8} distance={8} />
      </group>
    </group>
  );
}

// ============================================================================
// 4. CINEMA / PROJECTION ROOM (North at X: 0, Z: -16)
// ============================================================================
function CinemaRoom({
  projectorActive = false,
  isCinemaTerminalOpen = false,
  cinemaScreenState = "idle",
}: {
  projectorActive?: boolean;
  isCinemaTerminalOpen?: boolean;
  cinemaScreenState?: "offline" | "idle" | "projecting";
}) {
  const cinemaScreenTex = useMemo(
    () => createCinemaProjectionTexture(cinemaScreenState),
    [cinemaScreenState]
  );

  return (
    <group position={[0, 0, -16]}>
      {/* Floor & Ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial color="#221e28" roughness={0.88} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4.0, 0]}>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial color="#14121a" />
      </mesh>

      {/* East & West Solid Walls */}
      <mesh position={[-6, 2.0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[10, 4.0]} />
        <meshStandardMaterial color="#1a1622" />
      </mesh>
      <mesh position={[6, 2.0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[10, 4.0]} />
        <meshStandardMaterial color="#1a1622" />
      </mesh>

      {/* South Wall with Entry from Studio */}
      <mesh position={[-3.8, 2.0, 5]}>
        <planeGeometry args={[4.4, 4.0]} />
        <meshStandardMaterial color="#1a1622" />
      </mesh>
      <mesh position={[3.8, 2.0, 5]}>
        <planeGeometry args={[4.4, 4.0]} />
        <meshStandardMaterial color="#1a1622" />
      </mesh>
      <mesh position={[0, 3.4, 5]}>
        <planeGeometry args={[3.2, 1.2]} />
        <meshStandardMaterial color="#1a1622" />
      </mesh>

      {/* North Wall with Screen and Entry to Archive */}
      <mesh position={[-4.5, 2.0, -5]}>
        <planeGeometry args={[3.0, 4.0]} />
        <meshStandardMaterial color="#1a1622" />
      </mesh>
      <mesh position={[4.5, 2.0, -5]}>
        <planeGeometry args={[3.0, 4.0]} />
        <meshStandardMaterial color="#1a1622" />
      </mesh>
      <mesh position={[0, 3.4, -5]}>
        <planeGeometry args={[6.0, 1.2]} />
        <meshStandardMaterial color="#1a1622" />
      </mesh>

      {/* Visible Overhead Light Panels */}
      <CeilingLightPanel position={[-3.0, 3.95, 0]} color="#f3e8ff" intensity={2.8} distance={12} />
      <CeilingLightPanel position={[3.0, 3.95, 0]} color="#f3e8ff" intensity={2.8} distance={12} />

      {/* Massive 35mm Optical Projection Screen (North Wall) */}
      <group position={[0, 2.2, -4.88]}>
        <mesh>
          <planeGeometry args={[7.2, 3.2]} />
          <meshStandardMaterial color="#ffffff" emissive="#c084fc" emissiveIntensity={projectorActive ? 2.5 : 0.8} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[7.0, 3.0]} />
          <meshBasicMaterial map={cinemaScreenTex} />
        </mesh>
        <pointLight
          position={[0, 0, 1.2]}
          color="#c084fc"
          intensity={projectorActive ? 3.5 : 1.5}
          distance={14}
        />
      </group>

      {/* 35mm Film Projector Pedestal */}
      <group position={[0, 1.2, 2.5]}>
        <mesh>
          <boxGeometry args={[0.7, 1.2, 0.7]} />
          <meshStandardMaterial color="#1c1917" />
        </mesh>
        {/* Projector Lens with Optical Beam */}
        <mesh position={[0, 0.35, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.14, 0.3, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#c084fc" emissiveIntensity={3.5} />
        </mesh>
        <pointLight position={[0, 0.35, -0.6]} color="#c084fc" intensity={3.0} distance={10} />
      </group>
    </group>
  );
}

// ============================================================================
// 5. ARCHIVE / NODE 04 AREA (North at X: 0, Z: -30)
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
  const lockColor = isNode04Unlocked ? "#22c55e" : "#ef4444";

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

      {/* East & West Walls */}
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

      {/* North Wall: Blast Door */}
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

      {/* Overhead Light Panels */}
      <CeilingLightPanel position={[0, 3.55, 2.2]} color="#f8fafc" intensity={2.8} distance={12} size={[1.6, 0.08, 0.4]} />
      <pointLight ref={flickerLightRef} position={[0, 3.2, -2.0]} color="#fee2e2" intensity={2.4} distance={12} />
      <WallLampFixture position={[-3.85, 2.6, 0]} rotation={[0, Math.PI / 2, 0]} color="#ef4444" intensity={2.2} distance={9} />

      {/* Blast Door */}
      <group position={[0, isNode04DoorOpen ? 4.2 : 1.5, -4.42]}>
        <mesh>
          <boxGeometry args={[2.2, 3.0, 0.12]} />
          <meshStandardMaterial color="#302424" roughness={0.6} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.6, 0.07]}>
          <planeGeometry args={[1.8, 0.5]} />
          <meshBasicMaterial map={doorSignTex} transparent />
        </mesh>
        <mesh position={[0.85, 0.08, 0.12]}>
          <boxGeometry args={[0.05, 0.05, 0.02]} />
          <meshStandardMaterial color={lockColor} emissive={lockColor} emissiveIntensity={3.5} />
        </mesh>
        <pointLight position={[0.85, 0.08, 0.3]} color={lockColor} intensity={1.8} distance={5.0} />
      </group>

      {/* Node 04 Secret Chamber */}
      {isNode04DoorOpen && (
        <group position={[0, 0, -8.0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[7.2, 7.0]} />
            <meshStandardMaterial color="#261e24" roughness={0.85} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.6, 0]}>
            <planeGeometry args={[7.2, 7.0]} />
            <meshStandardMaterial color="#1a1418" />
          </mesh>
          <mesh position={[0, 1.8, -3.5]}>
            <planeGeometry args={[7.2, 3.6]} />
            <meshStandardMaterial color="#221a20" />
          </mesh>
          <pointLight position={[0, 2.6, -1.5]} color="#ef4444" intensity={3.2} distance={10} />
          <pointLight position={[0, 1.4, -2.8]} color="#10b981" intensity={2.4} distance={8} />
        </group>
      )}
    </group>
  );
}

// ============================================================================
// 6. CONNECTING CORRIDORS & SOUTH FACILITY EXIT CORRIDOR
// ============================================================================
function Corridors() {
  const exitSignTex = useMemo(
    () => createStencilTexture("EXIT", "SURFACE ACCESS // OUTDOOR", "#22c55e"),
    []
  );

  return (
    <group>
      {/* West Corridor (Studio to Beat Room) */}
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
      <CeilingLightPanel position={[-6.0, 3.55, 0]} color="#f8fafc" intensity={2.6} distance={9} size={[0.8, 0.08, 0.35]} />
      <CeilingLightPanel position={[-8.0, 3.55, 0]} color="#ef4444" intensity={2.6} distance={9} size={[0.8, 0.08, 0.35]} />

      {/* East Corridor (Studio to CCTV Room) */}
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
      <CeilingLightPanel position={[6.0, 3.55, 0]} color="#f8fafc" intensity={2.6} distance={9} size={[0.8, 0.08, 0.35]} />
      <CeilingLightPanel position={[8.0, 3.55, 0]} color="#38bdf8" intensity={2.6} distance={9} size={[0.8, 0.08, 0.35]} />

      {/* North Hallway 1 (Studio to Cinema) */}
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
      <CeilingLightPanel position={[0, 3.55, -6.5]} color="#f8fafc" intensity={2.5} distance={9} size={[1.2, 0.08, 0.35]} />
      <CeilingLightPanel position={[0, 3.55, -9.5]} color="#f8fafc" intensity={2.5} distance={9} size={[1.2, 0.08, 0.35]} />

      {/* North Hallway 2 (Cinema to Archive) */}
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
      <CeilingLightPanel position={[0, 3.55, -22.2]} color="#fee2e2" intensity={2.5} distance={9} size={[1.2, 0.08, 0.35]} />

      {/* ======================================================== */}
      {/* SOUTH FACILITY EXIT CORRIDOR (Studio to Surface Portal) */}
      {/* ======================================================== */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 7.3]}>
        <planeGeometry args={[2.4, 4.6]} />
        <meshStandardMaterial color="#222830" roughness={0.8} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.6, 7.3]}>
        <planeGeometry args={[2.4, 4.6]} />
        <meshStandardMaterial color="#161a20" />
      </mesh>
      <mesh position={[-1.2, 1.8, 7.3]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[4.6, 3.6]} />
        <meshStandardMaterial color="#1c222a" />
      </mesh>
      <mesh position={[1.2, 1.8, 7.3]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[4.6, 3.6]} />
        <meshStandardMaterial color="#1c222a" />
      </mesh>

      {/* Green Overhead Emergency Exit Fixtures */}
      <CeilingLightPanel position={[0, 3.55, 6.5]} color="#22c55e" intensity={2.8} distance={10} size={[1.2, 0.08, 0.35]} />
      <CeilingLightPanel position={[0, 3.55, 8.8]} color="#22c55e" intensity={3.2} distance={10} size={[1.2, 0.08, 0.35]} />

      {/* Surface Exit Gateway Portal Frame at Z: 9.2 */}
      <group position={[0, 1.8, 9.4]}>
        <mesh>
          <boxGeometry args={[2.4, 3.6, 0.2]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.8} />
        </mesh>
        {/* Luminous Green Portal Opening */}
        <mesh position={[0, -0.3, -0.11]}>
          <planeGeometry args={[1.8, 2.6]} />
          <meshBasicMaterial color="#22c55e" transparent opacity={0.85} />
        </mesh>
        <pointLight position={[0, 0, -0.4]} color="#22c55e" intensity={3.5} distance={6} />
        {/* Exit Sign */}
        <mesh position={[0, 1.2, -0.12]}>
          <planeGeometry args={[1.6, 0.45]} />
          <meshBasicMaterial map={exitSignTex} />
        </mesh>
      </group>
    </group>
  );
}

// ============================================================================
// 7. OUTDOOR WORLD (Connected explorable surface district, Z: 20 to 115)
// ============================================================================
function OutdoorWorld() {
  const outdoorBunkerSignTex = useMemo(
    () => createStencilTexture("AMITDIED FACILITY", "SECTOR -02 SURFACE ACCESS // ENTER", "#22c55e"),
    []
  );

  const audioLabsSignTex = useMemo(
    () => createStencilTexture("AMITDIED AUDIO LABS", "ANALOG MASTERING & BEAT FACTORY // 24/7", "#ef4444"),
    []
  );

  const cinemaLoungeSignTex = useMemo(
    () => createStencilTexture("35MM CINEMA LOUNGE", "ARCHIVE SCREENINGS & VINYL CAFE", "#c084fc"),
    []
  );

  const monumentWaveRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (typeof document !== "undefined" && monumentWaveRef.current) {
      const rootStyle = getComputedStyle(document.documentElement);
      const rawBass = parseFloat(rootStyle.getPropertyValue("--audio-bass") || "0");
      const bass = isNaN(rawBass) ? 0 : rawBass;
      monumentWaveRef.current.intensity = 2.5 + bass * 8.0;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* ======================================================== */}
      {/* OUTDOOR ATMOSPHERIC SKY & WARM SUNLIGHT */}
      {/* ======================================================== */}
      <directionalLight position={[35, 65, 30]} intensity={1.65} color="#fef08a" />
      <hemisphereLight args={["#7dd3fc", "#22c55e", 0.65]} />

      {/* Stylized Sky Dome / Horizon Ring */}
      <mesh position={[0, 30, 68]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[80, 80, 70, 32, 1, true]} />
        <meshBasicMaterial color="#1e1b4b" side={THREE.BackSide} />
      </mesh>

      {/* Glowing Sunset Sun Orb */}
      <mesh position={[45, 48, 20]}>
        <sphereGeometry args={[4.5, 24, 24]} />
        <meshBasicMaterial color="#fde047" />
      </mesh>

      {/* ======================================================== */}
      {/* 1. TERRAIN, ROADS & PATHWAYS */}
      {/* ======================================================== */}
      {/* Main Lush Grass Terrain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 68]} receiveShadow>
        <planeGeometry args={[130, 100]} />
        <meshStandardMaterial color="#2d6a2e" roughness={0.9} />
      </mesh>

      {/* East-West Asphalt Road across Z: 34 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 34]}>
        <planeGeometry args={[116, 6]} />
        <meshStandardMaterial color="#1f2937" roughness={0.7} />
      </mesh>
      {/* Road Lane Center White Dashes */}
      {[-40, -25, -10, 5, 20, 35].map((x, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, 34]}>
          <planeGeometry args={[8, 0.2]} />
          <meshBasicMaterial color="#f8fafc" />
        </mesh>
      ))}

      {/* North-South Central Park Promenade (Stone Paved Walkway) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 58]}>
        <planeGeometry args={[5.5, 44]} />
        <meshStandardMaterial color="#475569" roughness={0.8} />
      </mesh>

      {/* Winding Cobblestone Paths to Residential & Commercial Districts */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-20, 0.01, 52]}>
        <planeGeometry args={[35, 3.5]} />
        <meshStandardMaterial color="#52525b" roughness={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[20, 0.01, 52]}>
        <planeGeometry args={[35, 3.5]} />
        <meshStandardMaterial color="#52525b" roughness={0.8} />
      </mesh>

      {/* ======================================================== */}
      {/* 2. SURFACE BUNKER ENTRANCE (AT Z: 24) */}
      {/* ======================================================== */}
      <group position={[0, 0, 24]}>
        {/* Brutalist Concrete Bunker Head */}
        <mesh position={[0, 2.4, -0.5]}>
          <boxGeometry args={[7.2, 4.8, 3.5]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
        {/* Left & Right Wing Buttresses */}
        <mesh position={[-3.8, 1.8, 0.2]}>
          <boxGeometry args={[1.2, 3.6, 4.0]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[3.8, 1.8, 0.2]}>
          <boxGeometry args={[1.2, 3.6, 4.0]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>

        {/* Bunker Entrance Portal Archway (Z: 23.5) */}
        <group position={[0, 1.4, -0.4]}>
          <mesh>
            <boxGeometry args={[2.4, 2.8, 0.1]} />
            <meshBasicMaterial color="#22c55e" transparent opacity={0.85} />
          </mesh>
          <pointLight position={[0, 0, 0.5]} color="#22c55e" intensity={3.5} distance={8} />
          {/* Bunker Sign */}
          <mesh position={[0, 1.8, 1.3]}>
            <planeGeometry args={[3.2, 0.6]} />
            <meshBasicMaterial map={outdoorBunkerSignTex} />
          </mesh>
        </group>

        {/* Amber Warning Beacons on Bunker Roof */}
        <mesh position={[-2.4, 4.9, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.3, 12]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={3.0} />
        </mesh>
        <pointLight position={[-2.4, 5.2, 0]} color="#f59e0b" intensity={2.5} distance={10} />
        <mesh position={[2.4, 4.9, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.3, 12]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={3.0} />
        </mesh>
        <pointLight position={[2.4, 5.2, 0]} color="#f59e0b" intensity={2.5} distance={10} />
      </group>

      {/* ======================================================== */}
      {/* 3. CENTRAL PARK & PROCEDURAL TREES */}
      {/* ======================================================== */}
      {/* 16 Organic Stylized Trees scattered across the park & perimeter */}
      {[
        { x: -14, z: 42, scale: 1.2, color: "#16a34a" },
        { x: 14, z: 42, scale: 1.1, color: "#22c55e" },
        { x: -16, z: 62, scale: 1.3, color: "#15803d" },
        { x: 16, z: 62, scale: 1.2, color: "#16a34a" },
        { x: -8, z: 72, scale: 1.4, color: "#e11d48" }, // Cherry/Autumn accent tree
        { x: 8, z: 72, scale: 1.4, color: "#f97316" },  // Amber autumn accent tree
        { x: -28, z: 40, scale: 1.1, color: "#15803d" },
        { x: 28, z: 40, scale: 1.2, color: "#16a34a" },
        { x: -28, z: 68, scale: 1.3, color: "#16a34a" },
        { x: 28, z: 68, scale: 1.2, color: "#22c55e" },
        { x: -20, z: 90, scale: 1.5, color: "#15803d" },
        { x: 20, z: 90, scale: 1.5, color: "#16a34a" },
        { x: 0, z: 94, scale: 1.6, color: "#15803d" },
        { x: -42, z: 88, scale: 1.4, color: "#16a34a" },
        { x: 42, z: 88, scale: 1.4, color: "#22c55e" },
        { x: -10, z: 32, scale: 1.0, color: "#16a34a" },
      ].map((tree, idx) => (
        <group key={idx} position={[tree.x, 0, tree.z]} scale={[tree.scale, tree.scale, tree.scale]}>
          {/* Wood Trunk */}
          <mesh position={[0, 1.6, 0]}>
            <cylinderGeometry args={[0.25, 0.35, 3.2, 10]} />
            <meshStandardMaterial color="#451a03" roughness={0.9} />
          </mesh>
          {/* Tier 1 Foliage */}
          <mesh position={[0, 3.6, 0]}>
            <dodecahedronGeometry args={[1.8, 1]} />
            <meshStandardMaterial color={tree.color} roughness={0.7} />
          </mesh>
          {/* Tier 2 Foliage */}
          <mesh position={[0, 4.8, 0]}>
            <dodecahedronGeometry args={[1.3, 1]} />
            <meshStandardMaterial color={tree.color} roughness={0.65} />
          </mesh>
        </group>
      ))}

      {/* Central Audio-Reactive Park Monument (At X: 0, Z: 55) */}
      <group position={[0, 0, 55]}>
        {/* Tiered Stone Pedestal */}
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[4.2, 0.6, 4.2]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.8, 0]}>
          <boxGeometry args={[2.8, 0.5, 2.8]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        {/* Modernist Acoustic Blade Sculpture */}
        <mesh position={[0, 2.4, 0]}>
          <cylinderGeometry args={[0.4, 0.8, 3.0, 6]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Glowing Audio-Reactive Red LED Ring */}
        <mesh position={[0, 2.8, 0]}>
          <torusGeometry args={[1.1, 0.08, 12, 24]} />
          <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={3.2} />
        </mesh>
        <pointLight ref={monumentWaveRef} position={[0, 3.2, 0]} color="#ef4444" intensity={3.5} distance={14} />
      </group>

      {/* Stylized Park Benches & Streetlamps */}
      {[-8, 8].map((x, idx) => (
        <group key={idx}>
          {/* Bench */}
          <group position={[x, 0, 52]} rotation={[0, x > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
            <mesh position={[0, 0.45, 0]}>
              <boxGeometry args={[1.8, 0.08, 0.6]} />
              <meshStandardMaterial color="#78350f" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.8, -0.28]}>
              <boxGeometry args={[1.8, 0.6, 0.08]} />
              <meshStandardMaterial color="#78350f" roughness={0.7} />
            </mesh>
            {/* Cast Iron Legs */}
            <mesh position={[-0.75, 0.22, 0]}>
              <boxGeometry args={[0.08, 0.45, 0.55]} />
              <meshStandardMaterial color="#18181b" />
            </mesh>
            <mesh position={[0.75, 0.22, 0]}>
              <boxGeometry args={[0.08, 0.45, 0.55]} />
              <meshStandardMaterial color="#18181b" />
            </mesh>
          </group>

          {/* Park Streetlamp */}
          <group position={[x * 0.6, 0, 44]}>
            <mesh position={[0, 2.0, 0]}>
              <cylinderGeometry args={[0.08, 0.12, 4.0, 10]} />
              <meshStandardMaterial color="#18181b" metalness={0.8} />
            </mesh>
            <mesh position={[0, 4.1, 0]}>
              <boxGeometry args={[0.4, 0.5, 0.4]} />
              <meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={3.0} />
            </mesh>
            <pointLight position={[0, 4.1, 0]} color="#fde047" intensity={2.8} distance={10} />
          </group>
        </group>
      ))}

      {/* ======================================================== */}
      {/* 4. RESIDENTIAL DISTRICT (West at X: -46, Z: 38 to 76) */}
      {/* ======================================================== */}
      {/* House 1: Brick Cottage */}
      <group position={[-46, 0, 43]}>
        {/* Main Walls */}
        <mesh position={[0, 2.2, 0]}>
          <boxGeometry args={[9.0, 4.4, 7.5]} />
          <meshStandardMaterial color="#9a3412" roughness={0.85} />
        </mesh>
        {/* Gabled Terracotta Roof */}
        <mesh position={[0, 5.2, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[6.8, 2.4, 4]} />
          <meshStandardMaterial color="#7c2d12" roughness={0.7} />
        </mesh>
        {/* Warm Glowing Windows */}
        <mesh position={[2.2, 2.0, 3.8]}>
          <planeGeometry args={[1.5, 1.5]} />
          <meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={2.5} />
        </mesh>
        <mesh position={[-2.2, 2.0, 3.8]}>
          <planeGeometry args={[1.5, 1.5]} />
          <meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={2.5} />
        </mesh>
        <pointLight position={[0, 2.0, 4.5]} color="#fde047" intensity={2.2} distance={8} />
      </group>

      {/* House 2: Modernist Timber Loft */}
      <group position={[-46, 0, 57]}>
        <mesh position={[0, 2.6, 0]}>
          <boxGeometry args={[9.5, 5.2, 7.5]} />
          <meshStandardMaterial color="#b45309" roughness={0.7} />
        </mesh>
        <mesh position={[0, 5.4, 0]}>
          <boxGeometry args={[10.0, 0.4, 8.0]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        {/* Large Modern Picture Windows */}
        <mesh position={[0, 2.5, 3.8]}>
          <planeGeometry args={[5.5, 2.4]} />
          <meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={2.8} />
        </mesh>
        <pointLight position={[0, 2.5, 4.8]} color="#fde047" intensity={2.5} distance={9} />
      </group>

      {/* House 3: Pastel Townhouse */}
      <group position={[-46, 0, 71]}>
        <mesh position={[0, 2.2, 0]}>
          <boxGeometry args={[9.0, 4.4, 7.5]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
        </mesh>
        <mesh position={[0, 5.2, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[6.8, 2.4, 4]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[0, 1.8, 3.8]}>
          <planeGeometry args={[2.0, 1.8]} />
          <meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={2.5} />
        </mesh>
        <pointLight position={[0, 1.8, 4.5]} color="#fde047" intensity={2.0} distance={8} />
      </group>

      {/* ======================================================== */}
      {/* 5. COMMERCIAL SOUND DISTRICT (East at X: 46, Z: 38 to 76) */}
      {/* ======================================================== */}
      {/* Building 1: AMITDIED AUDIO LABS */}
      <group position={[46, 0, 47]}>
        <mesh position={[0, 3.2, 0]}>
          <boxGeometry args={[11.0, 6.4, 11.0]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
        {/* Rooftop HVAC Units */}
        <mesh position={[-2.5, 6.8, 0]}>
          <boxGeometry args={[2.4, 1.0, 2.0]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
        {/* Glowing Red Neon Sign */}
        <mesh position={[-5.55, 4.8, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[6.5, 1.2]} />
          <meshBasicMaterial map={audioLabsSignTex} />
        </mesh>
        <pointLight position={[-6.0, 4.8, 0]} color="#ef4444" intensity={3.5} distance={10} />
      </group>

      {/* Building 2: 35MM CINEMA LOUNGE & CAFE */}
      <group position={[46, 0, 67]}>
        <mesh position={[0, 2.8, 0]}>
          <boxGeometry args={[11.0, 5.6, 11.0]} />
          <meshStandardMaterial color="#2e1065" roughness={0.7} />
        </mesh>
        {/* Glowing Purple/Amber Marquee Sign */}
        <mesh position={[-5.55, 4.2, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[6.5, 1.2]} />
          <meshBasicMaterial map={cinemaLoungeSignTex} />
        </mesh>
        <pointLight position={[-6.0, 4.2, 0]} color="#c084fc" intensity={3.5} distance={10} />
      </group>

      {/* ======================================================== */}
      {/* 6. NORTHERN SCENIC OVERLOOK & HILLSIDE (Z: 85 to 110) */}
      {/* ======================================================== */}
      <group position={[0, 0, 95]}>
        {/* Rising Hillside Ridge */}
        <mesh position={[0, 1.5, 6]} rotation={[-Math.PI / 2.2, 0, 0]}>
          <planeGeometry args={[110, 24]} />
          <meshStandardMaterial color="#1e5520" roughness={0.9} />
        </mesh>
        {/* Wooden Fence along the scenic ridge */}
        {[-30, -15, 0, 15, 30].map((x, idx) => (
          <group key={idx} position={[x, 1.8, 7]}>
            <mesh position={[0, 0.45, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 0.9, 8]} />
              <meshStandardMaterial color="#78350f" />
            </mesh>
            <mesh position={[2.5, 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.04, 5.0, 8]} />
              <meshStandardMaterial color="#78350f" />
            </mesh>
          </group>
        ))}

        {/* Observation Telescope at X: 0, Z: 102 */}
        <group position={[0, 2.0, 7]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.06, 0.1, 1.0, 12]} />
            <meshStandardMaterial color="#475569" metalness={0.8} />
          </mesh>
          <mesh position={[0, 1.1, 0.2]} rotation={[-0.35, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 0.7, 12]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} />
          </mesh>
        </group>
      </group>
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
  cameraMode = "FPP",
  onCameraModeChange,
  onZoneTransition,
  onNearbyFriendChange,
}: WorldSceneProps) {
  const handleCameraToggle = () => {
    const nextMode: CameraMode = cameraMode === "FPP" ? "TPP" : "FPP";
    onCameraModeChange?.(nextMode);
  };

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
        {/* Global Balanced Ambient Base */}
        <ambientLight intensity={0.55} color="#475569" />

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

        {/* 6. Connecting Corridors & South Surface Exit */}
        <Corridors />

        {/* 7. Outdoor World (Central Park, Houses, Commercial District, Scenic Overlook) */}
        <OutdoorWorld />

        {/* 8. Integrated First-Person & Third-Person Camera Controller */}
        <IntegratedCameraController
          onHoverInteractable={onHoverInteractable}
          onInteract={onInteract}
          reducedMotion={reducedMotion}
          onToggleProjector={onToggleProjector}
          onPlayerPositionChange={onPlayerPositionChange}
          teleportTarget={teleportTarget}
          onTeleportHandled={onTeleportHandled}
          cameraMode={cameraMode}
          onCameraModeToggle={handleCameraToggle}
          onZoneTransition={onZoneTransition}
          onNearbyFriendChange={onNearbyFriendChange}
        />
      </Canvas>
    </div>
  );
}

export default WorldScene;
