"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  WorldInteractable,
  ALL_WORLD_INTERACTABLES,
  WALKABLE_BOUNDS,
  OBSTACLE_BOUNDS,
  SAFE_VEHICLE_SPAWNS,
} from "./worldData";
import { NPCSystem, FriendNPCData } from "./NPCSystem";
import { HumanoidCharacter } from "./HumanoidCharacter";
import { Vehicle } from "./Vehicle";
import {
  createStencilTexture,
  createCctvMonitorTexture,
  createCinemaProjectionTexture,
} from "./proceduralTextures";

export type CameraMode = "FPP" | "TPP";
export type NavMode = "CHARACTER" | "VEHICLE";

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
  navMode?: NavMode;
  onToggleNavMode?: () => void;
  onVehicleSpeedChange?: (speedKmh: number) => void;
  onVehicleProximityChange?: (nearVehicle: boolean) => void;
}

// ============================================================================
// PROCEDURAL STREETWEAR PLAYER CHARACTER (FOR TPP VIEW)
// ============================================================================
function PlayerCharacter({
  posRef,
  yawRef,
  isMovingRef,
  walkTimerRef,
  visible = true,
}: {
  posRef: React.MutableRefObject<THREE.Vector3>;
  yawRef: React.MutableRefObject<number>;
  isMovingRef: React.MutableRefObject<boolean>;
  walkTimerRef: React.MutableRefObject<number>;
  visible?: boolean;
}) {
  const charGroupRef = useRef<THREE.Group>(null);
  const [isMoving, setIsMoving] = useState(false);

  useFrame(() => {
    if (!charGroupRef.current) return;
    charGroupRef.current.position.set(posRef.current.x, posRef.current.y - 1.65, posRef.current.z);
    // Align visual character model (+Z front) with movement facing (-Z when yaw=0)
    charGroupRef.current.rotation.y = yawRef.current + Math.PI;

    if (isMoving !== isMovingRef.current) {
      setIsMoving(isMovingRef.current);
    }
  });

  if (!visible) return null;

  return (
    <group ref={charGroupRef}>
      <HumanoidCharacter
        modelUrl="/models/characters/player_amitdied.glb"
        colorShirt="#09090b"
        colorPants="#0f172a"
        colorShoes="#dc2626"
        colorSkin="#334155"
        shirtGraphicColor="#ef4444"
        hasHeadphones={true}
        hasBeanie={true}
        activityState={isMoving ? "WALKING" : "IDLE"}
        heightScale={1.0}
      />
    </group>
  );
}

interface PropItem {
  id: number;
  type: "cone" | "crate" | "barrel" | "box";
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Vector3;
  rotVel: THREE.Vector3;
}

const INITIAL_PROPS_DATA: PropItem[] = [
  { id: 1, type: "cone", pos: new THREE.Vector3(-3.2, 0.25, 30.0), vel: new THREE.Vector3(), rot: new THREE.Vector3(), rotVel: new THREE.Vector3() },
  { id: 2, type: "cone", pos: new THREE.Vector3(3.2, 0.25, 30.0), vel: new THREE.Vector3(), rot: new THREE.Vector3(), rotVel: new THREE.Vector3() },
  { id: 3, type: "cone", pos: new THREE.Vector3(-3.2, 0.25, 36.0), vel: new THREE.Vector3(), rot: new THREE.Vector3(), rotVel: new THREE.Vector3() },
  { id: 4, type: "cone", pos: new THREE.Vector3(3.2, 0.25, 36.0), vel: new THREE.Vector3(), rot: new THREE.Vector3(), rotVel: new THREE.Vector3() },
  { id: 5, type: "barrel", pos: new THREE.Vector3(-5.2, 0.45, 52.0), vel: new THREE.Vector3(), rot: new THREE.Vector3(), rotVel: new THREE.Vector3() },
  { id: 6, type: "barrel", pos: new THREE.Vector3(5.2, 0.45, 52.0), vel: new THREE.Vector3(), rot: new THREE.Vector3(), rotVel: new THREE.Vector3() },
  { id: 7, type: "crate", pos: new THREE.Vector3(-12.0, 0.4, 52.5), vel: new THREE.Vector3(), rot: new THREE.Vector3(), rotVel: new THREE.Vector3() },
  { id: 8, type: "crate", pos: new THREE.Vector3(12.0, 0.4, 52.5), vel: new THREE.Vector3(), rot: new THREE.Vector3(), rotVel: new THREE.Vector3() },
  { id: 9, type: "box", pos: new THREE.Vector3(-24.0, 0.3, 53.0), vel: new THREE.Vector3(), rot: new THREE.Vector3(), rotVel: new THREE.Vector3() },
  { id: 10, type: "box", pos: new THREE.Vector3(-36.0, 0.3, 53.0), vel: new THREE.Vector3(), rot: new THREE.Vector3(), rotVel: new THREE.Vector3() },
  { id: 11, type: "cone", pos: new THREE.Vector3(-28.0, 0.25, 56.0), vel: new THREE.Vector3(), rot: new THREE.Vector3(), rotVel: new THREE.Vector3() },
  { id: 12, type: "cone", pos: new THREE.Vector3(-44.0, 0.25, 56.0), vel: new THREE.Vector3(), rot: new THREE.Vector3(), rotVel: new THREE.Vector3() },
  { id: 13, type: "box", pos: new THREE.Vector3(24.0, 0.3, 53.0), vel: new THREE.Vector3(), rot: new THREE.Vector3(), rotVel: new THREE.Vector3() },
  { id: 14, type: "crate", pos: new THREE.Vector3(36.0, 0.4, 53.0), vel: new THREE.Vector3(), rot: new THREE.Vector3(), rotVel: new THREE.Vector3() },
  { id: 15, type: "barrel", pos: new THREE.Vector3(32.0, 0.45, 57.0), vel: new THREE.Vector3(), rot: new THREE.Vector3(), rotVel: new THREE.Vector3() },
  { id: 16, type: "cone", pos: new THREE.Vector3(44.0, 0.25, 56.0), vel: new THREE.Vector3(), rot: new THREE.Vector3(), rotVel: new THREE.Vector3() },
  { id: 17, type: "cone", pos: new THREE.Vector3(-8.0, 0.25, 84.0), vel: new THREE.Vector3(), rot: new THREE.Vector3(), rotVel: new THREE.Vector3() },
  { id: 18, type: "cone", pos: new THREE.Vector3(8.0, 0.25, 84.0), vel: new THREE.Vector3(), rot: new THREE.Vector3(), rotVel: new THREE.Vector3() },
  { id: 19, type: "barrel", pos: new THREE.Vector3(0.0, 0.45, 88.0), vel: new THREE.Vector3(), rot: new THREE.Vector3(), rotVel: new THREE.Vector3() },
  { id: 20, type: "crate", pos: new THREE.Vector3(-18.0, 0.4, 88.0), vel: new THREE.Vector3(), rot: new THREE.Vector3(), rotVel: new THREE.Vector3() },
  { id: 21, type: "crate", pos: new THREE.Vector3(18.0, 0.4, 88.0), vel: new THREE.Vector3(), rot: new THREE.Vector3(), rotVel: new THREE.Vector3() },
  { id: 22, type: "box", pos: new THREE.Vector3(0.0, 0.3, 98.0), vel: new THREE.Vector3(), rot: new THREE.Vector3(), rotVel: new THREE.Vector3() },
];

function InteractiveProps({
  vehiclePosRef,
  vehicleSpeedRef,
}: {
  vehiclePosRef: React.MutableRefObject<THREE.Vector3>;
  vehicleSpeedRef: React.MutableRefObject<number>;
}) {
  const propsRef = useRef<PropItem[]>(INITIAL_PROPS_DATA);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const safeDelta = Math.min(delta, 0.1);
    const vPos = vehiclePosRef.current;
    const speed = Math.abs(vehicleSpeedRef.current);

    groupRef.current.children.forEach((mesh, idx) => {
      const item = propsRef.current[idx];
      if (!item) return;

      const dist = item.pos.distanceTo(vPos);
      if (dist < 1.4) {
        const impulse = Math.max(3.5, speed * 0.85);
        const dir = new THREE.Vector3().subVectors(item.pos, vPos).normalize();
        dir.y = 0.2;
        item.vel.addScaledVector(dir, impulse);
        item.rotVel.set((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
      }

      item.pos.addScaledVector(item.vel, safeDelta);
      item.vel.multiplyScalar(0.92);
      item.rot.x += item.rotVel.x * safeDelta;
      item.rot.y += item.rotVel.y * safeDelta;
      item.rotVel.multiplyScalar(0.9);

      mesh.position.set(item.pos.x, Math.max(0.15, item.pos.y), item.pos.z);
      mesh.rotation.set(item.rot.x, item.rot.y, item.rot.z);
    });
  });

  return (
    <group ref={groupRef}>
      {INITIAL_PROPS_DATA.map((item) => (
        <group key={item.id} position={[item.pos.x, item.pos.y, item.pos.z]}>
          {item.type === "cone" && (
            <mesh position={[0, 0.2, 0]}>
              <coneGeometry args={[0.22, 0.5, 12]} />
              <meshStandardMaterial color="#f97316" emissive="#ea580c" emissiveIntensity={0.8} />
            </mesh>
          )}
          {item.type === "crate" && (
            <mesh position={[0, 0.25, 0]}>
              <boxGeometry args={[0.5, 0.5, 0.5]} />
              <meshStandardMaterial color="#78350f" roughness={0.8} />
            </mesh>
          )}
          {item.type === "barrel" && (
            <mesh position={[0, 0.35, 0]}>
              <cylinderGeometry args={[0.25, 0.25, 0.7, 12]} />
              <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.3} />
            </mesh>
          )}
          {item.type === "box" && (
            <mesh position={[0, 0.18, 0]}>
              <boxGeometry args={[0.42, 0.36, 0.42]} />
              <meshStandardMaterial color="#d97706" roughness={0.9} />
            </mesh>
          )}
        </group>
      ))}
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
  navMode?: NavMode;
  onToggleNavMode?: () => void;
  onVehicleSpeedChange?: (speedKmh: number) => void;
  onVehicleProximityChange?: (nearVehicle: boolean) => void;
}

const MOUSE_SENSITIVITY = 0.0025;

export function IntegratedCameraController({
  onHoverInteractable,
  onInteract,
  reducedMotion,
  onToggleProjector,
  onPlayerPositionChange,
  teleportTarget,
  onTeleportHandled,
  cameraMode = "FPP",
  onCameraModeToggle,
  onZoneTransition,
  onNearbyFriendChange,
  navMode = "CHARACTER",
  onToggleNavMode,
  onVehicleSpeedChange,
  onVehicleProximityChange,
}: ControllerProps) {
  const { gl } = useThree();

  const pos = useRef(new THREE.Vector3(0, 1.65, 2.5));
  const vel = useRef(new THREE.Vector3(0, 0, 0));

  // Character Mouse Look Smooth State
  const targetYaw = useRef(0);
  const targetPitch = useRef(0);
  const currentYaw = useRef(0);
  const currentPitch = useRef(0);

  // Vehicle Camera Orbit Smooth State
  const targetVehicleOrbitYaw = useRef(0);
  const targetVehicleOrbitPitch = useRef(0.25);
  const vehicleOrbitYaw = useRef(0);
  const vehicleOrbitPitch = useRef(0.25);

  const isLocked = useRef(false);
  const isFirstLockFrame = useRef(false);
  const lastMouseMoveTime = useRef(0);

  const walkTimer = useRef(0);
  const isMoving = useRef(false);

  // Vehicle State Refs
  const vehiclePosRef = useRef(new THREE.Vector3(0, 0.45, 30.0));
  const vehicleYawRef = useRef(0);
  const vehicleSpeedRef = useRef(0);
  const steeringAngleRef = useRef(0);
  const wheelRotationRef = useRef(0);
  const isBrakingRef = useRef(false);
  const isAcceleratingRef = useRef(false);
  const isNearVehicleRef = useRef(false);

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
      onPlayerPositionChange?.([teleportTarget[0], teleportTarget[1] ?? 1.65, teleportTarget[2]], currentYaw.current);
      onTeleportHandled?.();
    }
  }, [teleportTarget, onPlayerPositionChange, onTeleportHandled]);

  // Initial report on mount
  useEffect(() => {
    onPlayerPositionChange?.([pos.current.x, pos.current.y, pos.current.z], currentYaw.current);
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

    // Immediately synchronize pointer lock state upon effect attachment / mode transition
    const currentlyLocked = document.pointerLockElement === dom;
    isLocked.current = currentlyLocked;
    if (currentlyLocked) {
      isFirstLockFrame.current = true;
    }

    const onPointerDown = () => {
      if (!isLocked.current) {
        dom.requestPointerLock?.();
      }
    };

    const onLockChange = () => {
      const locked = document.pointerLockElement === dom;
      isLocked.current = locked;
      if (locked) {
        isFirstLockFrame.current = true; // Ignore first frame delta after pointer lock
      } else {
        isFirstLockFrame.current = false;
        keys.current.w = false;
        keys.current.a = false;
        keys.current.s = false;
        keys.current.d = false;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isLocked.current) return;

      // Ignore first frame anomalous delta right after pointer lock
      if (isFirstLockFrame.current) {
        isFirstLockFrame.current = false;
        return;
      }

      // Reject extreme anomalous jumps
      const dx = e.movementX;
      const dy = e.movementY;
      if (Math.abs(dx) > 250 || Math.abs(dy) > 250) return;

      lastMouseMoveTime.current = performance.now();

      if (navMode === "CHARACTER") {
        targetYaw.current -= dx * MOUSE_SENSITIVITY;
        targetPitch.current -= dy * MOUSE_SENSITIVITY;

        // Clamp vertical pitch approx -85° to +85°
        const maxPitch = (85 * Math.PI) / 180;
        targetPitch.current = THREE.MathUtils.clamp(targetPitch.current, -maxPitch, maxPitch);
      } else {
        // Vehicle camera orbit controls
        targetVehicleOrbitYaw.current -= dx * MOUSE_SENSITIVITY;
        targetVehicleOrbitPitch.current -= dy * MOUSE_SENSITIVITY;

        targetVehicleOrbitPitch.current = THREE.MathUtils.clamp(
          targetVehicleOrbitPitch.current,
          0.05,
          1.2
        );
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code.toLowerCase();
      if (code === "keyw" || code === "arrowup") keys.current.w = true;
      if (code === "keys" || code === "arrowdown") keys.current.s = true;
      if (code === "keya" || code === "arrowleft") keys.current.a = true;
      if (code === "keyd" || code === "arrowright") keys.current.d = true;
      if (code === "keyv") {
        // Toggle FPP / TPP camera
        onCameraModeToggle();
      }
      if (code === "keye") {
        // Enter / Exit Vehicle Mode
        onToggleNavMode?.();
      }
      if (code === "keyr" && navMode === "VEHICLE") {
        // Multi-Point Reset: Find nearest safe outdoor vehicle spawn
        let nearestSpawn: [number, number, number] = SAFE_VEHICLE_SPAWNS[0];
        let minDistance = 9999;
        for (const spawn of SAFE_VEHICLE_SPAWNS) {
          const d = vehiclePosRef.current.distanceTo(new THREE.Vector3(...spawn));
          if (d < minDistance) {
            minDistance = d;
            nearestSpawn = spawn;
          }
        }
        vehiclePosRef.current.set(nearestSpawn[0], nearestSpawn[1], nearestSpawn[2]);
        vehicleYawRef.current = 0;
        vehicleSpeedRef.current = 0;
        targetVehicleOrbitYaw.current = 0;
        targetVehicleOrbitPitch.current = 0.25;
        onZoneTransition?.("VEHICLE RESET // SAFELY POSITIONED ON ROAD");
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
      if (code === "keyw" || code === "arrowup") keys.current.w = false;
      if (code === "keys" || code === "arrowdown") keys.current.s = false;
      if (code === "keya" || code === "arrowleft") keys.current.a = false;
      if (code === "keyd" || code === "arrowright") keys.current.d = false;
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
      if (!document.pointerLockElement) {
        isLocked.current = false;
        isFirstLockFrame.current = false;
      }
    };
  }, [gl, onInteract, onToggleProjector, cameraMode, onCameraModeToggle, navMode, onToggleNavMode, onZoneTransition]);

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
    // Smooth camera mouse look interpolation for character mode
    const cameraLerpSpeed = 1 - Math.exp(-delta * 24);
    currentYaw.current = THREE.MathUtils.lerp(currentYaw.current, targetYaw.current, cameraLerpSpeed);
    currentPitch.current = THREE.MathUtils.lerp(currentPitch.current, targetPitch.current, cameraLerpSpeed);

    // ========================================================
    // VEHICLE MODE DRIVING PHYSICS & FOLLOW CAMERA
    // ========================================================
    if (navMode === "VEHICLE") {
      const maxForwardSpeed = 18.0; // ~65 km/h
      const maxReverseSpeed = 7.0;  // ~25 km/h
      const accelRate = 14.0;
      const brakeRate = 24.0;
      const dragRate = 4.0;
      const steerMax = 0.42;
      const steerRate = 5.0;

      let isAcc = false;
      let isBrake = false;

      // W / UP ARROW -> FORWARD
      // S / DOWN ARROW -> REVERSE
      if (keys.current.w) {
        if (vehicleSpeedRef.current < -0.5) {
          vehicleSpeedRef.current += brakeRate * delta;
          isBrake = true;
        } else {
          vehicleSpeedRef.current += accelRate * delta;
          isAcc = true;
        }
      } else if (keys.current.s) {
        if (vehicleSpeedRef.current > 0.5) {
          vehicleSpeedRef.current -= brakeRate * delta;
          isBrake = true;
        } else {
          vehicleSpeedRef.current -= accelRate * 0.7 * delta;
          isAcc = true;
        }
      } else {
        // Natural friction drag
        if (vehicleSpeedRef.current > 0) {
          vehicleSpeedRef.current = Math.max(0, vehicleSpeedRef.current - dragRate * delta);
        } else if (vehicleSpeedRef.current < 0) {
          vehicleSpeedRef.current = Math.min(0, vehicleSpeedRef.current + dragRate * delta);
        }
      }

      // Handbrake (SPACE)
      if (keys.current.space) {
        isBrake = true;
        if (vehicleSpeedRef.current > 0) {
          vehicleSpeedRef.current = Math.max(0, vehicleSpeedRef.current - brakeRate * 1.8 * delta);
        } else if (vehicleSpeedRef.current < 0) {
          vehicleSpeedRef.current = Math.min(0, vehicleSpeedRef.current + brakeRate * 1.8 * delta);
        }
      }

      // Clamp speed
      vehicleSpeedRef.current = THREE.MathUtils.clamp(
        vehicleSpeedRef.current,
        -maxReverseSpeed,
        maxForwardSpeed
      );

      // Steering: A / Left Arrow = Steer Left (+steerMax), D / Right Arrow = Steer Right (-steerMax)
      let targetSteer = 0;
      if (keys.current.a) targetSteer += steerMax;
      if (keys.current.d) targetSteer -= steerMax;

      steeringAngleRef.current = THREE.MathUtils.lerp(
        steeringAngleRef.current,
        targetSteer,
        delta * steerRate
      );

      // Turn vehicle yaw based on steering angle and movement direction
      if (Math.abs(vehicleSpeedRef.current) > 0.1) {
        const dirFactor = vehicleSpeedRef.current >= 0 ? 1.0 : -1.0;
        const speedTurnScale = Math.min(1.0, 0.4 + (Math.abs(vehicleSpeedRef.current) / maxForwardSpeed) * 0.6);
        vehicleYawRef.current += steeringAngleRef.current * dirFactor * speedTurnScale * delta * 2.8;
      }

      // Forward direction vector (Vehicle Front faces +Z when yaw=0)
      const forwardX = Math.sin(vehicleYawRef.current);
      const forwardZ = Math.cos(vehicleYawRef.current);

      // Vehicle 5-Point Footprint Collision Check
      const isVehicleFootprintWalkable = (x: number, z: number, yawVal: number): boolean => {
        const halfLength = 1.35;
        const halfWidth = 0.75;
        const sinY = Math.sin(yawVal);
        const cosY = Math.cos(yawVal);

        const points: [number, number][] = [
          [x, z], // Center
          [x + sinY * halfLength - cosY * halfWidth, z + cosY * halfLength + sinY * halfWidth], // Front-Left
          [x + sinY * halfLength + cosY * halfWidth, z + cosY * halfLength - sinY * halfWidth], // Front-Right
          [x - sinY * halfLength - cosY * halfWidth, z - cosY * halfLength + sinY * halfWidth], // Rear-Left
          [x - sinY * halfLength + cosY * halfWidth, z - cosY * halfLength - sinY * halfWidth], // Rear-Right
        ];

        return points.every(([px, pz]) => isPointWalkable(px, pz));
      };

      // Subdivided swept movement step check
      const totalDist = vehicleSpeedRef.current * delta;
      const subSteps = Math.max(1, Math.min(8, Math.ceil(Math.abs(totalDist) / 0.15)));
      const stepDist = totalDist / subSteps;

      let stepX = vehiclePosRef.current.x;
      let stepZ = vehiclePosRef.current.z;

      for (let i = 0; i < subSteps; i++) {
        const nextX = stepX + forwardX * stepDist;
        const nextZ = stepZ + forwardZ * stepDist;

        if (isVehicleFootprintWalkable(nextX, nextZ, vehicleYawRef.current)) {
          stepX = nextX;
          stepZ = nextZ;
        } else if (isVehicleFootprintWalkable(nextX, stepZ, vehicleYawRef.current)) {
          stepX = nextX;
          vehicleSpeedRef.current *= 0.85;
        } else if (isVehicleFootprintWalkable(stepX, nextZ, vehicleYawRef.current)) {
          stepZ = nextZ;
          vehicleSpeedRef.current *= 0.85;
        } else {
          vehicleSpeedRef.current *= -0.25;
          break;
        }
      }

      vehiclePosRef.current.x = stepX;
      vehiclePosRef.current.z = stepZ;

      // Wheel spinning rotation
      wheelRotationRef.current += (vehicleSpeedRef.current / 0.38) * delta;
      isAcceleratingRef.current = isAcc;
      isBrakingRef.current = isBrake;

      // Sync character position next to vehicle
      pos.current.set(
        vehiclePosRef.current.x + 1.8,
        1.65,
        vehiclePosRef.current.z
      );

      // Smooth Vehicle Follow Camera
      const camLerp = 1 - Math.exp(-delta * 14);
      vehicleOrbitYaw.current = THREE.MathUtils.lerp(vehicleOrbitYaw.current, targetVehicleOrbitYaw.current, camLerp);
      vehicleOrbitPitch.current = THREE.MathUtils.lerp(vehicleOrbitPitch.current, targetVehicleOrbitPitch.current, camLerp);

      // Auto-align camera behind vehicle when driving forward if mouse has been idle (>2000ms)
      const now = performance.now();
      if (Math.abs(vehicleSpeedRef.current) > 1.2 && now - lastMouseMoveTime.current > 2000) {
        targetVehicleOrbitYaw.current *= (1 - delta * 1.0);
      }

      const combinedAngle = vehicleYawRef.current + vehicleOrbitYaw.current;

      if (cameraMode === "FPP") {
        // First Person View inside car
        state.camera.position.set(
          vehiclePosRef.current.x,
          vehiclePosRef.current.y + 0.68,
          vehiclePosRef.current.z + Math.cos(vehicleYawRef.current) * 0.15
        );
        state.camera.rotation.set(vehicleOrbitPitch.current, combinedAngle, 0, "YXZ");
      } else {
        // Third Person Follow View
        const speedRatio = Math.abs(vehicleSpeedRef.current) / maxForwardSpeed;
        const dist = 5.5 + speedRatio * 1.6;
        const cosP = Math.cos(vehicleOrbitPitch.current);
        const sinP = Math.sin(vehicleOrbitPitch.current);
        const sinY = Math.sin(combinedAngle);
        const cosY = Math.cos(combinedAngle);

        // Calculate desired camera direction vector from vehicle center
        const dirX = -sinY * cosP;
        const dirY = sinP;
        const dirZ = -cosY * cosP;

        // Multi-sample camera sweep along line from vehicle to desired camera position using existing world collision
        let safeDist = dist;
        const steps = 12;
        for (let i = 1; i <= steps; i++) {
          const d = (dist * i) / steps;
          const testX = vehiclePosRef.current.x + dirX * d;
          const testZ = vehiclePosRef.current.z + dirZ * d;
          if (!isPointWalkable(testX, testZ)) {
            safeDist = Math.max(1.2, d - 0.4);
            break;
          }
        }

        const targetCamX = vehiclePosRef.current.x + dirX * safeDist;
        const targetCamY = Math.max(0.5, vehiclePosRef.current.y + 1.2 + dirY * safeDist);
        const targetCamZ = vehiclePosRef.current.z + dirZ * safeDist;

        state.camera.position.x += (targetCamX - state.camera.position.x) * camLerp;
        state.camera.position.y += (targetCamY - state.camera.position.y) * camLerp;
        state.camera.position.z += (targetCamZ - state.camera.position.z) * camLerp;

        if (state.camera instanceof THREE.PerspectiveCamera) {
          const targetFov = 72 + speedRatio * 6;
          state.camera.fov = THREE.MathUtils.lerp(state.camera.fov, targetFov, delta * 4);
          state.camera.updateProjectionMatrix();
        }

        state.camera.lookAt(
          vehiclePosRef.current.x,
          vehiclePosRef.current.y + 0.85,
          vehiclePosRef.current.z
        );
      }

      onVehicleSpeedChange?.(Math.round(Math.abs(vehicleSpeedRef.current) * 3.6));
      return;
    }

    // ========================================================
    // ON FOOT CHARACTER NAVIGATION
    // ========================================================
    // Check vehicle proximity on foot
    const distToVehicle = pos.current.distanceTo(vehiclePosRef.current);
    const isNear = distToVehicle < 3.8;
    if (isNearVehicleRef.current !== isNear) {
      isNearVehicleRef.current = isNear;
      onVehicleProximityChange?.(isNear);
    }

    const forwardX = -Math.sin(currentYaw.current);
    const forwardZ = -Math.cos(currentYaw.current);
    const rightX = Math.cos(currentYaw.current);
    const rightZ = -Math.sin(currentYaw.current);

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
      targetYaw.current = 0;
      currentYaw.current = 0; // Face South into park
      currentZoneRef.current = "outdoor";
      onZoneTransition?.("SURFACE // AMITDIED OUTDOOR DISTRICT");
    }
    // 2. Walking into underground facility through Bunker Portal (at Z: ~23.0)
    else if (currZ >= 15 && finalZ <= 23.0) {
      finalX = 0;
      finalZ = 7.8;
      targetYaw.current = Math.PI;
      currentYaw.current = Math.PI; // Face North into facility
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
      state.camera.rotation.set(currentPitch.current, currentYaw.current, 0, "YXZ");
    } else {
      // Third Person Follow View
      const idealDist = 2.8;
      const heightOffset = 0.25;

      const cosP = Math.cos(currentPitch.current);
      const sinP = Math.sin(currentPitch.current);
      const sinY = Math.sin(currentYaw.current);
      const cosY = Math.cos(currentYaw.current);

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
      state.camera.rotation.set(currentPitch.current, currentYaw.current, 0, "YXZ");
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
      const dyaw = Math.abs(currentYaw.current - lastReportedYaw.current);
      if (dx > 0.03 || dz > 0.03 || dyaw > 0.03 || frameCount.current % 18 === 0) {
        lastReportedPos.current = currPosTuple;
        lastReportedYaw.current = currentYaw.current;
        onPlayerPositionChange?.(currPosTuple, currentYaw.current);
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
        yawRef={currentYaw}
        isMovingRef={isMoving}
        walkTimerRef={walkTimer}
        visible={navMode === "CHARACTER" && cameraMode === "TPP"}
      />
      <Vehicle
        vehiclePosRef={vehiclePosRef}
        vehicleYawRef={vehicleYawRef}
        steeringAngleRef={steeringAngleRef}
        wheelRotationRef={wheelRotationRef}
        isBrakingRef={isBrakingRef}
        isAcceleratingRef={isAcceleratingRef}
        isOccupied={navMode === "VEHICLE"}
      />
      <InteractiveProps vehiclePosRef={vehiclePosRef} vehicleSpeedRef={vehicleSpeedRef} />
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
// PHASE D VISUAL POLISH: REUSABLE STREETLIGHT & ATMOSPHERIC PARTICLES
// ============================================================================
function Streetlight({
  position,
  color = "#fde047",
  intensity = 2.8,
}: {
  position: [number, number, number];
  color?: string;
  intensity?: number;
}) {
  return (
    <group position={position}>
      {/* Dark Metal Pole */}
      <mesh position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 4.4, 10]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.3} />
      </mesh>
      {/* Cantilever Arm */}
      <mesh position={[0.4, 4.3, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <cylinderGeometry args={[0.06, 0.06, 1.0, 8]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} />
      </mesh>
      {/* Fixture Lamp Head */}
      <mesh position={[0.8, 4.1, 0]}>
        <boxGeometry args={[0.45, 0.2, 0.3]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3.2} />
      </mesh>
      {/* Ground Light Pool */}
      <pointLight position={[0.8, 3.9, 0]} color={color} intensity={intensity} distance={12} />
    </group>
  );
}

function ParkedVehicle({
  position,
  rotation = [0, 0, 0] as [number, number, number],
  color = "#1e293b",
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Lower Chassis */}
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[1.65, 0.42, 3.2]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Canopy Glass */}
      <mesh position={[0, 0.65, -0.1]}>
        <boxGeometry args={[1.35, 0.45, 1.55]} />
        <meshStandardMaterial color="#020617" roughness={0.1} metalness={0.9} transparent opacity={0.85} />
      </mesh>

      {/* Wheels */}
      {[-0.85, 0.85].map((x, xi) =>
        [1.0, -1.0].map((z, zi) => (
          <mesh key={`${xi}-${zi}`} position={[x, 0.25, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.35, 0.38, 0.28, 14]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
        ))
      )}

      {/* Headlights & Taillights */}
      <mesh position={[-0.55, 0.38, 1.61]}>
        <boxGeometry args={[0.28, 0.12, 0.05]} />
        <meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={2.0} />
      </mesh>
      <mesh position={[0.55, 0.38, 1.61]}>
        <boxGeometry args={[0.28, 0.12, 0.05]} />
        <meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={2.0} />
      </mesh>
      <mesh position={[0, 0.38, -1.61]}>
        <boxGeometry args={[1.4, 0.08, 0.05]} />
        <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={1.8} />
      </mesh>
    </group>
  );
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 9999.0 + 1.0) * 10000.0;
  return x - Math.floor(x);
}

function createSkyGradientTexture(): THREE.CanvasTexture {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return new THREE.CanvasTexture(null as any);
  }
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    // Zenith / Top: Deep Twilight Blue
    grad.addColorStop(0.0, "#080d1a");
    grad.addColorStop(0.35, "#0f172a");
    grad.addColorStop(0.55, "#1e1b4b");
    // Mid Sky: Rich Violet / Royal Purple
    grad.addColorStop(0.72, "#3b0764");
    grad.addColorStop(0.85, "#581c87");
    // Horizon: Soft Crimson Sunset Haze
    grad.addColorStop(0.95, "#9a3412");
    grad.addColorStop(1.0, "#c2410c");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function AtmosphericParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 120;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (pseudoRandom(i * 3 + 1) - 0.5) * 110;
      pos[i * 3 + 1] = 1.0 + pseudoRandom(i * 3 + 2) * 12.0;
      pos[i * 3 + 2] = 20.0 + pseudoRandom(i * 3 + 3) * 85.0;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.getElapsedTime();
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += Math.sin(time + i) * 0.008;
      arr[i * 3] += Math.cos(time * 0.5 + i) * 0.004;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.25}
        color="#fde047"
        transparent
        opacity={0.45}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ============================================================================
// REALISTIC OPEN-WORLD GRAPHICS: DISTANT CITY SKYLINE (36 AAA-STYLE SILHOUETTES)
// ============================================================================
function DistantCitySkyline() {
  const buildings = useMemo(() => {
    const list: { x: number; y: number; z: number; width: number; height: number; depth: number; color: string }[] = [];
    const seeds = [
      // North skyline (across ridge)
      { x: -75, z: 130, h: 28, w: 12, d: 10 },
      { x: -60, z: 135, h: 36, w: 14, d: 12 },
      { x: -45, z: 140, h: 22, w: 10, d: 10 },
      { x: -30, z: 145, h: 42, w: 16, d: 14 },
      { x: -15, z: 142, h: 32, w: 12, d: 12 },
      { x: 0, z: 148, h: 48, w: 18, d: 16 },
      { x: 15, z: 142, h: 38, w: 15, d: 12 },
      { x: 30, z: 145, h: 26, w: 11, d: 10 },
      { x: 45, z: 140, h: 34, w: 13, d: 11 },
      { x: 60, z: 135, h: 30, w: 12, d: 11 },
      { x: 75, z: 130, h: 24, w: 11, d: 10 },
      // East perimeter flank
      { x: 78, z: 110, h: 26, w: 10, d: 10 },
      { x: 82, z: 90, h: 34, w: 12, d: 12 },
      { x: 86, z: 70, h: 28, w: 11, d: 11 },
      { x: 82, z: 50, h: 22, w: 10, d: 10 },
      { x: 78, z: 30, h: 30, w: 12, d: 11 },
      // West perimeter flank
      { x: -78, z: 110, h: 24, w: 11, d: 10 },
      { x: -82, z: 90, h: 32, w: 13, d: 12 },
      { x: -86, z: 70, h: 22, w: 10, d: 10 },
      { x: -82, z: 50, h: 28, w: 12, d: 11 },
      { x: -78, z: 30, h: 26, w: 10, d: 10 },
    ];

    seeds.forEach((item, idx) => {
      list.push({
        x: item.x,
        y: item.h / 2,
        z: item.z,
        width: item.w,
        height: item.h,
        depth: item.d,
        color: idx % 2 === 0 ? "#0f172a" : "#1e293b",
      });
    });
    return list;
  }, []);

  return (
    <group>
      {buildings.map((b, idx) => (
        <group key={idx} position={[b.x, b.y, b.z]}>
          {/* Main Tower Silhouette Mass */}
          <mesh>
            <boxGeometry args={[b.width, b.height, b.depth]} />
            <meshStandardMaterial color={b.color} roughness={0.9} />
          </mesh>

          {/* Window Dot Grid Planes */}
          <mesh position={[0, 0, b.depth / 2 + 0.05]}>
            <planeGeometry args={[b.width * 0.8, b.height * 0.7]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#fde047"
              emissiveIntensity={0.65}
              transparent
              opacity={0.8}
            />
          </mesh>

          {/* Rooftop Obstruction Warning Light */}
          {b.height > 25 && (
            <mesh position={[0, b.height / 2 + 0.3, 0]}>
              <sphereGeometry args={[0.25, 8, 8]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

// ============================================================================
// 7. OUTDOOR WORLD (Connected explorable surface district, Z: 20 to 115)
// ============================================================================
function OutdoorWorld() {
  const outdoorBunkerSignTex = useMemo(
    () => createStencilTexture("SECTOR -02 SURFACE ACCESS", "FACILITY AIRLOCK // ENTER", "#22c55e"),
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

  const nowShowingPosterTex = useMemo(
    () => createStencilTexture("NOW SHOWING", "AMITDIED VISUALS & STEMS", "#fde047"),
    []
  );

  const beatCaveSignTex = useMemo(
    () => createStencilTexture("BEAT CAVE", "STUDIO LOFT // ANALOG 808", "#38bdf8"),
    []
  );

  const vinylArchiveSignTex = useMemo(
    () => createStencilTexture("VINYL ARCHIVE", "RARE WAX & TEST PRESSINGS", "#f59e0b"),
    []
  );

  const sampleLabSignTex = useMemo(
    () => createStencilTexture("SAMPLE LAB", "CHOPPED STEMS & LOOPS", "#a855f7"),
    []
  );

  const skylineBillboardTex = useMemo(
    () => createStencilTexture("AMITDIED", "MUSIC UNIVERSE // 03:47 AM", "#f43f5e"),
    []
  );

  const skyGradientTex = useMemo(() => createSkyGradientTexture(), []);

  const monumentWaveRef = useRef<THREE.PointLight>(null);
  const antennaBeaconRef = useRef<THREE.PointLight>(null);
  const bunkerVentFanRef = useRef<THREE.Group>(null);
  const towerBeaconRef = useRef<THREE.Mesh>(null);
  const vuMeterRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // 1. Audio-Reactive Park Monument
    if (typeof document !== "undefined" && monumentWaveRef.current) {
      const rootStyle = getComputedStyle(document.documentElement);
      const rawBass = parseFloat(rootStyle.getPropertyValue("--audio-bass") || "0");
      const bass = isNaN(rawBass) ? 0 : rawBass;
      monumentWaveRef.current.intensity = 2.5 + bass * 8.0;
    }

    // 2. Audio Labs Antenna Beacon Blink
    if (antennaBeaconRef.current) {
      antennaBeaconRef.current.intensity = Math.sin(time * 4) > 0 ? 3.5 : 0.5;
    }

    // 3. Bunker Industrial Ventilation Fan Rotation
    if (bunkerVentFanRef.current) {
      bunkerVentFanRef.current.rotation.z += 0.08;
    }

    // 4. Overlook Radio Tower Aviation Beacon Pulsing
    if (towerBeaconRef.current) {
      const mat = towerBeaconRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissiveIntensity = 2.0 + Math.sin(time * 3) * 2.0;
      }
    }

    // 5. Audio Labs Facade VU-Meter Animation
    if (vuMeterRef.current) {
      vuMeterRef.current.scale.y = 0.5 + Math.abs(Math.sin(time * 5)) * 0.8;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* ======================================================== */}
      {/* OUTDOOR ATMOSPHERIC SKY, SUNLIGHT & DISTANT SKYLINE */}
      {/* ======================================================== */}
      <directionalLight position={[35, 65, 30]} intensity={1.65} color="#fde047" castShadow />
      <hemisphereLight args={["#38bdf8", "#1e293b", 0.7]} />

      {/* Atmospheric Particles System */}
      <AtmosphericParticles />

      {/* Distant City Skyline Silhouettes */}
      <DistantCitySkyline />

      {/* Cinematic Deep Blue to Purple Sky Dome */}
      <mesh position={[0, 30, 68]}>
        <cylinderGeometry args={[88, 88, 75, 32, 1, true]} />
        <meshBasicMaterial map={skyGradientTex} side={THREE.BackSide} />
      </mesh>

      {/* Soft Sunset Crimson & Orange Horizon Haze Band */}
      <mesh position={[0, 4, 68]}>
        <cylinderGeometry args={[85, 85, 16, 32, 1, true]} />
        <meshBasicMaterial color="#f97316" transparent opacity={0.28} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Soft Dusk Purple Haze Band */}
      <mesh position={[0, 16, 68]}>
        <cylinderGeometry args={[86, 86, 22, 32, 1, true]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.22} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Glowing Sunset Sun/Moon Orb Low on Horizon */}
      <mesh position={[48, 28, 15]}>
        <sphereGeometry args={[5.2, 24, 24]} />
        <meshBasicMaterial color="#fde047" />
      </mesh>

      {/* ======================================================== */}
      {/* 1. AAA LAYERED TERRAIN, EMBANKMENTS & PARK EDGES */}
      {/* ======================================================== */}
      {/* Main Base Grass Terrain Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 68]} receiveShadow>
        <planeGeometry args={[130, 100]} />
        <meshStandardMaterial color="#1e4620" roughness={0.92} />
      </mesh>

      {/* Raised Park Terrace Embankments (Elevated Ground around Park Perimeter) */}
      <mesh position={[-28, 0.12, 57]} castShadow receiveShadow>
        <boxGeometry args={[14, 0.24, 38]} />
        <meshStandardMaterial color="#1b4d22" roughness={0.9} />
      </mesh>
      <mesh position={[28, 0.12, 57]} castShadow receiveShadow>
        <boxGeometry args={[14, 0.24, 38]} />
        <meshStandardMaterial color="#1b4d22" roughness={0.9} />
      </mesh>

      {/* Sloped Terraced Steps around Central Park Plaza */}
      <mesh position={[0, 0.08, 41]}>
        <boxGeometry args={[18, 0.16, 2.2]} />
        <meshStandardMaterial color="#334155" roughness={0.75} />
      </mesh>

      {/* ======================================================== */}
      {/* 2. LAYERED ROAD NETWORK, ASPHALT WEAR, CURBS & SIDEWALKS */}
      {/* ======================================================== */}
      {/* East-West Multi-lane Asphalt Main Avenue across Z: 34 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 34]} receiveShadow>
        <planeGeometry args={[116, 6.8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.85} />
      </mesh>

      {/* Darker Tire Track Wear Lanes on Main Avenue */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 35.6]}>
        <planeGeometry args={[116, 1.4]} />
        <meshStandardMaterial color="#090d16" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 32.4]}>
        <planeGeometry args={[116, 1.4]} />
        <meshStandardMaterial color="#090d16" roughness={0.9} />
      </mesh>

      {/* Outer White Edge Lines on Main Avenue */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 37.1]}>
        <planeGeometry args={[116, 0.16]} />
        <meshBasicMaterial color="#f8fafc" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 30.9]}>
        <planeGeometry args={[116, 0.16]} />
        <meshBasicMaterial color="#f8fafc" />
      </mesh>

      {/* Double Yellow Center Line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, 34.0]}>
        <planeGeometry args={[116, 0.14]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>

      {/* Road Lane Center Dashes & Reflector Studs */}
      {[-45, -30, -15, 0, 15, 30, 45].map((x, i) => (
        <group key={i}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, 35.5]}>
            <planeGeometry args={[7, 0.15]} />
            <meshBasicMaterial color="#fde047" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, 32.5]}>
            <planeGeometry args={[7, 0.15]} />
            <meshBasicMaterial color="#fde047" />
          </mesh>
          {/* Reflector Studs */}
          <mesh position={[x + 3.5, 0.04, 34]}>
            <boxGeometry args={[0.15, 0.05, 0.15]} />
            <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={3.0} />
          </mesh>
        </group>
      ))}

      {/* Asphalt Repair Patches */}
      {[
        { x: -18, z: 33.2, w: 3.2, l: 1.8 },
        { x: 12, z: 35.4, w: 4.0, l: 1.2 },
        { x: 26, z: 32.8, w: 2.8, l: 2.2 },
      ].map((patch, idx) => (
        <mesh key={idx} rotation={[-Math.PI / 2, 0, 0]} position={[patch.x, 0.014, patch.z]}>
          <planeGeometry args={[patch.w, patch.l]} />
          <meshStandardMaterial color="#1e293b" roughness={0.95} />
        </mesh>
      ))}

      {/* Crosswalk Zebra Lines & Manholes at Intersections */}
      {[-32, 0, 32].map((xPos, idx) => (
        <group key={idx} position={[xPos, 0.025, 34]}>
          {[-2.2, -1.4, -0.6, 0.6, 1.4, 2.2].map((zOffset, zIdx) => (
            <mesh key={zIdx} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, zOffset]}>
              <planeGeometry args={[1.5, 0.38]} />
              <meshBasicMaterial color="#f8fafc" />
            </mesh>
          ))}
          {/* Storm Drain Grate / Manhole Cover */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.8, 0.01, 0]}>
            <cylinderGeometry args={[0.48, 0.48, 0.02, 16]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Bevelled Concrete Curb Blocks along Main Avenue */}
      <mesh position={[0, 0.08, 37.5]}>
        <boxGeometry args={[116, 0.18, 0.28]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.08, 30.5]}>
        <boxGeometry args={[116, 0.18, 0.28]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>

      {/* Raised Sidewalks with Concrete Tile Pattern */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.09, 38.8]}>
        <planeGeometry args={[116, 2.4]} />
        <meshStandardMaterial color="#475569" roughness={0.75} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.09, 29.2]}>
        <planeGeometry args={[116, 2.4]} />
        <meshStandardMaterial color="#475569" roughness={0.75} />
      </mesh>

      {/* North-South Central Park Promenade (Stone Paved Walkway) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 58]}>
        <planeGeometry args={[5.5, 44]} />
        <meshStandardMaterial color="#475569" roughness={0.8} />
      </mesh>

      {/* Cobblestone Paths to Residential & Commercial Districts */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-20, 0.01, 52]}>
        <planeGeometry args={[35, 3.5]} />
        <meshStandardMaterial color="#52525b" roughness={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[20, 0.01, 52]}>
        <planeGeometry args={[35, 3.5]} />
        <meshStandardMaterial color="#52525b" roughness={0.8} />
      </mesh>

      {/* ======================================================== */}
      {/* STREETLIGHT POLES ACROSS ALL DISTRICTS */}
      {/* ======================================================== */}
      {/* Bunker Access Road */}
      <Streetlight position={[-8, 0, 28]} color="#22c55e" intensity={3.0} />
      <Streetlight position={[8, 0, 28]} color="#22c55e" intensity={3.0} />

      {/* Central Park Boulevard */}
      <Streetlight position={[-12, 0, 48]} color="#fde047" intensity={2.8} />
      <Streetlight position={[12, 0, 48]} color="#fde047" intensity={2.8} />
      <Streetlight position={[-12, 0, 68]} color="#fde047" intensity={2.8} />
      <Streetlight position={[12, 0, 68]} color="#fde047" intensity={2.8} />

      {/* Residential District Cross Drive (Warm Amber) */}
      <Streetlight position={[-32, 0, 38]} color="#f59e0b" intensity={2.5} />
      <Streetlight position={[-32, 0, 54]} color="#f59e0b" intensity={2.5} />
      <Streetlight position={[-32, 0, 68]} color="#f59e0b" intensity={2.5} />

      {/* Commercial Sound District Drive (Cool Red/Cyan/Purple) */}
      <Streetlight position={[32, 0, 38]} color="#ef4444" intensity={3.0} />
      <Streetlight position={[32, 0, 54]} color="#38bdf8" intensity={3.0} />
      <Streetlight position={[32, 0, 68]} color="#c084fc" intensity={3.0} />

      {/* ======================================================== */}
      {/* PARKED VEHICLES IN RESIDENTIAL, COMMERCIAL & OVERLOOK DISTRICTS */}
      {/* ======================================================== */}
      <ParkedVehicle position={[-38, 0, 38]} rotation={[0, 0.2, 0]} color="#1e293b" />
      <ParkedVehicle position={[38, 0, 38]} rotation={[0, -0.15, 0]} color="#0369a1" />
      <ParkedVehicle position={[38, 0, 62]} rotation={[0, 0.1, 0]} color="#7c2d12" />
      <ParkedVehicle position={[-22, 0, 88]} rotation={[0, 0.05, 0]} color="#334155" />

      {/* ======================================================== */}
      {/* ENVIRONMENTAL MICRO-DETAIL PROPS & UTILITY INFRASTRUCTURE */}
      {/* ======================================================== */}
      {/* Electrical Transformer Boxes near Audio Labs & Bunker */}
      <group position={[34, 0, 42]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[1.2, 1.2, 1.0]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.8, 0.51]}>
          <planeGeometry args={[0.4, 0.3]} />
          <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* Fire Hydrants at Intersections */}
      {[-31, 31].map((x, idx) => (
        <group key={idx} position={[x, 0, 38.2]}>
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.12, 0.15, 0.7, 12]} />
            <meshStandardMaterial color="#ef4444" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.55, 0]}>
            <sphereGeometry args={[0.14, 12, 12]} />
            <meshStandardMaterial color="#ef4444" roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Dumpster & Trash Bins in Alleys */}
      <group position={[52, 0, 42]}>
        <mesh position={[0, 0.8, 0]} castShadow>
          <boxGeometry args={[1.8, 1.4, 2.8]} />
          <meshStandardMaterial color="#15803d" roughness={0.8} />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* 2. SURFACE BUNKER ENTRANCE (AT Z: 24) — LANDMARK 6 */}
      {/* ======================================================== */}
      <group position={[0, 0, 24]}>
        {/* Brutalist Concrete Bunker Head */}
        <mesh position={[0, 2.4, -0.5]} castShadow receiveShadow>
          <boxGeometry args={[7.2, 4.8, 3.5]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
        {/* Left & Right Wing Buttresses */}
        <mesh position={[-3.8, 1.8, 0.2]} castShadow>
          <boxGeometry args={[1.2, 3.6, 4.0]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[3.8, 1.8, 0.2]} castShadow>
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
          {/* Bunker Stencil Sign */}
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

        {/* Industrial Ventilation Duct & Fan */}
        <group position={[-2.8, 3.2, 1.2]}>
          <mesh>
            <cylinderGeometry args={[0.45, 0.45, 0.6, 16]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
          <group ref={bunkerVentFanRef} position={[0, 0, 0.31]}>
            {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((rot, idx) => (
              <mesh key={idx} rotation={[0, 0, rot]}>
                <boxGeometry args={[0.08, 0.35, 0.02]} />
                <meshStandardMaterial color="#f59e0b" />
              </mesh>
            ))}
          </group>
        </group>

        {/* Security Barrier Boom Gate & Hazard Markings */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 3.2]}>
          <planeGeometry args={[6.0, 1.2]} />
          <meshStandardMaterial color="#b45309" roughness={0.8} />
        </mesh>
        <mesh position={[2.2, 0.6, 3.2]}>
          <boxGeometry args={[0.15, 1.2, 0.15]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>

        {/* Mounted CCTV Surveillance Camera */}
        <group position={[3.2, 3.2, 1.2]}>
          <mesh position={[0, -0.4, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.8, 8]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position={[0, -0.8, 0.15]} rotation={[0.3, 0, 0]}>
            <boxGeometry args={[0.2, 0.2, 0.4]} />
            <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={1.5} />
          </mesh>
        </group>
      </group>

      {/* ======================================================== */}
      {/* 3. CENTRAL PARK, VINYL PLAZA & SOUND MONUMENT — LANDMARK 4 */}
      {/* ======================================================== */}
      {/* 16 Organic Stylized Trees with Irregular Trunks & Multi-tier Foliage */}
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
          {/* Wood Trunk with Irregular Taper */}
          <mesh position={[0, 1.6, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.38, 3.2, 10]} />
            <meshStandardMaterial color="#451a03" roughness={0.9} />
          </mesh>
          {/* Primary Branch Limb */}
          <mesh position={[0.3, 2.4, 0.1]} rotation={[0, 0, -0.35]}>
            <cylinderGeometry args={[0.1, 0.18, 1.4, 8]} />
            <meshStandardMaterial color="#451a03" roughness={0.9} />
          </mesh>
          {/* Tier 1 Foliage Cluster */}
          <mesh position={[0, 3.6, 0]} castShadow>
            <icosahedronGeometry args={[1.8, 1]} />
            <meshStandardMaterial color={tree.color} roughness={0.7} />
          </mesh>
          {/* Tier 2 Upper Foliage Cluster */}
          <mesh position={[0, 4.8, 0]} castShadow>
            <icosahedronGeometry args={[1.3, 1]} />
            <meshStandardMaterial color={tree.color} roughness={0.65} />
          </mesh>
        </group>
      ))}

      {/* VINYL RECORD PLAZA GROUND PATTERN (At X: 0, Z: 55) */}
      <group position={[0, 0, 55]}>
        {/* Outer Vinyl Disc Base */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
          <circleGeometry args={[7.5, 48]} />
          <meshStandardMaterial color="#111827" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Concentric Groove Rings */}
        {[6.2, 5.0, 3.8, 2.8].map((r, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[r - 0.08, r, 48]} />
            <meshBasicMaterial color="#1f2937" />
          </mesh>
        ))}
        {/* Central Red Vinyl Label Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
          <circleGeometry args={[2.2, 32]} />
          <meshStandardMaterial color="#ef4444" roughness={0.5} />
        </mesh>

        {/* Central Pedestal */}
        <mesh position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[3.2, 0.6, 3.2]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.8, 0]} castShadow>
          <boxGeometry args={[2.2, 0.5, 2.2]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>

        {/* Acoustic Monolith & Speaker Stack */}
        <mesh position={[0, 2.6, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.8, 3.2, 6]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Dual Sub-Woofer Cones on Sculpture Facade */}
        <mesh position={[0, 2.2, 0.61]}>
          <circleGeometry args={[0.38, 16]} />
          <meshStandardMaterial color="#000000" metalness={0.9} />
        </mesh>
        <mesh position={[0, 3.1, 0.51]}>
          <circleGeometry args={[0.28, 16]} />
          <meshStandardMaterial color="#000000" metalness={0.9} />
        </mesh>

        {/* Glowing Audio-Reactive Red LED Ring */}
        <mesh position={[0, 2.8, 0]}>
          <torusGeometry args={[1.1, 0.08, 12, 24]} />
          <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={3.2} />
        </mesh>
        <pointLight ref={monumentWaveRef} position={[0, 3.2, 0]} color="#ef4444" intensity={3.5} distance={14} />
      </group>

      {/* Park Benches & Streetlamps */}
      {[-8, 8].map((x, idx) => (
        <group key={idx}>
          {/* Bench */}
          <group position={[x, 0, 52]} rotation={[0, x > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
            <mesh position={[0, 0.45, 0]} castShadow>
              <boxGeometry args={[1.8, 0.08, 0.6]} />
              <meshStandardMaterial color="#78350f" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.8, -0.28]} castShadow>
              <boxGeometry args={[1.8, 0.6, 0.08]} />
              <meshStandardMaterial color="#78350f" roughness={0.7} />
            </mesh>
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
      {/* 4. RESIDENTIAL DISTRICT (West at X: -46, Z: 38 to 76) — LANDMARK 5 */}
      {/* ======================================================== */}
      {/* House 1: BEAT CAVE (Brick Studio Loft & Fire Escape) */}
      <group position={[-46, 0, 43]}>
        {/* Main Brick Mass with Foundation Pedestal */}
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[9.4, 0.3, 7.8]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
        <mesh position={[0, 2.35, 0]} castShadow receiveShadow>
          <boxGeometry args={[9.0, 4.4, 7.5]} />
          <meshStandardMaterial color="#9a3412" roughness={0.85} />
        </mesh>

        {/* Recessed Window Frames with Glass Panes & Mullions */}
        {[-2.2, 2.2].map((xOffset, wIdx) => (
          <group key={wIdx} position={[xOffset, 2.2, 3.78]}>
            {/* Dark Beveled Frame */}
            <mesh>
              <boxGeometry args={[1.8, 1.8, 0.12]} />
              <meshStandardMaterial color="#1e293b" roughness={0.4} />
            </mesh>
            {/* Recessed Glowing Glass Pane */}
            <mesh position={[0, 0, -0.04]}>
              <planeGeometry args={[1.5, 1.5]} />
              <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={2.2} />
            </mesh>
          </group>
        ))}

        {/* Pitch Roof with Shingles & Cornice */}
        <mesh position={[0, 5.2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[6.8, 2.4, 4]} />
          <meshStandardMaterial color="#7c2d12" roughness={0.7} />
        </mesh>

        {/* Exterior Steel Fire Escape Staircase */}
        <group position={[4.58, 2.2, -1.8]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[0, 1.2, 0]}>
            <boxGeometry args={[2.2, 0.08, 1.0]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
          <mesh position={[0, 1.6, 0.48]}>
            <boxGeometry args={[2.2, 0.8, 0.04]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
        </group>

        {/* BEAT CAVE Stencil Sign */}
        <mesh position={[4.55, 3.8, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[4.2, 0.8]} />
          <meshBasicMaterial map={beatCaveSignTex} />
        </mesh>
        <pointLight position={[5.0, 3.8, 0]} color="#38bdf8" intensity={2.5} distance={8} />

        {/* Porch Steps & Stoop */}
        <mesh position={[3.2, 0.25, 3.8]}>
          <boxGeometry args={[1.8, 0.5, 0.8]} />
          <meshStandardMaterial color="#475569" />
        </mesh>

        {/* Roof Antenna */}
        <group position={[-2.2, 5.8, -1.2]}>
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.03, 0.05, 1.6, 8]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} />
          </mesh>
        </group>
      </group>

      {/* House 2: VINYL ARCHIVE (Modern Timber Loft) */}
      <group position={[-46, 0, 57]}>
        <mesh position={[0, 2.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[9.5, 5.2, 7.5]} />
          <meshStandardMaterial color="#b45309" roughness={0.7} />
        </mesh>
        <mesh position={[0, 5.4, 0]} castShadow>
          <boxGeometry args={[10.0, 0.4, 8.0]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>

        {/* VINYL ARCHIVE Stencil Sign */}
        <mesh position={[4.81, 4.2, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[4.2, 0.8]} />
          <meshBasicMaterial map={vinylArchiveSignTex} />
        </mesh>
        <pointLight position={[5.2, 4.2, 0]} color="#f59e0b" intensity={2.5} distance={8} />

        {/* Rooftop Satellite Dish */}
        <group position={[-2.5, 6.0, 0]}>
          <mesh rotation={[0.4, 0.5, 0]}>
            <cylinderGeometry args={[0.6, 0.1, 0.2, 16]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.8} />
          </mesh>
        </group>

        {/* Large Bay Window with Recessed Frame & Interior Turntable Glow */}
        <group position={[0, 2.5, 3.8]}>
          <mesh>
            <boxGeometry args={[5.8, 2.6, 0.14]} />
            <meshStandardMaterial color="#1e293b" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, -0.04]}>
            <planeGeometry args={[5.5, 2.4]} />
            <meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={2.8} />
          </mesh>
        </group>
        <pointLight position={[0, 2.5, 4.8]} color="#fde047" intensity={2.5} distance={9} />

        {/* Stacked Vinyl Crates near porch */}
        <mesh position={[3.8, 0.4, 4.2]}>
          <boxGeometry args={[0.7, 0.7, 0.7]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
      </group>

      {/* House 3: SAMPLE LAB (Pastel Townhouse) */}
      <group position={[-46, 0, 71]}>
        <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[9.0, 4.4, 7.5]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
        </mesh>
        <mesh position={[0, 5.2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[6.8, 2.4, 4]} />
          <meshStandardMaterial color="#334155" />
        </mesh>

        {/* SAMPLE LAB Stencil Sign */}
        <mesh position={[4.55, 3.8, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[4.2, 0.8]} />
          <meshBasicMaterial map={sampleLabSignTex} />
        </mesh>
        <pointLight position={[5.0, 3.8, 0]} color="#a855f7" intensity={2.5} distance={8} />

        {/* Graffiti Street Art Decal Wall Plane */}
        <mesh position={[0, 2.0, -3.81]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[4.5, 2.2]} />
          <meshStandardMaterial color="#c084fc" roughness={0.9} />
        </mesh>

        <mesh position={[0, 1.8, 3.8]}>
          <planeGeometry args={[2.0, 1.8]} />
          <meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={2.5} />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* 5. COMMERCIAL SOUND DISTRICT (East at X: 46, Z: 38 to 76) — LANDMARKS 2 & 3 */}
      {/* ======================================================== */}
      {/* LANDMARK 2: AMITDIED AUDIO LABS (X: 46, Z: 47) */}
      <group position={[46, 0, 47]}>
        {/* Main Headquarters Building Facade */}
        <mesh position={[0, 3.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[11.0, 6.4, 11.0]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>

        {/* Glass Curtain Wall Panels with Steel Frame Mullions */}
        <mesh position={[-5.52, 3.2, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[9.8, 5.2]} />
          <meshStandardMaterial color="#020617" roughness={0.1} metalness={0.9} transparent opacity={0.88} />
        </mesh>

        {/* Large AMITDIED AUDIO LABS Stencil Sign */}
        <mesh position={[-5.55, 4.8, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[7.5, 1.4]} />
          <meshBasicMaterial map={audioLabsSignTex} />
        </mesh>
        <pointLight position={[-6.0, 4.8, 0]} color="#ef4444" intensity={3.8} distance={12} />

        {/* Entrance Canopy & Double Glass Doors */}
        <group position={[-5.6, 1.8, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh position={[0, 1.2, 0.8]}>
            <boxGeometry args={[3.2, 0.15, 1.6]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[2.2, 2.4]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={2.8} />
          </mesh>
        </group>

        {/* Studio Windows with Recessed Frames & Interior Gear Silhouettes */}
        {[-3.2, 3.2].map((zPos, idx) => (
          <group key={idx} position={[-5.52, 3.2, zPos]} rotation={[0, -Math.PI / 2, 0]}>
            <mesh>
              <boxGeometry args={[3.0, 2.2, 0.12]} />
              <meshStandardMaterial color="#0f172a" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, -0.04]}>
              <planeGeometry args={[2.8, 2.0]} />
              <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={2.0} />
            </mesh>
          </group>
        ))}

        {/* Animated VU-Meter Bar LED Strip on Facade */}
        <mesh ref={vuMeterRef} position={[-5.54, 3.2, -1.2]} rotation={[0, -Math.PI / 2, 0]}>
          <boxGeometry args={[0.2, 2.0, 0.05]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={3.0} />
        </mesh>

        {/* Rooftop HVAC Units, Solar Panels & Antenna */}
        <group position={[0, 6.4, 0]}>
          {/* HVAC Cooling Towers */}
          <mesh position={[-2.5, 0.8, -2.5]} castShadow>
            <boxGeometry args={[2.4, 1.6, 2.4]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
          <mesh position={[2.5, 0.8, -2.5]} castShadow>
            <boxGeometry args={[2.4, 1.6, 2.4]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>

          {/* Rooftop Antenna & Blinking Beacon */}
          <group position={[2.5, 0.8, 2.5]}>
            <mesh>
              <cylinderGeometry args={[0.08, 0.15, 3.2, 8]} />
              <meshStandardMaterial color="#475569" metalness={0.9} />
            </mesh>
            <mesh position={[0, 1.7, 0]}>
              <sphereGeometry args={[0.18, 12, 12]} />
              <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={3.5} />
            </mesh>
            <pointLight ref={antennaBeaconRef} position={[0, 1.7, 0]} color="#ef4444" intensity={3.5} distance={12} />
          </group>
        </group>

        {/* Side Loading Bay Dock & Equipment Crates */}
        <mesh position={[0, 1.6, -5.52]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[3.2, 2.8]} />
          <meshStandardMaterial color="#334155" metalness={0.7} />
        </mesh>
        <mesh position={[-3.2, 0.5, -6.2]}>
          <boxGeometry args={[1.0, 1.0, 1.4]} />
          <meshStandardMaterial color="#18181b" />
        </mesh>
        <mesh position={[-2.0, 0.35, -6.2]}>
          <boxGeometry args={[0.8, 0.7, 1.0]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
      </group>

      {/* LANDMARK 3: 35MM CINEMA LOUNGE & CAFE (X: 46, Z: 67) */}
      <group position={[46, 0, 67]}>
        <mesh position={[0, 2.8, 0]} castShadow receiveShadow>
          <boxGeometry args={[11.0, 5.6, 11.0]} />
          <meshStandardMaterial color="#2e1065" roughness={0.7} />
        </mesh>

        {/* Retro Cinema Marquee Sign with Neon Frame */}
        <group position={[-5.6, 4.2, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh position={[0, 0, 0.4]}>
            <boxGeometry args={[7.2, 1.5, 0.8]} />
            <meshStandardMaterial color="#1e1b4b" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0, 0.81]}>
            <planeGeometry args={[6.8, 1.2]} />
            <meshBasicMaterial map={cinemaLoungeSignTex} />
          </mesh>
          <pointLight position={[0, 0, 1.2]} color="#c084fc" intensity={3.8} distance={12} />
        </group>

        {/* Poster Lightboxes on exterior facade */}
        <mesh position={[-5.52, 2.2, -3.2]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[1.4, 2.2]} />
          <meshBasicMaterial map={nowShowingPosterTex} />
        </mesh>
        <mesh position={[-5.52, 2.2, 3.2]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[1.4, 2.2]} />
          <meshBasicMaterial map={nowShowingPosterTex} />
        </mesh>

        {/* Outdoor Cafe Terrace & Seating */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-7.2, 0.015, 0]}>
          <planeGeometry args={[4.2, 8.0]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>

        {/* Cafe Tables & Low-Poly Chairs */}
        {[-2.2, 2.2].map((zPos, idx) => (
          <group key={idx} position={[-7.2, 0, zPos]}>
            {/* Table */}
            <mesh position={[0, 0.4, 0]}>
              <cylinderGeometry args={[0.5, 0.05, 0.8, 12]} />
              <meshStandardMaterial color="#18181b" metalness={0.8} />
            </mesh>
            {/* Chairs */}
            <mesh position={[-0.6, 0.25, 0]}>
              <boxGeometry args={[0.35, 0.5, 0.35]} />
              <meshStandardMaterial color="#78350f" />
            </mesh>
            <mesh position={[0.6, 0.25, 0]}>
              <boxGeometry args={[0.35, 0.5, 0.35]} />
              <meshStandardMaterial color="#78350f" />
            </mesh>
          </group>
        ))}

        {/* Vintage Speaker Cabinet on Porch */}
        <group position={[-5.8, 0.6, -4.2]} rotation={[0, Math.PI / 4, 0]}>
          <mesh position={[0, 0.6, 0]}>
            <boxGeometry args={[0.6, 1.2, 0.5]} />
            <meshStandardMaterial color="#451a03" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.8, 0.26]}>
            <circleGeometry args={[0.2, 16]} />
            <meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={2.0} />
          </mesh>
        </group>

        {/* Projector Light Beam Cone */}
        <mesh position={[-5.8, 4.0, 0]} rotation={[0, 0, -Math.PI / 3]}>
          <coneGeometry args={[1.8, 4.5, 16, 1, true]} />
          <meshBasicMaterial color="#c084fc" transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* 6. NORTHERN SCENIC OVERLOOK & TRANSMISSION TOWER — LANDMARK 7 */}
      {/* ======================================================== */}
      <group position={[0, 0, 95]}>
        {/* Rising Hillside Ridge Terrain */}
        <mesh position={[0, 1.5, 6]} rotation={[-Math.PI / 2.2, 0, 0]} receiveShadow>
          <planeGeometry args={[110, 24]} />
          <meshStandardMaterial color="#1e5520" roughness={0.9} />
        </mesh>

        {/* Stone Retaining Wall along Overlook Base */}
        <mesh position={[0, 0.9, 4.8]}>
          <boxGeometry args={[66, 1.8, 0.6]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>

        {/* Overlook Wooden Deck & Railing */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.78, 6.8]} receiveShadow>
          <planeGeometry args={[65, 4.0]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
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

        {/* Radio Transmission Tower on Peak */}
        <group position={[25.0, 8.0, 14.0]}>
          <mesh position={[0, 6.0, 0]}>
            <cylinderGeometry args={[0.2, 1.8, 12.0, 4]} />
            <meshStandardMaterial color="#334155" wireframe metalness={0.8} />
          </mesh>
          <mesh ref={towerBeaconRef} position={[0, 12.2, 0]}>
            <sphereGeometry args={[0.25, 12, 12]} />
            <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={3.5} />
          </mesh>
          <pointLight position={[0, 12.2, 0]} color="#f43f5e" intensity={3.5} distance={15} />
        </group>

        {/* Skyline AMITDIED Billboard */}
        <group position={[-25.0, 7.5, 14.0]} rotation={[0, 0.2, 0]}>
          <mesh position={[0, 2.0, 0]}>
            <boxGeometry args={[12.0, 3.5, 0.4]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position={[0, 2.0, 0.21]}>
            <planeGeometry args={[11.5, 3.0]} />
            <meshBasicMaterial map={skylineBillboardTex} />
          </mesh>
          <pointLight position={[0, 2.0, 0.8]} color="#f43f5e" intensity={3.5} distance={12} />
        </group>

        {/* Reflecting Pool / Water Feature at Scenic Overlook */}
        <group position={[12.0, 1.82, 6.8]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[14.0, 3.2]} />
            <meshStandardMaterial color="#0284c7" roughness={0.1} metalness={0.9} transparent opacity={0.88} />
          </mesh>
          <mesh position={[0, 0.08, -1.65]}>
            <boxGeometry args={[14.2, 0.16, 0.15]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh position={[0, 0.08, 1.65]}>
            <boxGeometry args={[14.2, 0.16, 0.15]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <pointLight position={[0, 0.4, 0]} color="#38bdf8" intensity={2.2} distance={8} />
        </group>

        {/* Distant City Skyline Silhouettes beyond Scenic Overlook */}
        {[-55, -35, 35, 55].map((x, idx) => (
          <group key={idx} position={[x, 10.0, 26.0]}>
            <mesh position={[0, 8.0, 0]}>
              <boxGeometry args={[12, 22, 6]} />
              <meshStandardMaterial color="#0f172a" roughness={0.9} />
            </mesh>
            {/* Distant Window Dots */}
            <mesh position={[0, 9.0, 3.1]}>
              <planeGeometry args={[8, 10]} />
              <meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={0.6} />
            </mesh>
          </group>
        ))}
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
  navMode = "CHARACTER",
  onToggleNavMode,
  onVehicleSpeedChange,
  onVehicleProximityChange,
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
        {/* Global Atmospheric Fog & Ambient Light Base */}
        <fog attach="fog" args={["#0c0a1a", 24, 110]} />
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
          navMode={navMode}
          onToggleNavMode={onToggleNavMode}
          onVehicleSpeedChange={onVehicleSpeedChange}
          onVehicleProximityChange={onVehicleProximityChange}
        />
      </Canvas>
    </div>
  );
}

export default WorldScene;
