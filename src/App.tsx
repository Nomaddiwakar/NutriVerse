import { useState, useEffect, lazy, Suspense } from 'react';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Camera, 
  Calendar, 
  Dumbbell, 
  TrendingUp, 
  MessageSquare, 
  Settings, 
  UserCheck, 
  CreditCard,
  ChevronRight,
  Shield,
  Activity,
  Watch,
  ClipboardList
} from 'lucide-react';
import { Scene3D } from './components/3d/Scene3D';
import { Logo } from './components/brand/Logo';

// Lazy loading heavy components for performance optimisation & code splitting
const Overview = lazy(() => import('./components/dashboard/Overview').then(m => ({ default: m.Overview })));
const FoodScanner = lazy(() => import('./components/dashboard/FoodScanner').then(m => ({ default: m.FoodScanner })));
const MealPlanner = lazy(() => import('./components/dashboard/MealPlanner').then(m => ({ default: m.MealPlanner })));
const WorkoutEngine = lazy(() => import('./components/dashboard/WorkoutEngine').then(m => ({ default: m.WorkoutEngine })));
const ProgressCharts = lazy(() => import('./components/dashboard/ProgressCharts').then(m => ({ default: m.ProgressCharts })));
const AIChatCoach = lazy(() => import('./components/dashboard/AIChatCoach').then(m => ({ default: m.AIChatCoach })));
const SettingsPanel = lazy(() => import('./components/dashboard/SettingsPanel').then(m => ({ default: m.SettingsPanel })));
const ProfileMorpher = lazy(() => import('./components/dashboard/ProfileMorpher').then(m => ({ default: m.ProfileMorpher })));
const SubscriptionPortal = lazy(() => import('./components/dashboard/SubscriptionPortal').then(m => ({ default: m.SubscriptionPortal })));
const LoginGate = lazy(() => import('./components/dashboard/LoginGate').then(m => ({ default: m.LoginGate })));
const WearableSync = lazy(() => import('./components/dashboard/WearableSync').then(m => ({ default: m.WearableSync })));
const ReportsTab = lazy(() => import('./components/dashboard/Reports').then(m => ({ default: m.Reports })));

export default function App() {
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');
  const [activeTab, setActiveTab] = useState('overview');
  const [activeSection, setActiveSection] = useState('home'); // home, dna, heart, brain
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(!!localStorage.getItem('nutriverse_jwt'));

  // Administrative path-interceptor route protection
  useEffect(() => {
    const checkAdminPath = () => {
      const path = window.location.pathname;
      if (path.startsWith('/admin')) {
        fetch(`http://localhost:5000${path}`)
          .then(res => {
            if (res.status === 403) {
              alert("Access Denied: HTTP 403 Forbidden administrative signature failure. Redirecting to home dashboard node.");
              window.history.replaceState(null, '', '/');
              setView('dashboard');
              setActiveTab('overview');
            }
          })
          .catch(() => {
            window.history.replaceState(null, '', '/');
            setView('dashboard');
            setActiveTab('overview');
          });
      }
    };
    checkAdminPath();
    window.addEventListener('popstate', checkAdminPath);
    return () => window.removeEventListener('popstate', checkAdminPath);
  }, []);

  // Monitor scroll height to transition 3D model positions on landing page
  useEffect(() => {
    if (view !== 'landing') {
      setActiveSection('dashboard');
      return;
    }

    const handleScroll = () => {
      const scrollPos = window.scrollY;
      const height = window.innerHeight;

      if (scrollPos < height * 0.8) {
        setActiveSection('home');
      } else if (scrollPos >= height * 0.8 && scrollPos < height * 1.8) {
        setActiveSection('dna');
      } else if (scrollPos >= height * 1.8 && scrollPos < height * 2.8) {
        setActiveSection('heart');
      } else {
        setActiveSection('brain');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [view]);

  const navLinks = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'scanner', label: 'AI Food Scanner', icon: Camera },
    { id: 'planner', label: 'Meal Planner', icon: Calendar },
    { id: 'workout', label: 'Workout Split', icon: Dumbbell },
    { id: 'progress', label: 'Analytics', icon: TrendingUp },
    { id: 'reports', label: 'Reports', icon: ClipboardList },
    { id: 'chat', label: 'AI Coach Chat', icon: MessageSquare },
    { id: 'profile', label: '3D Body Morpher', icon: UserCheck },
    { id: 'wearables', label: 'Wearables Sync', icon: Watch },
    { id: 'subscription', label: 'Subscriptions', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleLogout = () => {
    localStorage.removeItem('nutriverse_jwt');
    setIsAuthed(false);
    setView('landing');
  };

  const dashboardFallback = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '360px', gap: '0.85rem' }}>
      <div className="spin" style={{ width: '28px', height: '28px', border: '3px solid oklch(1 0 0 / 0.05)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>Loading Telemetry Node...</span>
    </div>
  );

  return (
    <>
      {/* Immersive 3D Space Scene Background */}
      <Scene3D section={activeSection} />
      
      {/* Ambient backdrop and scan overlay grids */}
      <div className="aurora-backdrop" />
      <div className="grid-overlay" />

      {/* Main Container */}
      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Landing Page layout */}
        {view === 'landing' && (
          <>
            {/* Elegant Fixed Header */}
            <header style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              padding: '1.25rem 2rem',
              backdropFilter: 'blur(15px)',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 100
            }}>
              <Logo size={40} showText={true} />

              {/* Navigation Actions */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <a href="#dna-section" style={{ color: 'var(--foreground-muted)', fontSize: '0.9rem', textDecoration: 'none', marginRight: '1rem' }} className="desktop-only">
                  DNA Core
                </a>
                <a href="#heart-section" style={{ color: 'var(--foreground-muted)', fontSize: '0.9rem', textDecoration: 'none', marginRight: '1rem' }} className="desktop-only">
                  HRV Telemetry
                </a>
                <a href="#brain-section" style={{ color: 'var(--foreground-muted)', fontSize: '0.9rem', textDecoration: 'none', marginRight: '1.5rem' }} className="desktop-only">
                  AI Coach
                </a>
                <button onClick={() => setView('dashboard')} className="btn-premium" style={{ fontSize: '0.85rem', padding: '0.55rem 1.5rem' }}>
                  Launch Command Center
                </button>
              </div>
            </header>

            {/* Immersive Scroll Sections */}
            <main style={{ padding: '0 2rem' }}>
              
              {/* Section 1: Hero */}
              <section id="hero-section" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '720px', paddingTop: '100px' }}>
                <div className="glass-panel" style={{ padding: '0.5rem 1.25rem', width: 'fit-content', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)', boxShadow: '0 0 10px var(--accent-cyan)' }} />
                  <span className="font-mono" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-cyan)' }}>
                    Biochemical Telemetry Active
                  </span>
                </div>
                <h1 className="font-display" style={{ fontSize: '4rem', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.03em' }}>
                  The AI-powered <span className="text-gradient">3D Health Core</span> for human performance.
                </h1>
                <p style={{ fontSize: '1.15rem', color: 'var(--foreground-muted)', marginTop: '1.5rem', lineHeight: 1.5, maxWidth: '580px' }}>
                  Integrate DNA mapping, real-time metabolic volume vision scans, and progressive overload telemetry split planning into one futuristic 3D interface.
                </p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
                  <button onClick={() => setView('dashboard')} className="btn-premium">
                    Access Dashboard Console
                  </button>
                  <a href="#dna-section" className="btn-outline" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    Deploy Diagnostic Overview <ChevronRight size={14} />
                  </a>
                </div>
              </section>

              {/* Section 2: DNA Core */}
              <section id="dna-section" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '640px' }}>
                <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  [ PHASE 01 : BIO-GENOMICS ]
                </span>
                <h2 className="font-display" style={{ fontSize: '2.8rem', fontWeight: 600, marginTop: '0.5rem', lineHeight: 1.15 }}>
                  DNA Core sequence calibration.
                </h2>
                <p style={{ fontSize: '1rem', color: 'var(--foreground-muted)', marginTop: '1.2rem', lineHeight: 1.5 }}>
                  Calibrate workout engines and custom recipe matrices matching genetic metabolic bounds. Analyze markers regulating recovery, muscle synthesis, and active dietary thresholds.
                </p>
                <div className="glass-panel" style={{ padding: '1.25rem', marginTop: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <Shield size={24} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                  <p style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)', lineHeight: 1.4 }}>
                    Secure envelope-level cryptography. Biometric sequences map exclusively on localized device storage, validated under zero-knowledge proofs.
                  </p>
                </div>
              </section>

              {/* Section 3: Heart / HRV */}
              <section id="heart-section" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', marginLeft: 'auto', maxWidth: '640px', textAlign: 'right', alignItems: 'flex-end' }}>
                <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--accent-magenta)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  [ PHASE 02 : HRV TELEMETRY ]
                </span>
                <h2 className="font-display" style={{ fontSize: '2.8rem', fontWeight: 600, marginTop: '0.5rem', lineHeight: 1.15 }}>
                  Cardiovascular overload tracking.
                </h2>
                <p style={{ fontSize: '1rem', color: 'var(--foreground-muted)', marginTop: '1.2rem', lineHeight: 1.5, maxWidth: '580px' }}>
                  Synchronize active training sets to heart rate variability dynamics. The load engines calculate muscle splits, active calorie deficits, and rest timers in real-time.
                </p>
                <div className="glass-panel" style={{ padding: '1.25rem', marginTop: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', textAlign: 'left', maxWidth: '480px' }}>
                  <Activity size={24} style={{ color: 'var(--accent-magenta)', flexShrink: 0 }} />
                  <p style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)', lineHeight: 1.4 }}>
                    Automated progression algorithms track mechanical failure (RPE metrics) to program progressive load variables without overtraining.
                  </p>
                </div>
              </section>

              {/* Section 4: Brain / AI Chat */}
              <section id="brain-section" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '640px' }}>
                <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--accent-purple)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  [ PHASE 03 : AI COHESION ]
                </span>
                <h2 className="font-display" style={{ fontSize: '2.8rem', fontWeight: 600, marginTop: '0.5rem', lineHeight: 1.15 }}>
                  RAG Performance Intelligence.
                </h2>
                <p style={{ fontSize: '1rem', color: 'var(--foreground-muted)', marginTop: '1.2rem', lineHeight: 1.5 }}>
                  Interact with an AI agent connected to biometrics and dietary logs. Ask NutriVerse to substitute menu targets, construct recipe splits, or audit workout workloads instantly.
                </p>
                <button onClick={() => setView('dashboard')} className="btn-premium" style={{ width: 'fit-content', marginTop: '2rem' }}>
                  Initialize Coach Session
                </button>
              </section>

            </main>

            {/* Immersive Footer */}
            <footer style={{
              padding: '3rem 2rem',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              alignItems: 'center',
              backgroundColor: 'oklch(0.08 0.02 270 / 0.85)',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)' }}>
                © 2026 NutriVerse 3D Health Systems Corp. Designed for high-performance telemetry.
              </p>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem' }}>
                <a href="#" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>Security Core</a>
                <a href="#" style={{ color: 'var(--foreground-muted)', textDecoration: 'none' }}>Privacy Policy</a>
                <a href="#" style={{ color: 'var(--foreground-muted)', textDecoration: 'none' }}>Developer APIs</a>
              </div>
            </footer>
          </>
        )}

        {/* Dashboard Shell layout */}
        {view === 'dashboard' && (
          <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
            
            {/* Header / Nav Shell */}
            <header style={{
              padding: '1rem 2rem',
              borderBottom: '1px solid var(--border-light)',
              backdropFilter: 'blur(15px)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'oklch(0.12 0.03 270 / 0.8)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button onClick={() => setView('landing')} style={{ background: 'none', border: 'none', color: 'var(--foreground-muted)', cursor: 'pointer', fontSize: '0.9rem', marginRight: '0.5rem' }}>
                  ← Home
                </button>
                <Logo size={32} showText={true} />
              </div>

              {/* Mobile Menu trigger */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="mobile-only" 
                style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer' }}
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              {/* Auth and Logout controllers */}
              {isAuthed && (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }} className="desktop-only">
                  <span style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>Core Node Active</span>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-lime)' }} />
                  <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--accent-magenta)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                    Log Out
                  </button>
                </div>
              )}
            </header>

            {/* Dashboard Sidebar + Content Wrap */}
            {!isAuthed ? (
              <main style={{ flex: 1, padding: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Suspense fallback={dashboardFallback}>
                  <LoginGate onLoginSuccess={() => setIsAuthed(true)} />
                </Suspense>
              </main>
            ) : (
              <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
                
                {/* Desktop/Tablet Sidebar */}
                <aside className={`desktop-only tablet-only`} style={{
                  width: '260px',
                  borderRight: '1px solid var(--border-light)',
                  backgroundColor: 'oklch(0.12 0.03 270 / 0.55)',
                  backdropFilter: 'blur(10px)',
                  padding: '1.5rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  flexShrink: 0
                }}>
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = activeTab === link.id;
                    return (
                      <button
                        key={link.id}
                        onClick={() => setActiveTab(link.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          width: '100%',
                          padding: '0.75rem 1rem',
                          borderRadius: '10px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: isActive ? 600 : 500,
                          backgroundColor: isActive ? 'oklch(1 0 0 / 0.06)' : 'transparent',
                          color: isActive ? 'var(--foreground)' : 'var(--foreground-muted)',
                          transition: 'all 0.2s ease',
                          textAlign: 'left'
                        }}
                      >
                        <Icon size={18} style={{ color: isActive ? 'var(--accent-cyan)' : 'inherit' }} />
                        <span>{link.label}</span>
                      </button>
                    );
                  })}
                </aside>

                {/* Mobile Overlay Menu */}
                {mobileMenuOpen && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'var(--bg-deep)',
                    zIndex: 50,
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    {navLinks.map((link) => {
                      const Icon = link.icon;
                      const isActive = activeTab === link.id;
                      return (
                        <button
                          key={link.id}
                          onClick={() => {
                            setActiveTab(link.id);
                            setMobileMenuOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '12px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            backgroundColor: isActive ? 'oklch(1 0 0 / 0.08)' : 'transparent',
                            color: isActive ? 'var(--foreground)' : 'var(--foreground-muted)',
                            textAlign: 'left'
                          }}
                        >
                          <Icon size={20} style={{ color: isActive ? 'var(--accent-cyan)' : 'inherit' }} />
                          <span>{link.label}</span>
                        </button>
                      );
                    })}
                    <button onClick={handleLogout} style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--accent-magenta)', color: 'var(--accent-magenta)', background: 'none', cursor: 'pointer', marginTop: '1rem', fontSize: '1rem', fontWeight: 600 }}>
                      Log Out
                    </button>
                  </div>
                )}

                {/* Central Viewport Workspace */}
                <main style={{ flex: 1, padding: '2.5rem', overflowY: 'auto', maxWidth: '100vw' }}>
                  <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <Suspense fallback={dashboardFallback}>
                      {activeTab === 'overview' && <Overview />}
                      {activeTab === 'scanner' && <FoodScanner />}
                      {activeTab === 'planner' && <MealPlanner />}
                      {activeTab === 'workout' && <WorkoutEngine />}
                      {activeTab === 'progress' && <ProgressCharts />}
                      {activeTab === 'reports' && <ReportsTab />}
                      {activeTab === 'chat' && <AIChatCoach />}
                      {activeTab === 'subscription' && <SubscriptionPortal />}
                      {activeTab === 'profile' && <ProfileMorpher />}
                      {activeTab === 'wearables' && <WearableSync />}
                      {activeTab === 'settings' && <SettingsPanel />}
                    </Suspense>
                  </div>
                </main>

              </div>
            )}

            {/* Mobile Bottom Dock Menu Navigation (Liquid Dock) */}
            {isAuthed && (
              <nav className="mobile-only" style={{
                position: 'fixed',
                bottom: '20px',
                left: '5%',
                width: '90%',
                backgroundColor: 'oklch(0.16 0.04 270 / 0.85)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--border-light)',
                borderRadius: '24px',
                padding: '0.75rem 1rem',
                display: 'flex',
                justifyContent: 'space-around',
                boxShadow: 'var(--shadow-elegant)',
                zIndex: 90
              }}>
                {navLinks.slice(0, 5).map((link) => {
                  const Icon = link.icon;
                  const isActive = activeTab === link.id;
                  return (
                    <button
                      key={link.id}
                      onClick={() => setActiveTab(link.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: isActive ? 'var(--accent-cyan)' : 'var(--foreground-muted)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.2rem'
                      }}
                      aria-label={link.label}
                    >
                      <Icon size={20} />
                      <span style={{ fontSize: '0.6rem' }}>{link.label.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </nav>
            )}

          </div>
        )}

      </div>

      {/* Embedded CSS overrides for responsive media rules */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .tablet-only { display: none !important; }
        }
        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .desktop-only { display: none !important; }
        }
      `}</style>
    </>
  );
}
