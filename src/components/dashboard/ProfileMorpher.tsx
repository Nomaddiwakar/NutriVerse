import { useState, useEffect, useRef } from 'react';
import { Sparkles, Info, Heart, Activity, Droplet, RotateCcw, Monitor } from 'lucide-react';
import * as THREE from 'three';

export function ProfileMorpher() {
  // Biometric state variables
  const [age, setAge] = useState(28);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [height, setHeight] = useState(178); // cm
  const [weight, setWeight] = useState(78); // kg
  const [activity, setActivity] = useState('moderate');
  
  // Morphing sliders
  const [bodyFat, setBodyFat] = useState(18); // percent
  const [muscleMass, setMuscleMass] = useState(62); // kg
  const [waistSize, setWaistSize] = useState(32); // inches
  const [activeMuscleGroup, setActiveMuscleGroup] = useState<string | null>(null);

  // Fallback state
  const [renderMode, setRenderMode] = useState<'3d' | 'svg'>('3d');

  // Math Calculations
  const heightMeters = height / 100;
  const bmi = Number((weight / (heightMeters * heightMeters)).toFixed(1));

  // Mifflin-St Jeor Formula
  const weightFactor = 10 * weight;
  const heightFactor = 6.25 * height;
  const ageFactor = 5 * age;
  const bmr = Math.round(
    gender === 'male' 
      ? weightFactor + heightFactor - ageFactor + 5 
      : weightFactor + heightFactor - ageFactor - 161
  );

  let activityMultiplier = 1.2;
  if (activity === 'light') activityMultiplier = 1.375;
  if (activity === 'moderate') activityMultiplier = 1.55;
  if (activity === 'heavy') activityMultiplier = 1.725;

  const tdee = Math.round(bmr * activityMultiplier);
  const maintenanceCalories = tdee;

  const bodyFatMass = Number((weight * (bodyFat / 100)).toFixed(1));
  const leanMass = Number((weight - bodyFatMass).toFixed(1));

  // Target Macros
  const proteinTargetGrams = Math.round(leanMass * 2.2);
  const fatTargetCalories = maintenanceCalories * 0.25;
  const fatTargetGrams = Math.round(fatTargetCalories / 9);
  const carbCalories = maintenanceCalories - (proteinTargetGrams * 4) - fatTargetCalories;
  const carbTargetGrams = Math.round(carbCalories / 4);

  // Water Intake
  const waterIntakeLiters = Number(((weight * 0.035) + (activity === 'heavy' ? 1.0 : 0.5)).toFixed(1));

  // 3D Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  
  // Orbit navigation states
  const [isDragging, setIsDragging] = useState(false);
  const prevMousePos = useRef({ x: 0, y: 0 });

  // Initialize and scale the procedural 3D human body model
  useEffect(() => {
    if (renderMode !== '3d') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0718');
    scene.fog = new THREE.FogExp2('#0a0718', 0.12);

    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 1, 50);
    camera.position.set(0, 0.5, 5.5);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    rendererRef.current = renderer;

    // Premium PBR lighting
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.25);
    scene.add(ambientLight);

    const pointLightCyan = new THREE.PointLight('#00ffff', 2.0, 50);
    pointLightCyan.position.set(5, 5, 5);
    scene.add(pointLightCyan);

    const pointLightPurple = new THREE.PointLight('#ff00ff', 1.8, 50);
    pointLightPurple.position.set(-5, -5, -5);
    scene.add(pointLightPurple);

    // Dynamic grid overlay
    const gridHelper = new THREE.GridHelper(8, 8, '#00ffff', '#1e1b4b');
    gridHelper.position.y = -1.6;
    scene.add(gridHelper);

    // Procedural human body group
    const bodyGroup = new THREE.Group();
    modelGroupRef.current = bodyGroup;
    scene.add(bodyGroup);

    // PBR Skin materials with metalness glows
    const defaultMaterial = new THREE.MeshStandardMaterial({
      color: '#0e7490',
      roughness: 0.25,
      metalness: 0.8,
      emissive: '#0e7490',
      emissiveIntensity: 0.15
    });

    const activeMaterial = new THREE.MeshStandardMaterial({
      color: '#f43f5e',
      roughness: 0.1,
      metalness: 0.9,
      emissive: '#f43f5e',
      emissiveIntensity: 0.7
    });

    // Create segments: head, chest, waist, hips, limbs
    const headGeom = new THREE.SphereGeometry(0.35, 32, 32);
    const head = new THREE.Mesh(headGeom, defaultMaterial);
    head.position.y = 1.35;
    bodyGroup.add(head);

    const chestGeom = new THREE.CylinderGeometry(0.55, 0.45, 0.9, 16);
    const chest = new THREE.Mesh(chestGeom, activeMuscleGroup === 'chest' ? activeMaterial : defaultMaterial);
    chest.position.y = 0.65;
    bodyGroup.add(chest);

    const waistGeom = new THREE.CylinderGeometry(0.45, 0.5, 0.5, 16);
    const waist = new THREE.Mesh(waistGeom, activeMuscleGroup === 'core' ? activeMaterial : defaultMaterial);
    waist.position.y = -0.05;
    bodyGroup.add(waist);

    const hipsGeom = new THREE.SphereGeometry(0.52, 16, 16);
    const hips = new THREE.Mesh(hipsGeom, defaultMaterial);
    hips.position.y = -0.4;
    bodyGroup.add(hips);

    // Arms
    const armGeom = new THREE.CylinderGeometry(0.14, 0.1, 0.8, 8);
    const lArm = new THREE.Mesh(armGeom, activeMuscleGroup === 'arms' ? activeMaterial : defaultMaterial);
    lArm.position.set(-0.75, 0.65, 0);
    lArm.rotation.z = Math.PI / 12;
    bodyGroup.add(lArm);

    const rArm = new THREE.Mesh(armGeom, activeMuscleGroup === 'arms' ? activeMaterial : defaultMaterial);
    rArm.position.set(0.75, 0.65, 0);
    rArm.rotation.z = -Math.PI / 12;
    bodyGroup.add(rArm);

    // Legs
    const thighGeom = new THREE.CylinderGeometry(0.22, 0.18, 0.9, 8);
    const lThigh = new THREE.Mesh(thighGeom, activeMuscleGroup === 'legs' ? activeMaterial : defaultMaterial);
    lThigh.position.set(-0.3, -0.9, 0);
    bodyGroup.add(lThigh);

    const rThigh = new THREE.Mesh(thighGeom, activeMuscleGroup === 'legs' ? activeMaterial : defaultMaterial);
    rThigh.position.set(0.3, -0.9, 0);
    bodyGroup.add(rThigh);

    // Holographic Scanning Ring
    const ringGeom = new THREE.RingGeometry(0.9, 0.95, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: '#00ffff', side: THREE.DoubleSide });
    const scanningRing = new THREE.Mesh(ringGeom, ringMat);
    scanningRing.rotation.x = Math.PI / 2;
    scene.add(scanningRing);

    // Dynamic particles
    const particleCount = 30;
    const particlesGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    particlesGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMat = new THREE.PointsMaterial({ color: '#00ffff', size: 0.04 });
    const particleSystem = new THREE.Points(particlesGeom, particlesMat);
    scene.add(particleSystem);

    // Animation frame render loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // 1. Calculate dynamic scales based on biometrics inputs (Smooth Morphing)
      const fatFactor = 1 + (bodyFat - 18) * 0.015;
      const muscleFactor = 1 + (muscleMass - 62) * 0.012;
      const waistFactor = 1 + (waistSize - 32) * 0.02;

      // Chest scales with muscle factor
      chest.scale.set(muscleFactor, 1, muscleFactor);

      // Waist scales with fat and waist size parameters
      waist.scale.set(fatFactor * waistFactor, 1, fatFactor * waistFactor);
      hips.scale.set(fatFactor, fatFactor, fatFactor);

      // Arms scale with muscle mass
      lArm.scale.set(muscleFactor, 1, muscleFactor);
      rArm.scale.set(muscleFactor, 1, muscleFactor);

      // Legs scale with muscle mass
      lThigh.scale.set(muscleFactor, 1, muscleFactor);
      rThigh.scale.set(muscleFactor, 1, muscleFactor);

      // 2. Animate JARVIS holographic scanning ring
      const time = Date.now() * 0.0025;
      scanningRing.position.y = Math.sin(time) * 1.5;

      // Slowly rotate group when user is not dragging
      if (!isDragging) {
        bodyGroup.rotation.y += 0.005;
      }

      particleSystem.rotation.y += 0.002;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!canvas) return;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [renderMode, bodyFat, muscleMass, waistSize, activeMuscleGroup, isDragging]);

  const handleResetCamera = () => {
    if (modelGroupRef.current) {
      modelGroupRef.current.rotation.set(0, 0, 0);
    }
  };

  // Dragging event handlers to rotate 3D mesh manually
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    prevMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !modelGroupRef.current) return;
    const deltaX = e.clientX - prevMousePos.current.x;
    const deltaY = e.clientY - prevMousePos.current.y;

    modelGroupRef.current.rotation.y += deltaX * 0.01;
    modelGroupRef.current.rotation.x += deltaY * 0.005;

    prevMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Dynamic intake controls */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.35rem' }}>Age</label>
          <input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} className="input-futuristic" />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.35rem' }}>Gender</label>
          <select value={gender} onChange={(e) => setGender(e.target.value as 'male' | 'female')} className="input-futuristic" style={{ cursor: 'pointer' }}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.35rem' }}>Height (cm)</label>
          <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="input-futuristic" />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.35rem' }}>Weight (kg)</label>
          <input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="input-futuristic" />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.35rem' }}>Activity Factor</label>
          <select value={activity} onChange={(e) => setActivity(e.target.value)} className="input-futuristic" style={{ cursor: 'pointer' }}>
            <option value="sedentary">Sedentary (1.2)</option>
            <option value="light">Light Active (1.375)</option>
            <option value="moderate">Moderate Active (1.55)</option>
            <option value="heavy">Heavy Active (1.725)</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }} className="chat-layout-container">
        
        {/* Left: 3D / SVG Visual morph mesh container */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '440px', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Activity size={18} style={{ color: 'var(--accent-cyan)' }} /> 3D Body Telemetry Scan
            </h3>

            {/* Toggle fallback buttons */}
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                onClick={() => setRenderMode('3d')}
                className={`btn-outline ${renderMode === '3d' ? 'active' : ''}`}
                style={{ fontSize: '0.7rem', padding: '0.35rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              >
                <Monitor size={12} /> 3D PBR
              </button>
              <button
                onClick={() => setRenderMode('svg')}
                className={`btn-outline ${renderMode === 'svg' ? 'active' : ''}`}
                style={{ fontSize: '0.7rem', padding: '0.35rem 0.65rem' }}
              >
                SVG Fallback
              </button>
            </div>
          </div>

          <div style={{
            position: 'relative',
            width: '100%',
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: renderMode === '3d' ? 'grab' : 'default'
          }}
            onMouseDown={renderMode === '3d' ? handleMouseDown : undefined}
            onMouseMove={renderMode === '3d' ? handleMouseMove : undefined}
            onMouseUp={renderMode === '3d' ? handleMouseUp : undefined}
            onMouseLeave={renderMode === '3d' ? handleMouseUp : undefined}
          >
            {/* Hologram backing */}
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backgroundImage: 'radial-gradient(ellipse at center, oklch(0.75 0.22 195 / 0.04) 0%, transparent 65%)',
              pointerEvents: 'none'
            }} />

            {/* 3D WebGL Canvas Rendering */}
            {renderMode === '3d' ? (
              <div style={{ width: '100%', height: '300px', position: 'relative' }}>
                <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
                
                {/* Reset camera action */}
                <button
                  onClick={handleResetCamera}
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--foreground-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.7rem'
                  }}
                >
                  <RotateCcw size={12} /> Reset Camera
                </button>
              </div>
            ) : (
              /* Low-end SVG fallback rendering */
              <svg viewBox="0 0 100 200" style={{ width: '130px', height: '300px', zIndex: 2 }}>
                <g stroke="var(--accent-cyan)" strokeWidth="1" fill="none" opacity="0.4">
                  {Array.from({ length: 18 }).map((_, idx) => {
                    const y = 20 + idx * 10;
                    let offset = 6;
                    if (y > 45 && y < 90) {
                      offset = 6 + (bodyFat - 15) * 0.45;
                    } else if (y >= 90 && y < 140) {
                      offset = 7 + (muscleMass - 60) * 0.15;
                    }
                    const leftX = 50 - offset;
                    const rightX = 50 + offset;
                    return (
                      <line key={idx} x1={leftX} y1={y} x2={rightX} y2={y} />
                    );
                  })}
                </g>
                <line x1="50" y1="20" x2="50" y2="180" stroke="var(--accent-purple)" strokeWidth="2" opacity="0.65" strokeDasharray="3 3" />
                <path
                  d={`M 50 15 
                      C ${40 - (muscleMass - 62) * 0.1} 22, ${40 - (muscleMass - 62) * 0.15} 40, ${44 - (muscleMass - 62) * 0.1} 40 
                      C ${42 - (muscleMass - 62) * 0.1} 40, ${44 - (waistSize - 32) * 0.3} 60, ${35 - (bodyFat - 18) * 0.5} 80 
                      C ${32 - (bodyFat - 18) * 0.4} 100, ${40 - (muscleMass - 62) * 0.1} 130, 42 150 
                      L 45 190 L 55 190 L 58 150
                      C 60 130, ${68 + (bodyFat - 18) * 0.4} 100, ${65 + (bodyFat - 18) * 0.5} 80 
                      C ${56 + (waistSize - 32) * 0.3} 60, ${58 + (muscleMass - 62) * 0.1} 40, ${56 + (muscleMass - 62) * 0.1} 40 
                      C ${60 + (muscleMass - 62) * 0.15} 40, ${60 + (muscleMass - 62) * 0.1} 22, 50 15 Z`}
                  fill="none"
                  stroke="var(--accent-cyan)"
                  strokeWidth="2.5"
                  style={{ transition: 'd 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
                />
              </svg>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>
            <Sparkles size={14} style={{ color: 'var(--accent-cyan)' }} />
            <span>Holographic telemetry grid dynamically morphs matching coordinates.</span>
          </div>
        </div>

          {/* Right: Sliders Control Panel & JARVIS Telemetry cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Sliders Control Deck */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600 }}>Biometric mesh sliders</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)', marginTop: '0.25rem' }}>
                  Adjust parameters to scale 3D human model nodes.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Body Fat */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                    <span>Body Fat Ratio</span>
                    <span className="font-mono" style={{ color: 'var(--accent-purple)' }}>{bodyFat}%</span>
                  </div>
                  <input
                    type="range" min="8" max="40" value={bodyFat}
                    onChange={(e) => setBodyFat(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
                  />
                </div>

                {/* Muscle Mass */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                    <span>Muscle Mass</span>
                    <span className="font-mono" style={{ color: 'var(--accent-cyan)' }}>{muscleMass} kg</span>
                  </div>
                  <input
                    type="range" min="40" max="95" value={muscleMass}
                    onChange={(e) => setMuscleMass(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
                  />
                </div>

                {/* Waist Dimension */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                    <span>Waist Size</span>
                    <span className="font-mono" style={{ color: 'var(--accent-lime)' }}>{waistSize}"</span>
                  </div>
                  <input
                    type="range" min="26" max="44" value={waistSize}
                    onChange={(e) => setWaistSize(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-lime)', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* JARVIS Interactive Muscle Selectors buttons */}
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.85rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.5rem' }}>
                  Target Segment Highlights:
                </p>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {['chest', 'core', 'arms', 'legs'].map(g => (
                    <button
                      key={g}
                      onClick={() => setActiveMuscleGroup(activeMuscleGroup === g ? null : g)}
                      className={`btn-outline ${activeMuscleGroup === g ? 'active' : ''}`}
                      style={{ fontSize: '0.7rem', padding: '0.35rem 0.6rem', textTransform: 'capitalize' }}
                    >
                      {g} group
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick telemetry parameters indicators */}
            <div className="glass-panel" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem',
              padding: '1.25rem',
              textAlign: 'center'
            }}>
              <div>
                <p style={{ fontSize: '0.65rem', color: 'var(--foreground-muted)' }}>BMI Score</p>
                <p className="font-mono" style={{ fontSize: '1.05rem', fontWeight: 'bold' }}>{bmi}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.65rem', color: 'var(--foreground-muted)' }}>Fat Mass</p>
                <p className="font-mono" style={{ fontSize: '1.05rem', fontWeight: 'bold' }}>{bodyFatMass} kg</p>
              </div>
              <div>
                <p style={{ fontSize: '0.65rem', color: 'var(--foreground-muted)' }}>Lean Mass</p>
                <p className="font-mono" style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>{leanMass} kg</p>
              </div>
            </div>

          </div>

      </div>

      {/* Advanced Animated Diagnostics Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        {/* Maintenance / Calories specs */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 className="font-display" style={{ fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Heart size={16} style={{ color: 'var(--accent-magenta)' }} /> Energy Requirements
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--foreground-muted)' }}>BMR Baseline</span>
              <span className="font-mono" style={{ fontWeight: 'bold' }}>{bmr} kcal</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--foreground-muted)' }}>TDEE (Active Maintenance)</span>
              <span className="font-mono" style={{ fontWeight: 'bold', color: 'var(--accent-cyan)' }}>{maintenanceCalories} kcal</span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'oklch(1 0 0 / 0.05)', borderRadius: '3px', overflow: 'hidden', marginTop: '0.25rem' }}>
              <div style={{ width: `${Math.min(100, (bmr / maintenanceCalories) * 100)}%`, height: '100%', backgroundColor: 'var(--accent-magenta)', borderRadius: '3px' }} />
            </div>
          </div>
        </div>

        {/* Dynamic target macros */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 className="font-display" style={{ fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Info size={16} style={{ color: 'var(--accent-purple)' }} /> Calibrated Macronutrient Targets
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--foreground-muted)' }}>Protein (2.2g/kg lean)</span>
              <span className="font-mono" style={{ fontWeight: 'bold' }}>{proteinTargetGrams}g</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--foreground-muted)' }}>Fats (25% energy)</span>
              <span className="font-mono" style={{ fontWeight: 'bold' }}>{fatTargetGrams}g</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--foreground-muted)' }}>Carbs (Remaining balance)</span>
              <span className="font-mono" style={{ fontWeight: 'bold', color: 'var(--accent-purple)' }}>{carbTargetGrams}g</span>
            </div>
          </div>
        </div>

        {/* Hydration targets */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 className="font-display" style={{ fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Droplet size={16} style={{ color: 'var(--accent-cyan)' }} /> Optimal Water Intake
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center', flex: 1 }}>
            <div style={{ textAlign: 'center' }}>
              <p className="font-mono" style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>{waterIntakeLiters} Liters</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', marginTop: '0.25rem' }}>
                Calculated dynamic baseline water metric.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
