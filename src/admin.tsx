import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Server, 
  Users, 
  ShieldAlert, 
  Settings, 
  Terminal, 
  DollarSign, 
  Database, 
  AlertOctagon,
  LogOut,
  Sliders,
  TrendingUp,
  Cpu,
  BarChart3,
  Bookmark,
  Bell,
  Download,
  MessageSquare,
  LifeBuoy,
  FileCode,
  Layers,
  FileText,
  Save,
  Trash2,
  Edit2,
  ShieldCheck,
  CheckCircle,
  FileUp,
  FolderOpen
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import './index.css';

// Interfaces
interface UserItem {
  email: string;
  provider: string;
  joinedAt: string;
  tier: string;
  status: 'Active' | 'Suspended';
  role: string;
}

interface FoodItem {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface WorkoutItem {
  id: number;
  name: string;
  level: string;
  duration: string;
}

interface RecipeItem {
  id: number;
  title: string;
  description: string;
  calories: number;
  protein: number;
  cookingTime: string;
  instructions: string[];
}

interface SupportTicket {
  id: number;
  email: string;
  subject: string;
  message: string;
  priority: string;
  status: 'Open' | 'Closed';
  createdAt: string;
  response?: string;
}

interface FeedbackItem {
  id: number;
  email: string;
  comment: string;
  rating: number;
  sentiment: string;
  date: string;
}

interface AdCampaign {
  id: number;
  campaignName: string;
  bannerUrl: string;
  destinationUrl: string;
  impressions: number;
  clicks: number;
  active: boolean;
}

interface AuditLog {
  timestamp: string;
  email: string;
  action: string;
  ip: string;
  status: string;
  details: string;
}

const COLORS = ['#00C49F', '#FFBB28', '#FF8042', '#0088FE', '#8884d8'];

function AdminApp() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  

  // Tab routing
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'users' | 'premium' | 'analytics' | 'revenue' | 'ai-analytics' | 
    'food-db' | 'workout-lib' | 'recipe-mgr' | 'notifications' | 'reports' | 'feedback' | 
    'support' | 'ads' | 'cms' | 'files' | 'backup' | 'audit' | 'security' | 'settings'
  >('dashboard');

  // Sub-routing for dedicated settings panel
  const [settingsSubTab, setSettingsSubTab] = useState<
    'general' | 'ai' | 'auth' | 'database' | 'payments' | 'security' | 'notifications' | 'analytics' | 'connected'
  >('general');

  // Stats & States
  const [stats, setStats] = useState<any>({
    summary: { totalUsers: 0, activeSubs: 0, suspendedUsers: 0, revenueMRR: 0, revenueLTV: 0, aiTokensCount: 0, aiVisionCalls: 0, avgResponseTimeMs: 0 },
    nodes: []
  });
  const [users, setUsers] = useState<UserItem[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutItem[]>([]);
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [filesList, setFilesList] = useState<any[]>([]);
  const [backupsList, setBackupsList] = useState<string[]>([]);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Form states for creation
  const [foodForm, setFoodForm] = useState<Partial<FoodItem>>({});
  const [editingFoodId, setEditingFoodId] = useState<number | null>(null);
  const [workoutForm, setWorkoutForm] = useState<Partial<WorkoutItem>>({});
  const [editingWorkoutId, setEditingWorkoutId] = useState<number | null>(null);
  const [recipeForm, setRecipeForm] = useState<Partial<RecipeItem>>({});
  const [editingRecipeId, setEditingRecipeId] = useState<number | null>(null);
  
  const [ticketResponse, setTicketResponse] = useState<Record<number, string>>({});
  const [adForm, setAdForm] = useState<Partial<AdCampaign>>({});
  const [editingAdId, setEditingAdId] = useState<number | null>(null);
  const [announcementMsg, setAnnouncementMsg] = useState('');

  // Fetch utilities wrapping credentials
  const fetchSecure = async (url: string, options: RequestInit = {}) => {
    const API_BASE = `http://${window.location.hostname}:5000`;
    const targetUrl = url.replace('http://localhost:5000', API_BASE);
    const activeCsrf = localStorage.getItem('nutriverse_csrf') || '';
    const headers = {
      'Content-Type': 'application/json',
      'X-CSRF-Token': activeCsrf,
      ...options.headers,
    };
    
    // Ensure credentials: 'include' is passed to fetch the HTTP-only cookies
    const res = await fetch(targetUrl, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (res.status === 401) {
      // Session expired
      setIsAuthed(false);
      localStorage.removeItem('nutriverse_csrf');
    }
    
    return res;
  };

  const triggerNotify = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  // Verify auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetchSecure('http://localhost:5000/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.role === 'SUPER_ADMIN') {
            setIsAuthed(true);
          } else {
            setIsAuthed(false);
          }
        } else {
          setIsAuthed(false);
        }
      } catch (err) {
        console.warn("Auth server down:", err);
        setIsAuthed(false);
      } finally {
        setIsLoadingAuth(false);
      }
    };
    checkAuth();
  }, []);

  // Load active tab data
  useEffect(() => {
    if (!isAuthed) return;
    
    const loadData = async () => {
      try {
        if (activeTab === 'dashboard') {
          const res = await fetchSecure('http://localhost:5000/api/admin/stats');
          if (res.ok) {
            const data = await res.json();
            setStats(data);
          }
        }
        if (activeTab === 'users') {
          const res = await fetchSecure('http://localhost:5000/api/admin/users');
          if (res.ok) setUsers(await res.json());
        }
        if (activeTab === 'food-db') {
          const res = await fetchSecure('http://localhost:5000/api/admin/food');
          if (res.ok) setFoods(await res.json());
        }
        if (activeTab === 'workout-lib') {
          const res = await fetchSecure('http://localhost:5000/api/admin/workouts');
          if (res.ok) setWorkouts(await res.json());
        }
        if (activeTab === 'recipe-mgr') {
          const res = await fetchSecure('http://localhost:5000/api/admin/recipes');
          if (res.ok) setRecipes(await res.json());
        }
        if (activeTab === 'support') {
          const res = await fetchSecure('http://localhost:5000/api/admin/tickets');
          if (res.ok) setTickets(await res.json());
        }
        if (activeTab === 'feedback') {
          const res = await fetchSecure('http://localhost:5000/api/admin/feedback');
          if (res.ok) setFeedbacks(await res.json());
        }
        if (activeTab === 'ads') {
          const res = await fetchSecure('http://localhost:5000/api/admin/ads');
          if (res.ok) setAds(await res.json());
        }
        if (activeTab === 'settings') {
          const res = await fetchSecure('http://localhost:5000/api/admin/settings');
          if (res.ok) setSettings(await res.json());
        }
        if (activeTab === 'files') {
          const res = await fetchSecure('http://localhost:5000/api/admin/files');
          if (res.ok) setFilesList(await res.json());
        }
        if (activeTab === 'backup') {
          const res = await fetchSecure('http://localhost:5000/api/admin/database/backups');
          if (res.ok) setBackupsList(await res.json());
        }
        if (activeTab === 'audit') {
          const res = await fetchSecure('http://localhost:5000/api/admin/audit-logs');
          if (res.ok) setAuditLogs(await res.json());
        }
      } catch (err) {
        console.error("Failed to load admin module data:", err);
      }
    };
    loadData();
  }, [activeTab, isAuthed]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const API_BASE = `http://${window.location.hostname}:5000`;
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      const data = await response.json();
      if (!response.ok) {
        setLoginError(data.error || 'Invalid credentials.');
        return;
      }

      if (data.role !== 'SUPER_ADMIN') {
        setLoginError('Access denied. Administrative authority required.');
        return;
      }

      localStorage.setItem('nutriverse_csrf', data.csrfToken);
      setIsAuthed(true);
      setIsLoadingAuth(false);
      setLoginError(null);
    } catch (err) {
      setLoginError('Error connecting to backend SaaS authorization nodes.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetchSecure('http://localhost:5000/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn("Logout request skipped on connection fail.");
    }
    localStorage.removeItem('nutriverse_csrf');
    setIsAuthed(false);
  };

  // User status update
  const handleToggleSuspension = async (userEmail: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    const res = await fetchSecure('http://localhost:5000/api/admin/users/status', {
      method: 'POST',
      body: JSON.stringify({ email: userEmail, status: nextStatus })
    });
    if (res.ok) {
      setUsers(await res.json().then(d => d.users));
      triggerNotify(`User ${userEmail} suspension toggled.`);
    }
  };

  const handleDeleteUser = async (userEmail: string) => {
    if (!confirm(`Are you absolutely sure you want to delete user ${userEmail}?`)) return;
    const res = await fetchSecure(`http://localhost:5000/api/admin/users/${userEmail}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      setUsers(await res.json().then(d => d.users));
      triggerNotify(`User ${userEmail} deleted successfully.`);
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  const handleUserRoleUpgrade = async (userEmail: string, currentRole: string) => {
    const nextRole = currentRole === 'SUPER_ADMIN' ? 'USER' : 'SUPER_ADMIN';
    const nextTier = nextRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Free Plan';
    const res = await fetchSecure('http://localhost:5000/api/admin/users/role', {
      method: 'POST',
      body: JSON.stringify({ email: userEmail, role: nextRole, tier: nextTier })
    });
    if (res.ok) {
      setUsers(await res.json().then(d => d.users));
      triggerNotify(`User ${userEmail} role modified.`);
    }
  };

  // Settings Save
  const handleSaveSettings = async () => {
    const res = await fetchSecure('http://localhost:5000/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    });
    if (res.ok) {
      const data = await res.json();
      setSettings(data.settings);
      triggerNotify("Administrative configurations saved and calibrated.");
    }
  };

  // CRUD handlers: Food
  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingFoodId 
      ? `http://localhost:5000/api/admin/food/${editingFoodId}` 
      : 'http://localhost:5000/api/admin/food';
    const method = editingFoodId ? 'PUT' : 'POST';

    const res = await fetchSecure(url, {
      method,
      body: JSON.stringify(foodForm)
    });
    if (res.ok) {
      setFoods(await res.json().then(d => d.foodItems));
      setFoodForm({});
      setEditingFoodId(null);
      triggerNotify("Food item saved in index.");
    }
  };

  const handleDeleteFood = async (id: number) => {
    const res = await fetchSecure(`http://localhost:5000/api/admin/food/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setFoods(await res.json().then(d => d.foodItems));
      triggerNotify("Food item deleted.");
    }
  };

  // CRUD handlers: Workouts
  const handleSaveWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingWorkoutId 
      ? `http://localhost:5000/api/admin/workouts/${editingWorkoutId}` 
      : 'http://localhost:5000/api/admin/workouts';
    const method = editingWorkoutId ? 'PUT' : 'POST';

    const res = await fetchSecure(url, {
      method,
      body: JSON.stringify(workoutForm)
    });
    if (res.ok) {
      setWorkouts(await res.json().then(d => d.workoutItems));
      setWorkoutForm({});
      setEditingWorkoutId(null);
      triggerNotify("Workout template saved.");
    }
  };

  const handleDeleteWorkout = async (id: number) => {
    const res = await fetchSecure(`http://localhost:5000/api/admin/workouts/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setWorkouts(await res.json().then(d => d.workoutItems));
      triggerNotify("Workout template deleted.");
    }
  };

  // CRUD handlers: Recipes
  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingRecipeId 
      ? `http://localhost:5000/api/admin/recipes/${editingRecipeId}` 
      : 'http://localhost:5000/api/admin/recipes';
    const method = editingRecipeId ? 'PUT' : 'POST';

    const res = await fetchSecure(url, {
      method,
      body: JSON.stringify(recipeForm)
    });
    if (res.ok) {
      setRecipes(await res.json().then(d => d.recipes));
      setRecipeForm({});
      setEditingRecipeId(null);
      triggerNotify("Recipe template saved.");
    }
  };

  const handleDeleteRecipe = async (id: number) => {
    const res = await fetchSecure(`http://localhost:5000/api/admin/recipes/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setRecipes(await res.json().then(d => d.recipes));
      triggerNotify("Recipe template deleted.");
    }
  };

  // Support Ticketing handlers
  const handleResolveTicket = async (id: number) => {
    const responseText = ticketResponse[id];
    if (!responseText) return;
    const res = await fetchSecure(`http://localhost:5000/api/admin/tickets/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ response: responseText })
    });
    if (res.ok) {
      setTickets(await res.json().then(d => d.tickets));
      triggerNotify("Support ticket resolved.");
    }
  };

  // Ads campaigns CRUD
  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetchSecure('http://localhost:5000/api/admin/ads', {
      method: 'POST',
      body: JSON.stringify(adForm)
    });
    if (res.ok) {
      setAds(await res.json().then(d => d.advertisements));
      setAdForm({});
      setEditingAdId(null);
      triggerNotify("Ad campaign saved.");
    }
  };

  // Database Management Handlers
  const handleTriggerBackup = async () => {
    const res = await fetchSecure('http://localhost:5000/api/admin/database/backup', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      triggerNotify(data.message);
      // Reload backups
      const resB = await fetchSecure('http://localhost:5000/api/admin/database/backups');
      if (resB.ok) setBackupsList(await resB.json());
    }
  };

  const handleTriggerRestore = async (filename: string) => {
    if (!confirm(`Are you absolutely sure you want to restore from ${filename}?`)) return;
    const res = await fetchSecure('http://localhost:5000/api/admin/database/restore', {
      method: 'POST',
      body: JSON.stringify({ filename })
    });
    if (res.ok) {
      const data = await res.json();
      triggerNotify(data.message);
    }
  };

  const handleTriggerOptimization = async () => {
    const res = await fetchSecure('http://localhost:5000/api/admin/database/optimize', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      triggerNotify(data.message);
    }
  };

  if (isLoadingAuth) {
    return (
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, #0a081e 0%, #03020c 100%)',
        padding: '1.5rem',
        color: 'var(--foreground)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="spin" style={{ width: '36px', height: '36px', border: '3.5px solid oklch(1 0 0 / 0.05)', borderTopColor: 'var(--accent-magenta)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>Verifying administrative session key...</span>
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, #0a081e 0%, #03020c 100%)',
        padding: '1.5rem'
      }}>
        <div className="glass-panel" style={{
          maxWidth: '400px',
          width: '100%',
          padding: '2.5rem 2rem',
          border: '1.5px solid var(--accent-magenta)',
          boxShadow: '0 0 35px var(--accent-magenta-glow)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.45rem', alignItems: 'center' }}>
            <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'var(--accent-magenta-glow)', color: 'var(--accent-magenta)', display: 'flex' }}>
              <ShieldAlert size={28} />
            </div>
            <h2 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 800 }}>Admin Command Center</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>Authorized personnel administrative authentication gateway.</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.35rem' }}>Admin Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="input-futuristic" 
                placeholder="admin@nutriverse.fit" 
                required 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.35rem' }}>Security Signature Hash</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="input-futuristic" 
                placeholder="••••••••••••" 
                required 
              />
            </div>

            {loginError && (
              <p style={{ fontSize: '0.75rem', color: 'var(--accent-magenta)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <AlertOctagon size={12} /> {loginError}
              </p>
            )}

            <button type="submit" className="btn-premium" style={{ width: '100%', marginTop: '0.5rem' }}>
              Decrypt Gateway Node
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard charts mock sets
  const analyticsTrendData = [
    { name: 'Mon', registrations: 12, sessions: 85, latency: 310 },
    { name: 'Tue', registrations: 19, sessions: 110, latency: 380 },
    { name: 'Wed', registrations: 34, sessions: 140, latency: 450 },
    { name: 'Thu', registrations: 22, sessions: 130, latency: 390 },
    { name: 'Fri', registrations: 40, sessions: 190, latency: 320 },
    { name: 'Sat', registrations: 55, sessions: 240, latency: 410 },
    { name: 'Sun', registrations: 48, sessions: 210, latency: 380 }
  ];

  const revenueTimelineData = [
    { name: 'May', mrr: 1200 },
    { name: 'Jun', mrr: 2100 },
    { name: 'Jul', mrr: stats.summary.revenueMRR || 2900 }
  ];

  const activeSubData = [
    { name: 'Premium Active', value: stats.summary.activeSubs || 4 },
    { name: 'Standard Free', value: stats.summary.totalUsers - stats.summary.activeSubs - stats.summary.suspendedUsers || 6 }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      
      {/* Dynamic Toast Message */}
      {notificationMsg && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: 'oklch(0.12 0.03 270 / 0.95)',
          border: '1.5px solid var(--accent-cyan)',
          boxShadow: '0 0 20px var(--accent-cyan-glow)',
          borderRadius: '10px',
          padding: '0.75rem 1.25rem',
          color: 'var(--foreground)',
          zIndex: 1000,
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem'
        }}>
          <CheckCircle size={14} style={{ color: 'var(--accent-cyan)' }} />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <header style={{
        padding: '0.85rem 2rem',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'oklch(0.08 0.02 270 / 0.9)',
        backdropFilter: 'blur(15px)',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={20} style={{ color: 'var(--accent-magenta)' }} />
          <span className="font-display" style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
            NUTRI-ADMIN <span style={{ color: 'var(--accent-magenta)' }}>CORE</span>
          </span>
        </div>

        <button 
          onClick={handleLogout}
          className="btn-outline"
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', padding: '0.45rem 1rem' }}
        >
          <LogOut size={12} /> Exit Command Session
        </button>
      </header>

      {/* Main Splits */}
      <div style={{ display: 'flex', flex: 1 }}>
        
        {/* Navigation Sidebar */}
        <aside style={{
          width: '260px',
          borderRight: '1px solid var(--border-light)',
          backgroundColor: 'oklch(0.06 0.015 270 / 0.65)',
          padding: '1.5rem 0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.2rem',
          flexShrink: 0
        }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Server },
            { id: 'users', label: 'User Registry', icon: Users },
            { id: 'premium', label: 'Premium Tiers', icon: DollarSign },
            { id: 'analytics', label: 'User Analytics', icon: TrendingUp },
            { id: 'revenue', label: 'Revenue Dashboard', icon: BarChart3 },
            { id: 'ai-analytics', label: 'AI Usage Analytics', icon: Cpu },
            { id: 'food-db', label: 'Food Directory', icon: Database },
            { id: 'workout-lib', label: 'Workout Templates', icon: Sliders },
            { id: 'recipe-mgr', label: 'Recipes CMS', icon: Bookmark },
            { id: 'notifications', label: 'Notification Center', icon: Bell },
            { id: 'reports', label: 'Export Reports', icon: Download },
            { id: 'feedback', label: 'Feedback Manager', icon: MessageSquare },
            { id: 'support', label: 'Support Tickets', icon: LifeBuoy },
            { id: 'ads', label: 'Ads Campaigns', icon: Layers },
            { id: 'cms', label: 'Site Copy (CMS)', icon: FileText },
            { id: 'files', label: 'File Manager', icon: FolderOpen },
            { id: 'backup', label: 'Backup Manager', icon: FileCode },
            { id: 'audit', label: 'Audit Logging', icon: Terminal },
            { id: 'security', label: 'Security Center', icon: ShieldCheck },
            { id: 'settings', label: 'System Settings', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  width: '100%',
                  padding: '0.55rem 0.85rem',
                  border: 'none',
                  background: isActive ? 'oklch(1 0 0 / 0.06)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderRadius: '8px',
                  color: isActive ? 'var(--foreground)' : 'var(--foreground-muted)',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={14} style={{ color: isActive ? 'var(--accent-magenta)' : 'inherit' }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Central Workspace */}
        <main style={{ flex: 1, padding: '2.5rem', overflowY: 'auto', backgroundColor: 'oklch(0.04 0.01 270 / 0.2)' }}>
          
          {/* TAB 1: SYSTEM OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>Total Subscriptions</span>
                  <h4 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0.2rem 0' }}>{stats.summary.totalUsers}</h4>
                  <p style={{ fontSize: '0.65rem', color: 'var(--accent-lime)' }}>+14% registration bounds weekly</p>
                </div>
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>Active Premium MRR</span>
                  <h4 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0.2rem 0', color: 'var(--accent-cyan)' }}>${stats.summary.revenueMRR}</h4>
                  <p style={{ fontSize: '0.65rem', color: 'var(--foreground-muted)' }}>Stripe gateway verified</p>
                </div>
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>GPU Compute Nodes</span>
                  <h4 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0.2rem 0', color: 'var(--accent-lime)' }}>4 Online</h4>
                  <p style={{ fontSize: '0.65rem', color: 'var(--accent-lime)' }}>Scalability index: Healthy</p>
                </div>
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>AI Vision Calls</span>
                  <h4 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0.2rem 0' }}>{stats.summary.aiVisionCalls}</h4>
                  <p style={{ fontSize: '0.65rem', color: 'var(--foreground-muted)' }}>Avg latency: {stats.summary.avgResponseTimeMs}ms</p>
                </div>
              </div>

              {/* Node load diagnostics */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.2rem' }}>Kubernetes EKS GPU Cluster Infrastructure</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {stats.nodes?.map((node: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.45rem' }}>
                      <span>{node.id} ({node.type})</span>
                      <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <span>CPU: {node.cpu}</span>
                        <span>MEM: {node.mem}</span>
                        <span style={{ color: 'var(--accent-lime)' }}>{node.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER REGISTRY */}
          {activeTab === 'users' && (
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600 }}>SaaS Account Registry</h3>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid var(--border-light)', color: 'var(--foreground-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem' }}>USER_EMAIL</th>
                      <th style={{ padding: '0.5rem' }}>PROVIDER</th>
                      <th style={{ padding: '0.5rem' }}>JOINED</th>
                      <th style={{ padding: '0.5rem' }}>ROLE</th>
                      <th style={{ padding: '0.5rem' }}>TIER</th>
                      <th style={{ padding: '0.5rem' }}>STATUS</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.email} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{u.email}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--foreground-muted)' }}>{u.provider}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{u.joinedAt}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: u.role === 'SUPER_ADMIN' ? 'var(--accent-magenta)' : 'inherit' }}>{u.role}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--accent-cyan)' }}>{u.tier}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: u.status === 'Active' ? 'var(--accent-lime)' : 'var(--accent-magenta)' }}>{u.status}</td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleToggleSuspension(u.email, u.status)} className="btn-outline" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}>
                            {u.status === 'Active' ? 'Suspend' : 'Activate'}
                          </button>
                          <button onClick={() => handleUserRoleUpgrade(u.email, u.role)} className="btn-outline" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}>
                            Toggle Role
                          </button>
                          <button onClick={() => handleDeleteUser(u.email)} className="btn-outline" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', color: 'var(--accent-magenta)', borderColor: 'rgba(244,63,94,0.3)' }}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PREMIUM MANAGEMENT */}
          {activeTab === 'premium' && (
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600 }}>Stripe Billing Plans Calibration</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', marginTop: '0.25rem' }}>Configure Stripe product subscription tiers synced under API webhook structures.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Plans List */}
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <h4 className="font-display" style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Active SaaS Tiers</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                      <div>
                        <strong>Standard Free Plan</strong>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.7rem', color: 'var(--foreground-muted)' }}>Stripe ID: prod_free_0192</p>
                      </div>
                      <strong>$0/mo</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                      <div>
                        <strong>NutriVerse Premium Core</strong>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.7rem', color: 'var(--foreground-muted)' }}>Stripe ID: prod_prem_881</p>
                      </div>
                      <strong style={{ color: 'var(--accent-cyan)' }}>$29/mo</strong>
                    </div>
                  </div>
                </div>

                {/* Coupons Config */}
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <h4 className="font-display" style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>SaaS Promo Coupons</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    <p>• WELCOME10 — 10% Discount Campaign (Status: Active)</p>
                    <p>• FITNESS20 — 20% Off Calibration Split (Status: Active)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: USER ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600 }}>Active Registrations & Sessions Index</h3>
              
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsTrendData}>
                    <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} />
                    <YAxis stroke="#a1a1aa" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0e0b25', borderColor: '#4a0e4e' }} />
                    <Line type="monotone" dataKey="registrations" stroke="var(--accent-cyan)" strokeWidth={2.5} name="New Accounts" />
                    <Line type="monotone" dataKey="sessions" stroke="var(--accent-purple)" strokeWidth={2.5} name="Daily Active Sessions" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 5: REVENUE DASHBOARD */}
          {activeTab === 'revenue' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                {/* Revenue Chart */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.2rem' }}>Monthly Recurring Revenue Growth</h3>
                  <div style={{ height: '240px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueTimelineData}>
                        <XAxis dataKey="name" stroke="#a1a1aa" />
                        <YAxis stroke="#a1a1aa" />
                        <Tooltip contentStyle={{ backgroundColor: '#0e0b25', borderColor: '#4a0e4e' }} />
                        <Bar dataKey="mrr" fill="var(--accent-cyan)" radius={[4, 4, 0, 0]} name="MRR ($)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Sub Distribution */}
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                  <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.2rem' }}>Plan Shard Shares</h3>
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={activeSubData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {activeSubData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0e0b25', borderColor: '#4a0e4e' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.7rem', justifyContent: 'center', marginTop: '1rem' }}>
                    <span style={{ color: COLORS[0] }}>● Premium Active</span>
                    <span style={{ color: COLORS[1] }}>● Free Tier</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: AI USAGE ANALYTICS */}
          {activeTab === 'ai-analytics' && (
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600 }}>Generative AI Telemetry & Latencies</h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div className="glass-panel" style={{ padding: '1rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--foreground-muted)' }}>Tokens Consumed</span>
                  <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.2rem 0', color: 'var(--accent-purple)' }}>{stats.summary.aiTokensCount?.toLocaleString()}</h4>
                </div>
                <div className="glass-panel" style={{ padding: '1rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--foreground-muted)' }}>Vision Scans processed</span>
                  <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.2rem 0', color: 'var(--accent-cyan)' }}>{stats.summary.aiVisionCalls?.toLocaleString()}</h4>
                </div>
                <div className="glass-panel" style={{ padding: '1rem' }}>
                  <span style={{ fontSize: '0.7er', color: 'var(--foreground-muted)' }}>Response Latency</span>
                  <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.2rem 0', color: 'var(--accent-lime)' }}>{stats.summary.avgResponseTimeMs} ms</h4>
                </div>
              </div>

              <div style={{ height: '240px', marginTop: '1rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>Gateway Latency Profile</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsTrendData}>
                    <XAxis dataKey="name" stroke="#a1a1aa" />
                    <YAxis stroke="#a1a1aa" />
                    <Tooltip contentStyle={{ backgroundColor: '#0e0b25', borderColor: '#4a0e4e' }} />
                    <Line type="monotone" dataKey="latency" stroke="var(--accent-lime)" strokeWidth={2} name="Latency (ms)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 7: FOOD DATABASE */}
          {activeTab === 'food-db' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
              {/* Form */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
                  {editingFoodId ? 'Modify Food Record' : 'Register New Food'}
                </h3>
                <form onSubmit={handleSaveFood} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Food Name</label>
                    <input 
                      type="text" 
                      value={foodForm.name || ''} 
                      onChange={e => setFoodForm({...foodForm, name: e.target.value})} 
                      className="input-futuristic" 
                      required 
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Calories</label>
                      <input 
                        type="number" 
                        value={foodForm.calories || ''} 
                        onChange={e => setFoodForm({...foodForm, calories: Number(e.target.value)})} 
                        className="input-futuristic" 
                        required 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Protein (g)</label>
                      <input 
                        type="number" 
                        value={foodForm.protein || ''} 
                        onChange={e => setFoodForm({...foodForm, protein: Number(e.target.value)})} 
                        className="input-futuristic" 
                        required 
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Carbs (g)</label>
                      <input 
                        type="number" 
                        value={foodForm.carbs || ''} 
                        onChange={e => setFoodForm({...foodForm, carbs: Number(e.target.value)})} 
                        className="input-futuristic" 
                        required 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Fats (g)</label>
                      <input 
                        type="number" 
                        value={foodForm.fats || ''} 
                        onChange={e => setFoodForm({...foodForm, fats: Number(e.target.value)})} 
                        className="input-futuristic" 
                        required 
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-premium" style={{ marginTop: '0.5rem' }}>
                    {editingFoodId ? 'Calibrate Updates' : 'Commit Food Index'}
                  </button>
                  {editingFoodId && (
                    <button type="button" className="btn-outline" onClick={() => { setEditingFoodId(null); setFoodForm({}); }}>
                      Cancel
                    </button>
                  )}
                </form>
              </div>

              {/* Data list */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Indexed Food Index</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', maxHeight: '420px' }}>
                  {foods.map(f => (
                    <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.45rem', fontSize: '0.8rem' }}>
                      <div>
                        <strong>{f.name}</strong>
                        <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.7rem', color: 'var(--foreground-muted)' }}>
                          {f.calories} kcal | Protein: {f.protein}g | Carbs: {f.carbs}g | Fats: {f.fats}g
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                        <button onClick={() => { setFoodForm(f); setEditingFoodId(f.id); }} className="btn-outline" style={{ padding: '0.2rem' }} aria-label="Edit food"><Edit2 size={12} /></button>
                        <button onClick={() => handleDeleteFood(f.id)} className="btn-outline" style={{ padding: '0.2rem', color: 'var(--accent-magenta)', borderColor: 'rgba(244,63,94,0.3)' }} aria-label="Delete food"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: WORKOUT TEMPLATES */}
          {activeTab === 'workout-lib' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
              {/* Form */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
                  {editingWorkoutId ? 'Modify Workout Template' : 'Add Workout Template'}
                </h3>
                <form onSubmit={handleSaveWorkout} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Template Name</label>
                    <input 
                      type="text" 
                      value={workoutForm.name || ''} 
                      onChange={e => setWorkoutForm({...workoutForm, name: e.target.value})} 
                      className="input-futuristic" 
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Difficulty Level</label>
                    <select 
                      value={workoutForm.level || 'Beginner'} 
                      onChange={e => setWorkoutForm({...workoutForm, level: e.target.value})} 
                      className="input-futuristic"
                      style={{ background: 'var(--bg-deep)' }}
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Sets & Reps / Duration</label>
                    <input 
                      type="text" 
                      value={workoutForm.duration || ''} 
                      onChange={e => setWorkoutForm({...workoutForm, duration: e.target.value})} 
                      className="input-futuristic" 
                      placeholder="e.g. 4 sets x 12 reps"
                      required 
                    />
                  </div>
                  <button type="submit" className="btn-premium" style={{ marginTop: '0.5rem' }}>
                    {editingWorkoutId ? 'Calibrate Updates' : 'Commit Template'}
                  </button>
                  {editingWorkoutId && (
                    <button type="button" className="btn-outline" onClick={() => { setEditingWorkoutId(null); setWorkoutForm({}); }}>
                      Cancel
                    </button>
                  )}
                </form>
              </div>

              {/* Data list */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Templates Directory</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', maxHeight: '420px' }}>
                  {workouts.map(w => (
                    <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.45rem', fontSize: '0.8rem' }}>
                      <div>
                        <strong>{w.name}</strong>
                        <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.7rem', color: 'var(--foreground-muted)' }}>
                          Level: {w.level} | Targets: {w.duration}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                        <button onClick={() => { setWorkoutForm(w); setEditingWorkoutId(w.id); }} className="btn-outline" style={{ padding: '0.2rem' }} aria-label="Edit workout"><Edit2 size={12} /></button>
                        <button onClick={() => handleDeleteWorkout(w.id)} className="btn-outline" style={{ padding: '0.2rem', color: 'var(--accent-magenta)', borderColor: 'rgba(244,63,94,0.3)' }} aria-label="Delete workout"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: RECIPE MANAGER */}
          {activeTab === 'recipe-mgr' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
              {/* Form */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
                  {editingRecipeId ? 'Modify Recipe' : 'Add Recipe Template'}
                </h3>
                <form onSubmit={handleSaveRecipe} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Recipe Title</label>
                    <input 
                      type="text" 
                      value={recipeForm.title || ''} 
                      onChange={e => setRecipeForm({...recipeForm, title: e.target.value})} 
                      className="input-futuristic" 
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Description</label>
                    <textarea 
                      value={recipeForm.description || ''} 
                      onChange={e => setRecipeForm({...recipeForm, description: e.target.value})} 
                      className="input-futuristic" 
                      style={{ minHeight: '60px', resize: 'vertical' }}
                      required 
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Calories (kcal)</label>
                      <input 
                        type="number" 
                        value={recipeForm.calories || ''} 
                        onChange={e => setRecipeForm({...recipeForm, calories: Number(e.target.value)})} 
                        className="input-futuristic" 
                        required 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Protein (g)</label>
                      <input 
                        type="number" 
                        value={recipeForm.protein || ''} 
                        onChange={e => setRecipeForm({...recipeForm, protein: Number(e.target.value)})} 
                        className="input-futuristic" 
                        required 
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Cooking Time (e.g. 20 mins)</label>
                    <input 
                      type="text" 
                      value={recipeForm.cookingTime || ''} 
                      onChange={e => setRecipeForm({...recipeForm, cookingTime: e.target.value})} 
                      className="input-futuristic" 
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Instructions (one per line)</label>
                    <textarea 
                      value={Array.isArray(recipeForm.instructions) ? recipeForm.instructions.join('\n') : ''} 
                      onChange={e => setRecipeForm({...recipeForm, instructions: e.target.value.split('\n')})} 
                      className="input-futuristic" 
                      style={{ minHeight: '100px', resize: 'vertical' }}
                      placeholder="Season with herbs.&#10;Pan-sear for 5 mins."
                      required 
                    />
                  </div>
                  <button type="submit" className="btn-premium" style={{ marginTop: '0.5rem' }}>
                    {editingRecipeId ? 'Calibrate Updates' : 'Commit Recipe'}
                  </button>
                  {editingRecipeId && (
                    <button type="button" className="btn-outline" onClick={() => { setEditingRecipeId(null); setRecipeForm({}); }}>
                      Cancel
                    </button>
                  )}
                </form>
              </div>

              {/* Data list */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Recipe Library</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', maxHeight: '420px' }}>
                  {recipes.map(r => (
                    <div key={r.id} style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.65rem', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong>{r.title}</strong>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button onClick={() => { setRecipeForm(r); setEditingRecipeId(r.id); }} className="btn-outline" style={{ padding: '0.2rem' }} aria-label="Edit recipe"><Edit2 size={12} /></button>
                          <button onClick={() => handleDeleteRecipe(r.id)} className="btn-outline" style={{ padding: '0.2rem', color: 'var(--accent-magenta)', borderColor: 'rgba(244,63,94,0.3)' }} aria-label="Delete recipe"><Trash2 size={12} /></button>
                        </div>
                      </div>
                      <p style={{ margin: '0.15rem 0', color: 'var(--foreground-muted)', fontSize: '0.75rem' }}>{r.description}</p>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>
                        {r.calories} kcal | Protein: {r.protein}g | Time: {r.cookingTime}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: NOTIFICATION CENTER */}
          {activeTab === 'notifications' && (
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600 }}>Broadcaster announcement center</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Broadcast Msg */}
                <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h4 className="font-display" style={{ fontSize: '1rem', fontWeight: 600 }}>Broadcaster System Banner</h4>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.35rem' }}>Banner Text</label>
                    <input 
                      type="text" 
                      value={announcementMsg} 
                      onChange={e => setAnnouncementMsg(e.target.value)} 
                      className="input-futuristic" 
                      placeholder="Welcome to NutriVerse 3D SaaS..." 
                    />
                  </div>
                  <button 
                    onClick={async () => {
                      const res = await fetchSecure('http://localhost:5000/api/admin/settings');
                      if (res.ok) {
                        const settingsData = await res.json();
                        settingsData.notifications.announcementBanner = announcementMsg;
                        const updateRes = await fetchSecure('http://localhost:5000/api/admin/settings', {
                          method: 'POST',
                          body: JSON.stringify(settingsData)
                        });
                        if (updateRes.ok) triggerNotify("Broadcaster banner modified.");
                      }
                    }} 
                    className="btn-premium"
                  >
                    Broadcast System Banner
                  </button>
                </div>

                {/* Simulated Custom Push/SMS */}
                <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h4 className="font-display" style={{ fontSize: '1rem', fontWeight: 600 }}>Custom Email & Push Dispatcher</h4>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.35rem' }}>Message Payload</label>
                    <textarea className="input-futuristic" style={{ minHeight: '60px' }} placeholder="Configure text body..."></textarea>
                  </div>
                  <button onClick={() => triggerNotify("Custom push notifications sent to devices.")} className="btn-premium">
                    Broadcast Custom Notification
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: REPORTS SYSTEM */}
          {activeTab === 'reports' && (
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600 }}>Export Diagnostic System Logs</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>Generate and download system-wide diagnostics data packages for regulatory archiving.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={24} style={{ color: 'var(--accent-cyan)' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>User Database (CSV)</span>
                  <button onClick={() => triggerNotify("CSV download initiated.")} className="btn-premium" style={{ fontSize: '0.7rem', padding: '0.35rem 0.75rem' }}>Export Users</button>
                </div>
                <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart3 size={24} style={{ color: 'var(--accent-purple)' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Revenue Reports (PDF)</span>
                  <button onClick={() => triggerNotify("PDF report generation initiated.")} className="btn-premium" style={{ fontSize: '0.7rem', padding: '0.35rem 0.75rem' }}>Export Revenue</button>
                </div>
                <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <Terminal size={24} style={{ color: 'var(--accent-lime)' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Security Audit (JSON)</span>
                  <button onClick={() => triggerNotify("Audit logs downloaded.")} className="btn-premium" style={{ fontSize: '0.7rem', padding: '0.35rem 0.75rem' }}>Export Logs</button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 12: FEEDBACK MANAGER */}
          {activeTab === 'feedback' && (
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600 }}>Holistic User Feedback Indices</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {feedbacks.map(f => (
                  <div key={f.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '0.8rem' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <strong>{f.email}</strong>
                        <span style={{ fontSize: '0.7rem', color: 'var(--foreground-muted)' }}>{f.date}</span>
                      </div>
                      <p style={{ margin: '0.4rem 0 0 0', color: 'var(--foreground-muted)' }}>"{f.comment}"</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>Rating: {f.rating}/5</span>
                      <div style={{ 
                        fontSize: '0.65rem', 
                        padding: '0.15rem 0.35rem', 
                        borderRadius: '4px', 
                        marginTop: '0.25rem',
                        backgroundColor: f.sentiment === 'Positive' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
                        color: f.sentiment === 'Positive' ? 'var(--accent-lime)' : 'inherit'
                      }}>{f.sentiment}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 13: SUPPORT TICKETS */}
          {activeTab === 'support' && (
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600 }}>Interactive Support Ticket Queues</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {tickets.map(t => (
                  <div key={t.id} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                      <div>
                        <strong>{t.subject}</strong>
                        <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.7rem', color: 'var(--foreground-muted)' }}>From: {t.email} | Created: {t.createdAt}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ 
                          fontSize: '0.65rem', 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '4px',
                          backgroundColor: t.priority === 'Critical' ? 'rgba(244,63,94,0.15)' : 'rgba(255,187,40,0.15)',
                          color: t.priority === 'Critical' ? 'var(--accent-magenta)' : '#FFBB28'
                        }}>{t.priority}</span>
                        <span style={{ color: t.status === 'Open' ? '#FFBB28' : 'var(--accent-lime)' }}>● {t.status}</span>
                      </div>
                    </div>
                    
                    <p style={{ color: 'var(--foreground-muted)', margin: 0 }}>{t.message}</p>
                    
                    {t.response ? (
                      <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', borderLeft: '3.5px solid var(--accent-cyan)' }}>
                        <strong>Resolved Response:</strong>
                        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--foreground-muted)' }}>{t.response}</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <input 
                          type="text" 
                          placeholder="Type resolve reply message..." 
                          value={ticketResponse[t.id] || ''} 
                          onChange={e => setTicketResponse({...ticketResponse, [t.id]: e.target.value})} 
                          className="input-futuristic" 
                          style={{ flex: 1 }} 
                        />
                        <button onClick={() => handleResolveTicket(t.id)} className="btn-premium" style={{ fontSize: '0.75rem' }}>Respond & Close</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 14: ADS CAMPAIGNS */}
          {activeTab === 'ads' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
              {/* Form */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
                  {editingAdId ? 'Modify Campaign' : 'Configure Promo Ad'}
                </h3>
                <form onSubmit={handleSaveAd} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Campaign Name</label>
                    <input 
                      type="text" 
                      value={adForm.campaignName || ''} 
                      onChange={e => setAdForm({...adForm, campaignName: e.target.value})} 
                      className="input-futuristic" 
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Banner Image URL</label>
                    <input 
                      type="text" 
                      value={adForm.bannerUrl || ''} 
                      onChange={e => setAdForm({...adForm, bannerUrl: e.target.value})} 
                      className="input-futuristic" 
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Destination Target Link</label>
                    <input 
                      type="text" 
                      value={adForm.destinationUrl || ''} 
                      onChange={e => setAdForm({...adForm, destinationUrl: e.target.value})} 
                      className="input-futuristic" 
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={adForm.active || false} 
                        onChange={e => setAdForm({...adForm, active: e.target.checked})} 
                        style={{ width: '15px', height: '15px' }}
                      />
                      <span>Campaign Active</span>
                    </label>
                  </div>
                  <button type="submit" className="btn-premium" style={{ marginTop: '0.5rem' }}>
                    Save Ad Campaign
                  </button>
                </form>
              </div>

              {/* Data list */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Active Campaigns</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {ads.map(ad => (
                    <div key={ad.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', fontSize: '0.8rem' }}>
                      <div>
                        <strong>{ad.campaignName}</strong>
                        <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.7rem', color: 'var(--foreground-muted)' }}>
                          Impressions: {ad.impressions} | Clicks: {ad.clicks} (CTR: {ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : 0}%)
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                        <span style={{ color: ad.active ? 'var(--accent-lime)' : 'var(--foreground-muted)' }}>{ad.active ? 'Active' : 'Offline'}</span>
                        <button onClick={() => { setAdForm(ad); setEditingAdId(ad.id); }} className="btn-outline" style={{ padding: '0.2rem' }} aria-label="Edit ad"><Edit2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 15: CMS COPYWRITING */}
          {activeTab === 'cms' && (
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600 }}>Homepage Copys & Landing Panel</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>Edit marketing copies and SEO metadata headers on the public-facing landing interface.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.35rem' }}>Hero Main Headline</label>
                  <input type="text" className="input-futuristic" defaultValue="The AI-powered 3D Health Core for human performance." />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.35rem' }}>Hero Description Paragraph</label>
                  <textarea className="input-futuristic" style={{ minHeight: '80px' }} defaultValue="Integrate DNA mapping, real-time metabolic volume vision scans, and progressive overload telemetry split planning into one futuristic 3D interface."></textarea>
                </div>
                <button onClick={() => triggerNotify("Public CMS homepage copies successfully compiled.")} className="btn-premium" style={{ width: 'fit-content' }}>Compile Copy Edits</button>
              </div>
            </div>
          )}

          {/* TAB 16: FILE MANAGER */}
          {activeTab === 'files' && (
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600 }}>Administrative System Files Shards</h3>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button onClick={() => triggerNotify("Select file dialog simulation.")} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <FileUp size={14} /> Upload Mock Shard File
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', color: 'var(--foreground-muted)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.35rem' }}>
                  <span>FILE_NAME</span>
                  <span>TYPE</span>
                  <span style={{ textAlign: 'right' }}>SIZE_BYTES</span>
                </div>
                {filesList.map((f, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.35rem' }}>
                    <span>{f.name}</span>
                    <span style={{ color: 'var(--foreground-muted)' }}>{f.isDir ? 'Directory' : 'File'}</span>
                    <span style={{ textAlign: 'right' }}>{f.isDir ? '-' : f.size.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 17: BACKUP & DATABASE MANAGER */}
          {activeTab === 'backup' && (
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600 }}>Database backup, restore & optimization</h3>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={handleTriggerBackup} className="btn-premium" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  Create DB Snapshot
                </button>
                <button onClick={handleTriggerOptimization} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  Optimize Database Indexes
                </button>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <h4 className="font-display" style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Snapshot Backups List</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {backupsList.map(bk => (
                    <div key={bk} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.45rem' }}>
                      <span>{bk}</span>
                      <button onClick={() => handleTriggerRestore(bk)} className="btn-outline" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}>Restore Shard</button>
                    </div>
                  ))}
                  {backupsList.length === 0 && <p style={{ color: 'var(--foreground-muted)' }}>No snapshot backups created yet.</p>}
                </div>
              </div>
            </div>
          )}

          {/* TAB 18: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600 }}>Administrative security logs feed</h3>
              
              <div style={{
                backgroundColor: 'black',
                color: '#10b981',
                padding: '1rem',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                minHeight: '320px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                overflowY: 'auto',
                maxHeight: '480px'
              }}>
                {auditLogs.map((log, idx) => (
                  <p key={idx} style={{ margin: 0, borderBottom: '1px solid rgba(16,185,129,0.1)', paddingBottom: '0.35rem' }}>
                    <span style={{ color: '#888' }}>[{log.timestamp}]</span> <span style={{ color: log.status === 'FAILED' ? '#ef4444' : 'inherit' }}>[{log.status}]</span> [{log.email}] {log.action} - IP: {log.ip} {log.details ? `(${log.details})` : ''}
                  </p>
                ))}
                {auditLogs.length === 0 && <p style={{ margin: 0 }}>No administrative logs reported.</p>}
              </div>
            </div>
          )}

          {/* TAB 19: SECURITY CENTER */}
          {activeTab === 'security' && (
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600 }}>SaaS Cyber Defense Configurations</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.35rem' }}>Active Firewall Policy</label>
                  <select className="input-futuristic" style={{ background: 'var(--bg-deep)' }}>
                    <option>Block all external API scans</option>
                    <option selected>Permit EKS Ingress proxy validations (Strict)</option>
                    <option>Development debug mode</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.35rem' }}>Allowed Whitelisted administrative IPs (comma separated)</label>
                  <input type="text" className="input-futuristic" defaultValue="127.0.0.1, 192.168.1.1" />
                </div>
                <button onClick={() => triggerNotify("Cyber security shields calibrated and deployed.")} className="btn-premium" style={{ width: 'fit-content' }}>Save Shield Rules</button>
              </div>
            </div>
          )}

          {/* TAB 20: DEDICATED SYSTEM SETTINGS PANEL */}
          {activeTab === 'settings' && settings && (
            <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '2rem' }}>
              {/* Settings Sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderRight: '1px solid var(--border-light)', paddingRight: '1rem' }}>
                <h4 className="font-display" style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 0.75rem 0', color: 'var(--accent-magenta)' }}>Categories</h4>
                {[
                  { id: 'general', label: 'General Settings' },
                  { id: 'ai', label: 'AI Configurations' },
                  { id: 'auth', label: 'Authentication' },
                  { id: 'database', label: 'Database Status' },
                  { id: 'payments', label: 'Payments & Sub' },
                  { id: 'security', label: 'Security Firewall' },
                  { id: 'notifications', label: 'Notifications' },
                  { id: 'analytics', label: 'Google Analytics' },
                  { id: 'connected', label: 'Connected Wearables' }
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setSettingsSubTab(sub.id as any)}
                    style={{
                      border: 'none',
                      background: settingsSubTab === sub.id ? 'oklch(1 0 0 / 0.05)' : 'none',
                      textAlign: 'left',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      color: settingsSubTab === sub.id ? 'var(--foreground)' : 'var(--foreground-muted)'
                    }}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              {/* Settings Fields Area */}
              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 600, borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {settingsSubTab} parameters settings
                </h3>

                {/* SubTab 1: GENERAL */}
                {settingsSubTab === 'general' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Website Name</label>
                      <input 
                        type="text" 
                        value={settings.general.websiteName} 
                        onChange={e => setSettings({...settings, general: {...settings.general, websiteName: e.target.value}})} 
                        className="input-futuristic" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Logo Asset Link</label>
                      <input 
                        type="text" 
                        value={settings.general.logo} 
                        onChange={e => setSettings({...settings, general: {...settings.general, logo: e.target.value}})} 
                        className="input-futuristic" 
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Website Timezone</label>
                        <input 
                          type="text" 
                          value={settings.general.timezone} 
                          onChange={e => setSettings({...settings, general: {...settings.general, timezone: e.target.value}})} 
                          className="input-futuristic" 
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Default Language</label>
                        <input 
                          type="text" 
                          value={settings.general.language} 
                          onChange={e => setSettings({...settings, general: {...settings.general, language: e.target.value}})} 
                          className="input-futuristic" 
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Email Server Config Connection</label>
                      <input 
                        type="text" 
                        value={settings.general.emailConfig} 
                        onChange={e => setSettings({...settings, general: {...settings.general, emailConfig: e.target.value}})} 
                        className="input-futuristic" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={settings.general.maintenanceMode} 
                          onChange={e => setSettings({...settings, general: {...settings.general, maintenanceMode: e.target.checked}})} 
                          style={{ width: '15px', height: '15px' }}
                        />
                        <span>Enable System Maintenance Mode</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* SubTab 2: AI SETTINGS */}
                {settingsSubTab === 'ai' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>AI Model Selection</label>
                      <select 
                        value={settings.ai.modelSelection} 
                        onChange={e => setSettings({...settings, ai: {...settings.ai, modelSelection: e.target.value}})} 
                        className="input-futuristic"
                        style={{ background: 'var(--bg-deep)' }}
                      >
                        <option value="Gemini 1.5 Flash">Gemini 1.5 Flash</option>
                        <option value="Gemini 1.5 Pro">Gemini 1.5 Pro</option>
                        <option value="Gemini 2.0 Ultra">Gemini 2.0 Ultra</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Vision API Configuration</label>
                      <input 
                        type="text" 
                        value={settings.ai.visionApiConfig} 
                        onChange={e => setSettings({...settings, ai: {...settings.ai, visionApiConfig: e.target.value}})} 
                        className="input-futuristic" 
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Daily Chat Limits (Regular)</label>
                        <input 
                          type="number" 
                          value={settings.ai.aiLimits} 
                          onChange={e => setSettings({...settings, ai: {...settings.ai, aiLimits: Number(e.target.value)}})} 
                          className="input-futuristic" 
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Vision scan limits</label>
                        <input 
                          type="number" 
                          value={settings.ai.aiUsageLimits} 
                          onChange={e => setSettings({...settings, ai: {...settings.ai, aiUsageLimits: Number(e.target.value)}})} 
                          className="input-futuristic" 
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>System Prompt Configuration</label>
                      <textarea 
                        value={settings.ai.aiPromptConfig} 
                        onChange={e => setSettings({...settings, ai: {...settings.ai, aiPromptConfig: e.target.value}})} 
                        className="input-futuristic"
                        style={{ minHeight: '80px', resize: 'vertical' }}
                      />
                    </div>
                  </div>
                )}

                {/* SubTab 3: AUTHENTICATION */}
                {settingsSubTab === 'auth' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>JWT Hash Strategy</label>
                      <input 
                        type="text" 
                        value={settings.auth.jwtSettings} 
                        onChange={e => setSettings({...settings, auth: {...settings.auth, jwtSettings: e.target.value}})} 
                        className="input-futuristic" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Session Timeout (seconds)</label>
                      <input 
                        type="number" 
                        value={settings.auth.sessionTimeout} 
                        onChange={e => setSettings({...settings, auth: {...settings.auth, sessionTimeout: Number(e.target.value)}})} 
                        className="input-futuristic" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>OAuth Identity Providers</label>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <input 
                            type="checkbox" 
                            checked={settings.auth.oauthProviders?.includes('google')} 
                            onChange={e => {
                              const providers = [...(settings.auth.oauthProviders || [])];
                              if (e.target.checked) {
                                if (!providers.includes('google')) providers.push('google');
                              } else {
                                const idx = providers.indexOf('google');
                                if (idx > -1) providers.splice(idx, 1);
                              }
                              setSettings({...settings, auth: {...settings.auth, oauthProviders: providers}});
                            }}
                          />
                          <span>Google OAuth</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <input 
                            type="checkbox" 
                            checked={settings.auth.oauthProviders?.includes('apple')} 
                            onChange={e => {
                              const providers = [...(settings.auth.oauthProviders || [])];
                              if (e.target.checked) {
                                if (!providers.includes('apple')) providers.push('apple');
                              } else {
                                const idx = providers.indexOf('apple');
                                if (idx > -1) providers.splice(idx, 1);
                              }
                              setSettings({...settings, auth: {...settings.auth, oauthProviders: providers}});
                            }}
                          />
                          <span>Apple ID</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Password Complexity Policy</label>
                      <input 
                        type="text" 
                        value={settings.auth.passwordPolicies} 
                        onChange={e => setSettings({...settings, auth: {...settings.auth, passwordPolicies: e.target.value}})} 
                        className="input-futuristic" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={settings.auth.twoFactorAuth} 
                          onChange={e => setSettings({...settings, auth: {...settings.auth, twoFactorAuth: e.target.checked}})} 
                          style={{ width: '15px', height: '15px' }}
                        />
                        <span>Enforce Two-Factor Authentication (2FA)</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* SubTab 4: DATABASE */}
                {settingsSubTab === 'database' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem' }}>Database Shards Link Status</span>
                      <strong style={{ color: 'var(--accent-lime)', fontSize: '0.8rem' }}>{settings.database.status} (pgvector Cluster)</strong>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Auto-Backup Schedule</label>
                      <input 
                        type="text" 
                        value={settings.database.backupInterval} 
                        onChange={e => setSettings({...settings, database: {...settings.database, backupInterval: e.target.value}})} 
                        className="input-futuristic" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Shards Optimization Level</label>
                      <input 
                        type="text" 
                        value={settings.database.optimizationLevel} 
                        onChange={e => setSettings({...settings, database: {...settings.database, optimizationLevel: e.target.value}})} 
                        className="input-futuristic" 
                      />
                    </div>
                    <div className="glass-panel" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                      <span style={{ color: 'var(--accent-cyan)' }}>DB STATUS DIAGNOSTICS:</span>
                      <span>Total users capacity: 100,000 max</span>
                      <span>Active connections count: 42 connections</span>
                      <span>Migration migrations version: migrations_v12_pgvector_schema</span>
                    </div>
                  </div>
                )}

                {/* SubTab 5: PAYMENTS */}
                {settingsSubTab === 'payments' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Stripe API Status</label>
                        <select 
                          value={settings.payments.stripe} 
                          onChange={e => setSettings({...settings, payments: {...settings.payments, stripe: e.target.value}})} 
                          className="input-futuristic"
                          style={{ background: 'var(--bg-deep)' }}
                        >
                          <option value="enabled">Enabled</option>
                          <option value="disabled">Disabled</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Razorpay Status</label>
                        <select 
                          value={settings.payments.razorpay} 
                          onChange={e => setSettings({...settings, payments: {...settings.payments, razorpay: e.target.value}})} 
                          className="input-futuristic"
                          style={{ background: 'var(--bg-deep)' }}
                        >
                          <option value="enabled">Enabled</option>
                          <option value="disabled">Disabled</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>PayPal Status</label>
                      <select 
                        value={settings.payments.paypal} 
                        onChange={e => setSettings({...settings, payments: {...settings.payments, paypal: e.target.value}})} 
                        className="input-futuristic"
                        style={{ background: 'var(--bg-deep)' }}
                      >
                        <option value="enabled">Enabled</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Subscription Plans (comma separated)</label>
                      <input 
                        type="text" 
                        value={settings.payments.subscriptionPlans?.join(', ')} 
                        onChange={e => setSettings({...settings, payments: {...settings.payments, subscriptionPlans: e.target.value.split(',').map(s=>s.trim())}})} 
                        className="input-futuristic" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Promo Coupons (comma separated)</label>
                      <input 
                        type="text" 
                        value={settings.payments.coupons?.join(', ')} 
                        onChange={e => setSettings({...settings, payments: {...settings.payments, coupons: e.target.value.split(',').map(s=>s.trim())}})} 
                        className="input-futuristic" 
                      />
                    </div>
                  </div>
                )}

                {/* SubTab 6: SECURITY */}
                {settingsSubTab === 'security' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Firewall Policy Config</label>
                      <input 
                        type="text" 
                        value={settings.security.firewallSettings} 
                        onChange={e => setSettings({...settings, security: {...settings.security, firewallSettings: e.target.value}})} 
                        className="input-futuristic" 
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>NutriVerse API Key Token</label>
                        <input 
                          type="password" 
                          value={settings.security.apiKeyToken || ''} 
                          onChange={e => setSettings({...settings, security: {...settings.security, apiKeyToken: e.target.value}})} 
                          className="input-futuristic" 
                          style={{ fontFamily: 'monospace' }}
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const randToken = 'nv_live_' + Array.from({length: 32}, () => Math.floor(Math.random()*16).toString(16)).join('');
                          setSettings({...settings, security: {...settings.security, apiKeyToken: randToken}});
                          triggerNotify('Access credentials regenerated. Commit changes to apply.');
                        }}
                        className="btn-premium"
                        style={{ fontSize: '0.75rem', height: '38px', padding: '0 1rem' }}
                      >
                        Rotate Credentials
                      </button>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Webhook Endpoint Routing</label>
                      <input 
                        type="text" 
                        value={settings.security.webhookUrl || ''} 
                        onChange={e => setSettings({...settings, security: {...settings.security, webhookUrl: e.target.value}})} 
                        className="input-futuristic" 
                        style={{ fontFamily: 'monospace' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>IP Blacklist / Whitelist</label>
                      <input 
                        type="text" 
                        value={settings.security.ipWhitelist?.join(', ')} 
                        onChange={e => setSettings({...settings, security: {...settings.security, ipWhitelist: e.target.value.split(',').map(s=>s.trim())}})} 
                        className="input-futuristic" 
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Rate Limiting Limit (req/min)</label>
                        <input 
                          type="number" 
                          value={settings.security.rateLimiting} 
                          onChange={e => setSettings({...settings, security: {...settings.security, rateLimiting: Number(e.target.value)}})} 
                          className="input-futuristic" 
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Max Login Attempts</label>
                        <input 
                          type="number" 
                          value={settings.security.loginAttempts} 
                          onChange={e => setSettings({...settings, security: {...settings.security, loginAttempts: Number(e.target.value)}})} 
                          className="input-futuristic" 
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Security Signature Hash Algorithm</label>
                      <input 
                        type="text" 
                        value={settings.security.encryptionSettings} 
                        onChange={e => setSettings({...settings, security: {...settings.security, encryptionSettings: e.target.value}})} 
                        className="input-futuristic" 
                      />
                    </div>
                  </div>
                )}

                {/* SubTab 7: NOTIFICATIONS */}
                {settingsSubTab === 'notifications' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={settings.notifications.email} 
                          onChange={e => setSettings({...settings, notifications: {...settings.notifications, email: e.target.checked}})} 
                        />
                        <span>Enable Email Dispatching</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={settings.notifications.pushNotifications} 
                          onChange={e => setSettings({...settings, notifications: {...settings.notifications, pushNotifications: e.target.checked}})} 
                        />
                        <span>Enable Device Push Broadcasts</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={settings.notifications.sms} 
                          onChange={e => setSettings({...settings, notifications: {...settings.notifications, sms: e.target.checked}})} 
                        />
                        <span>Enable SMS Notifications</span>
                      </label>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Website Announcement Banner Text</label>
                      <input 
                        type="text" 
                        value={settings.notifications.announcementBanner} 
                        onChange={e => setSettings({...settings, notifications: {...settings.notifications, announcementBanner: e.target.value}})} 
                        className="input-futuristic" 
                      />
                    </div>
                  </div>
                )}

                {/* SubTab 8: ANALYTICS */}
                {settingsSubTab === 'analytics' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Google Analytics Tracking ID (Gtag)</label>
                      <input 
                        type="text" 
                        value={settings.analytics.googleAnalytics} 
                        onChange={e => setSettings({...settings, analytics: {...settings.analytics, googleAnalytics: e.target.value}})} 
                        className="input-futuristic" 
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <input 
                          type="checkbox" 
                          checked={settings.analytics.userStatistics === 'enabled'} 
                          onChange={e => setSettings({...settings, analytics: {...settings.analytics, userStatistics: e.target.checked ? 'enabled' : 'disabled'}})} 
                        />
                        <span>User Stats logging</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <input 
                          type="checkbox" 
                          checked={settings.analytics.aiStatistics === 'enabled'} 
                          onChange={e => setSettings({...settings, analytics: {...settings.analytics, aiStatistics: e.target.checked ? 'enabled' : 'disabled'}})} 
                        />
                        <span>AI query stats tracking</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <input 
                          type="checkbox" 
                          checked={settings.analytics.revenueReports === 'enabled'} 
                          onChange={e => setSettings({...settings, analytics: {...settings.analytics, revenueReports: e.target.checked ? 'enabled' : 'disabled'}})} 
                        />
                        <span>Stripe checkout analytics</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* SubTab 9: CONNECTED DEVICES */}
                {settingsSubTab === 'connected' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Active Wearables Integrations (APIs whitelist)
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.75rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <input type="checkbox" checked={settings.connectedDevices.appleHealth} onChange={e => setSettings({...settings, connectedDevices: {...settings.connectedDevices, appleHealth: e.target.checked}})} />
                        <span>Apple HealthKit Integration</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <input type="checkbox" checked={settings.connectedDevices.whoop} onChange={e => setSettings({...settings, connectedDevices: {...settings.connectedDevices, whoop: e.target.checked}})} />
                        <span>WHOOP Cloud Sync API</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <input type="checkbox" checked={settings.connectedDevices.garmin} onChange={e => setSettings({...settings, connectedDevices: {...settings.connectedDevices, garmin: e.target.checked}})} />
                        <span>Garmin Connect Sync API</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <input type="checkbox" checked={settings.connectedDevices.oura} onChange={e => setSettings({...settings, connectedDevices: {...settings.connectedDevices, oura: e.target.checked}})} />
                        <span>Oura Ring Sleep Cloud</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <input type="checkbox" checked={settings.connectedDevices.fitbit} onChange={e => setSettings({...settings, connectedDevices: {...settings.connectedDevices, fitbit: e.target.checked}})} />
                        <span>Fitbit Web API Integration</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <input type="checkbox" checked={settings.connectedDevices.samsungHealth} onChange={e => setSettings({...settings, connectedDevices: {...settings.connectedDevices, samsungHealth: e.target.checked}})} />
                        <span>Samsung Health Integration</span>
                      </label>
                    </div>
                    <div style={{ marginTop: '0.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Sync Execution Settings</label>
                      <select 
                        value={settings.connectedDevices.apiSyncSettings} 
                        onChange={e => setSettings({...settings, connectedDevices: {...settings.connectedDevices, apiSyncSettings: e.target.value}})} 
                        className="input-futuristic"
                        style={{ background: 'var(--bg-deep)' }}
                      >
                        <option value="immediate">Immediate Sync</option>
                        <option value="hourly">Hourly Sync</option>
                        <option value="daily">Daily Sync</option>
                      </select>
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleSaveSettings} 
                  className="btn-premium" 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '1rem', width: 'fit-content' }}
                >
                  <Save size={14} /> Commit Changes & Restart Node
                </button>
              </div>
            </div>
          )}

        </main>

      </div>

    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<AdminApp />);
}
