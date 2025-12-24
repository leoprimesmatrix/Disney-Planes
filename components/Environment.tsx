
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky, Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';

const CLOUD_COUNT = 60;
const WORLD_DEPTH = 4000;
const CLOUD_SPEED_FACTOR = 0.8;

// Softer cloud geometry
const puffGeo = new THREE.SphereGeometry(1, 16, 16); 

const CloudInstanced: React.FC<{ color: string, speed: number }> = ({ color, speed }) => {
    const groupRef = useRef<THREE.Group>(null!);
    const instancesData = useMemo(() => {
        const temp = [];
        for (let i = 0; i < CLOUD_COUNT; i++) {
            // Clusters
            const cx = (Math.random() - 0.5) * 2000;
            const cy = (Math.random() - 0.5) * 300 + 50; 
            const cz = Math.random() * -WORLD_DEPTH;

            // Create 5-8 puffs per cloud
            const puffs = Math.floor(5 + Math.random() * 5);
            for(let j=0; j<puffs; j++) {
                temp.push({
                    pos: [
                        cx + (Math.random() - 0.5) * 60,
                        cy + (Math.random() - 0.5) * 30,
                        cz + (Math.random() - 0.5) * 60
                    ] as [number, number, number],
                    scale: 25 + Math.random() * 30,
                    rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0] as [number, number, number]
                })
            }
        }
        // Sort by Z to help potential transparency (though standard material is opaque here)
        return temp.sort((a, b) => b.pos[2] - a.pos[2]); 
    }, []);

    useFrame((_, delta) => {
        if (!groupRef.current) return;
        
        // Move the entire group to simulate speed
        groupRef.current.position.z += speed * delta;
        
        // Modulo the group position to loop, but individual children usually safer for no-pop
        // For simple infinite scroll, reset Z:
        if (groupRef.current.position.z > WORLD_DEPTH) {
            groupRef.current.position.z = 0;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Using 2 sets of instances offset by WORLD_DEPTH to create seamless loop */}
             <Instances range={instancesData.length} geometry={puffGeo}>
                <meshStandardMaterial 
                    color={color} 
                    roughness={1} 
                    metalness={0} 
                    flatShading={false} // Smooth shading for fluffier clouds
                    transparent
                    opacity={0.9}
                />
                {instancesData.map((d, i) => (
                    <Instance key={i} position={d.pos} scale={[d.scale, d.scale, d.scale]} rotation={d.rotation} />
                ))}
            </Instances>
             <Instances range={instancesData.length} geometry={puffGeo} position={[0, 0, -WORLD_DEPTH]}>
                <meshStandardMaterial 
                    color={color} 
                    roughness={1} 
                    metalness={0} 
                    transparent
                    opacity={0.9}
                />
                {instancesData.map((d, i) => (
                    <Instance key={`2-${i}`} position={d.pos} scale={[d.scale, d.scale, d.scale]} rotation={d.rotation} />
                ))}
            </Instances>
        </group>
    );
};

const Terrain: React.FC<{ biome: string, speed: number }> = ({ biome, speed }) => {
    const terrainRef = useRef<THREE.Group>(null!);
    
    // Biome Colors
    const colors = useMemo(() => {
        switch(biome) {
            case 'desert': return { ground: '#d97706', grid: '#fcd34d' };
            case 'tundra': return { ground: '#e2e8f0', grid: '#94a3b8' };
            case 'city': return { ground: '#1e293b', grid: '#38bdf8' }; // Neon grid for city
            default: return { ground: '#166534', grid: '#4ade80' }; // Forest
        }
    }, [biome]);

    useFrame((_, delta) => {
        if (terrainRef.current) {
            // Move ground opposite to player
            terrainRef.current.position.z += speed * delta;
            // Loop texture/grid
            if (terrainRef.current.position.z > 200) {
                terrainRef.current.position.z = 0;
            }
        }
    });

    return (
        <group ref={terrainRef} position={[0, -250, 0]}>
            {/* Infinite Plane illusion */}
            <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0, -1000]}>
                <planeGeometry args={[4000, 4000, 32, 32]} />
                <meshStandardMaterial 
                    color={colors.ground} 
                    roughness={0.9}
                    wireframe={biome === 'city'} // Wireframe look for city "Tron" vibe
                />
            </mesh>
            
            {/* Grid Helper for speed reference */}
            {biome !== 'city' && (
                <gridHelper 
                    args={[4000, 40, colors.grid, colors.grid]} 
                    position={[0, 1, -1000]} 
                    rotation={[0, 0, 0]} 
                />
            )}

            {/* City Blocks Procedural */}
            {biome === 'city' && (
                <group>
                     {Array.from({length: 40}).map((_, i) => (
                         <mesh key={i} position={[(Math.random()-0.5)*1000, 50, -Math.random()*2000]}>
                             <boxGeometry args={[20 + Math.random()*50, 100 + Math.random()*300, 20+Math.random()*50]} />
                             <meshStandardMaterial color="#0f172a" emissive="#38bdf8" emissiveIntensity={0.2} />
                         </mesh>
                     ))}
                </group>
            )}

            {/* Trees for Forest */}
            {biome === 'forest' && (
                 <group>
                 {Array.from({length: 60}).map((_, i) => (
                     <mesh key={i} position={[(Math.random()-0.5)*1500, 0, -Math.random()*2000]} rotation={[0, Math.random()*Math.PI, 0]}>
                         <coneGeometry args={[15, 60, 8]} />
                         <meshStandardMaterial color="#064e3b" />
                     </mesh>
                 ))}
            </group>
            )}
             {/* Rocks for Desert */}
             {biome === 'desert' && (
                 <group>
                 {Array.from({length: 30}).map((_, i) => (
                     <mesh key={i} position={[(Math.random()-0.5)*1500, 0, -Math.random()*2000]} rotation={[Math.random(), Math.random(), 0]}>
                         <dodecahedronGeometry args={[20, 0]} />
                         <meshStandardMaterial color="#92400e" />
                     </mesh>
                 ))}
            </group>
            )}
        </group>
    )
}

const Environment: React.FC = () => {
  const { biome, weather, speed } = useStore();

  const config = useMemo(() => ({
    forest: { cloud: '#f1f5f9', sky: [100, 20, 100], ambient: 0.8 },
    desert: { cloud: '#fff7ed', sky: [20, 5, 20], ambient: 1.1 },
    city: { cloud: '#94a3b8', sky: [0, 0, -10], ambient: 0.5 },
    tundra: { cloud: '#e0f2fe', sky: [0, 10, -50], ambient: 0.9 },
  }), []);

  const currentConfig = config[biome as keyof typeof config];
  const isStorm = weather === 'storm';
  const isRain = weather === 'rain';

  // Darker clouds for bad weather
  const cloudColor = isStorm ? '#334155' : isRain ? '#64748b' : currentConfig.cloud;
  const sunPos = isStorm ? [0, -10, -500] : (currentConfig.sky as [number, number, number]);
  const fogColor = isStorm ? '#0f172a' : biome === 'city' ? '#020617' : '#e0f2fe';

  return (
    <group>
      <Sky 
        sunPosition={sunPos} 
        turbidity={isStorm ? 10 : 2} 
        rayleigh={isStorm ? 0.2 : biome === 'desert' ? 2 : 1} 
        mieCoefficient={0.005} 
        mieDirectionalG={0.8} 
      />
      
      <ambientLight intensity={isStorm ? 0.2 : currentConfig.ambient} />
      <directionalLight 
        position={[50, 100, 20]} 
        intensity={isStorm ? 0.1 : 1.5} 
        castShadow
        shadow-bias={-0.001}
      />
      
      {/* Dynamic Ground */}
      <Terrain biome={biome} speed={speed} />

      {/* Cloud Layers */}
      <group position={[0, 50, 0]}>
          <CloudInstanced color={cloudColor} speed={speed * CLOUD_SPEED_FACTOR} />
      </group>
      
      {/* Lower fog clouds for depth */}
      <group position={[0, -150, 0]}>
         <CloudInstanced color={cloudColor} speed={speed * CLOUD_SPEED_FACTOR * 0.8} />
      </group>

      <fog attach="fog" args={[fogColor, 100, 3000]} />
    </group>
  );
};

export default Environment;
