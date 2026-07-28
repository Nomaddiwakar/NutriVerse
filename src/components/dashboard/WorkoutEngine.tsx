import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Calendar, 
  TrendingUp, 
  Volume2, 
  Maximize2, 
  Minimize2, 
  Activity, 
  Heart, 
  Award, 
  Info, 
  ChevronLeft
} from 'lucide-react';
import * as THREE from 'three';

interface Exercise {
  name: string;
  category: string;
  duration: number; // in seconds
  description: string;
  instructions: string[];
  mistakes: string[];
  safety: string[];
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  calBurnPerMin: number;
}

const exercisesDatabase: Exercise[] = [
  {
    name: 'Prisoner Bodyweight Squat',
    category: 'Lower Body',
    duration: 45,
    description: 'A fundamental bodyweight movement targeting the quadriceps, glutes, and core stability.',
    instructions: [
      'Place hands behind head, pull shoulders back to engage upper back.',
      'Set feet shoulder-width apart, toes pointed slightly outwards.',
      'Lower hips back and down until thighs are parallel to the floor.',
      'Drive through heels to return to standing position.'
    ],
    mistakes: ['Knees caving inwards', 'Rounding lower back', 'Heels lifting off ground'],
    safety: ['Keep chest up', 'Ensure knees track in line with toes', 'Do not bounce at the bottom'],
    primaryMuscles: ['Quadriceps', 'Gluteus Maximus'],
    secondaryMuscles: ['Hamstrings', 'Core', 'Calves'],
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    calBurnPerMin: 8
  },
  {
    name: 'Dumbbell Overhead Shoulder Press',
    category: 'Upper Body',
    duration: 40,
    description: 'An overhead compound pressing movement focusing on deltoid hypertrophy and scapular stability.',
    instructions: [
      'Sit or stand holding dumbbells at shoulder height with palms facing forward.',
      'Brace your core, keep feet firmly planted.',
      'Press dumbbells straight overhead until arms are fully locked.',
      'Lower dumbbells slowly back to shoulder height.'
    ],
    mistakes: ['Arching lower back excess', 'Flaring elbows outwards', 'Incomplete range of motion'],
    safety: ['Do not lock elbows aggressively', 'Select controlled weights', 'Keep spine neutral'],
    primaryMuscles: ['Anterior Deltoid', 'Lateral Deltoid'],
    secondaryMuscles: ['Triceps Brachii', 'Upper Trapezius', 'Core'],
    equipment: 'Dumbbells',
    difficulty: 'Intermediate',
    calBurnPerMin: 7
  },
  {
    name: 'Isometric Forearm Plank',
    category: 'Core Stability',
    duration: 60,
    description: 'A structural static core holding pose mapping global abdominal and lower back telemetry.',
    instructions: [
      'Place forearms on the floor, elbows aligned directly under shoulders.',
      'Extend legs straight back, balancing weight on toes.',
      'Form a straight line from head to heels.',
      'Squeeze core and glutes, breathing rhythmically.'
    ],
    mistakes: ['Sagging hips', 'Poking head forward', 'Holding breath'],
    safety: ['Engage scapula', 'Tuck pelvis slightly', 'Discontinue if lower back aches'],
    primaryMuscles: ['Rectus Abdominis', 'Transverse Abdominis'],
    secondaryMuscles: ['Glutes', 'Serratus Anterior', 'Quadriceps'],
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    calBurnPerMin: 5
  },
  {
    name: 'Dynamic Dumbbell Bicep Curl',
    category: 'Arm Isolation',
    duration: 35,
    description: 'An isolation curl targeting bicep peak contraction and forearm endurance splits.',
    instructions: [
      'Hold dumbbells by your sides, palms facing forward, elbows tucked.',
      'Curl weights upward, rotating wrist slightly for full squeeze.',
      'Bring weights close to shoulder height.',
      'Lower weights under slow control.'
    ],
    mistakes: ['Swinging torso for momentum', 'Elbows moving forward', 'Dropping weights fast'],
    safety: ['Maintain stable stance', 'Exhale on curl, inhale on release', 'Avoid hyperextending wrist'],
    primaryMuscles: ['Biceps Brachii'],
    secondaryMuscles: ['Brachialis', 'Brachioradialis', 'Forearms'],
    equipment: 'Dumbbells',
    difficulty: 'Beginner',
    calBurnPerMin: 6
  }
];

export function WorkoutEngine() {
  const [inWorkout, setInWorkout] = useState(false);
  const [activeExerciseIdx, setActiveExerciseIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(0.8);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Timers states
  const [countdown, setCountdown] = useState<number | null>(null);
  const [exerciseTime, setExerciseTime] = useState(0);
  const [totalWorkoutTime, setTotalWorkoutTime] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(15);

  // JARVIS biometric indicators state
  const [simulatedHr, setSimulatedHr] = useState(72);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [postureCorrectness, setPostureCorrectness] = useState(98);
  const [activeGuidance, setActiveGuidance] = useState('Engage your core.');
  const [breathingPrompt, setBreathingPrompt] = useState<'Inhale' | 'Exhale'>('Inhale');

  // Summary post workout state
  const [workoutFinished, setWorkoutFinished] = useState(false);

  // Calendar completions state
  const [completedDays, setCompletedDays] = useState<string[]>(['Mon']);

  const activeExercise = exercisesDatabase[activeExerciseIdx];

  // 3D Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const skeletonRef = useRef<THREE.Group | null>(null);

  // Sound generator parameters
  const playBeep = (freq = 440, duration = 0.15) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.frequency.value = freq;
      gainNode.gain.setValueAtTime(volume * 0.15, audioCtx.currentTime);
      
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Audio Context block:', e);
    }
  };

  // Speaks guide instructions via browser voice API
  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = volume;
    window.speechSynthesis.speak(utterance);
  };

  // Simulated live workout metrics progression
  useEffect(() => {
    if (!inWorkout || !isPlaying || isResting || workoutFinished) return;

    const interval = setInterval(() => {
      // Simulate ticking timers
      setExerciseTime(prev => {
        const next = prev + 1;
        if (next >= activeExercise.duration) {
          playBeep(880, 0.45);
          speakText('Rest period initiated.');
          setIsResting(true);
          setRestTime(15);
          return 0;
        }
        return next;
      });

      setTotalWorkoutTime(prev => prev + 1);

      // Symmetrize JARVIS parameters
      setSimulatedHr(prev => {
        const drift = Math.random() > 0.5 ? 2 : -1;
        return Math.min(168, Math.max(110, prev + drift));
      });

      setCaloriesBurned(prev => prev + activeExercise.calBurnPerMin / 60);

      setPostureCorrectness(prev => {
        const drift = (Math.random() - 0.5) * 1.5;
        return Math.min(100, Math.max(92, prev + drift));
      });

      // Update breathing prompts & floating guidance cards at intervals
      setBreathingPrompt(prev => prev === 'Inhale' ? 'Exhale' : 'Inhale');

      const guides = [
        'Keep your back straight.',
        'Avoid locking your elbows.',
        'Exhale on bicep curls contraction.',
        'Engage abdominal muscles.',
        'Keep heels locked on ground.',
        'Slow down extension movement.'
      ];
      setActiveGuidance(guides[Math.floor(Math.random() * guides.length)]);

    }, 1000);

    return () => clearInterval(interval);
  }, [inWorkout, isPlaying, isResting, activeExerciseIdx, workoutFinished]);

  // Handle rest time countdown
  useEffect(() => {
    if (!inWorkout || !isPlaying || !isResting || workoutFinished) return;

    const interval = setInterval(() => {
      setRestTime(prev => {
        if (prev <= 1) {
          setIsResting(false);
          playBeep(660, 0.3);
          // Transition next exercise
          if (activeExerciseIdx < exercisesDatabase.length - 1) {
            setActiveExerciseIdx(idx => idx + 1);
            speakText(`Up next: ${exercisesDatabase[activeExerciseIdx + 1].name}`);
          } else {
            setWorkoutFinished(true);
            setIsPlaying(false);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [inWorkout, isPlaying, isResting, activeExerciseIdx, workoutFinished]);

  // Initialize and run the Immersive 3D fitness environment inside React Effect
  useEffect(() => {
    if (!inWorkout) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Build scene, camera, renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0718');
    scene.fog = new THREE.FogExp2('#0a0718', 0.1);

    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 1, 50);
    camera.position.set(0, 0.8, 6.5);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    rendererRef.current = renderer;

    // Glowing lighting layers
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.35);
    scene.add(ambientLight);

    const frontLight = new THREE.PointLight('#00ffff', 1.8, 50);
    frontLight.position.set(3, 4, 3);
    scene.add(frontLight);

    const backLight = new THREE.PointLight('#ff00ff', 1.2, 50);
    backLight.position.set(-3, -4, -3);
    scene.add(backLight);

    // Floor hologram grid
    const grid = new THREE.GridHelper(10, 10, '#00ffff', '#1e1b4b');
    grid.position.y = -1.6;
    scene.add(grid);

    // Dynamic particles floaters
    const particleCount = 40;
    const particlesGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    particlesGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMat = new THREE.PointsMaterial({ color: '#ff00ff', size: 0.05 });
    const particleSystem = new THREE.Points(particlesGeom, particlesMat);
    scene.add(particleSystem);

    // Procedural Joint-based human skeleton hierarchy group
    const skeleton = new THREE.Group();
    skeletonRef.current = skeleton;
    scene.add(skeleton);

    // Nodes definition: head, neck, spine, hips, shoulders, elbows, hands, knees, feet
    const jointPositions = {
      head: [0, 1.2, 0],
      neck: [0, 0.9, 0],
      chest: [0, 0.6, 0],
      hips: [0, -0.1, 0],
      lShoulder: [-0.4, 0.8, 0],
      rShoulder: [0.4, 0.8, 0],
      lElbow: [-0.65, 0.45, 0],
      rElbow: [0.65, 0.45, 0],
      lHand: [-0.85, 0.15, 0],
      rHand: [0.85, 0.15, 0],
      lKnee: [-0.25, -0.7, 0],
      rKnee: [0.25, -0.7, 0],
      lFoot: [-0.25, -1.4, 0],
      rFoot: [0.25, -1.4, 0]
    };

    const jointMeshes: Record<string, THREE.Mesh> = {};
    const sphereGeom = new THREE.SphereGeometry(0.08, 16, 16);
    
    // Glowing standard material mapping activated muscle telemetry
    const jointMaterial = new THREE.MeshStandardMaterial({
      color: '#00ffff',
      metalness: 0.9,
      roughness: 0.1,
      emissive: '#00ffff',
      emissiveIntensity: 0.6
    });

    Object.entries(jointPositions).forEach(([name, pos]) => {
      const mesh = new THREE.Mesh(sphereGeom, jointMaterial);
      mesh.position.set(pos[0], pos[1], pos[2]);
      skeleton.add(mesh);
      jointMeshes[name] = mesh;
    });

    // Bone connectors links definitions
    const bonePairs = [
      ['head', 'neck'],
      ['neck', 'chest'],
      ['chest', 'hips'],
      ['chest', 'lShoulder'],
      ['chest', 'rShoulder'],
      ['lShoulder', 'lElbow'],
      ['rShoulder', 'rElbow'],
      ['lElbow', 'lHand'],
      ['rElbow', 'rHand'],
      ['hips', 'lKnee'],
      ['hips', 'rKnee'],
      ['lKnee', 'lFoot'],
      ['rKnee', 'rFoot']
    ];

    const boneLines: THREE.Line[] = [];
    bonePairs.forEach(() => {
      const lineGeom = new THREE.BufferGeometry();
      const points = [new THREE.Vector3(), new THREE.Vector3()];
      lineGeom.setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({ color: '#8b5cf6', linewidth: 3 });
      const line = new THREE.Line(lineGeom, lineMat);
      skeleton.add(line);
      boneLines.push(line);
    });

    // Animation frame loops
    let animationFrameId: number;
    let frame = 0;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (isPlaying && !isResting) {
        frame += 0.05 * playbackSpeed;
      }

      // Calculate periodic skeletal joint animations based on selected exercise
      const cycle = Math.sin(frame);

      if (activeExerciseIdx === 0) {
        // Squats animation
        const squatY = Math.max(-0.6, cycle * 0.5);
        
        // Hips, knees and chest lower
        jointMeshes['hips'].position.y = -0.1 + squatY * 0.6;
        jointMeshes['chest'].position.y = 0.6 + squatY * 0.5;
        jointMeshes['neck'].position.y = 0.9 + squatY * 0.5;
        jointMeshes['head'].position.y = 1.2 + squatY * 0.5;

        jointMeshes['lShoulder'].position.y = 0.8 + squatY * 0.5;
        jointMeshes['rShoulder'].position.y = 0.8 + squatY * 0.5;

        // Knees bend slightly outward
        jointMeshes['lKnee'].position.y = -0.7 + squatY * 0.25;
        jointMeshes['lKnee'].position.x = -0.25 + squatY * 0.05;
        jointMeshes['rKnee'].position.y = -0.7 + squatY * 0.25;
        jointMeshes['rKnee'].position.x = 0.25 - squatY * 0.05;

        // Prisoner posture: hands locked behind head
        jointMeshes['lElbow'].position.set(-0.35, 1.1 + squatY * 0.5, 0.2);
        jointMeshes['rElbow'].position.set(0.35, 1.1 + squatY * 0.5, 0.2);
        jointMeshes['lHand'].position.set(-0.15, 1.2 + squatY * 0.5, 0.1);
        jointMeshes['rHand'].position.set(0.15, 1.2 + squatY * 0.5, 0.1);

      } else if (activeExerciseIdx === 1) {
        // Shoulder Overhead Press
        const pressY = (Math.sin(frame) + 1) * 0.55; // 0 to 1

        // Hips/legs static standing
        jointMeshes['hips'].position.y = -0.1;
        jointMeshes['lKnee'].position.set(-0.25, -0.7, 0);
        jointMeshes['rKnee'].position.set(0.25, -0.7, 0);

        // Hands/elbows move up and down overhead
        jointMeshes['lElbow'].position.set(-0.55, 0.6 + pressY * 0.35, 0);
        jointMeshes['rElbow'].position.set(0.55, 0.6 + pressY * 0.35, 0);
        jointMeshes['lHand'].position.set(-0.55, 0.8 + pressY * 0.75, 0);
        jointMeshes['rHand'].position.set(0.55, 0.8 + pressY * 0.75, 0);

      } else if (activeExerciseIdx === 2) {
        // Forearm Plank
        // Rotate entire skeleton to horizontal orientation
        skeleton.rotation.z = Math.PI / 2;
        skeleton.position.set(0, -0.4, 0);

        // Slight breathing cycle pulse
        const breath = Math.sin(frame) * 0.03;
        jointMeshes['chest'].position.y = 0.6 + breath;
        jointMeshes['hips'].position.y = -0.1 + breath * 0.5;

      } else if (activeExerciseIdx === 3) {
        // Bicep Curls
        const curlCycle = (Math.sin(frame) + 1) * 0.5; // 0 to 1

        skeleton.rotation.z = 0;
        skeleton.position.set(0, 0, 0);
        jointMeshes['hips'].position.y = -0.1;
        jointMeshes['lKnee'].position.set(-0.25, -0.7, 0);
        jointMeshes['rKnee'].position.set(0.25, -0.7, 0);

        // Elbows locked at side, hand forearm rotates curl upwards
        jointMeshes['lElbow'].position.set(-0.45, 0.45, 0);
        jointMeshes['rElbow'].position.set(0.45, 0.45, 0);

        jointMeshes['lHand'].position.set(-0.45, 0.45 + (1 - curlCycle) * -0.3 + curlCycle * 0.3, curlCycle * 0.2);
        jointMeshes['rHand'].position.set(0.45, 0.45 + (1 - curlCycle) * -0.3 + curlCycle * 0.3, curlCycle * 0.2);
      }

      // Update bone lines buffer coordinates
      bonePairs.forEach((pair, idx) => {
        const line = boneLines[idx];
        const j1 = jointMeshes[pair[0]];
        const j2 = jointMeshes[pair[1]];
        if (line && j1 && j2) {
          const positions = line.geometry.attributes.position.array as Float32Array;
          positions[0] = j1.position.x;
          positions[1] = j1.position.y;
          positions[2] = j1.position.z;
          positions[3] = j2.position.x;
          positions[4] = j2.position.y;
          positions[5] = j2.position.z;
          line.geometry.attributes.position.needsUpdate = true;
        }
      });

      // Slowly rotate skeleton for visual engagement
      if (!isFullscreen) {
        skeleton.rotation.y = Math.sin(frame * 0.15) * 0.35;
      }

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

    // Cleanups
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [inWorkout, activeExerciseIdx, isPlaying, isResting]);

  const handleStartWorkout = () => {
    setCountdown(5);
    speakText('Starting countdown. Five, four, three, two, one.');
    playBeep(440, 0.1);

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timer);
          setInWorkout(true);
          setIsPlaying(true);
          setActiveExerciseIdx(0);
          setExerciseTime(0);
          setTotalWorkoutTime(0);
          setCaloriesBurned(0);
          setWorkoutFinished(false);
          speakText(`Begin: ${exercisesDatabase[0].name}`);
          return null;
        }
        playBeep(440, 0.1);
        return prev - 1;
      });
    }, 1000);
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleDayCheck = (day: string) => {
    setCompletedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  // Determine active muscle telemetry color tags
  const getMuscleColor = (muscle: string) => {
    const active = activeExercise.primaryMuscles.includes(muscle);
    const secondary = activeExercise.secondaryMuscles.includes(muscle);

    if (active) return { text: 'Red (Maximum)', cssColor: 'var(--accent-magenta)' };
    if (secondary) return { text: 'Orange (High)', cssColor: 'orange' };
    return { text: 'Green (Active)', cssColor: 'var(--accent-lime)' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. Countdown Overlay Banner */}
      {countdown !== null && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'oklch(0.08 0.02 270 / 0.95)',
          zIndex: 1100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem'
        }}>
          <span className="font-mono" style={{ fontSize: '1rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            Calibrating telemetry coordinates...
          </span>
          <h2 className="font-display" style={{ fontSize: '8rem', fontWeight: 800, color: 'var(--foreground)' }}>
            {countdown}
          </h2>
        </div>
      )}

      {/* 2. Primary Layout Switcher */}
      {!inWorkout ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }} className="chat-layout-container">
          
          {/* Left panel: Catalog overview */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                AI Workout Core
              </span>
              <h3 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.15rem' }}>
                Active Progression Routines
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {exercisesDatabase.map((ex, idx) => (
                <div key={idx} style={{
                  padding: '1.2rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)',
                  backgroundColor: 'oklch(1 0 0 / 0.02)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--accent-purple)', textTransform: 'uppercase' }}>
                      {ex.category} • {ex.difficulty}
                    </span>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0.15rem 0' }}>{ex.name}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>Duration: {ex.duration}s | Equip: {ex.equipment}</p>
                  </div>
                  <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
                    ~{ex.calBurnPerMin * (ex.duration / 60)} kcal
                  </span>
                </div>
              ))}
            </div>

            <button onClick={handleStartWorkout} className="btn-premium" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.45rem', marginTop: '0.5rem' }}>
              Deploy Live Workout Player <Play size={16} />
            </button>
          </div>

          {/* Right panel: Calendar progress */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Weekly checklist */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Calendar size={18} style={{ color: 'var(--accent-cyan)' }} /> Training Split Calendar
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.45rem', textAlign: 'center' }}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                  const done = completedDays.includes(day);
                  return (
                    <div
                      key={day}
                      onClick={() => handleDayCheck(day)}
                      style={{
                        padding: '0.65rem 0.25rem',
                        borderRadius: '10px',
                        border: '1.5px solid',
                        borderColor: done ? 'var(--accent-cyan)' : 'var(--border-light)',
                        backgroundColor: done ? 'var(--accent-cyan-glow)' : 'oklch(1 0 0 / 0.02)',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      <p style={{ fontWeight: 'bold' }}>{day}</p>
                      <span style={{ fontSize: '0.55rem', color: 'var(--foreground-muted)' }}>{done ? '✓' : '—'}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Performance telemetry diagnostics */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <TrendingUp size={18} style={{ color: 'var(--accent-purple)' }} /> Diagnostics Stats
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-light)', backgroundColor: 'oklch(1 0 0 / 0.02)' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--foreground-muted)' }}>Total active volume</span>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>18,450 lbs</h4>
                </div>
                <div style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-light)', backgroundColor: 'oklch(1 0 0 / 0.02)' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--foreground-muted)' }}>HRV recovery rate</span>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>94 ms</h4>
                </div>
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* Immersive Workout Player View (Dashboard Transformation) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Top segment buttons and status headers */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => {
                setInWorkout(false);
                setIsPlaying(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'none',
                border: 'none',
                color: 'var(--foreground-muted)',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              <ChevronLeft size={16} /> Return to Catalog
            </button>

            {isResting && (
              <span className="font-mono" style={{ fontSize: '0.8rem', color: 'orange', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                ★ REST TIMER SPEED ACTIVE: {restTime}s
              </span>
            )}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isFullscreen ? '1fr' : '1.3fr 1fr',
            gap: '1.5rem'
          }}>
            
            {/* Left: 3D Animation Viewer & Player Controllers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div className="glass-panel" style={{
                padding: '1.5rem',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                minHeight: '400px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                      {activeExercise.category} • Immersive 3D HUD
                    </span>
                    <h3 className="font-display" style={{ fontSize: '1.4rem', fontWeight: 700 }}>{activeExercise.name}</h3>
                  </div>

                  {/* Breathing prompt flashing tag */}
                  <span className="font-mono" style={{
                    fontSize: '0.75rem',
                    color: 'var(--accent-cyan)',
                    border: '1.5px solid var(--accent-cyan)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    animation: 'pulse-glow 2s infinite'
                  }}>
                    BREATHING: {breathingPrompt}
                  </span>
                </div>

                {/* WebGL Canvas holding rotatable skeleton meshes */}
                <div style={{
                  flex: 1,
                  backgroundColor: '#0a0718',
                  borderRadius: '16px',
                  border: '1px solid var(--border-light)',
                  overflow: 'hidden',
                  position: 'relative',
                  minHeight: '280px'
                }}>
                  <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

                  {/* Floating AI Guidance alerts cards */}
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    right: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    pointerEvents: 'none'
                  }}>
                    <div className="glass-panel" style={{
                      padding: '0.65rem 1rem',
                      alignSelf: 'flex-start',
                      borderLeft: '3px solid var(--accent-cyan)',
                      fontSize: '0.75rem',
                      color: 'var(--foreground)',
                      animation: 'fadeInOut 4s infinite'
                    }}>
                      💬 AI Guidance: {activeGuidance}
                    </div>
                  </div>

                  {/* Right side floating JARVIS telemetry card */}
                  <div style={{
                    position: 'absolute',
                    bottom: '15px',
                    right: '15px',
                    backgroundColor: 'rgba(10, 7, 24, 0.85)',
                    border: '1.5px solid var(--accent-purple)',
                    borderRadius: '12px',
                    padding: '0.85rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.65rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}>
                    <p style={{ color: 'var(--accent-purple)', fontWeight: 'bold' }}>JARVIS TELEMETRY</p>
                    <p>HEART RATE: <span style={{ color: 'var(--accent-magenta)' }}>{simulatedHr} BPM</span></p>
                    <p>POSTURE: <span style={{ color: 'var(--accent-cyan)' }}>{postureCorrectness.toFixed(1)}%</span></p>
                    <p>CALORIES: <span style={{ color: 'var(--accent-magenta)' }}>{caloriesBurned.toFixed(1)} kcal</span></p>
                    <p>STABLE SCALE: ACTIVE</p>
                  </div>
                </div>

                {/* Live Workout controls HUD panel */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  borderTop: '1px solid var(--border-light)',
                  paddingTop: '1rem'
                }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      onClick={() => {
                        if (activeExerciseIdx > 0) {
                          setActiveExerciseIdx(idx => idx - 1);
                          setExerciseTime(0);
                        }
                      }}
                      className="btn-outline"
                      style={{ padding: '0.5rem' }}
                      title="Previous"
                    >
                      ⏮
                    </button>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="btn-premium"
                      style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      {isPlaying ? <Pause size={14} /> : <Play size={14} />} {isPlaying ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={() => {
                        if (activeExerciseIdx < exercisesDatabase.length - 1) {
                          setActiveExerciseIdx(idx => idx + 1);
                          setExerciseTime(0);
                        }
                      }}
                      className="btn-outline"
                      style={{ padding: '0.5rem' }}
                      title="Next"
                    >
                      ⏭
                    </button>
                    <button
                      onClick={() => {
                        setExerciseTime(0);
                        setTotalWorkoutTime(0);
                        setCaloriesBurned(0);
                      }}
                      className="btn-outline"
                      style={{ padding: '0.5rem' }}
                      title="Restart"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>

                  {/* Extra options controls */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {/* Speed controllers */}
                    <select
                      value={playbackSpeed}
                      onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                      className="input-futuristic"
                      style={{ cursor: 'pointer', fontSize: '0.75rem', width: '70px', padding: '0.25rem' }}
                    >
                      <option value={0.5}>0.5x</option>
                      <option value={1}>1.0x</option>
                      <option value={1.5}>1.5x</option>
                      <option value={2}>2.0x</option>
                    </select>

                    {/* Volume controllers */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Volume2 size={16} style={{ color: 'var(--foreground-muted)' }} />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        style={{ width: '60px', accentColor: 'var(--accent-cyan)' }}
                      />
                    </div>

                    <button onClick={handleToggleFullscreen} className="btn-outline" style={{ padding: '0.5rem' }}>
                      {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* Right: Biometric telemetry HUD grids */}
            {!isFullscreen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* 1. Timers HUD Panel */}
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Activity size={18} style={{ color: 'var(--accent-cyan)' }} /> Session Timers
                  </h3>

                  <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--foreground-muted)' }}>Exercise</span>
                      <h4 className="font-mono" style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
                        {activeExercise.duration - exerciseTime}s
                      </h4>
                    </div>

                    {/* Circular Animated Progress Ring */}
                    <div style={{ position: 'relative', width: '70px', height: '70px' }}>
                      <svg width="70" height="70" viewBox="0 0 70 70">
                        <circle cx="35" cy="35" r="30" fill="none" stroke="var(--border-light)" strokeWidth="4" />
                        <circle cx="35" cy="35" r="30" fill="none" stroke="var(--accent-cyan)" strokeWidth="4"
                          strokeDasharray="188.4"
                          strokeDashoffset={188.4 - (exerciseTime / activeExercise.duration) * 188.4}
                          transform="rotate(-90 35 35)"
                          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                        />
                      </svg>
                      <span className="font-mono" style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}>
                        {Math.round((exerciseTime / activeExercise.duration) * 100)}%
                      </span>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--foreground-muted)' }}>Total Session</span>
                      <h4 className="font-mono" style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                        {Math.floor(totalWorkoutTime / 60)}:{totalWorkoutTime % 60 < 10 ? '0' : ''}{totalWorkoutTime % 60}
                      </h4>
                    </div>
                  </div>
                </div>

                {/* 2. Muscle Activation HUD Map */}
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Heart size={18} style={{ color: 'var(--accent-magenta)' }} /> Muscle Activation Telemetry
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {activeExercise.primaryMuscles.map(m => {
                      const data = getMuscleColor(m);
                      return (
                        <div key={m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                          <span style={{ fontWeight: 600 }}>{m}</span>
                          <span style={{ color: data.cssColor, fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                            {data.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Instructions & Mistakes Panel */}
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Info size={18} style={{ color: 'var(--accent-purple)' }} /> Safety & Tips
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p style={{ fontWeight: 600, color: 'var(--foreground)' }}>Common mistakes to avoid:</p>
                    <ul style={{ paddingLeft: '1rem' }}>
                      {activeExercise.mistakes.map((mis, idx) => (
                        <li key={idx}>{mis}</li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Post Workout Summary overlay panel */}
          {workoutFinished && (
            <div style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'oklch(0.08 0.02 270 / 0.96)',
              zIndex: 1200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem'
            }}>
              <div className="glass-panel" style={{
                maxWidth: '500px',
                width: '100%',
                padding: '2.5rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                textAlign: 'center',
                boxShadow: '0 0 35px var(--accent-lime-glow)'
              }}>
                <div style={{ display: 'inline-flex', alignSelf: 'center', padding: '0.65rem', borderRadius: '50%', backgroundColor: 'var(--accent-lime-glow)', color: 'var(--accent-lime)' }}>
                  <Award size={32} />
                </div>

                <div>
                  <h3 className="font-display" style={{ fontSize: '1.8rem', fontWeight: 700 }}>Workout Completed!</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)' }}>Session telemetry recorded in database ledger.</p>
                </div>

                {/* Summary numbers */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)', padding: '1rem 0' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--foreground-muted)' }}>Duration</span>
                    <h4 className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>
                      {Math.floor(totalWorkoutTime / 60)}m {totalWorkoutTime % 60}s
                    </h4>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--foreground-muted)' }}>Est. Burned</span>
                    <h4 className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--accent-lime)' }}>
                      {caloriesBurned.toFixed(1)} kcal
                    </h4>
                  </div>
                </div>

                <div style={{ textAlign: 'left', fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>
                  <p style={{ fontWeight: 600, color: 'var(--foreground)', marginBottom: '0.25rem' }}>Recovery Guidelines:</p>
                  <p>Incorporate static hamstring and deltoid stretches for 5 minutes. Drink 500ml water within 20 minutes to replenish baseline telemetry.</p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      setInWorkout(false);
                      setWorkoutFinished(false);
                    }}
                    className="btn-premium"
                    style={{ flex: 1 }}
                  >
                    Save & Finish
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* Slide alerts fade keyframes */}
      <style>{`
        @keyframes fadeInOut {
          0%, 100% { opacity: 0; transform: translateY(-5px); }
          15%, 85% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

    </div>
  );
}
