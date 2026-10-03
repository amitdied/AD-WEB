"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface VehicleProps {
  vehiclePosRef: React.MutableRefObject<THREE.Vector3>;
  vehicleYawRef: React.MutableRefObject<number>;
  steeringAngleRef: React.MutableRefObject<number>;
  wheelRotationRef: React.MutableRefObject<number>;
  isBrakingRef: React.MutableRefObject<boolean>;
  isAcceleratingRef: React.MutableRefObject<boolean>;
  isOccupied?: boolean;
}

/**
 * AMITDIED Procedural Toy Vehicle (Phase A Prototype)
 * Low-poly chunky silhouette with dark body, red/cyan accent trim,
 * glowing headlights, brake lights, cabin glass, and 4 oversized wheels.
 * All dynamic transform updates are driven inside useFrame via refs.
 */
export function Vehicle({
  vehiclePosRef,
  vehicleYawRef,
  steeringAngleRef,
  wheelRotationRef,
  isBrakingRef,
  isAcceleratingRef,
  isOccupied = false,
}: VehicleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const frontLeftWheelRef = useRef<THREE.Group>(null);
  const frontRightWheelRef = useRef<THREE.Group>(null);
  const backLeftWheelRef = useRef<THREE.Mesh>(null);
  const backRightWheelRef = useRef<THREE.Mesh>(null);
  const bodyMeshRef = useRef<THREE.Group>(null);
  const leftBrakeLightRef = useRef<THREE.MeshStandardMaterial>(null);
  const rightBrakeLightRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const pos = vehiclePosRef.current;
    const yaw = vehicleYawRef.current;
    const steer = steeringAngleRef.current;
    const wheelRot = wheelRotationRef.current;
    const isAcc = isAcceleratingRef.current;
    const isBrake = isBrakingRef.current;

    groupRef.current.position.set(pos.x, pos.y, pos.z);
    groupRef.current.rotation.y = yaw;

    // Front wheels steering turn
    if (frontLeftWheelRef.current) {
      frontLeftWheelRef.current.rotation.y = steer;
    }
    if (frontRightWheelRef.current) {
      frontRightWheelRef.current.rotation.y = steer;
    }

    // Wheel spin rolling animation
    if (backLeftWheelRef.current) backLeftWheelRef.current.rotation.x = wheelRot;
    if (backRightWheelRef.current) backRightWheelRef.current.rotation.x = wheelRot;
    if (frontLeftWheelRef.current) {
      const mesh = frontLeftWheelRef.current.children[0] as THREE.Mesh;
      if (mesh) mesh.rotation.x = wheelRot;
    }
    if (frontRightWheelRef.current) {
      const mesh = frontRightWheelRef.current.children[0] as THREE.Mesh;
      if (mesh) mesh.rotation.x = wheelRot;
    }

    // Body suspension tilt / pitch on acceleration and roll on steering
    if (bodyMeshRef.current) {
      const targetPitch = isAcc ? -0.06 : isBrake ? 0.08 : 0;
      const targetRoll = -steer * 0.12;
      bodyMeshRef.current.rotation.z = THREE.MathUtils.lerp(
        bodyMeshRef.current.rotation.z,
        targetRoll,
        delta * 8
      );
      bodyMeshRef.current.rotation.x = THREE.MathUtils.lerp(
        bodyMeshRef.current.rotation.x,
        targetPitch,
        delta * 8
      );
    }

    // Dynamic brake light emission
    if (leftBrakeLightRef.current) {
      leftBrakeLightRef.current.emissiveIntensity = isBrake ? 5.0 : 1.5;
    }
    if (rightBrakeLightRef.current) {
      rightBrakeLightRef.current.emissiveIntensity = isBrake ? 5.0 : 1.5;
    }
  });

  return (
    <group ref={groupRef}>
      {/* VEHICLE CHASSIS & DETAILED BODYWORK */}
      <group ref={bodyMeshRef}>
        {/* Main Sleek Lower Chassis */}
        <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.68, 0.42, 3.25]} />
          <meshStandardMaterial color="#0b0f19" roughness={0.15} metalness={0.85} />
        </mesh>

        {/* Aerodynamic Side Skirts with Red Accent Lines */}
        <mesh position={[-0.86, 0.22, 0]}>
          <boxGeometry args={[0.08, 0.24, 2.8]} />
          <meshStandardMaterial color="#ef4444" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[0.86, 0.22, 0]}>
          <boxGeometry args={[0.08, 0.24, 2.8]} />
          <meshStandardMaterial color="#ef4444" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Front Hood / Sloped Nose */}
        <group position={[0, 0.36, 1.25]}>
          <mesh rotation={[0.12, 0, 0]} castShadow>
            <boxGeometry args={[1.58, 0.32, 0.95]} />
            <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
          </mesh>
          {/* Hood Air Intake Scoops */}
          <mesh position={[-0.38, 0.18, 0.05]} rotation={[0.12, 0, 0]}>
            <boxGeometry args={[0.28, 0.04, 0.45]} />
            <meshStandardMaterial color="#020617" roughness={0.9} />
          </mesh>
          <mesh position={[0.38, 0.18, 0.05]} rotation={[0.12, 0, 0]}>
            <boxGeometry args={[0.28, 0.04, 0.45]} />
            <meshStandardMaterial color="#020617" roughness={0.9} />
          </mesh>
          {/* Center Red Cyber Stripe */}
          <mesh position={[0, 0.185, 0.02]} rotation={[0.12, 0, 0]}>
            <boxGeometry args={[0.32, 0.02, 0.88]} />
            <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={1.4} />
          </mesh>
        </group>

        {/* Front Grille & Front Bumper Splitter */}
        <group position={[0, 0.22, 1.68]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1.52, 0.22, 0.12]} />
            <meshStandardMaterial color="#020617" roughness={0.9} />
          </mesh>
          {/* Lower Front Splitter Lip */}
          <mesh position={[0, -0.08, 0.06]}>
            <boxGeometry args={[1.65, 0.05, 0.22]} />
            <meshStandardMaterial color="#ef4444" roughness={0.3} metalness={0.7} />
          </mesh>
          {/* Cyan LED Grille Light Strip */}
          <mesh position={[0, 0.08, 0.07]}>
            <boxGeometry args={[1.1, 0.03, 0.02]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={3.0} />
          </mesh>
        </group>

        {/* Dashboard / Instrument Console & Steering Wheel */}
        <group position={[0, 0.58, 0.35]}>
          <mesh>
            <boxGeometry args={[0.95, 0.16, 0.22]} />
            <meshStandardMaterial color="#020617" roughness={0.8} />
          </mesh>

          {/* Illuminated Digital Gauge Cluster Display */}
          <mesh position={[0, 0.06, 0.12]} rotation={[-0.3, 0, 0]}>
            <planeGeometry args={[0.65, 0.12]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={3.2} />
          </mesh>

          {/* Sports Steering Wheel */}
          <mesh position={[-0.28, 0.08, 0.15]} rotation={[Math.PI / 3, 0, 0]}>
            <torusGeometry args={[0.12, 0.02, 8, 16]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>

        {/* Cabin Glass Canopy / Roof Pillars */}
        <group position={[0, 0.68, -0.15]}>
          {/* Main Glass Housing */}
          <mesh castShadow>
            <boxGeometry args={[1.38, 0.48, 1.62]} />
            <meshStandardMaterial
              color="#020617"
              roughness={0.08}
              metalness={0.92}
              transparent
              opacity={0.85}
            />
          </mesh>

          {/* Aerodynamic Windshield Trim Frame */}
          <mesh position={[0, 0.08, 0.81]} rotation={[0.38, 0, 0]}>
            <boxGeometry args={[1.34, 0.42, 0.04]} />
            <meshStandardMaterial color="#020617" roughness={0.2} metalness={0.9} />
          </mesh>

          {/* Windshield Luminous Blue Tint Line */}
          <mesh position={[0, 0.22, 0.78]} rotation={[0.38, 0, 0]}>
            <planeGeometry args={[1.28, 0.06]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={2.0} />
          </mesh>

          {/* Side View Mirrors */}
          <mesh position={[-0.78, 0, 0.4]} rotation={[0, -0.2, 0]}>
            <boxGeometry args={[0.18, 0.1, 0.12]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0.78, 0, 0.4]} rotation={[0, 0.2, 0]}>
            <boxGeometry args={[0.18, 0.1, 0.12]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>

        {/* Carbon Fiber Rear Wing / GT Spoiler */}
        <group position={[0, 0.84, -1.52]}>
          {/* Wing Blade */}
          <mesh position={[0, 0.14, 0]} castShadow>
            <boxGeometry args={[1.82, 0.05, 0.38]} />
            <meshStandardMaterial color="#09090b" roughness={0.2} metalness={0.9} />
          </mesh>
          {/* Wing Endplates */}
          <mesh position={[-0.88, 0.14, 0]}>
            <boxGeometry args={[0.04, 0.18, 0.42]} />
            <meshStandardMaterial color="#ef4444" roughness={0.3} metalness={0.8} />
          </mesh>
          <mesh position={[0.88, 0.14, 0]}>
            <boxGeometry args={[0.04, 0.18, 0.42]} />
            <meshStandardMaterial color="#ef4444" roughness={0.3} metalness={0.8} />
          </mesh>
          {/* Upright Mounting Struts */}
          <mesh position={[-0.55, -0.06, 0]}>
            <boxGeometry args={[0.06, 0.35, 0.22]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} />
          </mesh>
          <mesh position={[0.55, -0.06, 0]}>
            <boxGeometry args={[0.06, 0.35, 0.22]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} />
          </mesh>
        </group>

        {/* Underbody Cyan LED Glow */}
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[1.25, 0.04, 2.5]} />
          <meshStandardMaterial color="#06b6d4" emissive="#0891b2" emissiveIntensity={3.8} />
        </mesh>
        <pointLight position={[0, 0.08, 0]} color="#06b6d4" intensity={3.8} distance={5.5} />

        {/* PROJECTOR HEADLIGHTS (FRONT LED HOUSINGS) */}
        <group position={[0, 0.38, 1.7]}>
          {/* Left Headlight Assembly */}
          <group position={[-0.62, 0, 0]}>
            <mesh>
              <boxGeometry args={[0.32, 0.14, 0.1]} />
              <meshStandardMaterial color="#020617" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.02, 12]} />
              <meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={5.0} />
            </mesh>
          </group>

          {/* Right Headlight Assembly */}
          <group position={[0.62, 0, 0]}>
            <mesh>
              <boxGeometry args={[0.32, 0.14, 0.1]} />
              <meshStandardMaterial color="#020617" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.02, 12]} />
              <meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={5.0} />
            </mesh>
          </group>

          {/* Forward Headlight Beam Cones & Spotlights when occupied */}
          {isOccupied && (
            <>
              <spotLight
                position={[-0.62, 0, 0.2]}
                target-position={[-0.62, -0.5, 16]}
                color="#fef08a"
                intensity={7.0}
                angle={0.46}
                penumbra={0.35}
                distance={24}
              />
              <spotLight
                position={[0.62, 0, 0.2]}
                target-position={[0.62, -0.5, 16]}
                color="#fef08a"
                intensity={7.0}
                angle={0.46}
                penumbra={0.35}
                distance={24}
              />
              {/* Volumetric Headlight Light Cones */}
              <mesh position={[0, -0.15, 3.5]} rotation={[Math.PI / 2.08, 0, 0]}>
                <coneGeometry args={[1.8, 6.8, 16, 1, true]} />
                <meshBasicMaterial color="#fde047" transparent opacity={0.22} side={THREE.DoubleSide} />
              </mesh>
            </>
          )}
        </group>

        {/* REAR TAILLIGHTS & DYNAMIC BRAKE LIGHT BAR */}
        <group position={[0, 0.42, -1.64]}>
          {/* Full-width LED Lightbar */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1.52, 0.08, 0.06]} />
            <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={1.8} />
          </mesh>

          {/* Left Main Brake Light */}
          <mesh position={[-0.64, 0, 0]}>
            <boxGeometry args={[0.32, 0.14, 0.06]} />
            <meshStandardMaterial
              ref={leftBrakeLightRef}
              color="#ef4444"
              emissive="#dc2626"
              emissiveIntensity={2.0}
            />
          </mesh>

          {/* Right Main Brake Light */}
          <mesh position={[0.64, 0, 0]}>
            <boxGeometry args={[0.32, 0.14, 0.06]} />
            <meshStandardMaterial
              ref={rightBrakeLightRef}
              color="#ef4444"
              emissive="#dc2626"
              emissiveIntensity={2.0}
            />
          </mesh>
          <pointLight position={[0, 0, -0.25]} color="#ef4444" intensity={3.0} distance={4.5} />
        </group>
      </group>

      {/* 4 HEAVY-DUTY WHEELS WITH RUBBER TREADS & ALLOY RIMS */}
      {/* Front Left Wheel */}
      <group ref={frontLeftWheelRef} position={[-0.94, 0.28, 1.05]}>
        {/* Rubber Tire */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.38, 0.38, 0.34, 20]} />
          <meshStandardMaterial color="#0f172a" roughness={0.88} />
        </mesh>
        {/* Alloy Spoke Rim */}
        <mesh position={[-0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.26, 0.26, 0.02, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.15} />
        </mesh>
        {/* Red Center Cap */}
        <mesh position={[-0.19, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 0.02, 8]} />
          <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* Front Right Wheel */}
      <group ref={frontRightWheelRef} position={[0.94, 0.28, 1.05]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.38, 0.38, 0.34, 20]} />
          <meshStandardMaterial color="#0f172a" roughness={0.88} />
        </mesh>
        <mesh position={[0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.26, 0.26, 0.02, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.15} />
        </mesh>
        <mesh position={[0.19, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 0.02, 8]} />
          <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* Rear Left Wheel */}
      <group position={[-0.94, 0.28, -1.05]}>
        <mesh ref={backLeftWheelRef} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.38, 0.38, 0.34, 20]} />
          <meshStandardMaterial color="#0f172a" roughness={0.88} />
        </mesh>
        <mesh position={[-0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.26, 0.26, 0.02, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.15} />
        </mesh>
        <mesh position={[-0.19, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 0.02, 8]} />
          <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* Rear Right Wheel */}
      <group position={[0.94, 0.28, -1.05]}>
        <mesh ref={backRightWheelRef} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.38, 0.38, 0.34, 20]} />
          <meshStandardMaterial color="#0f172a" roughness={0.88} />
        </mesh>
        <mesh position={[0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.26, 0.26, 0.02, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.15} />
        </mesh>
        <mesh position={[0.19, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 0.02, 8]} />
          <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={1.2} />
        </mesh>
      </group>
    </group>
  );
}

export default Vehicle;
