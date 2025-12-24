
import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, KeyboardControls, useKeyboardControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import Aircraft from './Aircraft';
import Environment from './Environment';
import SpeedLines from './SpeedLines';
import { useStore } from '../store';

// TUNED PHYSICS
const PLAYER_MAX_SPEED = 320;
const PLAYER_MIN_SPEED = 120;
const DRAG = 0.98;
const ROLL_SPEED = 2.5;
const PITCH_SPEED = 1.8;
const RACE_DISTANCE = 50000;

const SoundManager: React.FC = () => {
    const { speed, status } = useStore();
    const engineOscRef = useRef<OscillatorNode | null>(null);
    const windNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const windGainRef = useRef<GainNode | null>(null);
    const ctxRef = useRef<AudioContext | null>(null);
    const initialized = useRef(false);

    useEffect(() => {
        if ((status === 'playing' || status === 'intro') && !initialized.current) {
            initialized.current = true;
            try {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                const ctx = new AudioContext();
                ctxRef.current = ctx;

                // Engine Drone
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.value = 80;
                osc.connect(gain);
                gain.connect(ctx.destination);
                gain.gain.value = 0.0;
                osc.start();
                engineOscRef.current = osc;
                gainNodeRef.current = gain;

                // Wind Noise
                const bufferSize = ctx.sampleRate * 2;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                const noise = ctx.createBufferSource();
                noise.buffer = buffer;
                noise.loop = true;
                const noiseGain = ctx.createGain();
                noiseGain.gain.value = 0.0;
                noise.connect(noiseGain);
                noiseGain.connect(ctx.destination);
                noise.start();
                windNodeRef.current = noise;
                windGainRef.current = noiseGain;
            } catch (e) {
                console.error("Audio init failed", e);
            }
        }
    }, [status]);

    useEffect(() => {
        if (!ctxRef.current) return;
        const s = status === 'intro' ? 200 : speed;
        const now = ctxRef.current.currentTime;
        
        if (engineOscRef.current && gainNodeRef.current) {
            const targetFreq = 50 + (s / PLAYER_MAX_SPEED) * 150;
            engineOscRef.current.frequency.setTargetAtTime(targetFreq, now, 0.1);
            gainNodeRef.current.gain.setTargetAtTime(0.02 + (s/PLAYER_MAX_SPEED)*0.08, now, 0.1);
        }
        if (windGainRef.current) {
             const windVol = (s / PLAYER_MAX_SPEED) * 0.3;
             windGainRef.current.gain.setTargetAtTime(windVol, now, 0.1);
        }
    }, [speed, status]);

    return null;
}

const CameraRig: React.FC = () => {
  const { camera } = useThree();
  const status = useStore((state) => state.status);
  const setStatus = useStore((state) => state.setStatus);
  const playerRef = useRef<THREE.Group>(null!);
  const tomcat1Ref = useRef<THREE.Group>(null!);
  const tomcat2Ref = useRef<THREE.Group>(null!);
  
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const currentSpeed = useRef(150);
  const rotationEuler = useRef(new THREE.Euler(0, 0, 0));
  const raceDistanceTraveled = useRef(0);
  
  const [, getKeys] = useKeyboardControls();
  const setSpeed = useStore((state) => state.setSpeed);
  const setTorque = useStore((state) => state.setTorque);
  const updateDistance = useStore((state) => state.updateDistance);

  // Intro Cinematic Vars
  const introTime = useRef(0);

  // Tomcat Logic
  const tomcat1State = useRef({ speed: 280, offset: new THREE.Vector3(-25, 10, 20) });
  const tomcat2State = useRef({ speed: 275, offset: new THREE.Vector3(25, -10, 20) });

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    
    // --- INTRO SEQUENCE ---
    if (status === 'intro') {
      introTime.current += delta;
      currentSpeed.current = 300; // Locked high speed
      setSpeed(300);
      setTorque(100);
      
      // Dramatic Orbit
      const radius = 35;
      const camX = Math.sin(time * 0.4) * radius;
      const camZ = Math.cos(time * 0.4) * radius + 10;
      
      camera.position.lerp(new THREE.Vector3(camX, 10, camZ), delta * 2);
      if (playerRef.current) camera.lookAt(playerRef.current.position);

      // Player gentle float
      if (playerRef.current) {
          playerRef.current.rotation.z = Math.sin(time) * 0.1;
          playerRef.current.rotation.x = Math.cos(time*0.7) * 0.05;
      }
      
      // Tomcats flying formation
      if (tomcat1Ref.current && playerRef.current) {
          tomcat1Ref.current.position.set(-20, Math.sin(time)*5, 10);
      }
      if (tomcat2Ref.current && playerRef.current) {
          tomcat2Ref.current.position.set(20, Math.cos(time)*5, 10);
      }
      return;
    }

    if (status === 'finished') {
        // Fly off into sunset
        if (playerRef.current) {
            playerRef.current.position.y += delta * 50;
            playerRef.current.rotation.x = -0.5;
            camera.lookAt(playerRef.current.position);
        }
        return;
    }

    // --- GAMEPLAY PHYSICS ---
    const keys = getKeys ? getKeys() : { forward: false, backward: false, left: false, right: false };
    const { forward, backward, left, right } = keys;

    if (playerRef.current) {
      // Input Logic
      const targetRoll = (right ? -1 : 0) + (left ? 1 : 0);
      const targetPitch = (forward ? 1 : 0) + (backward ? -1 : 0);
      
      // Smooth Damping for Rotation
      rotationEuler.current.z = THREE.MathUtils.damp(rotationEuler.current.z, targetRoll * 1.4, ROLL_SPEED, delta);
      rotationEuler.current.x = THREE.MathUtils.damp(rotationEuler.current.x, targetPitch * 0.8, PITCH_SPEED, delta);
      
      // Auto-leveling
      if (!left && !right) rotationEuler.current.z = THREE.MathUtils.damp(rotationEuler.current.z, 0, 1.0, delta);
      if (!forward && !backward) rotationEuler.current.x = THREE.MathUtils.damp(rotationEuler.current.x, 0, 1.0, delta);
      
      playerRef.current.rotation.copy(rotationEuler.current);

      // Velocity & Movement
      const xForce = -rotationEuler.current.z * 120;
      const yForce = rotationEuler.current.x * 90;
      
      velocity.current.x += xForce * delta;
      velocity.current.y += yForce * delta;
      
      // Drag & Decay
      velocity.current.x *= DRAG;
      velocity.current.y *= DRAG;

      // Apply
      playerRef.current.position.add(velocity.current.clone().multiplyScalar(delta));

      // Speed Accel/Decel based on dive/climb
      let speedChange = (rotationEuler.current.x < 0 ? 40 : -20) * delta;
      if (Math.abs(rotationEuler.current.x) < 0.1) speedChange = 10 * delta; // Natural acceleration
      
      currentSpeed.current = THREE.MathUtils.clamp(
        currentSpeed.current + speedChange, 
        PLAYER_MIN_SPEED, 
        PLAYER_MAX_SPEED
      );

      // Soft Bounds with bounce back
      if(playerRef.current.position.x > 300) velocity.current.x -= 200 * delta;
      if(playerRef.current.position.x < -300) velocity.current.x += 200 * delta;
      if(playerRef.current.position.y > 200) velocity.current.y -= 200 * delta;
      if(playerRef.current.position.y < -100) velocity.current.y += 200 * delta;
      
      // Update Global State
      const distanceTick = currentSpeed.current * delta;
      raceDistanceTraveled.current += distanceTick;
      updateDistance(distanceTick);

      if (raceDistanceTraveled.current >= RACE_DISTANCE) {
          setStatus('finished');
      }

      // --- TOMCAT AI ---
      // They rubberband around the player to keep it exciting
      if (tomcat1Ref.current) {
          const t1 = tomcat1Ref.current;
          t1.position.z -= (tomcat1State.current.speed - currentSpeed.current) * delta * 0.2;
          t1.position.x = THREE.MathUtils.lerp(t1.position.x, playerRef.current.position.x - 30 + Math.sin(time)*20, delta);
          t1.position.y = THREE.MathUtils.lerp(t1.position.y, playerRef.current.position.y, delta);
          // Banking visuals
          t1.rotation.z = Math.sin(time) * 0.5;
      }
      if (tomcat2Ref.current) {
          const t2 = tomcat2Ref.current;
          t2.position.z -= (tomcat2State.current.speed - currentSpeed.current) * delta * 0.2;
          t2.position.x = THREE.MathUtils.lerp(t2.position.x, playerRef.current.position.x + 30 + Math.cos(time)*20, delta);
          t2.position.y = THREE.MathUtils.lerp(t2.position.y, playerRef.current.position.y + 10, delta);
          t2.rotation.z = Math.cos(time) * 0.5;
      }

      // --- AAA CAMERA RIG ---
      // Position the camera behind the player, but delay it (spring)
      const speedRatio = currentSpeed.current / PLAYER_MAX_SPEED;
      
      // Dynamic FOV
      const targetFOV = 60 + speedRatio * 35; 
      if (camera instanceof THREE.PerspectiveCamera) {
          camera.fov = THREE.MathUtils.lerp(camera.fov, targetFOV, delta * 2);
          camera.updateProjectionMatrix();
      }

      // Target Cam Position relative to player
      const idealOffset = new THREE.Vector3(0, 8 + rotationEuler.current.x * -5, 25 + speedRatio * 10);
      idealOffset.applyEuler(playerRef.current.rotation); // Rotate with player? No, keeps horizon steady usually better for arcade
      // Actually, for arcade, keeping camera upright but following position is better, with slight tilt.
      
      const camTargetPos = playerRef.current.position.clone().add(new THREE.Vector3(0, 10, 30 + speedRatio * 5));
      // Add lag to camera movement
      camera.position.lerp(camTargetPos, delta * 5);
      
      // Look slightly ahead of player
      const lookTarget = playerRef.current.position.clone();
      lookTarget.z -= 100; // Look far ahead
      lookTarget.y += velocity.current.y * 0.5; // Look into the turn
      lookTarget.x += velocity.current.x * 0.5;
      
      // Smooth lookAt
      const currentLook = new THREE.Vector3();
      camera.getWorldDirection(currentLook);
      const targetLook = lookTarget.clone().sub(camera.position).normalize();
      
      // We manually interpolate the quaternion for smoother lookAt
      const lookQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,-1), targetLook);
      camera.quaternion.slerp(lookQuat, delta * 5);
      
      // Camera Shake
      const shakeAmt = speedRatio * 0.15;
      camera.position.x += (Math.random()-0.5) * shakeAmt;
      camera.position.y += (Math.random()-0.5) * shakeAmt;

      setSpeed(currentSpeed.current);
      setTorque(100 + (currentSpeed.current / PLAYER_MAX_SPEED) * 50);
    }
  });

  return (
    <>
      <SoundManager />
      <group ref={playerRef} position={[0, 0, 0]}>
        <Aircraft type="player" color="#ef4444" />
      </group>

      <group ref={tomcat1Ref} position={[-20, 0, 20]}>
        <Aircraft type="tomcat" />
      </group>
      <group ref={tomcat2Ref} position={[20, 0, 20]}>
        <Aircraft type="tomcat" />
      </group>
    </>
  );
};

const Effects: React.FC = () => {
    return (
        <EffectComposer disableNormalPass multisampling={0}>
            <Bloom 
                luminanceThreshold={0.7} 
                mipmapBlur 
                intensity={1.2} 
                radius={0.6} 
            />
            <ChromaticAberration 
                blendFunction={BlendFunction.NORMAL} 
                offset={new THREE.Vector2(0.003, 0.003)} 
            />
            <Noise opacity={0.08} />
            <Vignette eskil={false} offset={0.1} darkness={0.4} />
        </EffectComposer>
    )
}

const GameScene: React.FC = () => {
  return (
      <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}>
        <KeyboardControls
          map={[
            { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
            { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
            { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
            { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
          ]}
        >
          <PerspectiveCamera makeDefault position={[0, 10, 30]} fov={70} near={0.1} far={5000} />
          <Suspense fallback={null}>
            <Environment />
            <Stars radius={400} depth={100} count={5000} factor={4} saturation={0} fade speed={1} />
            <SpeedLines />
            <CameraRig />
            <Effects />
          </Suspense>
        </KeyboardControls>
      </Canvas>
  );
};

export default GameScene;
