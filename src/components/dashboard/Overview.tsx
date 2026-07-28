import { useState } from 'react';
import { 
  Flame, 
  Droplet, 
  Activity, 
  Zap, 
  Heart, 
  Moon, 
  Smile, 
  TrendingUp, 
  Layers,
  ChevronRight,
  Sparkles,
  ClipboardList,
  Target,
  Award,
  Bell,
  RefreshCw
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
  color: string;
  glowColor: string;
}

function Metric3DCard({ title, value, unit, icon, color, glowColor }: MetricCardProps) {
  return (
    <div 
      className="glass-panel" 
      style={{ 
        padding: '1.25rem', 
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        cursor: 'pointer',
        boxShadow: `0 8px 32px 0 oklch(0 0 0 / 0.3)`
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 12px 40px 0 ${glowColor}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = `0 8px 32px 0 oklch(0 0 0 / 0.3)`;
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>{title}</span>
        <div style={{ 
          padding: '0.35rem', 
          borderRadius: '8px', 
          backgroundColor: glowColor, 
          color: color,
          display: 'flex'
        }}>
          {icon}
        </div>
      </div>
      <h4 className="font-display" style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0.15rem 0' }}>
        {value} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--foreground-muted)' }}>{unit}</span>
      </h4>
    </div>
  );
}

export function Overview() {
  const [waterCount, setWaterCount] = useState(5);
  const [weight, setWeight] = useState(78.2);
  const [mood, setMood] = useState('Focused');
  const [caloriesLogged, setCaloriesLogged] = useState(1480);
  const [workoutsCompleted, setWorkoutsCompleted] = useState(3);
  const [activeDurationFilter, setActiveDurationFilter] = useState<'7d' | '30d' | '90d'>('7d');

  // New Command Center telemetry states
  const [spo2, setSpo2] = useState(98);
  const [temperature, setTemperature] = useState(98.4);
  const [steps, setSteps] = useState(6450);
  const [stressScore, setStressScore] = useState(34);
  const [activeMinutes, setActiveMinutes] = useState(45);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Constants
  const heartRate = 72;
  const bloodPressure = '120/80';
  const bloodSugar = 95;
  const sleepHours = 7.4;

  // Multi-day Weight datasets filters
  const trendDataMap = {
    '7d': [
      { day: 'Mon', weight: 79.1, calories: 2100 },
      { day: 'Tue', weight: 78.8, calories: 1950 },
      { day: 'Wed', weight: 78.6, calories: 2200 },
      { day: 'Thu', weight: 78.4, calories: 1800 },
      { day: 'Fri', weight: 78.2, calories: 1900 },
      { day: 'Sat', weight: 78.3, calories: 2300 },
      { day: 'Sun', weight: 78.2, calories: caloriesLogged }
    ],
    '30d': [
      { day: 'Wk 1', weight: 80.2, calories: 2050 },
      { day: 'Wk 2', weight: 79.4, calories: 2100 },
      { day: 'Wk 3', weight: 78.8, calories: 1980 },
      { day: 'Wk 4', weight: 78.2, calories: caloriesLogged }
    ],
    '90d': [
      { day: 'Month 1', weight: 81.5, calories: 2150 },
      { day: 'Month 2', weight: 79.8, calories: 2020 },
      { day: 'Month 3', weight: 78.2, calories: caloriesLogged }
    ]
  };

  const handleWaterClick = (idx: number) => {
    setWaterCount(idx + 1);
    if (idx + 1 >= 8) {
      triggerNotification('Hydration milestone complete! 2000 ml logged.');
    }
  };

  const triggerNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const handleLogCalorie = () => {
    setCaloriesLogged(prev => {
      const next = prev + 150;
      triggerNotification('Logged 150 kcal. Calorie metrics updated.');
      return next;
    });
  };

  const handleQuickAction = (action: string) => {
    if (action === 'steps') {
      setSteps(prev => prev + 1000);
      triggerNotification('+1000 Steps logged.');
    } else if (action === 'meditation') {
      setStressScore(prev => Math.max(10, prev - 8));
      triggerNotification('Meditation completed: Stress score lowered.');
    } else if (action === 'active') {
      setActiveMinutes(prev => prev + 15);
      triggerNotification('+15 active minutes logged.');
    }
  };

  // Calculates a holistic AI Health score out of 100
  const hydrationPct = (waterCount / 8) * 100;
  const caloriePct = Math.min(100, (caloriesLogged / 2200) * 100);
  const stepsPct = Math.min(100, (steps / 10000) * 100);
  const healthScore = Math.round((hydrationPct + caloriePct + stepsPct + (100 - stressScore) + 95) / 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Dynamic Floating Notification */}
      {notificationMsg && (
        <div style={{
          position: 'fixed',
          top: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'oklch(0.16 0.04 270 / 0.95)',
          border: '2px solid var(--accent-cyan)',
          boxShadow: '0 0 25px var(--accent-cyan-glow)',
          borderRadius: '12px',
          padding: '0.85rem 1.5rem',
          color: 'var(--foreground)',
          zIndex: 1000,
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          animation: 'fadeInOut 3s ease'
        }}>
          <Bell size={16} style={{ color: 'var(--accent-cyan)' }} />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Biochemical Sync active
          </span>
          <h2 className="font-display" style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.25rem' }}>
            NutriVerse Command Center
          </h2>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '0.9rem', marginTop: '0.5rem', maxWidth: '640px' }}>
            Cardiovascular load indexes, deep hydration curves, and calorie splits are operating inside optimal boundaries.
          </p>
        </div>
        <button onClick={handleLogCalorie} className="btn-premium" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
          Quick Log Meal (+150 kcal) <ChevronRight size={14} />
        </button>
      </div>

      {/* Smart Quick Actions Section */}
      <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <button onClick={() => handleQuickAction('steps')} className="btn-outline" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          🚶 Log Steps (+1000)
        </button>
        <button onClick={() => handleQuickAction('meditation')} className="btn-outline" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          🧘 Start Meditation
        </button>
        <button onClick={() => handleQuickAction('active')} className="btn-outline" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          ⚡ Log Activity (+15m)
        </button>
        <button onClick={() => {
          setSpo2(99);
          setTemperature(98.6);
          triggerNotification('AI Health diagnostic check complete.');
        }} className="btn-outline" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-cyan)' }}>
          🤖 AI Diagnostics check
        </button>
      </div>

      {/* Main Core HUD Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '1.5rem' }} className="chat-layout-container">
        
        {/* Left: Overall Health Score Gauge */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', justifyContent: 'center' }}>
          <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem', width: '100%' }}>
            <Target size={18} style={{ color: 'var(--accent-cyan)' }} /> Overall Health Index
          </h3>

          {/* Animated Gauge */}
          <div style={{ position: 'relative', width: '140px', height: '140px' }}>
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="60" fill="none" stroke="var(--border-light)" strokeWidth="6" />
              <circle cx="70" cy="70" r="60" fill="none" stroke="var(--accent-cyan)" strokeWidth="6"
                strokeDasharray="377"
                strokeDashoffset={377 - (healthScore / 100) * 377}
                transform="rotate(-90 70 70)"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <h4 className="font-display" style={{ fontSize: '2rem', fontWeight: 800 }}>{healthScore}</h4>
              <span className="font-mono" style={{ fontSize: '0.6rem', color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                OPTIMAL
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>
            <p>Your physiological telemetry score is optimized based on hydration logs and active steps completed.</p>
          </div>
        </div>

        {/* Right: Key Vitals Subgrid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
          <Metric3DCard 
            title="Blood Glucose" value={bloodSugar} unit="mg/dL" 
            icon={<Activity size={18} />} color="var(--accent-lime)" glowColor="var(--accent-lime-glow)" 
          />
          <Metric3DCard 
            title="Blood Pressure" value={bloodPressure} unit="mmHg" 
            icon={<Layers size={18} />} color="var(--accent-cyan)" glowColor="var(--accent-cyan-glow)" 
          />
          <Metric3DCard 
            title="Oxygen Saturation" value={spo2} unit="%" 
            icon={<Zap size={18} />} color="var(--accent-cyan)" glowColor="var(--accent-cyan-glow)" 
          />
          <Metric3DCard 
            title="Core Temp" value={temperature} unit="°F" 
            icon={<RefreshCw size={18} />} color="var(--accent-purple)" glowColor="var(--accent-purple-glow)" 
          />
          <Metric3DCard 
            title="Heart Rate" value={heartRate} unit="bpm" 
            icon={<Heart size={18} />} color="var(--accent-magenta)" glowColor="var(--accent-magenta-glow)" 
          />
          <Metric3DCard 
            title="Active Minutes" value={activeMinutes} unit="mins" 
            icon={<TrendingUp size={18} />} color="var(--accent-lime)" glowColor="var(--accent-lime-glow)" 
          />
          <Metric3DCard 
            title="Current Weight" value={weight} unit="kg" 
            icon={<Activity size={18} />} color="var(--accent-cyan)" glowColor="var(--accent-cyan-glow)" 
          />
          <Metric3DCard 
            title="Resting Sleep" value={sleepHours} unit="hrs" 
            icon={<Moon size={18} />} color="var(--accent-purple)" glowColor="var(--accent-purple-glow)" 
          />
        </div>

      </div>

      {/* Main Dynamic Panel Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '1.5rem' }} className="chat-layout-container">
        
        {/* Left Side: Graphs & Hydrations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Progress Chart Panel with Duration toggles */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <TrendingUp size={18} style={{ color: 'var(--accent-cyan)' }} /> Progress Chart: Weight & Deficits
              </h3>
              
              {/* Duration filter triggers & weight controls */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input 
                  type="number" 
                  step="0.1" 
                  value={weight} 
                  onChange={(e) => setWeight(Number(e.target.value))} 
                  className="input-futuristic" 
                  style={{ width: '80px', padding: '0.25rem 0.55rem', fontSize: '0.8rem' }}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)', marginRight: '0.5rem' }}>kg</span>
                {['7d', '30d', '90d'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setActiveDurationFilter(filter as any)}
                    className={`btn-outline ${activeDurationFilter === filter ? 'active' : ''}`}
                    style={{ fontSize: '0.7rem', padding: '0.25rem 0.55rem', textTransform: 'uppercase' }}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ width: '100%', height: '220px', marginTop: '0.5rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendDataMap[activeDurationFilter]} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="var(--foreground-muted)" style={{ fontSize: '0.7rem' }} />
                  <YAxis domain={['auto', 'auto']} stroke="var(--foreground-muted)" style={{ fontSize: '0.7rem' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'oklch(0.12 0.03 270)', borderColor: 'var(--border-light)', color: 'var(--foreground)', fontSize: '0.8rem' }}
                  />
                  <Area type="monotone" dataKey="weight" stroke="var(--accent-cyan)" fillOpacity={1} fill="url(#colorWeight)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Interactive Hydration Tracker */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>Hydration Status</p>
                <h4 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  {waterCount * 250} <span style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)', fontWeight: 400 }}>/ 2000 ml</span>
                </h4>
              </div>
              <div style={{ padding: '0.45rem', borderRadius: '50%', backgroundColor: 'var(--accent-cyan-glow)', color: 'var(--accent-cyan)', display: 'flex' }}>
                <Droplet size={18} />
              </div>
            </div>

            {/* Interactive Grid Cups */}
            <div style={{ display: 'flex', gap: '0.5rem', margin: '0.75rem 0', flexWrap: 'wrap' }}>
              {Array.from({ length: 8 }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handleWaterClick(idx)}
                  style={{
                    flex: 1,
                    minWidth: '24px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: idx < waterCount ? 'var(--accent-cyan)' : 'oklch(1 0 0 / 0.05)',
                    border: '1px solid var(--border-light)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: idx < waterCount ? '0 0 10px var(--accent-cyan-glow)' : 'none'
                  }}
                  aria-label={`Log cup ${idx + 1}`}
                />
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Calories, Workouts, Achievements, Moods */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Calorie Progress Card */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>Energy Logged</span>
                <h4 className="font-display" style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.15rem' }}>
                  {caloriesLogged} <span style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)', fontWeight: 400 }}>/ 2200 kcal</span>
                </h4>
              </div>
              <div style={{ padding: '0.45rem', borderRadius: '50%', backgroundColor: 'var(--accent-magenta-glow)', color: 'var(--accent-magenta)', display: 'flex' }}>
                <Flame size={18} />
              </div>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'oklch(1 0 0 / 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, (caloriesLogged / 2200) * 100)}%`, height: '100%', backgroundColor: 'var(--accent-magenta)', borderRadius: '4px', transition: 'width 0.4s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>
              <span>{Math.round((caloriesLogged / 2200) * 100)}% Targets reached</span>
              <span>{Math.max(0, 2200 - caloriesLogged)} kcal remaining</span>
            </div>
          </div>

          {/* Holographic AI Insights Panel */}
          <div className="glass-panel" style={{
            padding: '1.5rem',
            border: '1.5px solid var(--accent-cyan)',
            backgroundColor: 'var(--accent-cyan-glow)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <h4 className="font-display" style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-cyan)' }}>
              <Sparkles size={16} /> AI Health Insights
            </h4>
            <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p>✔ Calorie intake is perfectly aligned with active BMR targets.</p>
              <p>✔ Hydration rate requires +500ml water to match step logs output.</p>
              <p>✔ Heart rate metrics show stable baseline recoveries.</p>
            </div>
          </div>

          {/* Earned Badges/Achievements HUD */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h4 className="font-display" style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Award size={16} style={{ color: 'var(--accent-lime)' }} /> Earned Achievements
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
              <div style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'oklch(1 0 0 / 0.02)' }}>
                <span style={{ fontSize: '1rem' }}>💧</span>
                <p style={{ fontSize: '0.6rem', marginTop: '0.2rem', color: 'var(--foreground-muted)' }}>Water complete</p>
              </div>
              <div style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'oklch(1 0 0 / 0.02)' }}>
                <span style={{ fontSize: '1rem' }}>🔥</span>
                <p style={{ fontSize: '0.6rem', marginTop: '0.2rem', color: 'var(--foreground-muted)' }}>Calorie target</p>
              </div>
              <div style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'oklch(1 0 0 / 0.02)' }}>
                <span style={{ fontSize: '1rem' }}>🚶</span>
                <p style={{ fontSize: '0.6rem', marginTop: '0.2rem', color: 'var(--foreground-muted)' }}>6k steps streak</p>
              </div>
            </div>
          </div>

          {/* Interactive Mood Card */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h4 className="font-display" style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Smile size={16} style={{ color: 'var(--accent-purple)' }} /> Mood tracking
            </h4>
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              {['Energetic', 'Focused', 'Calmed', 'Fatigued'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className="btn-outline"
                  style={{
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.75rem',
                    borderRadius: '8px',
                    borderColor: mood === m ? 'var(--accent-purple)' : 'var(--border-light)',
                    backgroundColor: mood === m ? 'var(--accent-purple-glow)' : 'transparent',
                    color: mood === m ? 'var(--foreground)' : 'var(--foreground-muted)'
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Chronological Activity Timeline */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h4 className="font-display" style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <ClipboardList size={16} style={{ color: 'var(--accent-cyan)' }} /> Session Log Timeline
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>
              <p>🕒 08:30 AM — Scanned Breakfast Salmon Bowl</p>
              <p>🕒 10:15 AM — Logged 1000ml Hydration Cup</p>
              <p>🕒 02:40 PM — Started Gym Chest Progression Split</p>
            </div>
          </div>

          {/* Workouts logged indicator */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h4 className="font-display" style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Moon size={16} style={{ color: 'var(--accent-lime)' }} /> Workout split targets
            </h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>Weekly active sessions:</span>
              <span className="font-mono" style={{ fontWeight: 'bold' }}>{workoutsCompleted} / 5</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button 
                onClick={() => setWorkoutsCompleted(prev => Math.min(5, prev + 1))}
                className="btn-premium" 
                style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', display: 'flex', justifyContent: 'center' }}
              >
                Log workout completion
              </button>
              <button 
                onClick={() => setWorkoutsCompleted(0)}
                className="btn-outline" 
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem' }}
              >
                Reset
              </button>
            </div>
          </div>

        </div>

      </div>

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
