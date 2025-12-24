
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';

const SpeedLines: React.FC = () => {
  const status = useStore((state) => state.status);
  const torque = useStore((state) => state.torque);
  const linesRef = useRef<THREE.Group>(null!);

  const lineCount = 100;
  const lines = useMemo(() => {
    const arr = [];
    for (let i = 0; i < lineCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 10 + Math.random() * 30; // Further out
      const length = 20 + Math.random() * 50;
      arr.push({
        position: [
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          -Math.random() * 200,
        ] as [number, number, number],
        // Very thin, very long
        scale: [0.05, 0.05, length] as [number, number, number],
        speed: 1 + Math.random() * 1.5,
      });
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    if (!linesRef.current) return;
    
    // Only show speed lines if status is intro or torque is high
    const isHighSpeed = status === 'intro' || torque > 110;
    
    // Smooth opacity transition
    const targetOpacity = isHighSpeed ? 0.3 : 0;
    
    linesRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, delta * 2);

      child.position.z += delta * 400 * lines[i].speed;
      if (child.position.z > 50) {
        child.position.z = -200 - Math.random() * 100;
        // Randomize angle on reset
        const angle = Math.random() * Math.PI * 2;
        const radius = 10 + Math.random() * 30;
        child.position.x = Math.cos(angle) * radius;
        child.position.y = Math.sin(angle) * radius;
      }
    });
  });

  return (
    <group ref={linesRef}>
      {lines.map((line, i) => (
        <mesh key={i} position={line.position} scale={line.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="white" transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
};

export default SpeedLines;
