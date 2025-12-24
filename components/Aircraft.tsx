
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Trail, Html } from '@react-three/drei';

interface AircraftProps {
  type: 'player' | 'tomcat';
  color?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

// --- GEOMETRY & MATERIALS ---

const PropellerBlur: React.FC = () => {
  return (
    <group position={[0, 0, -2.2]}>
       {/* Primary Blur Disc - The visual "solid" part of the spin */}
       <mesh rotation={[Math.PI / 2, 0, 0]}>
         <cylinderGeometry args={[2.8, 2.8, 0.05, 32]} />
         <meshBasicMaterial 
            color="#a0aec0" 
            transparent 
            opacity={0.15} 
            side={THREE.DoubleSide} 
            depthWrite={false}
         />
       </mesh>
       {/* Inner High-Velocity Ring */}
       <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.01]}>
         <ringGeometry args={[0.5, 2.6, 32]} />
         <meshBasicMaterial 
            color="#cbd5e1" 
            transparent 
            opacity={0.1} 
            side={THREE.DoubleSide} 
            depthWrite={false} 
            blending={THREE.AdditiveBlending}
         />
       </mesh>
       {/* Outer Tip Trace */}
       <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.02]}>
         <ringGeometry args={[2.7, 2.8, 32]} />
         <meshBasicMaterial 
            color="#fef08a" 
            transparent 
            opacity={0.3} 
            side={THREE.DoubleSide} 
            depthWrite={false} 
            blending={THREE.AdditiveBlending}
         />
       </mesh>
    </group>
  )
}

const PlayerPlane: React.FC<{ color: string }> = ({ color }) => {
  const propRef = useRef<THREE.Group>(null!);
  const bladeRef = useRef<THREE.Group>(null!);

  useFrame((state, delta) => {
    if (propRef.current) {
        // Subtle wobble for realism
        propRef.current.rotation.z += delta * 40; 
    }
    if (bladeRef.current) {
        // Insane speed for the physical blades to create chaos behind the blur
        bladeRef.current.rotation.z -= delta * 50; 
    }
  });

  return (
    <group>
      {/* --- FUSELAGE GROUP --- */}
      <group position={[0, 0, 0.5]}>
        {/* Main Body */}
        <mesh castShadow receiveShadow position={[0, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.6, 0.9, 5, 16]} />
            <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Engine Cowling (Front) */}
        <mesh castShadow position={[0, 0, -2.5]} rotation={[Math.PI/2, 0, 0]}>
             <cylinderGeometry args={[0.9, 0.6, 1.5, 16]} />
             <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Tail Cone */}
        <mesh position={[0, 0, 3.5]} rotation={[Math.PI/2, 0, 0]}>
             <coneGeometry args={[0.6, 2.5, 16]} />
             <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
        </mesh>
      </group>

      {/* --- COCKPIT --- */}
      <group position={[0, 0.6, -0.5]}>
         <mesh castShadow>
             <capsuleGeometry args={[0.55, 1.5, 4, 16]} />
             <meshPhysicalMaterial 
                color="#0f172a" 
                metalness={0.9} 
                roughness={0.1} 
                clearcoat={1} 
                transparent 
                opacity={0.95} 
             />
         </mesh>
         {/* Frame */}
         <mesh position={[0, -0.1, 0.5]} rotation={[0.2, 0, 0]}>
             <boxGeometry args={[1.2, 0.1, 1.8]} />
             <meshStandardMaterial color="#333" />
         </mesh>
      </group>

      {/* --- WINGS --- */}
      <group position={[0, -0.1, -0.5]}>
          {/* Main Wing Shape */}
          <mesh castShadow receiveShadow>
              <geometry>
                  {/* Custom Wing Geometry simulated via Box for stability */}
                  <boxGeometry args={[9, 0.1, 2.5]} />
              </geometry>
              <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
          </mesh>
          {/* Wing Tips (Red) */}
          <mesh position={[4.5, 0.1, 0]}>
               <boxGeometry args={[0.5, 0.15, 2.5]} />
               <meshStandardMaterial color="#fff" />
          </mesh>
           <mesh position={[-4.5, 0.1, 0]}>
               <boxGeometry args={[0.5, 0.15, 2.5]} />
               <meshStandardMaterial color="#fff" />
          </mesh>
      </group>
      
      {/* Lower Wing Supports (Bi-plane aesthetic hint) */}
      <mesh position={[2, -0.3, -0.5]} rotation={[0, 0, 0.5]}>
           <cylinderGeometry args={[0.05, 0.05, 1]} />
           <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[-2, -0.3, -0.5]} rotation={[0, 0, -0.5]}>
           <cylinderGeometry args={[0.05, 0.05, 1]} />
           <meshStandardMaterial color="#333" />
      </mesh>

      {/* --- TAIL --- */}
      <group position={[0, 0.5, 4]}>
        {/* Vertical Stab */}
        <mesh position={[0, 0.5, 0]} rotation={[0.4, 0, 0]}>
           <boxGeometry args={[0.15, 1.5, 1.2]} />
           <meshStandardMaterial color={color} />
        </mesh>
        {/* Horizontal Stab */}
        <mesh position={[0, 0, 0.2]}>
           <boxGeometry args={[3.2, 0.1, 1.2]} />
           <meshStandardMaterial color={color} />
        </mesh>
      </group>

      {/* --- PROPELLER SYSTEM --- */}
      <group position={[0, 0, -1.2]}>
         {/* Nose Spinner */}
         <mesh position={[0, 0, -2.2]} rotation={[Math.PI/2, 0, 0]}>
             <coneGeometry args={[0.4, 1.2, 16]} />
             <meshStandardMaterial color="#b91c1c" metalness={0.5} roughness={0.2} />
         </mesh>

         {/* The Blur Effect */}
         <PropellerBlur />

         {/* Physical Blades (Ghosted) */}
         <group ref={bladeRef} position={[0, 0, -2.1]}>
            {[0, 1, 2].map(i => (
                <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
                    <boxGeometry args={[0.3, 5.5, 0.08]} />
                    <meshStandardMaterial color="#111" transparent opacity={0.3} />
                </mesh>
            ))}
         </group>
      </group>

      {/* --- TRAILS --- */}
      <group position={[4.2, 0, -0.5]}>
         <Trail width={1.5} length={12} color="#fff" attenuation={(t) => t*t}>
            <mesh visible={false} />
         </Trail>
      </group>
      <group position={[-4.2, 0, -0.5]}>
         <Trail width={1.5} length={12} color="#fff" attenuation={(t) => t*t}>
            <mesh visible={false} />
         </Trail>
      </group>
    </group>
  );
};

const TomcatPlane: React.FC = () => {
  const afterburnerRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (afterburnerRef.current) {
        const flicker = 1 + Math.random() * 0.4;
        afterburnerRef.current.scale.set(1, 1, flicker);
    }
  });

  return (
    <group rotation={[0, Math.PI, 0]}>
        {/* --- FUSELAGE --- */}
        <group>
            {/* Main Body */}
            <mesh castShadow receiveShadow position={[0, 0, 0]}>
                <boxGeometry args={[1.5, 0.8, 8]} />
                <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Intake Ramps */}
            <mesh position={[1.2, -0.2, 1]}>
                 <boxGeometry args={[0.8, 0.6, 4]} />
                 <meshStandardMaterial color="#334155" />
            </mesh>
             <mesh position={[-1.2, -0.2, 1]}>
                 <boxGeometry args={[0.8, 0.6, 4]} />
                 <meshStandardMaterial color="#334155" />
            </mesh>
        </group>
        
        {/* --- COCKPIT --- */}
        <mesh position={[0, 0.5, -2]}>
            <coneGeometry args={[0.6, 3, 16]} />
            <meshStandardMaterial color="#000" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.6, -1.5]} rotation={[0.2, 0, 0]}>
             <boxGeometry args={[0.9, 0.1, 2.5]} />
             <meshStandardMaterial color="#1e293b" />
        </mesh>

        {/* --- WINGS (Variable Sweep simulation - Fixed fully swept for speed) --- */}
        <group position={[0, 0, 0.5]}>
             <mesh position={[2.8, 0, 1.5]} rotation={[0, -0.6, 0]}>
                 <boxGeometry args={[4.5, 0.1, 2.5]} />
                 <meshStandardMaterial color="#475569" metalness={0.6} />
             </mesh>
             <mesh position={[-2.8, 0, 1.5]} rotation={[0, 0.6, 0]}>
                 <boxGeometry args={[4.5, 0.1, 2.5]} />
                 <meshStandardMaterial color="#475569" metalness={0.6} />
             </mesh>
        </group>

        {/* --- STABILIZERS --- */}
        <group position={[0, 0.6, 3]}>
             {/* Vertical */}
             <mesh position={[0.8, 0.8, 0]} rotation={[0, 0, 0.1]}>
                 <boxGeometry args={[0.1, 2, 1.5]} />
                 <meshStandardMaterial color="#334155" />
             </mesh>
             <mesh position={[-0.8, 0.8, 0]} rotation={[0, 0, -0.1]}>
                 <boxGeometry args={[0.1, 2, 1.5]} />
                 <meshStandardMaterial color="#334155" />
             </mesh>
             {/* Horizontal */}
             <mesh position={[2, -0.5, 0.5]} rotation={[-0.2, 0, -0.2]}>
                  <boxGeometry args={[2, 0.1, 1.5]} />
                  <meshStandardMaterial color="#334155" />
             </mesh>
             <mesh position={[-2, -0.5, 0.5]} rotation={[-0.2, 0, 0.2]}>
                  <boxGeometry args={[2, 0.1, 1.5]} />
                  <meshStandardMaterial color="#334155" />
             </mesh>
        </group>

        {/* --- AFTERBURNERS --- */}
        <group ref={afterburnerRef} position={[0, 0, 4.2]}>
             <mesh position={[0.8, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
                 <cylinderGeometry args={[0.4, 0.3, 0.2, 16]} />
                 <meshStandardMaterial color="#111" />
                 <mesh position={[0, -0.8, 0]}>
                      <coneGeometry args={[0.35, 2.5, 16]} />
                      <meshBasicMaterial color="#f97316" transparent opacity={0.8} />
                 </mesh>
                 <pointLight distance={5} intensity={2} color="orange" />
             </mesh>
             <mesh position={[-0.8, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
                 <cylinderGeometry args={[0.4, 0.3, 0.2, 16]} />
                 <meshStandardMaterial color="#111" />
                 <mesh position={[0, -0.8, 0]}>
                      <coneGeometry args={[0.35, 2.5, 16]} />
                      <meshBasicMaterial color="#f97316" transparent opacity={0.8} />
                 </mesh>
                 <pointLight distance={5} intensity={2} color="orange" />
             </mesh>
        </group>

        {/* Trails */}
        <group position={[0.8, 0, 4.5]}>
             <Trail width={4} length={25} color="#fb923c" attenuation={(t) => t*0.4}>
                <mesh visible={false} />
             </Trail>
        </group>
        <group position={[-0.8, 0, 4.5]}>
             <Trail width={4} length={25} color="#fb923c" attenuation={(t) => t*0.4}>
                <mesh visible={false} />
             </Trail>
        </group>
    </group>
  );
};

const Aircraft: React.FC<AircraftProps> = ({ type, color = '#ff0000', position = [0, 0, 0], rotation = [0, 0, 0] }) => {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
     if(groupRef.current) {
         // Idling micro-movement
         groupRef.current.position.y += (Math.random() - 0.5) * 0.03;
     }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
       {type === 'player' ? <PlayerPlane color={color} /> : <TomcatPlane />}
    </group>
  );
};

export default Aircraft;
