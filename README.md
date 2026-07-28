# NutriVerse 3D | Immersive AI Health & Nutrition SaaS

NutriVerse is an enterprise-grade, high-performance 3D Health and AI Nutrition SaaS platform. It combines immersive 3D graphics (Three.js/React Three Fiber) with a robust Express secure API gateway and an administrative command center to deliver a fully-isolated management console and a public user experience.

---

## 🚀 System Architecture

NutriVerse is built using a strict dual-application architecture to ensure maximum security, hiding administrative components from the public code bundles.

```mermaid
graph TD
    User([Public User]) -->|Visits /| PublicApp[Vite Public App bundle]
    Admin([Super Admin]) -->|Visits /admin.html| AdminApp[Vite Admin App bundle]
    
    subgraph Frontend Build (Vite)
        PublicApp -->|Does NOT contain| AdminApp
        PublicApp -->|Loads| UserModules[Dashboard, Food Scanner, AI Coach, Reports]
        AdminApp -->|Loads| AdminModules[User CRUD, Backups, Stats, Settings]
    end
    
    subgraph Backend APIs (Express)
        UserModules -->|Port 5000 /api/*| API[Security Gateway]
        AdminModules -->|Port 5000 /api/admin/*| API
        API -->|Access checks| DB[(JSON Shard Database)]
        API -->|Security logs| Audit[(Audit Logs)]
    end
```

---

## 🔑 Security Architecture & Threat Model

NutriVerse employs a zero-trust model between the public client and the administrative backend:

### 1. Zero Admin Leakage (Build-Time Code Splitting)
*   Administrative components, route layouts, and views are **completely excluded** from the main user build. Vite splits the build assets into separate pages: `index.html` (public) and `admin.html` (private).
*   Even if a user inspects the compiled JS bundles on the main site, they will find no reference to admin modules, statistics, or database schemas.

### 2. Session Security (Cryptographic JWT & HTTP-Only Cookies)
*   Authentications generate an **Access Token** (15m expiry) and a **Refresh Token** (7d expiry) using Node's native `crypto` HMAC-SHA256 signatures.
*   Tokens are transmitted in `httpOnly: true`, `SameSite: 'lax'`, `path: '/'` secure cookies. They are immune to client-side XSS theft.

### 3. Double-Submit CSRF Defenses
*   Every login response yields a unique, high-entropy CSRF token.
*   All state-mutating requests (`POST`, `PUT`, `DELETE`) are checked by the backend CSRF middleware, requiring the client to attach the token in the `X-CSRF-Token` header, matching the encrypted cookie value.

### 4. Router Interceptors & Guards
*   **Client-Side Route Interception**: An active path observer in `App.tsx` checks for direct url hits matching `/admin*`. If hit, the app logs a security alert, requests a backend security endpoint, throws a 403 Forbidden screen, and rewrites the history context to `/`.
*   **Server-Side Path Interception**: Direct hits on routes like `/admin`, `/admin/settings`, etc., return an **HTTP 403 Forbidden** page and force-redirect the browser to the home dashboard after 2 seconds.

---

## 🛠️ Main Feature Modules

### 1. Immersive 3D Parallax View
Renders interactive 3D models representing human biometrics (glowing double-helix DNA, beating cardiac channels, neural brain networks) that dynamically rotate and shift based on scroll sections.

### 2. AI Food Scanner
Enables users to analyze meal photos (camera snapshot, drag-and-drop file upload, or system paste). The Express backend processes the files and returns a complete macronutrient summary (Calories, Protein, Carbs, Fats) and vitamin metrics.

### 3. Speech-Synthesized AI Nutrition Coach
Speech-enabled conversational RAG assistant providing tailored advice for keto diets, glycemic index limits, or clinical concerns (like PCOS and Diabetes).

### 4. Custom Wellness Reports (`Reports.tsx`)
A dedicated user workspace to compile and preview health stats. Renders interactive export panels that generate download payloads in **PDF**, **CSV**, and **JSON** formats.

### 5. Private Super Admin Dashboard (`admin.tsx`)
*   **19 Interactive Widgets**: Real-time server diagnostics (CPU, memory, Kubernetes active nodes), user activity trackers, active subscription MRC charts, and support ticket registers.
*   **Backup & Restore Manager**: Allows immediate creation of JSON database snapshots, listing snapshots, full database restorations, and database vector search optimization.
*   **9-Section Settings Sidebar**: Granular panels to toggle GENERAL, AI, AUTH, DATABASE, PAYMENTS, SECURITY, NOTIFICATIONS, ANALYTICS, and CONNECTED DEVICES.

---

## 💾 Database & Storage Structure

All application states are persisted inside the workspace:
*   **`server/data/db.json`**: Stores user accounts, levels/XP status, food databases, active settings, and active announcements.
*   **`server/data/audit_log.json`**: Appends timestamps, emails, actions (e.g. `LOGIN_SUCCESSFUL`, `BACKUP_CREATED`), IP addresses, status, and detail logs for security audits.

---

## 🎨 Brand Identity

NutriVerse uses a custom-designed, futuristic vector branding system defined in **[Logo.tsx](file:///d:/final%20year%20proje/AI%20Food%20Manager/src/components/brand/Logo.tsx)**:
*   **Logo Symbol**: Abstract vector mark combining a circular universe orbit, AI network nodes, a green leaf, and a cyan DNA helix.
*   **Modes Supported**: Dynamic resizing (`16px` up to `512px`), dark/light contrast variants, label toggles (`showText`), and a monochrome mode (`mono`) for high-contrast print layouts.

---

## 🚀 Installation & Setup

### Prerequisites
*   Node.js (v18 or higher)
*   npm

### 1. Start the API Server (Express)
Open a terminal in the root folder and run:
```bash
npm run server
```
This launches the backend in file watch mode using `tsx --watch` on **`http://localhost:5000`**.

### 2. Start the Frontend (Vite)
Open a second terminal tab in the root folder and run:
```bash
npm run dev
```
This launches the dev server on **`http://localhost:5173`**.

---

## 🔑 Administrative Access
To access the private Admin Control Center:
1.  Navigate to: **[http://localhost:5173/admin.html](http://localhost:5173/admin.html)**
2.  Log in using the root Super Admin credentials:
    *   **Email**: `admin@nutriverse.fit`
    *   **Password**: `supersecretpassword1020`

---

## 📦 Production Bundling
To compile the separate production bundles:
```bash
npm run build
```
Vite will compile and output:
*   `dist/index.html` (Public App entry)
*   `dist/admin.html` (Admin Control Center entry)
*   `dist/assets/admin-[hash].js` (Isolated admin modules)
