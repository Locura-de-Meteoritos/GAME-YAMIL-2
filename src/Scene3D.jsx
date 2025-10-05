import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Componente de la Tierra
export function Earth({ gameState }) {
  const earthRef = useRef();
  const glowRef = useRef();

  useFrame((state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.1;
      
      // Efecto de sacudida si hay impacto
      if (gameState === 'impact') {
        earthRef.current.rotation.x += Math.sin(state.clock.elapsedTime * 20) * 0.02;
        earthRef.current.rotation.z += Math.cos(state.clock.elapsedTime * 20) * 0.02;
      }
    }

    // Animación del glow
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.05);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <mesh ref={earthRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial
          color="#1a73e8"
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
      
      {/* Continentes (manchas verdes) */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2.01, 64, 64]} />
        <meshStandardMaterial
          color="#0f9d58"
          roughness={0.9}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Glow de la atmósfera */}
      <mesh ref={glowRef} position={[0, 0, 0]}>
        <sphereGeometry args={[2.3, 32, 32]} />
        <meshBasicMaterial
          color="#4285f4"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

// Componente del Asteroide
export function Asteroid({ distance, strategy, gameState }) {
  const asteroidRef = useRef();
  const explosionRef = useRef();

  useFrame((state, delta) => {
    if (!asteroidRef.current) return;

    // Rotación del asteroide
    asteroidRef.current.rotation.x += delta * 0.5;
    asteroidRef.current.rotation.y += delta * 0.3;

    // Posición basada en la distancia
    const angle = Math.PI / 4;
    const baseDistance = 8;
    const currentDistance = baseDistance - (baseDistance - 2.5) * (1 - distance / 1000000);
    
    asteroidRef.current.position.set(
      Math.cos(angle) * currentDistance,
      Math.sin(angle) * currentDistance * 0.5,
      Math.sin(angle) * currentDistance
    );

    // Animaciones según la estrategia
    if (strategy === 'nuclear' && gameState === 'executing') {
      // Explosión nuclear
      if (explosionRef.current) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 5) * 2;
        explosionRef.current.scale.setScalar(scale);
        explosionRef.current.material.opacity = Math.max(0, 0.8 - scale * 0.2);
      }
    } else if (strategy === 'kinetic' && gameState === 'executing') {
      // Cambio de trayectoria
      asteroidRef.current.position.x += Math.sin(state.clock.elapsedTime * 3) * 0.05;
    } else if (gameState === 'success') {
      // Desvío exitoso
      asteroidRef.current.position.x += delta * 2;
      asteroidRef.current.position.y += delta * 1;
    } else if (gameState === 'impact') {
      // Impacto fallido - mover hacia la Tierra
      const targetDistance = 2.2;
      if (currentDistance > targetDistance) {
        asteroidRef.current.position.lerp(new THREE.Vector3(0, 0, 0), delta * 2);
      }
    }
  });

  return (
    <group>
      <mesh ref={asteroidRef}>
        <dodecahedronGeometry args={[0.4, 1]} />
        <meshStandardMaterial
          color="#5a4a3a"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Explosión (visible solo con estrategia nuclear) */}
      {strategy === 'nuclear' && (
        <mesh ref={explosionRef} position={asteroidRef.current?.position}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial
            color="#ff6600"
            transparent
            opacity={0}
          />
        </mesh>
      )}
    </group>
  );
}

// Campo de estrellas
export function StarField() {
  const starsRef = useRef();

  const starPositions = useMemo(() => {
    const positions = new Float32Array(5000 * 3);
    for (let i = 0; i < 5000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    return positions;
  }, []);

  useFrame((state, delta) => {
    if (starsRef.current) {
      starsRef.current.rotation.y += delta * 0.01;
    }
  });

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={starPositions.length / 3}
          array={starPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#ffffff"
        sizeAttenuation={true}
        transparent
        opacity={0.8}
      />
    </points>
  );
}

// Trayectoria del asteroide
export function Trajectory({ distance }) {
  const points = useMemo(() => {
    const curve = [];
    for (let i = 0; i <= 50; i++) {
      const t = i / 50;
      const angle = Math.PI / 4;
      const dist = 8 - t * 5.5;
      curve.push(
        new THREE.Vector3(
          Math.cos(angle) * dist,
          Math.sin(angle) * dist * 0.5,
          Math.sin(angle) * dist
        )
      );
    }
    return curve;
  }, []);

  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [points]);

  return (
    <line geometry={lineGeometry}>
      <lineBasicMaterial
        color="#ff0000"
        transparent
        opacity={0.3}
        linewidth={2}
      />
    </line>
  );
}

// Componente de partículas para efectos
export function Particles({ active, position = [0, 0, 0] }) {
  const particlesRef = useRef();

  const particlePositions = useMemo(() => {
    const positions = new Float32Array(1000 * 3);
    for (let i = 0; i < 1000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    return positions;
  }, []);

  useFrame((state, delta) => {
    if (particlesRef.current && active) {
      particlesRef.current.rotation.y += delta;
      particlesRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 5) * 0.5);
    }
  });

  if (!active) return null;

  return (
    <points ref={particlesRef} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlePositions.length / 3}
          array={particlePositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#ffaa00"
        transparent
        opacity={0.6}
      />
    </points>
  );
}
