import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { TextureLoader } from 'three';

// Componente de la Tierra con texturas de la NASA
export function Earth({ gameState }) {
  const earthRef = useRef();
  const cloudsRef = useRef();
  const glowRef = useRef();
  const [textures, setTextures] = useState(null);

  // Cargar texturas de la NASA
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    
    // Texturas procedurales si la API de la NASA falla
    const createEarthTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      
      // Océanos
      const gradient = ctx.createLinearGradient(0, 0, 0, 1024);
      gradient.addColorStop(0, '#1a365d');
      gradient.addColorStop(0.5, '#1e40af');
      gradient.addColorStop(1, '#1a365d');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 2048, 1024);
      
      // Continentes
      ctx.fillStyle = '#166534';
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * 2048;
        const y = Math.random() * 1024;
        const size = Math.random() * 200 + 100;
        ctx.beginPath();
        ctx.ellipse(x, y, size, size * 0.6, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
      
      return new THREE.CanvasTexture(canvas);
    };

    // Intentar cargar desde NASA EPIC API (Earth Polychromatic Imaging Camera)
    fetch('https://api.nasa.gov/EPIC/api/natural/images?api_key=DEMO_KEY')
      .then(res => res.json())
      .then(data => {
        if (data && data[0]) {
          const latestImage = data[0];
          const date = latestImage.date.split(' ')[0].split('-').join('/');
          const imageUrl = `https://epic.gsfc.nasa.gov/archive/natural/${date.split('/').join('/')}/png/${latestImage.image}.png`;
          
          loader.load(
            imageUrl,
            (texture) => {
              texture.wrapS = THREE.RepeatWrapping;
              texture.wrapT = THREE.RepeatWrapping;
              setTextures({ earth: texture });
            },
            undefined,
            () => {
              // Fallback a textura procedural
              setTextures({ earth: createEarthTexture() });
            }
          );
        } else {
          setTextures({ earth: createEarthTexture() });
        }
      })
      .catch(() => {
        setTextures({ earth: createEarthTexture() });
      });
  }, []);

  useFrame((state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.1;
      
      // Efecto de sacudida si hay impacto
      if (gameState === 'impact') {
        earthRef.current.rotation.x += Math.sin(state.clock.elapsedTime * 20) * 0.02;
        earthRef.current.rotation.z += Math.cos(state.clock.elapsedTime * 20) * 0.02;
        earthRef.current.position.y += Math.sin(state.clock.elapsedTime * 30) * 0.01;
      }
    }

    // Rotación de nubes
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.05;
    }

    // Animación del glow
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.05);
    }
  });

  if (!textures) {
    return (
      <mesh>
        <sphereGeometry args={[2, 32, 32]} />
        <meshStandardMaterial color="#1a73e8" />
      </mesh>
    );
  }

  return (
    <group position={[0, 0, 0]}>
      {/* Tierra con textura */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[2, 128, 128]} />
        <meshStandardMaterial
          map={textures.earth}
          roughness={0.8}
          metalness={0.2}
          bumpScale={0.05}
        />
      </mesh>
      
      {/* Capa de nubes */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.02, 64, 64]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.3}
          roughness={1}
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

// Componente del Asteroide mejorado
export function Asteroid({ distance, strategy, gameState, fragments }) {
  const asteroidRef = useRef();
  const trailRef = useRef();
  const [isVisible, setIsVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(1);

  // Reset visibilidad cuando el juego se reinicia
  useEffect(() => {
    if (gameState === 'briefing' || gameState === 'situation-room') {
      setIsVisible(true);
      setFadeOut(1);
      if (asteroidRef.current) {
        asteroidRef.current.scale.setScalar(1);
      }
    }
  }, [gameState]);

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

    // Trail de fuego
    if (trailRef.current && currentDistance < 6) {
      trailRef.current.position.copy(asteroidRef.current.position);
      const trailScale = (8 - currentDistance) / 8;
      trailRef.current.scale.setScalar(trailScale * 0.5);
      trailRef.current.material.opacity = trailScale * 0.6;
    }

    // Animaciones según la estrategia
    if (gameState === 'success') {
      // Hacer que el asteroide desaparezca gradualmente después del éxito
      if (fadeOut > 0) {
        setFadeOut(prev => Math.max(0, prev - delta * 2));
        asteroidRef.current.scale.setScalar(fadeOut);
      } else if (isVisible) {
        setIsVisible(false);
      }
    } else if (gameState === 'impact') {
      // Impacto fallido - mover hacia la Tierra
      const targetDistance = 2.2;
      if (currentDistance > targetDistance) {
        asteroidRef.current.position.lerp(new THREE.Vector3(0, 0, 0), delta * 2);
      }
    }
  });

  // No renderizar si no está visible
  if (!isVisible && gameState === 'success') return null;

  return (
    <group ref={asteroidRef}>
      {/* Luz para iluminar el asteroide */}
      <pointLight intensity={3} distance={5} color="#ff4400" />

      {/* Asteroide principal - MUCHO MÁS GRANDE Y VISIBLE */}
      <mesh castShadow>
        <dodecahedronGeometry args={[0.8, 1]} />
        <meshStandardMaterial
          color="#cc5522"
          roughness={0.8}
          metalness={0.3}
          emissive="#ff4400"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* Glow exterior para máxima visibilidad */}
      <mesh scale={1.2}>
        <dodecahedronGeometry args={[0.8, 1]} />
        <meshBasicMaterial
          color="#ff6600"
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Trail de entrada atmosférica */}
      <mesh ref={trailRef}>
        <coneGeometry args={[0.3, 1.5, 8]} />
        <meshBasicMaterial
          color="#ff6600"
          transparent
          opacity={0}
        />
      </mesh>

      {/* Fragmentos si fue destruido */}
      {fragments && fragments.map((frag, i) => (
        <Fragment key={i} data={frag} index={i} />
      ))}
    </group>
  );
}

// Fragmento de asteroide
function Fragment({ data, index }) {
  const ref = useRef();

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.position.x += data.velocity.x * delta;
      ref.current.position.y += data.velocity.y * delta;
      ref.current.position.z += data.velocity.z * delta;
      ref.current.rotation.x += delta * 2;
      ref.current.rotation.y += delta * 1.5;
      
      // Fade out
      if (ref.current.material.opacity > 0) {
        ref.current.material.opacity -= delta * 0.3;
      }
    }
  });

  return (
    <mesh ref={ref} position={[data.position.x, data.position.y, data.position.z]}>
      <dodecahedronGeometry args={[data.size, 0]} />
      <meshStandardMaterial
        color="#5a4a3a"
        transparent
        opacity={1}
      />
    </mesh>
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

// Misil interceptor
export function Missile({ target, onImpact, active }) {
  const groupRef = useRef();
  const missileRef = useRef();
  const trailRef = useRef();
  const [hasImpacted, setHasImpacted] = useState(false);
  const [logged, setLogged] = useState(false);

  // Reset state cuando se activa
  useEffect(() => {
    if (active) {
      setHasImpacted(false);
      setLogged(false);
      // Resetear posición inicial
      if (groupRef.current) {
        groupRef.current.position.set(0, -2, 3);
      }
    }
  }, [active]);

  useFrame((state, delta) => {
    if (!groupRef.current || !active || hasImpacted) return;

    // Debug inicial
    if (!logged && active) {
      console.log('🚀 MISIL ACTIVADO! Posición inicial:', groupRef.current.position);
      console.log('🎯 Target:', target);
      setLogged(true);
    }

    const targetPos = new THREE.Vector3(target.x, target.y, target.z);
    const currentPos = groupRef.current.position;
    
    // Mover hacia el objetivo
    const direction = targetPos.clone().sub(currentPos).normalize();
    groupRef.current.position.add(direction.multiplyScalar(delta * 8));
    
    // Rotar el grupo hacia el objetivo
    groupRef.current.lookAt(targetPos);

    // Detectar impacto - RADIO MUCHO MÁS GRANDE
    const distanceToTarget = currentPos.distanceTo(targetPos);
    console.log('Distancia al objetivo:', distanceToTarget.toFixed(2)); // Debug
    if (distanceToTarget < 1.5) {
      console.log('¡IMPACTO DETECTADO!'); // Debug
      setHasImpacted(true);
      onImpact && onImpact();
    }
  });

  if (!active) return null;

  return (
    <group ref={groupRef} position={[0, -2, 3]}>
      {/* Punto brillante del misil - TIPO COMETA */}
      <mesh ref={missileRef}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={1}
        />
      </mesh>

      {/* Glow exterior brillante amarillo */}
      <mesh scale={1.5}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial
          color="#ffff00"
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Glow exterior naranja */}
      <mesh scale={2}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial
          color="#ff8800"
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Luz intensa del misil */}
      <pointLight
        intensity={10}
        distance={15}
        color="#ffaa00"
      />

      {/* Estela tipo cometa - cono principal */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
        <coneGeometry args={[0.2, 2.5, 8]} />
        <meshBasicMaterial
          color="#ff6600"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Estela secundaria más larga y sutil */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <coneGeometry args={[0.12, 4.0, 8]} />
        <meshBasicMaterial
          color="#ff8800"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Estela terciaria muy larga */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]}>
        <coneGeometry args={[0.06, 5.0, 8]} />
        <meshBasicMaterial
          color="#ffaa44"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// Explosión nuclear ÉPICA - MÁXIMO DRAMATISMO
export function NuclearExplosion({ position, active, onComplete }) {
  const explosionRef = useRef();
  const shockwaveRef = useRef();
  const shockwave2Ref = useRef();
  const shockwave3Ref = useRef();
  const flashRef = useRef();
  const fireballRef = useRef();
  const plasmaRingRef = useRef();
  const energySphereRef = useRef();
  const [time, setTime] = useState(0);

  // Reset timer when activated
  useEffect(() => {
    if (active) {
      setTime(0);
      console.log('💥 EPIC EXPLOSION INITIATED');
    }
  }, [active]);

  useFrame((state, delta) => {
    if (!active) return;

    const newTime = time + delta;
    setTime(newTime);

    // Debug
    if (newTime < 0.1) {
      console.log('💥 NUCLEAR DETONATION at position:', position);
    }

    // Flash inicial ULTRA masivo con pulsación
    if (flashRef.current && newTime < 0.5) {
      const flashScale = 3 + newTime * 30 + Math.sin(newTime * 50) * 2;
      flashRef.current.scale.setScalar(flashScale);
      flashRef.current.material.opacity = Math.max(0, 1 - newTime * 2.5);
    }

    // Bola de fuego principal con crecimiento orgánico
    if (explosionRef.current) {
      const scale = Math.min(18, newTime * 7 + Math.sin(newTime * 4) * 1.5);
      explosionRef.current.scale.setScalar(scale);
      explosionRef.current.material.opacity = Math.max(0, 1 - newTime * 0.18);
      explosionRef.current.rotation.y += delta * 1.2;
      explosionRef.current.rotation.x += delta * 0.3;
    }

    // Núcleo de fuego ultra brillante con pulsación
    if (fireballRef.current) {
      const scale = Math.min(12, newTime * 5.5 + Math.sin(newTime * 8) * 0.8);
      fireballRef.current.scale.setScalar(scale);
      fireballRef.current.material.opacity = Math.max(0, 1 - newTime * 0.25);
      fireballRef.current.rotation.z += delta * 2;
    }

    // Esfera de energía interna pulsante
    if (energySphereRef.current) {
      const scale = Math.min(6, newTime * 4) + Math.sin(newTime * 10) * 0.5;
      energySphereRef.current.scale.setScalar(scale);
      energySphereRef.current.material.opacity = Math.max(0, 0.9 - newTime * 0.3);
    }

    // Anillo de plasma horizontal épico
    if (plasmaRingRef.current && newTime > 0.2) {
      const ringScale = (newTime - 0.2) * 15;
      plasmaRingRef.current.scale.setScalar(ringScale);
      plasmaRingRef.current.material.opacity = Math.max(0, 0.9 - (newTime - 0.2) * 0.15);
      plasmaRingRef.current.rotation.z += delta * 3;
    }

    // Onda expansiva 1 - MÁS GRANDE Y DRAMÁTICA
    if (shockwaveRef.current) {
      const waveScale = newTime * 15;
      shockwaveRef.current.scale.setScalar(waveScale);
      shockwaveRef.current.material.opacity = Math.max(0, 0.9 - newTime * 0.1);
      shockwaveRef.current.rotation.z += delta * 3;
    }

    // Onda expansiva 2 (secundaria) - MÁS INTENSA
    if (shockwave2Ref.current && newTime > 0.3) {
      const waveScale = (newTime - 0.3) * 18;
      shockwave2Ref.current.scale.setScalar(waveScale);
      shockwave2Ref.current.material.opacity = Math.max(0, 0.7 - (newTime - 0.3) * 0.12);
      shockwave2Ref.current.rotation.z -= delta * 2;
    }

    // Onda expansiva 3 (terciaria) - EFECTO ADICIONAL
    if (shockwave3Ref.current && newTime > 0.6) {
      const waveScale = (newTime - 0.6) * 22;
      shockwave3Ref.current.scale.setScalar(waveScale);
      shockwave3Ref.current.material.opacity = Math.max(0, 0.5 - (newTime - 0.6) * 0.1);
      shockwave3Ref.current.rotation.z += delta * 1.5;
    }

    // Completar después de 8 segundos (más largo para más épico)
    if (newTime > 8 && onComplete) {
      onComplete();
    }
  });

  if (!active) return null;

  return (
    <group position={position}>
      {/* Luces explosivas ULTRA INTENSAS con múltiples colores */}
      <pointLight
        intensity={time < 0.3 ? 200 * (1 - time * 3.5) : 0}
        distance={80}
        color="#ffffff"
        decay={2}
      />
      <pointLight
        intensity={time < 0.5 ? 150 * (1 - time * 2) : 0}
        distance={60}
        color="#ffff00"
        decay={2}
      />
      <pointLight
        intensity={time < 2 ? 100 * (1 - time * 0.5) : 0}
        distance={50}
        color="#ff6600"
        decay={2}
      />
      <pointLight
        intensity={time < 3 ? 80 * (1 - time * 0.33) : 0}
        distance={40}
        color="#ff0000"
        decay={2}
      />

      {/* Flash inicial ULTRA brillante con distorsión */}
      <mesh ref={flashRef} scale={3}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={1}
        />
      </mesh>

      {/* Esfera de energía interna pulsante */}
      <mesh ref={energySphereRef} scale={1}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#00ffff"
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Núcleo de fuego ultra brillante */}
      <mesh ref={fireballRef} scale={1.5}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#ffff00"
          transparent
          opacity={1}
        />
      </mesh>

      {/* Bola de fuego principal MASIVA */}
      <mesh ref={explosionRef} scale={2}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#ff4500"
          transparent
          opacity={1}
        />
      </mesh>

      {/* Capa externa de fuego naranja */}
      <mesh scale={explosionRef.current ? explosionRef.current.scale.x * 1.3 : 2.6}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#ff6600"
          transparent
          opacity={Math.max(0, 0.6 - time * 0.12)}
        />
      </mesh>

      {/* Capa de humo/calor distorsionado */}
      <mesh scale={explosionRef.current ? explosionRef.current.scale.x * 1.5 : 3}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#882200"
          transparent
          opacity={Math.max(0, 0.4 - time * 0.08)}
        />
      </mesh>

      {/* Anillos de energía múltiples con diferentes velocidades */}
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={time * 10}>
        <ringGeometry args={[0.7, 1.2, 64]} />
        <meshBasicMaterial
          color="#ffff00"
          transparent
          opacity={Math.max(0, 1 - time * 0.35)}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, time * 2]} scale={time * 12}>
        <ringGeometry args={[0.5, 1.0, 64]} />
        <meshBasicMaterial
          color="#ff6600"
          transparent
          opacity={Math.max(0, 0.8 - time * 0.3)}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Anillo de plasma horizontal ÉPICO */}
      <mesh ref={plasmaRingRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.15, 32, 100]} />
        <meshBasicMaterial
          color="#00ffff"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Ondas expansivas con geometría más compleja */}
      <mesh ref={shockwaveRef}>
        <torusGeometry args={[1, 0.4, 32, 100]} />
        <meshBasicMaterial
          color="#ffff00"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          wireframe
        />
      </mesh>

      <mesh ref={shockwave2Ref}>
        <torusGeometry args={[1, 0.3, 32, 100]} />
        <meshBasicMaterial
          color="#ff8844"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          wireframe
        />
      </mesh>

      <mesh ref={shockwave3Ref}>
        <torusGeometry args={[1, 0.25, 32, 100]} />
        <meshBasicMaterial
          color="#ff4422"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          wireframe
        />
      </mesh>

      {/* Destellos radiales MÁS NUMEROSOS (12 rayos) */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(angle => (
        <mesh
          key={angle}
          rotation={[0, 0, (angle * Math.PI) / 180]}
          scale={[time * 8, 0.15, 1]}
        >
          <planeGeometry args={[2.5, 0.3]} />
          <meshBasicMaterial
            color="#ffaa00"
            transparent
            opacity={Math.max(0, 1 - time * 0.4)}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}

      {/* Rayos verticales adicionales para más profundidad */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
        <mesh
          key={`v${angle}`}
          rotation={[Math.PI / 2, 0, (angle * Math.PI) / 180]}
          scale={[time * 7, 0.12, 1]}
        >
          <planeGeometry args={[2, 0.25]} />
          <meshBasicMaterial
            color="#ff6600"
            transparent
            opacity={Math.max(0, 0.8 - time * 0.35)}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}

      {/* Partículas de chispa brillantes */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const distance = time * 5;
        return (
          <mesh
            key={`spark${i}`}
            position={[
              Math.cos(angle) * distance,
              Math.sin(angle) * distance * 0.5,
              Math.sin(angle * 2) * distance * 0.3
            ]}
            scale={Math.max(0, 1.5 - time * 0.3)}
          >
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial
              color="#ffff00"
              transparent
              opacity={Math.max(0, 1 - time * 0.4)}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// Sistema de partículas mejorado - EXPLOSIÓN MASIVA
export function Particles({ active, position = [0, 0, 0], color = "#ffaa00", count = 3000 }) {
  const particlesRef = useRef();
  const [startTime, setStartTime] = useState(0);

  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 0.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Velocidades radiales para explosión
      const speed = Math.random() * 3 + 1;
      velocities[i * 3] = positions[i * 3] * speed;
      velocities[i * 3 + 1] = positions[i * 3 + 1] * speed;
      velocities[i * 3 + 2] = positions[i * 3 + 2] * speed;
    }
    return { positions, velocities };
  }, [count]);

  useFrame((state, delta) => {
    if (!particlesRef.current || !active) return;

    if (startTime === 0) {
      setStartTime(state.clock.elapsedTime);
    }

    const elapsed = state.clock.elapsedTime - startTime;
    const geometry = particlesRef.current.geometry;
    const posArray = geometry.attributes.position.array;

    // Actualizar posiciones con física de explosión
    for (let i = 0; i < count; i++) {
      posArray[i * 3] += velocities[i * 3] * delta;
      posArray[i * 3 + 1] += velocities[i * 3 + 1] * delta;
      posArray[i * 3 + 2] += velocities[i * 3 + 2] * delta;

      // Gravedad ligera
      velocities[i * 3 + 1] -= delta * 0.5;
    }

    geometry.attributes.position.needsUpdate = true;

    // Rotación para efecto dinámico
    particlesRef.current.rotation.y += delta * 0.5;
    
    // Fade out gradual
    if (particlesRef.current.material.opacity > 0) {
      particlesRef.current.material.opacity -= delta * 0.15;
    }
  });

  if (!active) return null;

  return (
    <points ref={particlesRef} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color={color}
        transparent
        opacity={1}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// Camera Shake - Efecto de vibración en impacto
export function CameraShake({ active, intensity = 0.5, duration = 2 }) {
  const { camera } = useThree();
  const [startTime, setStartTime] = useState(0);
  const originalPosition = useRef(camera.position.clone());

  // Reset cuando se desactiva
  useEffect(() => {
    if (!active && startTime !== 0) {
      setStartTime(0);
    }
  }, [active, startTime]);

  useFrame((state, delta) => {
    if (!active) {
      // Restaurar posición si se desactiva
      if (startTime !== 0) {
        camera.position.lerp(originalPosition.current, delta * 10);
      }
      return;
    }

    if (startTime === 0) {
      setStartTime(state.clock.elapsedTime);
      originalPosition.current = camera.position.clone();
    }

    const elapsed = state.clock.elapsedTime - startTime;
    
    if (elapsed < duration) {
      // Shake con decaimiento
      const decay = 1 - (elapsed / duration);
      const shakeIntensity = intensity * decay;
      
      camera.position.x = originalPosition.current.x + (Math.random() - 0.5) * shakeIntensity;
      camera.position.y = originalPosition.current.y + (Math.random() - 0.5) * shakeIntensity;
      camera.position.z = originalPosition.current.z + (Math.random() - 0.5) * shakeIntensity * 0.5;
    } else {
      // Restaurar posición original suavemente
      camera.position.lerp(originalPosition.current, delta * 5);
    }
  });

  return null;
}
