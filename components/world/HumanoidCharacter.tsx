"use client";

import React, { useRef, useMemo, useState, useEffect, Component, ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";

export type HumanoidActivityState = "IDLE" | "WALKING" | "SITTING" | "LOOKING";

export interface HumanoidCharacterProps {
  modelUrl?: string;
  colorShirt?: string;
  colorPants?: string;
  colorShoes?: string;
  colorSkin?: string;
  shirtGraphicColor?: string;
  hasHeadphones?: boolean;
  hasCap?: boolean;
  hasBeanie?: boolean;
  isFriend?: boolean;
  name?: string;
  activityState?: HumanoidActivityState;
  heightScale?: number;
  rootRotationY?: number;
}

// Global set to track console warnings so we log missing model warning only once per asset path
const loggedMissingWarnings = new Set<string>();

/**
 * Find best matching AnimationClip by semantic keyword from available GLTF animations
 */
function resolveAnimationClip(
  animations: THREE.AnimationClip[],
  state: HumanoidActivityState
): THREE.AnimationClip | null {
  if (!animations || animations.length === 0) return null;

  const stateKeywords: Record<HumanoidActivityState, string[]> = {
    IDLE: ["idle", "stand", "idle_01", "wait"],
    WALKING: ["walk", "run", "stride", "walk_forward", "step"],
    SITTING: ["sit", "sitting", "chair", "rest"],
    LOOKING: ["talk", "conversation", "look", "chat", "speak", "idle"],
  };

  const keywords = stateKeywords[state] || stateKeywords.IDLE;

  for (const kw of keywords) {
    const matched = animations.find((clip) =>
      clip.name.toLowerCase().includes(kw.toLowerCase())
    );
    if (matched) return matched;
  }

  return animations[0] || null;
}

/**
 * GLTF Skinned Humanoid Model Component with Skeleton Cloning & Animation Resolution
 */
function GLTFHumanoidModel({
  url,
  activityState = "IDLE",
  rootRotationY = 0,
}: {
  url: string;
  activityState?: HumanoidActivityState;
  rootRotationY?: number;
}) {
  const { scene, animations } = useGLTF(url);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const activeActionRef = useRef<THREE.AnimationAction | null>(null);

  // Clone scene safely using SkeletonUtils to isolate skinned skeleton per instance
  const clonedScene = useMemo(() => {
    return SkeletonUtils.clone(scene);
  }, [scene]);

  // Compute model bounding box & normalized height scale (~1.75m adult human)
  const { normalizedScale, yOffset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const nativeHeight = box.max.y - box.min.y;
    const normScale = nativeHeight > 0.1 ? 1.75 / nativeHeight : 1.0;
    const yOff = -box.min.y * normScale;
    return { normalizedScale: normScale, yOffset: yOff };
  }, [clonedScene]);

  // Setup AnimationMixer & clip resolution
  useEffect(() => {
    if (!clonedScene) return;

    const mixer = new THREE.AnimationMixer(clonedScene);
    mixerRef.current = mixer;

    return () => {
      mixer.stopAllAction();
      mixerRef.current = null;
    };
  }, [clonedScene]);

  // Handle smooth animation clip transitions on activityState change
  useEffect(() => {
    const mixer = mixerRef.current;
    if (!mixer || !animations || animations.length === 0) return;

    const clip = resolveAnimationClip(animations, activityState);
    if (!clip) return;

    const nextAction = mixer.clipAction(clip);
    if (activeActionRef.current !== nextAction) {
      if (activeActionRef.current) {
        activeActionRef.current.fadeOut(0.3);
      }
      nextAction.reset().fadeIn(0.3).play();
      activeActionRef.current = nextAction;
    }
  }, [activityState, animations]);

  // Advance animation mixer on useFrame
  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  return (
    <group position={[0, yOffset, 0]} rotation={[0, rootRotationY, 0]} scale={[normalizedScale, normalizedScale, normalizedScale]}>
      <primitive object={clonedScene} />
    </group>
  );
}

/**
 * Anatomical Humanoid Fallback Mesh Template
 * Used when GLB model asset is missing or loading.
 */
function AnatomicalHumanoidFallback({
  colorShirt = "#0b0f19",
  colorPants = "#0f172a",
  colorShoes = "#e2e8f0",
  colorSkin = "#334155",
  shirtGraphicColor = "#ef4444",
  hasHeadphones = false,
  hasCap = false,
  hasBeanie = false,
  activityState = "IDLE",
}: Omit<HumanoidCharacterProps, "modelUrl">) {
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (headRef.current) {
      headRef.current.position.y = 1.58 + Math.sin(time * 2) * 0.008;
    }

    if (activityState === "WALKING") {
      const walkCycle = Math.sin(time * 8);
      if (leftLegRef.current) leftLegRef.current.rotation.x = walkCycle * 0.45;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -walkCycle * 0.45;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -walkCycle * 0.35;
      if (rightArmRef.current) rightArmRef.current.rotation.x = walkCycle * 0.35;
    } else {
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(time * 1.5) * 0.05;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(time * 1.5) * 0.05;
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
    }
  });

  return (
    <group>
      {/* 1. HEAD, FACE & ACCESSORIES */}
      <group ref={headRef} position={[0, 1.58, 0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial color={colorSkin} roughness={0.65} />
        </mesh>

        <mesh position={[0, -0.01, 0.12]}>
          <boxGeometry args={[0.035, 0.06, 0.04]} />
          <meshStandardMaterial color={colorSkin} roughness={0.65} />
        </mesh>

        <mesh position={[-0.045, 0.02, 0.11]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.2} />
        </mesh>
        <mesh position={[0.045, 0.02, 0.11]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.2} />
        </mesh>

        {hasBeanie && (
          <group position={[0, 0.06, -0.01]}>
            <mesh>
              <sphereGeometry args={[0.142, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
              <meshStandardMaterial color="#09090b" roughness={0.85} />
            </mesh>
            <mesh position={[0, -0.02, 0.135]}>
              <boxGeometry args={[0.05, 0.03, 0.01]} />
              <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.8} />
            </mesh>
          </group>
        )}

        {hasCap && !hasBeanie && (
          <group position={[0, 0.05, 0]}>
            <mesh position={[0, 0.04, -0.01]} rotation={[-0.1, 0, 0]}>
              <sphereGeometry args={[0.142, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
              <meshStandardMaterial color="#09090b" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.01, 0.18]} rotation={[0.2, 0, 0]}>
              <boxGeometry args={[0.16, 0.02, 0.12]} />
              <meshStandardMaterial color="#09090b" roughness={0.8} />
            </mesh>
          </group>
        )}

        {hasHeadphones && (
          <group position={[0, 0, 0]}>
            <mesh position={[0, 0.12, 0]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.15, 0.018, 8, 16, Math.PI]} />
              <meshStandardMaterial color="#020617" roughness={0.3} metalness={0.8} />
            </mesh>
            <mesh position={[-0.14, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.03, 12]} />
              <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.6} />
            </mesh>
            <mesh position={[0.14, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.03, 12]} />
              <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.6} />
            </mesh>
          </group>
        )}
      </group>

      {/* 2. NECK & TORSO */}
      <mesh position={[0, 1.42, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.065, 0.12, 12]} />
        <meshStandardMaterial color={colorSkin} roughness={0.65} />
      </mesh>

      <group position={[0, 1.1, 0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.44, 0.58, 0.28]} />
          <meshStandardMaterial color={colorShirt} roughness={0.8} />
        </mesh>
        {shirtGraphicColor && (
          <mesh position={[0, 0.08, 0.145]}>
            <planeGeometry args={[0.2, 0.2]} />
            <meshStandardMaterial
              color={shirtGraphicColor}
              emissive={shirtGraphicColor}
              emissiveIntensity={0.5}
            />
          </mesh>
        )}
      </group>

      {/* 3. ARMS & HANDS */}
      <group name="leftArm" ref={leftArmRef} position={[-0.25, 1.3, 0]}>
        <mesh position={[-0.04, -0.16, 0]}>
          <cylinderGeometry args={[0.05, 0.045, 0.32, 12]} />
          <meshStandardMaterial color={colorShirt} roughness={0.8} />
        </mesh>
        <mesh position={[-0.04, -0.38, 0]}>
          <cylinderGeometry args={[0.038, 0.032, 0.28, 12]} />
          <meshStandardMaterial color={colorSkin} roughness={0.65} />
        </mesh>
      </group>

      <group name="rightArm" ref={rightArmRef} position={[0.25, 1.3, 0]}>
        <mesh position={[0.04, -0.16, 0]}>
          <cylinderGeometry args={[0.05, 0.045, 0.32, 12]} />
          <meshStandardMaterial color={colorShirt} roughness={0.8} />
        </mesh>
        <mesh position={[0.04, -0.38, 0]}>
          <cylinderGeometry args={[0.038, 0.032, 0.28, 12]} />
          <meshStandardMaterial color={colorSkin} roughness={0.65} />
        </mesh>
      </group>

      {/* 4. LEGS & CARGO PANTS */}
      <group name="leftLeg" ref={leftLegRef} position={[-0.12, 0.76, 0]}>
        <mesh position={[0, -0.3, 0]} castShadow>
          <cylinderGeometry args={[0.11, 0.095, 0.64, 12]} />
          <meshStandardMaterial color={colorPants} roughness={0.85} />
        </mesh>
        <mesh position={[-0.1, -0.22, 0]}>
          <boxGeometry args={[0.04, 0.14, 0.12]} />
          <meshStandardMaterial color={colorPants} roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.65, 0.05]}>
          <boxGeometry args={[0.14, 0.06, 0.28]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.61, 0.04]}>
          <boxGeometry args={[0.13, 0.06, 0.25]} />
          <meshStandardMaterial color={colorShoes} roughness={0.6} />
        </mesh>
      </group>

      <group name="rightLeg" ref={rightLegRef} position={[0.12, 0.76, 0]}>
        <mesh position={[0, -0.3, 0]} castShadow>
          <cylinderGeometry args={[0.11, 0.095, 0.64, 12]} />
          <meshStandardMaterial color={colorPants} roughness={0.85} />
        </mesh>
        <mesh position={[0.1, -0.22, 0]}>
          <boxGeometry args={[0.04, 0.14, 0.12]} />
          <meshStandardMaterial color={colorPants} roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.65, 0.05]}>
          <boxGeometry args={[0.14, 0.06, 0.28]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.61, 0.04]}>
          <boxGeometry args={[0.13, 0.06, 0.25]} />
          <meshStandardMaterial color={colorShoes} roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Error Boundary for catching GLTF load failures per character instance
 */
interface ErrorBoundaryProps {
  fallback: ReactNode;
  url?: string;
  onError?: () => void;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class GLTFErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch() {
    if (this.props.url && !loggedMissingWarnings.has(this.props.url)) {
      loggedMissingWarnings.add(this.props.url);
      if (typeof console !== "undefined") {
        console.warn(`[AMITDIED CHARACTER PIPELINE] Model asset missing or pending: ${this.props.url}`);
      }
    }
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * Main Exported Humanoid Character Component
 */
export function HumanoidCharacter(props: HumanoidCharacterProps) {
  const [loadError, setLoadError] = useState(false);
  const scale = props.heightScale ?? 1.0;

  return (
    <group scale={[scale, scale, scale]}>
      {props.modelUrl && !loadError ? (
        <GLTFErrorBoundary
          url={props.modelUrl}
          fallback={<AnatomicalHumanoidFallback {...props} />}
          onError={() => setLoadError(true)}
        >
          <React.Suspense fallback={<AnatomicalHumanoidFallback {...props} />}>
            <GLTFHumanoidModel
              url={props.modelUrl}
              activityState={props.activityState}
              rootRotationY={props.rootRotationY}
            />
          </React.Suspense>
        </GLTFErrorBoundary>
      ) : (
        <AnatomicalHumanoidFallback {...props} />
      )}
    </group>
  );
}

export default HumanoidCharacter;
