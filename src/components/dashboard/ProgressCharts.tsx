import { useState, useEffect, useRef } from 'react';
import { 
  Award, 
  Flame, 
  Sparkles, 
  Check, 
  Users, 
  Trophy
} from 'lucide-react';
import * as THREE from 'three';

interface Mission {
  id: string;
  task: string;
  xpReward: number;
  completed: boolean;
}

interface Achievement {
  title: string;
  description: string;
  unlocked: boolean;
  xp: number;
}

export function ProgressCharts() {
  // Gamification state
  const [xp, setXp] = useState(4200);
  const [level, setLevel] = useState(12);
  const [animationText, setAnimationText] = useState<string | null>(null);

  const [missions, setMissions] = useState<Mission[]>([
    { id: '1', task: 'Scan breakfast meal targets', xpReward: 150, completed: false },
    { id: '2', task: 'Log 2 Liters baseline water', xpReward: 100, completed: false },
    { id: '3', task: 'Complete gym pull progression sets', xpReward: 250, completed: false }
  ]);

  const achievements: Achievement[] = [
    { title: 'Metabolic Titan', description: 'Complete a calorie deficit streak for 7 consecutive days.', unlocked: true, xp: 500 },
    { title: 'Hydration Overlord', description: 'Log 3.2L of water baseline for 5 consecutive days.', unlocked: true, xp: 400 },
    { title: 'Hypertrophy Master', description: 'Achieve a progressive volume score above 20k lbs.', unlocked: false, xp: 1000 },
    { title: 'RAG Conversationalist', description: 'Initiate 10 active chat sessions with the AI Coach.', unlocked: true, xp: 300 }
  ];

  // 3D Trophy Room canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Initialize direct WebGL Three.js Trophy Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create Scene, Camera, and Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0718');

    // Soft fog
    scene.fog = new THREE.FogExp2('#0a0718', 0.15);

    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 1, 100);
    camera.position.set(0, 0, 7);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    rendererRef.current = renderer;

    // Add glowing lighting
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight('#00ffff', 1.8, 100);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const backLight = new THREE.PointLight('#ff00ff', 1.2, 100);
    backLight.position.set(-5, -5, -5);
    scene.add(backLight);

    // Procedural Trophy Group Mesh
    const trophyGroup = new THREE.Group();

    // Trophy cup cylinder
    const cupGeom = new THREE.CylinderGeometry(0.8, 0.4, 1.4, 16);
    const cupMat = new THREE.MeshStandardMaterial({
      color: '#eab308',
      metalness: 0.9,
      roughness: 0.1,
      emissive: '#eab308',
      emissiveIntensity: 0.15
    });
    const cupMesh = new THREE.Mesh(cupGeom, cupMat);
    cupMesh.position.y = 0.5;
    trophyGroup.add(cupMesh);

    // Trophy base
    const baseGeom = new THREE.BoxGeometry(1.2, 0.4, 1.2);
    const baseMat = new THREE.MeshStandardMaterial({ color: '#1e1b4b', roughness: 0.5 });
    const baseMesh = new THREE.Mesh(baseGeom, baseMat);
    baseMesh.position.y = -0.5;
    trophyGroup.add(baseMesh);

    // Trophy stem connector
    const stemGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.4, 8);
    const stemMesh = new THREE.Mesh(stemGeom, cupMat);
    stemMesh.position.y = -0.2;
    trophyGroup.add(stemMesh);

    scene.add(trophyGroup);

    // Particle ring surrounding the trophy
    const particleCount = 60;
    const particlesGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const radius = 1.6;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      positions[i * 3] = Math.sin(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
      positions[i * 3 + 2] = Math.cos(angle) * radius;
    }

    particlesGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMat = new THREE.PointsMaterial({
      color: '#00ffff',
      size: 0.08,
      transparent: true,
      opacity: 0.8
    });
    const particleSystem = new THREE.Points(particlesGeom, particlesMat);
    scene.add(particleSystem);

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Rotates group and particles
      trophyGroup.rotation.y += 0.015;
      particleSystem.rotation.y -= 0.008;

      // Pulse floating y position
      const time = Date.now() * 0.003;
      trophyGroup.position.y = Math.sin(time) * 0.15;

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
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
  }, []);

  const handleCompleteMission = (id: string, xpReward: number, task: string) => {
    // Prevent double claims
    const target = missions.find(m => m.id === id);
    if (!target || target.completed) return;

    // Toggle completed state
    setMissions(prev => prev.map(m => m.id === id ? { ...m, completed: true } : m));

    // Reward animation popup
    setAnimationText(`+${xpReward} XP earned: Completed "${task}"!`);
    setTimeout(() => {
      setAnimationText(null);
    }, 2500);

    // Calculate level ups
    setXp(prev => {
      const nextXp = prev + xpReward;
      if (nextXp >= 5000) {
        setLevel(l => l + 1);
        setAnimationText(`LEVEL UP: Welcome to Level ${level + 1}!`);
        return nextXp - 5000;
      }
      return nextXp;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Dynamic Floating Reward Notification Overlay */}
      {animationText && (
        <div className="reward-overlay-banner" style={{
          position: 'fixed',
          top: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'oklch(0.16 0.04 270 / 0.95)',
          border: '2px solid var(--accent-lime)',
          borderRadius: '16px',
          padding: '1rem 2rem',
          zIndex: 1000,
          color: 'var(--foreground)',
          fontSize: '0.95rem',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: '0 0 30px var(--accent-lime-glow)',
          animation: 'fadeInOut 2.5s ease-in-out'
        }}>
          <Sparkles size={18} style={{ color: 'var(--accent-lime)' }} />
          <span>{animationText}</span>
        </div>
      )}

      {/* Levels & XP HUD header */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', textTransform: 'uppercase' }}>
              Level Progression
            </span>
            <h3 className="font-display" style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '0.15rem' }}>
              Active Level: <span style={{ color: 'var(--accent-cyan)' }}>Level {level}</span>
            </h3>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)' }}>
            XP: <span className="font-mono" style={{ color: 'var(--accent-purple)' }}>{xp}</span> / 5000
          </span>
        </div>

        {/* Level progress bar */}
        <div style={{ width: '100%', height: '10px', backgroundColor: 'oklch(1 0 0 / 0.05)', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{
            width: `${(xp / 5000) * 100}%`,
            height: '100%',
            background: 'var(--gradient-aurora)',
            borderRadius: '5px',
            transition: 'width 0.4s ease'
          }} />
        </div>
      </div>

      {/* Layout Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }} className="chat-layout-container">
        
        {/* Left: Quests, Badges, and Leaderboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Daily Missions */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Flame size={18} style={{ color: 'var(--accent-magenta)' }} /> Daily Missions
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {missions.map((m) => (
                <div
                  key={m.id}
                  onClick={() => handleCompleteMission(m.id, m.xpReward, m.task)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.85rem',
                    borderRadius: '12px',
                    backgroundColor: m.completed ? 'var(--accent-lime-glow)' : 'oklch(1 0 0 / 0.03)',
                    border: '1px solid',
                    borderColor: m.completed ? 'var(--accent-lime)' : 'var(--border-light)',
                    cursor: m.completed ? 'default' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: '1.5px solid',
                      borderColor: m.completed ? 'var(--accent-lime)' : 'var(--foreground-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-lime)'
                    }}>
                      {m.completed && <Check size={12} />}
                    </div>
                    <span style={{ fontSize: '0.85rem', color: m.completed ? 'var(--foreground)' : 'var(--foreground)', textDecoration: m.completed ? 'line-through' : 'none' }}>
                      {m.task}
                    </span>
                  </div>
                  <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--accent-purple)' }}>+{m.xpReward} XP</span>
                </div>
              ))}
            </div>
          </div>

          {/* Badges & Achievements Grid */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '12rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Award size={18} style={{ color: 'var(--accent-purple)' }} /> Earned Achievements
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              {achievements.map((ach, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-light)',
                    backgroundColor: ach.unlocked ? 'oklch(1 0 0 / 0.04)' : 'oklch(1 0 0 / 0.01)',
                    opacity: ach.unlocked ? 1.0 : 0.45,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: ach.unlocked ? 'var(--accent-cyan)' : 'var(--foreground)' }}>
                      {ach.title}
                    </h4>
                    <span style={{ fontSize: '0.65rem', color: 'var(--foreground-muted)' }}>{ach.unlocked ? 'Unlocked' : 'Locked'}</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', lineHeight: 1.3 }}>{ach.description}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right: 3D Trophy Room & Leaderboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* 3D Trophy Room Container */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Trophy size={18} style={{ color: 'var(--accent-cyan)' }} /> 3D Trophy Room
            </h3>

            {/* Canvas wrapper */}
            <div style={{
              width: '100%',
              aspectRatio: '4/3',
              borderRadius: '12px',
              backgroundColor: '#0a0718',
              border: '1px solid var(--border-light)',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
              <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                fontSize: '0.65rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-cyan)'
              }}>
                NutriVerse METALS COLLECTION
              </div>
            </div>
          </div>

          {/* Global Leaderboard */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Users size={18} style={{ color: 'var(--accent-lime)' }} /> Global Leaderboard
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {[
                { rank: 1, name: 'Diwakar (You)', lvl: level, xp: 'Champion Node' },
                { rank: 2, name: 'NutriVerse Bot', lvl: 11, xp: 'Simulated Node' },
                { rank: 3, name: 'Garmin Node', lvl: 9, xp: 'External Node' }
              ].map((user) => (
                <div
                  key={user.rank}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    backgroundColor: user.rank === 1 ? 'oklch(1 0 0 / 0.04)' : 'transparent',
                    border: '1px solid',
                    borderColor: user.rank === 1 ? 'var(--accent-cyan)' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--foreground-muted)' }}>
                      #{user.rank}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: user.rank === 1 ? 600 : 500 }}>{user.name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-purple)', fontWeight: 'bold' }}>Lvl {user.lvl}</span>
                    <p style={{ fontSize: '0.65rem', color: 'var(--foreground-muted)' }}>{user.xp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Embedded CSS variables keyframe animations */}
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -20px); }
          15% { opacity: 1; transform: translate(-50%, 0); }
          85% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -20px); }
        }
      `}</style>

    </div>
  );
}
