import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 5000;

// Pathing
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const LOG_PATH = path.join(DATA_DIR, 'audit_log.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

// Request Logger Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[HTTP] ${req.method} ${req.url} - Origin: ${req.headers.origin || 'None'}`);
  res.on('finish', () => {
    console.log(`[HTTP] Response: ${res.statusCode} for ${req.method} ${req.url}`);
  });
  next();
});

// CORS Configuration - Allow credentials
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage });

// JWT Core Implementation using native crypto (no extra dependency)
const JWT_SECRET = 'super-secret-key-nutriverse-3d-2026';

function signJwt(payload: any, expiresInSeconds: number): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp };
  
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
    
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyJwt(token: string): any {
  try {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) return null;
    
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');
      
    if (signature !== expectedSignature) return null;
    
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token Expired
    }
    return decodedPayload;
  } catch {
    return null;
  }
}

// Custom Cookie Parser middleware
function getCookies(req: Request): Record<string, string> {
  const list: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const name = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    if (name) {
      list[name] = decodeURIComponent(value);
    }
  });
  return list;
}

// Database Helpers
function loadDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (err) {
    console.error('[DB ERROR] Load failure. Re-initializing.', err);
    return null;
  }
}

function saveDb(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB ERROR] Save failure:', err);
  }
}

// Persistent Audit Logging Helper
function logAudit(email: string, action: string, ip: string, status: 'SUCCESS' | 'FAILED' | 'WARN', details?: string) {
  try {
    let logs = [];
    if (fs.existsSync(LOG_PATH)) {
      logs = JSON.parse(fs.readFileSync(LOG_PATH, 'utf8'));
    }
    const entry = {
      timestamp: new Date().toISOString(),
      email,
      action,
      ip,
      status,
      details: details || ''
    };
    logs.unshift(entry);
    if (logs.length > 500) logs.pop(); // Cap logs
    fs.writeFileSync(LOG_PATH, JSON.stringify(logs, null, 2), 'utf8');
  } catch (err) {
    console.error('[AUDIT ERROR] Logging failed:', err);
  }
}

// Rate Limiter middleware (sliding-window in memory)
const rateLimitStore = new Map<string, number[]>();

function rateLimiter(limit: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    
    if (!rateLimitStore.has(ip)) {
      rateLimitStore.set(ip, []);
    }
    
    let timestamps = rateLimitStore.get(ip)!;
    timestamps = timestamps.filter(t => now - t < windowMs);
    
    if (timestamps.length >= limit) {
      logAudit('System', 'RATE_LIMIT_TRIGGERED', ip, 'WARN', `IP: ${ip} exceeded API quota limits.`);
      return res.status(429).json({ error: 'Too many requests. Cyber intelligence shield active.' });
    }
    
    timestamps.push(now);
    rateLimitStore.set(ip, timestamps);
    next();
  };
}

// CSRF Protection middleware
function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Only check CSRF for mutating methods
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const cookies = getCookies(req);
    const csrfCookie = cookies['csrf_token'];
    const csrfHeader = req.headers['x-csrf-token'];
    
    if (!csrfCookie || csrfCookie !== csrfHeader) {
      logAudit('Anonymous', 'CSRF_VALIDATION_FAILURE', req.ip || 'unknown', 'FAILED', 'CSRF verification token mismatch.');
      return res.status(403).json({ error: 'CSRF token mismatch. Secure protocol aborted.' });
    }
  }
  next();
}

// Auth and Role Middleware
interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
    role: string;
    id?: string;
  };
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const cookies = getCookies(req);
  const token = cookies['access_token'];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthenticated. Sign-in signature required.' });
  }
  
  const payload = verifyJwt(token);
  if (!payload) {
    return res.status(401).json({ error: 'Session expired or signature invalid.' });
  }
  
  // Check if user is suspended
  const db = loadDb();
  const user = db?.users?.find((u: any) => u.email === payload.email);
  if (user && user.status === 'Suspended') {
    return res.status(403).json({ error: 'Your NutriVerse account has been suspended by administrative command.' });
  }

  req.user = {
    email: payload.email,
    role: user?.role || 'USER'
  };
  next();
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'SUPER_ADMIN') {
      logAudit(req.user?.email || 'Unknown', 'UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT', req.ip || 'unknown', 'FAILED');
      return res.status(403).json({ error: 'Access Denied: Administrative authority only.' });
    }
    next();
  });
}

// Validation Middleware
function validatePayload(schema: Record<string, string>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const body = req.body;
    for (const [key, type] of Object.entries(schema)) {
      if (body[key] === undefined) {
        return res.status(400).json({ error: `Validation error: Parameter '${key}' is required.` });
      }
      const actualType = Array.isArray(body[key]) ? 'array' : typeof body[key];
      if (actualType !== type) {
        return res.status(400).json({ error: `Validation error: Parameter '${key}' must be a ${type}.` });
      }
    }
    next();
  };
}

// ==========================================
// 1. PUBLIC WEBAPP INTERCEPT ROUTING
// ==========================================
app.get(['/admin', '/admin/settings', '/admin/users', '/admin/database', '/admin/security'], (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  logAudit('Anonymous User', 'FORBIDDEN_ROUTE_VISIT', ip, 'FAILED', `Attempted to access forbidden UI route: ${req.path}`);
  
  res.status(403).send(`
    <html>
      <head>
        <title>403 Forbidden</title>
        <style>
          body { background: #060412; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; flex-direction: column; text-align: center; }
          .card { background: rgba(255,255,255,0.02); border: 1.5px solid #f43f5e; border-radius: 16px; padding: 3rem 2rem; width: 420px; box-shadow: 0 0 35px rgba(244,63,94,0.15); }
          h1 { color: #f43f5e; font-size: 2.2rem; margin: 0 0 1rem 0; font-family: monospace; }
          p { color: #a1a1aa; font-size: 0.95rem; line-height: 1.4; margin-bottom: 2rem; }
          .loader { border: 3px solid rgba(255,255,255,0.1); border-top: 3px solid #f43f5e; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 0 auto; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>HTTP 403 FORBIDDEN</h1>
          <p>Access is restricted to authorized administrative personnel only. Retrying cryptographic handshake...</p>
          <div class="loader"></div>
        </div>
        <script>
          setTimeout(() => {
            window.location.href = "/";
          }, 2500);
        </script>
      </body>
    </html>
  `);
});

// ==========================================
// 2. AUTHENTICATION SERVICES
// ==========================================

// Login (Credentials)
app.post('/api/auth/login', rateLimiter(10, 60000), (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password signature required.' });
  }

  const db = loadDb();
  const user = db?.users?.find((u: any) => u.email === email);

  if (!user || user.passwordHash !== password) {
    logAudit(email, 'LOGIN_ATTEMPT', req.ip || 'unknown', 'FAILED', 'Invalid credential signature matching.');
    return res.status(401).json({ error: 'Invalid administrative or user credential signature.' });
  }

  if (user.status === 'Suspended') {
    logAudit(email, 'LOGIN_ATTEMPT', req.ip || 'unknown', 'FAILED', 'Suspended account login attempt.');
    return res.status(403).json({ error: 'Account suspended. Administrative clearance required.' });
  }

  // Issue CSRF Token
  const csrfToken = crypto.randomBytes(24).toString('hex');
  
  // Issue JWT tokens
  const accessToken = signJwt({ email: user.email, role: user.role }, 900); // 15 mins
  const refreshToken = signJwt({ email: user.email }, 604800); // 7 days

  // Store in cookies
  res.cookie('access_token', accessToken, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 900000 });
  res.cookie('refresh_token', refreshToken, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 604800000 });
  res.cookie('csrf_token', csrfToken, { sameSite: 'lax', path: '/', maxAge: 604800000 }); // Can be read by front-end

  logAudit(email, 'LOGIN_SUCCESSFUL', req.ip || 'unknown', 'SUCCESS', `User authenticated as role: ${user.role}`);
  
  res.json({
    email: user.email,
    role: user.role,
    csrfToken
  });
});

// Google OAuth Simulation
app.post('/api/auth/oauth/google', (req: Request, res: Response) => {
  const { email } = req.body;
  const db = loadDb();
  let user = db?.users?.find((u: any) => u.email === email);
  if (!user) {
    user = { email, role: 'USER', joinedAt: new Date().toISOString().split('T')[0], status: 'Active', tier: 'Free Plan', provider: 'Google OAuth' };
    db.users.push(user);
    saveDb(db);
  }
  
  const csrfToken = crypto.randomBytes(24).toString('hex');
  const accessToken = signJwt({ email: user.email, role: user.role }, 900);
  const refreshToken = signJwt({ email: user.email }, 604800);

  res.cookie('access_token', accessToken, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 900000 });
  res.cookie('refresh_token', refreshToken, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 604800000 });
  res.cookie('csrf_token', csrfToken, { sameSite: 'lax', path: '/', maxAge: 604800000 });

  res.json({ email: user.email, role: user.role, csrfToken });
});

// Apple OAuth Simulation
app.post('/api/auth/oauth/apple', (req: Request, res: Response) => {
  const { email } = req.body;
  const db = loadDb();
  let user = db?.users?.find((u: any) => u.email === email);
  if (!user) {
    user = { email, role: 'USER', joinedAt: new Date().toISOString().split('T')[0], status: 'Active', tier: 'Free Plan', provider: 'Apple ID' };
    db.users.push(user);
    saveDb(db);
  }
  
  const csrfToken = crypto.randomBytes(24).toString('hex');
  const accessToken = signJwt({ email: user.email, role: user.role }, 900);
  const refreshToken = signJwt({ email: user.email }, 604800);

  res.cookie('access_token', accessToken, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 900000 });
  res.cookie('refresh_token', refreshToken, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 604800000 });
  res.cookie('csrf_token', csrfToken, { sameSite: 'lax', path: '/', maxAge: 604800000 });

  res.json({ email: user.email, role: user.role, csrfToken });
});

// Send OTP Simulation
let lastGeneratedOtp = '';
app.post('/api/auth/otp/send', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email address target is required.' });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  lastGeneratedOtp = code;

  console.log(`[SECURITY ENVELOPE] OTP code issued for ${email}: ==> ${code} <==`);
  res.json({ success: true, message: 'OTP token sent to log streams.' });
});

// Verify OTP Simulation
app.post('/api/auth/otp/verify', (req: Request, res: Response) => {
  const { email, code } = req.body;
  if (code !== lastGeneratedOtp) {
    return res.status(400).json({ error: 'Invalid verification passcode signature.' });
  }

  const db = loadDb();
  let user = db?.users?.find((u: any) => u.email === email);
  if (!user) {
    user = { email, role: 'USER', joinedAt: new Date().toISOString().split('T')[0], status: 'Active', tier: 'Free Plan', provider: 'OTP Lock' };
    db.users.push(user);
    saveDb(db);
  }

  const csrfToken = crypto.randomBytes(24).toString('hex');
  const accessToken = signJwt({ email: user.email, role: user.role }, 900);
  const refreshToken = signJwt({ email: user.email }, 604800);

  res.cookie('access_token', accessToken, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 900000 });
  res.cookie('refresh_token', refreshToken, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 604800000 });
  res.cookie('csrf_token', csrfToken, { sameSite: 'lax', path: '/', maxAge: 604800000 });

  res.json({ email: user.email, role: user.role, csrfToken });
});

// Token Refresh
app.post('/api/auth/refresh', (req: Request, res: Response) => {
  const cookies = getCookies(req);
  const refreshCookie = cookies['refresh_token'];
  
  if (!refreshCookie) {
    return res.status(401).json({ error: 'Refresh token not found. Signature required.' });
  }
  
  const payload = verifyJwt(refreshCookie);
  if (!payload) {
    return res.status(401).json({ error: 'Refresh token expired or tampered.' });
  }
  
  const db = loadDb();
  const user = db?.users?.find((u: any) => u.email === payload.email);
  if (!user || user.status === 'Suspended') {
    return res.status(403).json({ error: 'Account invalid or suspended.' });
  }

  const csrfToken = crypto.randomBytes(24).toString('hex');
  const accessToken = signJwt({ email: user.email, role: user.role }, 900);

  res.cookie('access_token', accessToken, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 900000 });
  res.cookie('csrf_token', csrfToken, { sameSite: 'lax', path: '/', maxAge: 604800000 });

  res.json({
    email: user.email,
    role: user.role,
    csrfToken
  });
});

// Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  res.clearCookie('csrf_token');
  res.json({ success: true, message: 'Cryptographic session cleared successfully.' });
});

// Current User Details
app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = loadDb();
  const user = db?.users?.find((u: any) => u.email === req.user?.email);
  if (!user) return res.status(404).json({ error: 'User profiles offline.' });
  res.json({
    email: user.email,
    role: user.role,
    joinedAt: user.joinedAt,
    tier: user.tier,
    provider: user.provider
  });
});

// ==========================================
// 3. CORE USER APIs (Protected by requireAuth)
// ==========================================

// Food Scanner
app.post('/api/scan', requireAuth, upload.single('foodImage'), (req: AuthenticatedRequest, res: Response) => {
  const base64Image = req.body.imageUri;
  
  const mockScans: Record<string, any> = {
    'chicken': {
      foodName: 'Deep Fried Crispy Chicken Wings',
      servingSize: '220g (4 pieces)',
      cookingMethod: 'Deep Fried in Vegetable Oil',
      calories: 580,
      macros: { protein: '38g', carbs: '22g', fats: '36g', fiber: '0g', sugar: '2g' },
      micros: { vitamins: { 'Vitamin A': '2%', 'Vitamin B6': '15%' }, minerals: { 'Calcium': '2%', 'Iron': '6%' } },
      confidenceScore: 97.2,
      healthScore: 3,
      alternatives: [
        { name: 'Herb Grilled Chicken Breast', calories: 260, macros: { protein: '42g', carbs: '0g', fats: '6g', fiber: '0g', sugar: '0g' }, benefit: 'Reduces caloric load by 55% and saturated fat by 80% while retaining protein synthesis properties.' }
      ]
    },
    'salmon': {
      foodName: 'Wild Caught Seared Salmon Fillet',
      servingSize: '160g fillet',
      cookingMethod: 'Pan-Seared in Light Olive Oil',
      calories: 320,
      macros: { protein: '34g', carbs: '0g', fats: '18g', fiber: '0g', sugar: '0g' },
      micros: { vitamins: { 'Vitamin D': '120%' }, minerals: { 'Potassium': '14%' } },
      confidenceScore: 98.6,
      healthScore: 9,
      alternatives: [
        { name: 'Steamed Lemon-Dill Salmon', calories: 280, macros: { protein: '34g', carbs: '14g', fats: '10g', fiber: '0g', sugar: '0g' }, benefit: 'Eliminates added oils, conserving pure omega-3 profiles.' }
      ]
    }
  };

  let targetProfile = mockScans['salmon'];
  
  if (req.file) {
    const filename = req.file.originalname.toLowerCase();
    if (filename.includes('chicken') || filename.includes('fry')) {
      targetProfile = mockScans['chicken'];
    }
  } else if (base64Image && (base64Image.includes('chicken') || base64Image.includes('fry'))) {
    targetProfile = mockScans['chicken'];
  }
  
  res.json(targetProfile);
});

// AI Coach Chatbot
app.post('/api/chat', requireAuth, csrfProtection, (req: AuthenticatedRequest, res: Response) => {
  const { messages, context } = req.body;
  const lastMessage = messages[messages.length - 1]?.text || '';
  const goal = context?.goal || 'General Health';
  const query = lastMessage.toLowerCase();
  
  let reply = '';
  if (query.includes('keto')) {
    reply = `Based on your biometrics context and target: [${goal}], my neural RAG mapping outlines a keto matrix containing 70% Fats, 25% Protein, and 5% Carbs. Avoid refined sugars. Highlight seared salmon, whole eggs, and leaf spinach in your splits.`;
  } else if (query.includes('diabetes') || query.includes('sugar')) {
    reply = `Given your dietary guidelines for glucose stabilization, keep glycemic indices low. Highlight high-fiber grain bases like black wild rice or quinoa. Substitute breakfast logs with avocado tofu scrambles.`;
  } else if (query.includes('pcos')) {
    reply = `For insulin management matching PCOS telemetry splits, integrate anti-inflammatory proteins. Minimize seed oil configurations, replacing them with wild salmon or organic avocados, and target a 40-30-30 macro split.`;
  } else {
    reply = `Calibrating health core matrix for: [${goal}]. Weekly caloric bounds set at 2200 kcal. Recommend logging a 45-minute cardiorespiratory split (HRV zones 2/3) and consuming 2.2g of protein per kg bodyweight.`;
  }
  
  res.json({ reply });
});

// Diet Planner
app.post('/api/planner', requireAuth, csrfProtection, (req: AuthenticatedRequest, res: Response) => {
  const { age, gender, height, weight, goal, activity, cuisine, budget } = req.body;
  
  const weightFactor = 10 * Number(weight || 75);
  const heightFactor = 6.25 * Number(height || 180);
  const ageFactor = 5 * Number(age || 25);
  
  const baseBmr = gender === 'male' 
    ? weightFactor + heightFactor - ageFactor + 5 
    : weightFactor + heightFactor - ageFactor - 161;

  let activityMultiplier = 1.2;
  if (activity === 'light') activityMultiplier = 1.375;
  if (activity === 'moderate') activityMultiplier = 1.55;
  if (activity === 'heavy') activityMultiplier = 1.725;

  const tdee = Math.round(baseBmr * activityMultiplier);
  let targetCalories = tdee;
  if (goal === 'Weight Loss') targetCalories = tdee - 450;
  if (goal === 'Muscle Gain') targetCalories = tdee + 350;

  const proteinGrams = Math.round(Number(weight || 75) * 2.0);
  const fatCalories = targetCalories * 0.25;
  const fatGrams = Math.round(fatCalories / 9);
  const carbCalories = targetCalories - (proteinGrams * 4) - fatCalories;
  const carbGrams = Math.max(50, Math.round(carbCalories / 4));

  let breakfast = 'Oats porridge with blueberries';
  let lunch = 'Grilled Chicken and Quinoa';
  let dinner = 'Baked Salmon with Asparagus';
  let snack = 'Greek Yogurt with chia seeds';

  if (cuisine === 'mediterranean') {
    breakfast = 'Greek feta toast with olive oil';
    lunch = 'Tuna Salad with chickpeas and herbs';
    dinner = 'Baked Cod with roasted vegetables';
    snack = 'Mixed walnuts and dried figs';
  } else if (cuisine === 'asian') {
    breakfast = 'Tofu scramble with spinach';
    lunch = 'Steamed chicken and brown rice';
    dinner = 'Baked Salmon with ginger soy glaze';
    snack = 'Edamame pods with sea salt';
  } else if (cuisine === 'indian') {
    breakfast = 'Paneer bhurji with whole wheat roti';
    lunch = 'Dal tadka with red quinoa';
    dinner = 'Tandoori Tilapia with stir fry greens';
    snack = 'Roasted chickpeas';
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weeklyPlan = days.map(day => ({
    day,
    breakfast,
    lunch,
    dinner,
    snack,
    calories: targetCalories,
    macros: { protein: `${proteinGrams}g`, carbs: `${carbGrams}g`, fats: `${fatGrams}g` }
  }));

  const shoppingList = [
    { item: 'Fresh Salmon Fillet', category: 'Proteins', qty: '1.2 kg', estCost: budget === 'premium' ? '$36' : '$24' },
    { item: 'Organic Asparagus', category: 'Produce', qty: '800g', estCost: '$8' },
    { item: 'Organic Quinoa', category: 'Grains', qty: '1 kg', estCost: '$10' },
    { item: 'Fresh Lemons', category: 'Produce', qty: '5 pieces', estCost: '$3' },
    { item: 'Extra Virgin Olive Oil', category: 'Dairy & Fats', qty: '500ml', estCost: '$12' }
  ];

  res.json({
    bmr: Math.round(baseBmr),
    tdee,
    targetCalories,
    macros: { protein: `${proteinGrams}g`, carbs: `${carbGrams}g`, fats: `${fatGrams}g` },
    weeklyPlan,
    shoppingList
  });
});

// Recipe Generator
app.post('/api/recipe', requireAuth, csrfProtection, (req: AuthenticatedRequest, res: Response) => {
  const { ingredients, goal, cuisine, calories, protein, budget, cookingTime } = req.body;
  
  const targetCal = Number(calories) || 450;
  const targetProt = Number(protein) || 35;
  const resolvedTime = Number(cookingTime) || 20;

  let title = 'Lemon Herb Seared Protein Bowl';
  let desc = 'A quick seared protein meal optimized for recovery guidelines.';
  let instructions = [
    'Season protein slice with dry herbs, pepper, and sea salt.',
    'Heat olive oil on skillet to medium-hot, sear for 4 minutes skin-down.',
    'Add green asparagus and toss. Flip protein, cook for 3-4 minutes.',
    'Plate over warm target grain base (quinoa/brown rice).'
  ];
  let shopping = [
    { item: 'Fresh Salmon Fillet', qty: '160g', cost: budget === 'premium' ? '$6.50' : '$4.50' },
    { item: 'Green Asparagus spears', qty: '100g', cost: '$1.50' }
  ];
  let alternatives = [
    { item: 'White Rice', swap: 'Cauliflower Rice', save: '-180 kcal', macroEffect: 'Lowers glycemic load, adds fiber.' }
  ];

  if (String(ingredients).toLowerCase().includes('chicken')) {
    title = 'Pan-Roasted Herb Chicken Breasts';
    desc = 'Lean high-protein chicken breast seared with garlic and asparagus.';
    shopping = [
      { item: 'Organic Chicken Breast', qty: '180g', cost: '$3.50' },
      { item: 'Broccoli florets', qty: '120g', cost: '$1.00' }
    ];
  }

  const proteinCals = targetProt * 4;
  const fatCals = targetCal * 0.28;
  const fatGrams = Math.round(fatCals / 9);
  const carbCals = targetCal - proteinCals - fatCals;
  const carbGrams = Math.max(5, Math.round(carbCals / 4));

  res.json({
    title,
    description: desc,
    cuisine,
    goal,
    cookingTime: `${resolvedTime} mins`,
    nutrition: { calories: targetCal, protein: `${targetProt}g`, carbs: `${carbGrams}g`, fats: `${fatGrams}g` },
    instructions,
    shoppingList: shopping,
    alternatives
  });
});

// Stripe Checkout Simulation
app.post('/api/stripe/checkout', requireAuth, csrfProtection, (req: AuthenticatedRequest, res: Response) => {
  const { tier } = req.body;
  const sessionId = `cs_test_${crypto.randomBytes(12).toString('hex')}`;
  
  res.json({
    sessionId,
    checkoutUrl: `http://localhost:5000/api/stripe/checkout-portal?session=${sessionId}&tier=${encodeURIComponent(tier)}&email=${encodeURIComponent(req.user?.email || '')}`
  });
});

app.get('/api/stripe/checkout-portal', (req: Request, res: Response) => {
  const { session, tier, email } = req.query;
  res.send(`
    <html>
      <head>
        <title>Stripe Checkout Core</title>
        <style>
          body { background: #060412; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 2.5rem; width: 380px; text-align: center; box-shadow: 0 12px 40px rgba(0,0,0,0.55); }
          button { background: #06b6d4; border: none; border-radius: 8px; color: #060412; font-weight: bold; width: 100%; padding: 0.85rem; margin-top: 1.5rem; cursor: pointer; font-size: 0.95rem; transition: background 0.2s; }
          button:hover { background: #22d3ee; }
        </style>
      </head>
      <body>
        <div class="card">
          <h3 style="margin:0 0 0.5rem 0;">Stripe Checkout Secure Gate</h3>
          <p style="color: #888; font-size: 0.8rem; font-family: monospace;">Session: ${session}</p>
          <p style="font-size: 1.3rem; font-weight: bold; color: #06b6d4; margin: 1.5rem 0 0.5rem 0;">${tier}</p>
          <p style="font-size: 0.85rem; color: #aaa;">Billing target: ${email}</p>
          <form action="/api/stripe/webhook" method="POST">
            <input type="hidden" name="session" value="${session}" />
            <input type="hidden" name="tier" value="${tier}" />
            <input type="hidden" name="email" value="${email}" />
            <button type="submit">Authorize Stripe Payment</button>
          </form>
        </div>
      </body>
    </html>
  `);
});

app.post('/api/stripe/webhook', (req: Request, res: Response) => {
  const { tier, email } = req.body;
  const db = loadDb();
  
  if (db && email) {
    db.users = db.users.map((u: any) => {
      if (u.email === email) {
        return { ...u, tier: String(tier) };
      }
      return u;
    });
    saveDb(db);
    logAudit(String(email), 'STRIPE_SUBSCRIPTION_UPGRADE', req.ip || 'unknown', 'SUCCESS', `Upgraded to: ${tier}`);
  }

  res.send(`
    <html>
      <head><meta http-equiv="refresh" content="2;url=http://localhost:5173" /></head>
      <body style="background: #060412; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh;">
        <div style="text-align: center;">
          <h2 style="color: #10b981; margin:0 0 0.5rem 0;">Payment Authorized Successfully</h2>
          <p>Activating credentials for: <strong>${tier}</strong>. Syncing...</p>
        </div>
      </body>
    </html>
  `);
});


// ==========================================
// 4. PRIVATE ADMIN CONTROL CENTER APIs (SUPER_ADMIN only)
// ==========================================

// Administrative Stats Overview
app.get('/api/admin/stats', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = loadDb();
  const logs = fs.existsSync(LOG_PATH) ? JSON.parse(fs.readFileSync(LOG_PATH, 'utf8')) : [];

  // Calculate some simple aggregates
  const totalUsers = db.users.length;
  const activeSubs = db.users.filter((u: any) => u.tier !== 'Free Plan' && u.role !== 'SUPER_ADMIN').length;
  const suspendedUsers = db.users.filter((u: any) => u.status === 'Suspended').length;
  
  // Simulated Revenue analytics
  const revenueMRR = activeSubs * 29;
  const revenueLTV = (activeSubs * 180) + 1200; // Mock cumulative logic
  
  // AI Metrics
  const aiTokensCount = 1845000;
  const aiVisionCalls = 4520;
  const avgResponseTimeMs = 380;

  // GPU Node parameters
  const nodes = [
    { id: 'aws-us-east-eks-gpu-01', type: 'g5.2xlarge (NVIDIA A10G)', cpu: '68%', mem: '78%', status: 'Healthy' },
    { id: 'aws-us-east-eks-gpu-02', type: 'g5.2xlarge (NVIDIA A10G)', cpu: '42%', mem: '84%', status: 'Healthy' },
    { id: 'aws-us-east-eks-cpu-01', type: 'c6i.xlarge', cpu: '18%', mem: '52%', status: 'Healthy' },
    { id: 'aws-us-east-db-postgres-01', type: 'db.r6g.2xlarge', cpu: '24%', mem: '69%', status: 'Healthy' }
  ];

  res.json({
    summary: {
      totalUsers,
      activeSubs,
      suspendedUsers,
      revenueMRR,
      revenueLTV,
      aiTokensCount,
      aiVisionCalls,
      avgResponseTimeMs
    },
    nodes,
    auditLogs: logs.slice(0, 100) // return last 100 logs
  });
});

// System Settings
app.get('/api/admin/settings', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = loadDb();
  res.json(db.settings);
});

app.post('/api/admin/settings', requireAdmin, csrfProtection, (req: AuthenticatedRequest, res: Response) => {
  const db = loadDb();
  db.settings = req.body;
  saveDb(db);
  logAudit(req.user?.email || 'Admin', 'SETTINGS_UPDATE', req.ip || 'unknown', 'SUCCESS', 'Modified global administrative configurations.');
  res.json({ success: true, settings: db.settings });
});

// User Management Registry
app.get('/api/admin/users', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = loadDb();
  res.json(db.users);
});

app.post('/api/admin/users/status', requireAdmin, csrfProtection, (req: AuthenticatedRequest, res: Response) => {
  const { email, status } = req.body;
  if (!email || !status) return res.status(400).json({ error: 'Missing parameters.' });

  const db = loadDb();
  db.users = db.users.map((u: any) => {
    if (u.email === email) {
      if (u.role === 'SUPER_ADMIN') return u; // Protect super admin from suspension
      return { ...u, status };
    }
    return u;
  });
  saveDb(db);
  logAudit(req.user?.email || 'Admin', 'USER_STATUS_CHANGE', req.ip || 'unknown', 'SUCCESS', `User ${email} status changed to ${status}`);
  res.json({ success: true, users: db.users });
});

app.post('/api/admin/users/role', requireAdmin, csrfProtection, (req: AuthenticatedRequest, res: Response) => {
  const { email, role, tier } = req.body;
  if (!email) return res.status(400).json({ error: 'Email target required.' });

  const db = loadDb();
  db.users = db.users.map((u: any) => {
    if (u.email === email) {
      return { ...u, role: role || u.role, tier: tier || u.tier };
    }
    return u;
  });
  saveDb(db);
  logAudit(req.user?.email || 'Admin', 'USER_ROLE_TIER_UPDATE', req.ip || 'unknown', 'SUCCESS', `Updated privileges for ${email}: Role=${role}, Tier=${tier}`);
  res.json({ success: true, users: db.users });
});

app.delete('/api/admin/users/:email', requireAdmin, csrfProtection, (req: AuthenticatedRequest, res: Response) => {
  const { email } = req.params;
  const db = loadDb();
  
  const user = db.users.find((u: any) => u.email === email);
  if (user && user.role === 'SUPER_ADMIN') {
    return res.status(400).json({ error: 'Cannot delete the Super Admin root account.' });
  }

  db.users = db.users.filter((u: any) => u.email !== email);
  saveDb(db);
  logAudit(req.user?.email || 'Admin', 'USER_DELETION', req.ip || 'unknown', 'SUCCESS', `Deleted account registration for: ${email}`);
  res.json({ success: true, users: db.users });
});

// CRUD Manager: Food Nutrition Index
app.get('/api/admin/food', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = loadDb();
  res.json(db.foodItems);
});

app.post('/api/admin/food', requireAdmin, csrfProtection, (req: AuthenticatedRequest, res: Response) => {
  const { name, calories, protein, carbs, fats } = req.body;
  const db = loadDb();
  const newId = db.foodItems.length > 0 ? Math.max(...db.foodItems.map((f: any) => f.id)) + 1 : 1;
  const newItem = { id: newId, name, calories: Number(calories), protein: Number(protein), carbs: Number(carbs), fats: Number(fats) };
  db.foodItems.push(newItem);
  saveDb(db);
  logAudit(req.user?.email || 'Admin', 'FOOD_ITEM_CREATION', req.ip || 'unknown', 'SUCCESS', `Created food entity: ${name}`);
  res.json({ success: true, foodItems: db.foodItems });
});

app.put('/api/admin/food/:id', requireAdmin, csrfProtection, (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const { name, calories, protein, carbs, fats } = req.body;
  const db = loadDb();
  db.foodItems = db.foodItems.map((f: any) => {
    if (f.id === id) {
      return { ...f, name, calories: Number(calories), protein: Number(protein), carbs: Number(carbs), fats: Number(fats) };
    }
    return f;
  });
  saveDb(db);
  logAudit(req.user?.email || 'Admin', 'FOOD_ITEM_UPDATE', req.ip || 'unknown', 'SUCCESS', `Updated food ID: ${id}`);
  res.json({ success: true, foodItems: db.foodItems });
});

app.delete('/api/admin/food/:id', requireAdmin, csrfProtection, (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const db = loadDb();
  db.foodItems = db.foodItems.filter((f: any) => f.id !== id);
  saveDb(db);
  logAudit(req.user?.email || 'Admin', 'FOOD_ITEM_DELETION', req.ip || 'unknown', 'SUCCESS', `Deleted food ID: ${id}`);
  res.json({ success: true, foodItems: db.foodItems });
});

// CRUD Manager: Workout Split Templates
app.get('/api/admin/workouts', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = loadDb();
  res.json(db.workoutItems);
});

app.post('/api/admin/workouts', requireAdmin, csrfProtection, (req: AuthenticatedRequest, res: Response) => {
  const { name, level, duration } = req.body;
  const db = loadDb();
  const newId = db.workoutItems.length > 0 ? Math.max(...db.workoutItems.map((w: any) => w.id)) + 1 : 1;
  const newItem = { id: newId, name, level, duration };
  db.workoutItems.push(newItem);
  saveDb(db);
  logAudit(req.user?.email || 'Admin', 'WORKOUT_TEMPLATE_CREATION', req.ip || 'unknown', 'SUCCESS', `Created workout template: ${name}`);
  res.json({ success: true, workoutItems: db.workoutItems });
});

app.put('/api/admin/workouts/:id', requireAdmin, csrfProtection, (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const { name, level, duration } = req.body;
  const db = loadDb();
  db.workoutItems = db.workoutItems.map((w: any) => {
    if (w.id === id) {
      return { ...w, name, level, duration };
    }
    return w;
  });
  saveDb(db);
  logAudit(req.user?.email || 'Admin', 'WORKOUT_TEMPLATE_UPDATE', req.ip || 'unknown', 'SUCCESS', `Updated workout template ID: ${id}`);
  res.json({ success: true, workoutItems: db.workoutItems });
});

app.delete('/api/admin/workouts/:id', requireAdmin, csrfProtection, (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const db = loadDb();
  db.workoutItems = db.workoutItems.filter((w: any) => w.id !== id);
  saveDb(db);
  logAudit(req.user?.email || 'Admin', 'WORKOUT_TEMPLATE_DELETION', req.ip || 'unknown', 'SUCCESS', `Deleted workout template ID: ${id}`);
  res.json({ success: true, workoutItems: db.workoutItems });
});

// CRUD Manager: Recipe Items
app.get('/api/admin/recipes', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = loadDb();
  res.json(db.recipes);
});

app.post('/api/admin/recipes', requireAdmin, csrfProtection, (req: AuthenticatedRequest, res: Response) => {
  const { title, description, calories, protein, cookingTime, instructions } = req.body;
  const db = loadDb();
  const newId = db.recipes.length > 0 ? Math.max(...db.recipes.map((r: any) => r.id)) + 1 : 1;
  
  const parsedInstructions = Array.isArray(instructions) 
    ? instructions 
    : String(instructions).split('\n').filter(l => l.trim() !== '');

  const newItem = { 
    id: newId, 
    title, 
    description, 
    calories: Number(calories), 
    protein: Number(protein), 
    cookingTime, 
    instructions: parsedInstructions 
  };
  
  db.recipes.push(newItem);
  saveDb(db);
  logAudit(req.user?.email || 'Admin', 'RECIPE_TEMPLATE_CREATION', req.ip || 'unknown', 'SUCCESS', `Created recipe template: ${title}`);
  res.json({ success: true, recipes: db.recipes });
});

app.put('/api/admin/recipes/:id', requireAdmin, csrfProtection, (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const { title, description, calories, protein, cookingTime, instructions } = req.body;
  const db = loadDb();
  
  const parsedInstructions = Array.isArray(instructions) 
    ? instructions 
    : String(instructions).split('\n').filter(l => l.trim() !== '');

  db.recipes = db.recipes.map((r: any) => {
    if (r.id === id) {
      return { ...r, title, description, calories: Number(calories), protein: Number(protein), cookingTime, instructions: parsedInstructions };
    }
    return r;
  });
  saveDb(db);
  logAudit(req.user?.email || 'Admin', 'RECIPE_TEMPLATE_UPDATE', req.ip || 'unknown', 'SUCCESS', `Updated recipe template ID: ${id}`);
  res.json({ success: true, recipes: db.recipes });
});

app.delete('/api/admin/recipes/:id', requireAdmin, csrfProtection, (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const db = loadDb();
  db.recipes = db.recipes.filter((r: any) => r.id !== id);
  saveDb(db);
  logAudit(req.user?.email || 'Admin', 'RECIPE_TEMPLATE_DELETION', req.ip || 'unknown', 'SUCCESS', `Deleted recipe template ID: ${id}`);
  res.json({ success: true, recipes: db.recipes });
});

// Support Tickets Manager
app.get('/api/admin/tickets', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = loadDb();
  res.json(db.tickets);
});

app.post('/api/admin/tickets/:id/resolve', requireAdmin, csrfProtection, (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const { response } = req.body;
  const db = loadDb();
  
  db.tickets = db.tickets.map((t: any) => {
    if (t.id === id) {
      return { ...t, status: 'Closed', response };
    }
    return t;
  });
  saveDb(db);
  logAudit(req.user?.email || 'Admin', 'SUPPORT_TICKET_RESOLVE', req.ip || 'unknown', 'SUCCESS', `Resolved support ticket ID: ${id}`);
  res.json({ success: true, tickets: db.tickets });
});

// User Feedback Manager
app.get('/api/admin/feedback', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = loadDb();
  res.json(db.feedback);
});

// Advertisement Campaigns Manager
app.get('/api/admin/ads', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = loadDb();
  res.json(db.advertisements);
});

app.post('/api/admin/ads', requireAdmin, csrfProtection, (req: AuthenticatedRequest, res: Response) => {
  const { id, campaignName, bannerUrl, destinationUrl, active } = req.body;
  const db = loadDb();
  
  if (id) {
    // Edit existing ad
    db.advertisements = db.advertisements.map((ad: any) => {
      if (ad.id === Number(id)) {
        return { ...ad, campaignName, bannerUrl, destinationUrl, active: Boolean(active) };
      }
      return ad;
    });
    logAudit(req.user?.email || 'Admin', 'AD_CAMPAIGN_UPDATE', req.ip || 'unknown', 'SUCCESS', `Modified campaign: ${campaignName}`);
  } else {
    // Create new ad
    const newId = db.advertisements.length > 0 ? Math.max(...db.advertisements.map((a: any) => a.id)) + 1 : 1;
    const newAd = { id: newId, campaignName, bannerUrl, destinationUrl, impressions: 0, clicks: 0, active: Boolean(active) };
    db.advertisements.push(newAd);
    logAudit(req.user?.email || 'Admin', 'AD_CAMPAIGN_CREATION', req.ip || 'unknown', 'SUCCESS', `Created campaign: ${campaignName}`);
  }
  
  saveDb(db);
  res.json({ success: true, advertisements: db.advertisements });
});

// File Manager Service
app.get('/api/admin/files', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const getFiles = (dir: string): any[] => {
    const list: any[] = [];
    if (!fs.existsSync(dir)) return list;
    const files = fs.readdirSync(dir);
    files.forEach(f => {
      const fullPath = path.join(dir, f);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        // Skip backups directory nested recursively
        if (f !== 'backups') {
          list.push({ name: f, isDir: true, size: 0, path: fullPath });
        }
      } else {
        list.push({ name: f, isDir: false, size: stat.size, path: fullPath });
      }
    });
    return list;
  };

  const fileList = [
    ...getFiles(DATA_DIR),
    ...getFiles(BACKUP_DIR).map(b => ({ ...b, name: `backups/${b.name}` }))
  ];
  
  res.json(fileList);
});

// Database Backup, Restore, Optimization Manager
app.post('/api/admin/database/backup', requireAdmin, csrfProtection, (req: AuthenticatedRequest, res: Response) => {
  const db = loadDb();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilename = `backup_${timestamp}.json`;
  const backupPath = path.join(BACKUP_DIR, backupFilename);
  
  fs.writeFileSync(backupPath, JSON.stringify(db, null, 2), 'utf8');
  logAudit(req.user?.email || 'Admin', 'DATABASE_BACKUP_CREATED', req.ip || 'unknown', 'SUCCESS', `Snapshot saved to: ${backupFilename}`);
  
  res.json({ success: true, message: `Backup snap file '${backupFilename}' created successfully.` });
});

app.get('/api/admin/database/backups', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const backups = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json'));
  res.json(backups);
});

app.post('/api/admin/database/restore', requireAdmin, csrfProtection, (req: AuthenticatedRequest, res: Response) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ error: 'Backup filename parameter required.' });

  const backupPath = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(backupPath)) {
    return res.status(404).json({ error: `Selected backup snapshot '${filename}' not found.` });
  }

  const backupContent = fs.readFileSync(backupPath, 'utf8');
  fs.writeFileSync(DB_PATH, backupContent, 'utf8');
  
  logAudit(req.user?.email || 'Admin', 'DATABASE_RESTORED', req.ip || 'unknown', 'SUCCESS', `System restored from snapshot: ${filename}`);
  res.json({ success: true, message: `System database successfully restored from snapshot '${filename}'.` });
});

app.post('/api/admin/database/optimize', requireAdmin, csrfProtection, (req: AuthenticatedRequest, res: Response) => {
  // Simulate database index optimization and pgvector index updates
  const db = loadDb();
  // Simply pretty print the JSON database file to run cleanup
  saveDb(db);
  
  logAudit(req.user?.email || 'Admin', 'DATABASE_OPTIMIZATION', req.ip || 'unknown', 'SUCCESS', 'Executed pgvector shard index re-balancing.');
  res.json({ success: true, message: 'Database tables and index hashes successfully optimized.' });
});

app.get('/api/admin/audit-logs', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  if (fs.existsSync(LOG_PATH)) {
    const logs = JSON.parse(fs.readFileSync(LOG_PATH, 'utf8'));
    return res.json(logs);
  }
  res.json([]);
});

// App Listen
app.listen(port, () => {
  console.log(`[NUTRIVERSE API] Secure SaaS gateway running at http://localhost:${port}`);
});
