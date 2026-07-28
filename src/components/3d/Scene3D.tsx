import { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Float, Grid } from '@react-three/drei';
import * as THREE from 'three';

// Procedural DNA helix component
function DNAHelix({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const count = 40;
  const radius = 1.2;
  const speed = 0.8;

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * speed;
      groupRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.2) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {Array.from({ length: count }).map((_, i) => {
        const t = (i / count) * Math.PI * 4; // 2 full turns
        const y = (i / count) * 4 - 2; // centered
        const x1 = Math.sin(t) * radius;
        const z1 = Math.cos(t) * radius;
        const x2 = Math.sin(t + Math.PI) * radius;
        const z2 = Math.cos(t + Math.PI) * radius;

        return (
          <group key={i}>
            {/* Strand 1 Node */}
            <mesh position={[x1, y, z1]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.8} roughness={0.1} />
            </mesh>
            {/* Strand 2 Node */}
            <mesh position={[x2, y, z2]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={0.8} roughness={0.1} />
            </mesh>
            {/* Connecting Bar */}
            {i % 2 === 0 && (
              <mesh position={[(x1 + x2) / 2, y, (z1 + z2) / 2]} rotation={[0, 0, t]}>
                <cylinderGeometry args={[0.03, 0.03, radius * 2, 8]} />
                <meshStandardMaterial color="#ffffff" opacity={0.4} transparent roughness={0.5} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

// Procedural Pulsing Wireframe Heart
function ParametricHeart({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = elapsed * 0.5;
      // Heartbeat pulse calculation
      const pulse = 1 + Math.pow(Math.sin(elapsed * 2.5), 4) * 0.12;
      meshRef.current.scale.set(pulse * scale, pulse * scale, pulse * scale);
    }
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = 0.5 + Math.pow(Math.sin(elapsed * 2.5), 4) * 0.8;
    }
  });

  // Heart shape geometry function
  const geom = (() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    // Draw heart curve
    const x = 0, y = 0;
    shape.bezierCurveTo(x, y + 0.5, x - 0.5, y + 1, x - 1, y + 1);
    shape.bezierCurveTo(x - 1.8, y + 1, x - 1.8, y - 0.2, x - 1.8, y - 0.2);
    shape.bezierCurveTo(x - 1.8, y - 1, x - 1, y - 1.8, x, y - 2.5);
    shape.bezierCurveTo(x + 1, y - 1.8, x + 1.8, y - 1, x + 1.8, y - 0.2);
    shape.bezierCurveTo(x + 1.8, y - 0.2, x + 1.8, y + 1, x + 1, y + 1);
    shape.bezierCurveTo(x + 0.5, y + 1, x, y + 0.5, x, y);

    const extrudeSettings = {
      depth: 0.4,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.1,
      bevelThickness: 0.1
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  })();

  return (
    <mesh ref={meshRef} geometry={geom} position={position} rotation={[Math.PI, 0, 0]}>
      <meshStandardMaterial
        ref={materialRef}
        wireframe
        color="#ff2a5f"
        emissive="#ff2a5f"
        emissiveIntensity={0.6}
        roughness={0.2}
      />
    </mesh>
  );
}

// Procedural Brain Network
function BrainNetwork({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const count = 30;

  // Generate random brain node clusters
  const points = (() => {
    const arr: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      // Form two brain hemisphere shapes
      const isLeft = Math.random() > 0.5;
      const x = (Math.random() - 0.5) * 1.2 + (isLeft ? -0.4 : 0.4);
      const y = (Math.random() - 0.3) * 1.5;
      const z = (Math.random() - 0.5) * 1.2;
      arr.push(new THREE.Vector3(x, y, z));
    }
    return arr;
  })();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Node Spheres */}
      {points.map((p, i) => (
        <mesh key={i} position={p.toArray()}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.6} />
        </mesh>
      ))}

      {/* Connection Links */}
      {points.map((p1, i) => {
        // Link to nearest 2 nodes
        const sorted = [...points]
          .map((p2, idx) => ({ dist: p1.distanceTo(p2), p2, idx }))
          .filter((item) => item.idx !== i)
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 2);

        return sorted.map((link, j) => {
          const midpoint = new THREE.Vector3().addVectors(p1, link.p2).multiplyScalar(0.5);
          const direction = new THREE.Vector3().subVectors(link.p2, p1);
          const length = direction.length();
          direction.normalize();

          // Align cylinder with link vector
          const alignRotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

          return (
            <mesh
              key={`${i}-${j}`}
              position={midpoint.toArray()}
              quaternion={alignRotation}
            >
              <cylinderGeometry args={[0.015, 0.015, length, 4]} />
              <meshStandardMaterial color="#8b5cf6" opacity={0.25} transparent />
            </mesh>
          );
        });
      })}
    </group>
  );
}

// Procedural floating nutrient molecules (Vitamins / Protein Spheres)
function NutrientMolecules() {
  const count = 15;
  const refs = useRef<THREE.Group[]>([]);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    refs.current.forEach((ref, i) => {
      if (ref) {
        ref.position.y += Math.sin(elapsed + i) * 0.003;
        ref.rotation.y += 0.005;
        ref.rotation.x += 0.002;
      }
    });
  });

  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const x = (Math.random() - 0.5) * 15;
        const y = (Math.random() - 0.5) * 10;
        const z = (Math.random() - 0.5) * 8 - 4;
        const color = i % 3 === 0 ? '#10b981' : i % 3 === 1 ? '#0ea5e9' : '#eab308'; // lime, blue, gold

        return (
          <group
            key={i}
            position={[x, y, z]}
            ref={(el) => {
              if (el) refs.current[i] = el;
            }}
          >
            <mesh>
              <dodecahedronGeometry args={[0.25]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.4}
                roughness={0.1}
                metalness={0.8}
              />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

// Camera control and mouse-parallax handler
function InteractiveCamera({ section }: { section: string }) {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  useFrame(() => {
    // Determine base coordinates based on landing page scroll section
    let targetX = 0;
    let targetY = 0;
    let targetZ = 6;

    if (section === 'dna') {
      targetX = -2.5;
      targetY = 0;
      targetZ = 5;
    } else if (section === 'heart') {
      targetX = 2.5;
      targetY = 0.5;
      targetZ = 5;
    } else if (section === 'brain') {
      targetX = 0;
      targetY = 0.8;
      targetZ = 4.5;
    } else if (section === 'dashboard') {
      targetX = 0;
      targetY = 0;
      targetZ = 7;
    }

    // Add smooth mouse-parallax displacement
    const lookX = targetX + mouse.current.x * 0.6;
    const lookY = targetY + mouse.current.y * 0.6;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, lookX, 0.08);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, lookY, 0.08);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.08);
  });

  return null;
}

export function Scene3D({ section }: { section: string }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#080512']} />
        
        {/* Futuristic Fog */}
        <fog attach="fog" args={['#080512', 3, 14]} />

        {/* Realistic Studio Lighting */}
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#00ffff" />
        <pointLight position={[-10, -10, -5]} intensity={1.2} color="#ff00ff" />
        <directionalLight position={[0, 5, 5]} intensity={1.0} color="#ffffff" />

        {/* Immersive Starfield background representing cellular energy */}
        <Stars radius={100} depth={50} count={1200} factor={4} saturation={0.5} fade speed={1.5} />

        {/* Interactive Models */}
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <DNAHelix position={[-2.5, 0, 0]} scale={section === 'dna' ? 1.3 : 0.85} />
        </Float>

        <Float speed={2.5} rotationIntensity={0.6} floatIntensity={0.6}>
          <ParametricHeart position={[2.5, 0.5, 0]} scale={section === 'heart' ? 0.7 : 0.4} />
        </Float>

        <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.4}>
          <BrainNetwork position={[0, section === 'brain' ? 0.8 : -3.5, -0.5]} scale={section === 'brain' ? 1.4 : 0.8} />
        </Float>

        <NutrientMolecules />

        {/* Cyber Hologram Grid overlay */}
        <Grid
          position={[0, -2, 0]}
          args={[20, 20]}
          cellSize={1.0}
          cellThickness={0.8}
          cellColor="#00ffff"
          sectionSize={3.3}
          sectionThickness={1.2}
          sectionColor="#ff00ff"
          fadeDistance={25}
          infiniteGrid
        />

        <InteractiveCamera section={section} />
      </Canvas>
    </div>
  );
}
