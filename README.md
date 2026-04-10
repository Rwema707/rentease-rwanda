# 🏠 RentEase Rwanda

**A Digital Property Management and Rental Platform**

> **Prepared by:** Gashumba Rwema Christian
> **Institution:** African Leadership University (ALU), Rwanda
> **Course:** Software Engineering — Summative Assessment
> **Date:** 03/23/2026

---

## 🌐 Live Deployment

| Service | URL |
|---------|-----|
| **Frontend (Vercel)** | https://rentease-rwanda.vercel.app |
| **Backend API (Railway)** | https://rentease-rwanda-production.up.railway.app |
| **API Health Check** | https://rentease-rwanda-production.up.railway.app/api/health |
| **API Status + DB Check** | https://rentease-rwanda-production.up.railway.app/api/status |

---

## 📋 Overview

RentEase Rwanda is a full-stack web application that modernises property management and rent collection in Rwanda. It connects landlords and tenants through a secure digital platform supporting MTN Mobile Money and Airtel Money payments, automated rent reminders, maintenance tracking, and role-based dashboards for Tenants, Landlords, and Administrators.

---

## ✅ All SRS Requirements Implemented

| Req ID | Feature | Status |
|--------|---------|--------|
| FR 1.1 | User Registration (name, email, phone, password, role) | ✅ |
| FR 1.2 | Account Verification (token-based) | ✅ |
| FR 1.3 | User Login with JWT + role-based redirect | ✅ |
| FR 2.1 | Create Property Listing | ✅ |
| FR 2.2 | Upload Property Images (Multer) | ✅ |
| FR 2.3 | Edit Property Listing | ✅ |
| FR 2.4 | Deactivate Property Listing | ✅ |
| FR 3.1 | Search Properties by location/district | ✅ |
| FR 3.2 | Filter by price, rooms, property type | ✅ |
| FR 3.3 | View Full Property Details | ✅ |
| FR 4.1 | Tenant Submits Rental Request | ✅ |
| FR 4.2 | Landlord Approves / Rejects Request | ✅ |
| FR 5.1 | Pay Rent via MTN MoMo / Airtel Money | ✅ |
| FR 5.2 | Generate Digital Receipt (unique RCT-RW-XXXX number) | ✅ |
| FR 5.3 | View Full Payment History | ✅ |
| FR 6.1 | Schedule Automated Rent Reminders (node-cron, daily 8AM) | ✅ |
| FR 6.2 | In-app Notifications (real-time bell, unread badge) | ✅ |
| FR 7.1 | Tenant Submits Maintenance Request with Priority | ✅ |
| FR 7.2 | Landlord Views All Maintenance Requests | ✅ |
| FR 7.3 | Landlord Updates Status (Pending → In Progress → Completed) | ✅ |
| NFR 1 | JWT Auth + Role-Based Access Control (tenant/landlord/admin) | ✅ |
| NFR 2 | Scalable REST API Architecture | ✅ |
| NFR 5 | Admin Reporting Dashboard (users, payments, properties) | ✅ |

---

## 🔑 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@rentease.rw | admin123 |
| Landlord | landlord@rentease.rw | landlord123 |
| Tenant | tenant@rentease.rw | tenant123 |

> These accounts are **automatically seeded** when the server starts for the first time. 6 sample properties are also pre-loaded.

---

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + Vite + React Router v6 | UI, routing, SPA |
| Styling | Custom CSS (Rwanda-inspired design system) | No CSS framework — handcrafted |
| Backend | Node.js + Express.js | REST API server |
| Database | SQLite via `sql.js` (pure JS, no native compilation) | Zero-dependency SQLite |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` | Secure login & sessions |
| File Upload | Multer | Property & maintenance images |
| Scheduling | `node-cron` | Daily 8AM rent reminder job |
| Payments | MTN MoMo / Airtel Money *(simulated, 95% success)* | Rent payment processing |
| Frontend Deploy | Vercel | Free tier, auto-deploy from GitHub |
| Backend Deploy | Railway | Free tier, auto-deploy from GitHub |

> **Why `sql.js` instead of `better-sqlite3`?** Railway's build environment cannot compile native Node.js addons. `sql.js` is a WebAssembly port of SQLite that requires zero compilation — it works identically on any platform.

---

## 🚀 Local Setup — Step by Step

### Prerequisites

Install these before starting:
- **Node.js 18+** → https://nodejs.org (download LTS version)
- **Git** → https://git-scm.com
- **VS Code** → https://code.visualstudio.com *(recommended)*

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/Rwema707/rentease-rwanda.git
cd rentease-rwanda
```

---

### Step 2 — Set Up the Backend

Open a terminal in the `backend/` folder:

```bash
cd backend
npm install
cp .env.example .env
node server.js
```

You should see:

```
╔══════════════════════════════════════╗
║    🏠  RentEase Rwanda API           ║
║    http://localhost:5000             ║
║                                      ║
║  Demo accounts:                      ║
║  admin@rentease.rw   / admin123      ║
║  landlord@rentease.rw/ landlord123   ║
║  tenant@rentease.rw  / tenant123     ║
╚══════════════════════════════════════╝
✅ Database initialized successfully
✅ 6 sample properties seeded
```

Verify the backend is working:
```
http://localhost:5000/api/health
```
Should return: `{"status":"ok","service":"RentEase Rwanda API"}`

---

### Step 3 — Set Up the Frontend

Open a **second terminal** in the `frontend/` folder:

```bash
cd frontend
npm install
npm run dev
```

You should see:
```
  VITE v5.x  ready in 300ms
  ➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in your browser. ✅

---

### Step 4 — Environment Variables

The backend `.env` file (created from `.env.example`) contains:

```bash
PORT=5000
JWT_SECRET=rentease_rwanda_change_this_in_production
FRONTEND_URL=http://localhost:5173
```

> **For production (Railway):** Set `JWT_SECRET` to a long random string and `FRONTEND_URL` to your Vercel URL.

---

## 📁 Project Structure

```
rentease-rwanda/
├── railway.toml               ← Railway monorepo build config
├── nixpacks.toml              ← Nixpacks Node.js runtime config
├── .gitignore
├── README.md
│
├── backend/
│   ├── database/
│   │   └── db.js              # sql.js SQLite setup + auto-seeding
│   ├── middleware/
│   │   └── auth.js            # JWT token verification + role guard
│   ├── routes/
│   │   ├── auth.js            # POST /register, POST /login, GET /me
│   │   ├── properties.js      # CRUD listings + image upload
│   │   ├── rentals.js         # Rental requests + approval
│   │   ├── payments.js        # MoMo payments + receipts + history
│   │   ├── maintenance.js     # Maintenance requests + status updates
│   │   ├── notifications.js   # Notifications + cron scheduler
│   │   └── admin.js           # Admin stats + audit reports
│   ├── uploads/               # Uploaded images (gitignored)
│   ├── .env.example           ← Copy to .env and fill in values
│   ├── package.json
│   └── server.js              # Express entry point
│
└── frontend/
    ├── vercel.json            ← Vercel proxy config (routes /api/* to Railway)
    ├── vite.config.js         ← Dev proxy to localhost:5000
    ├── index.html
    ├── package.json
    └── src/
        ├── api.js             # Axios client (auto-attaches JWT header)
        ├── App.jsx            # Routes + ErrorBoundary + ProtectedRoute
        ├── main.jsx
        ├── index.css          # Rwanda-inspired design system (CSS vars)
        ├── components/
        │   ├── Navbar.jsx     # Top nav + notification bell + user menu
        │   ├── PropertyCard.jsx
        │   ├── Modal.jsx
        │   └── ErrorBoundary.jsx  # Catches React crashes, shows error
        ├── context/
        │   └── AuthContext.jsx    # JWT auth state (validates user shape)
        └── pages/
            ├── Home.jsx           # Landing page + property search
            ├── Login.jsx
            ├── Register.jsx
            ├── Properties.jsx     # Browse + filter properties
            ├── PropertyDetail.jsx # Detail + rental request
            ├── TenantDashboard.jsx
            ├── LandlordDashboard.jsx
            └── AdminDashboard.jsx
```

---

## 🌐 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Register (tenant or landlord) |
| POST | `/api/auth/login` | None | Login, returns JWT token |
| GET | `/api/auth/me` | JWT | Get current user profile |
| PUT | `/api/auth/profile` | JWT | Update name / phone |
| PUT | `/api/auth/change-password` | JWT | Change password |

### Properties
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/properties` | None | Search & filter (public) |
| GET | `/api/properties/:id` | None | Property detail (public) |
| GET | `/api/properties/landlord/mine` | Landlord | Own listings |
| POST | `/api/properties` | Landlord | Create listing + images |
| PUT | `/api/properties/:id` | Landlord | Edit listing |
| DELETE | `/api/properties/:id` | Landlord | Deactivate listing |

### Rentals
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/rentals` | Tenant | Submit rental request |
| PUT | `/api/rentals/:id` | Landlord | Approve or reject |
| GET | `/api/rentals/landlord` | Landlord | Incoming requests |
| GET | `/api/rentals/tenant` | Tenant | Own requests |

### Payments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payments` | Tenant | Pay rent (MoMo/Airtel) |
| GET | `/api/payments/tenancy` | Tenant | Active tenancy info |
| GET | `/api/payments/history` | JWT | Payment history |
| GET | `/api/payments/receipt/:id` | JWT | Single receipt |

### Maintenance
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/maintenance` | Tenant | Submit request |
| GET | `/api/maintenance/tenant` | Tenant | Own requests |
| GET | `/api/maintenance/landlord` | Landlord | All requests |
| PUT | `/api/maintenance/:id` | Landlord | Update status + notes |

### Notifications
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notifications` | JWT | Get notifications + unread count |
| PUT | `/api/notifications/read` | JWT | Mark as read |
| POST | `/api/notifications/send-reminder` | Landlord | Manual rent reminder |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/stats` | Admin | Platform statistics |
| GET | `/api/admin/users` | Admin | All users |
| GET | `/api/admin/payments` | Admin | All transactions |

### Diagnostics
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | None | Server health check |
| GET | `/api/status` | None | DB connection + seed status |

---

## ☁️ Deployment Guide

### Backend → Railway

1. Push your code to GitHub (repo must be public)
2. Go to https://railway.app → **New Project** → **Deploy from GitHub**
3. Select `rentease-rwanda` repo
4. Set **Root Directory** to `backend`
5. Under **Variables**, add:
   ```
   JWT_SECRET=your_long_random_secret_here
   FRONTEND_URL=https://rentease-rwanda.vercel.app
   ```
6. Railway generates a URL like `https://rentease-rwanda-production.up.railway.app`
7. Verify it works: visit `YOUR_RAILWAY_URL/api/health`

> **Troubleshooting Railway:** If the build fails with "Railpack could not determine how to build", make sure `railway.toml` and `nixpacks.toml` are in the **repo root** (not inside `backend/`).

---

### Frontend → Vercel

1. Go to https://vercel.com → **New Project** → **Import from GitHub**
2. Select `rentease-rwanda` repo
3. Set **Root Directory** to `frontend`
4. Click **Deploy** — Vercel auto-detects Vite
5. After deploy, update `frontend/vercel.json` with your Railway URL:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://YOUR-RAILWAY-URL.up.railway.app/api/:path*"
    },
    {
      "source": "/uploads/:path*",
      "destination": "https://YOUR-RAILWAY-URL.up.railway.app/uploads/:path*"
    },
    {
      "source": "/((?!api|uploads).*)",
      "destination": "/index.html"
    }
  ]
}
```

6. Push the updated `vercel.json` → Vercel redeploys automatically

> **Important:** The SPA fallback uses `/((?!api|uploads).*)` — a negative lookahead — to prevent Vercel's rewrite engine from intercepting API calls and causing an infinite loop.

---

## 💳 Payment Integration Notes

Payments are currently **simulated** with a 95% success rate for demo purposes. To connect real MTN MoMo:

1. Register at https://momodeveloper.mtn.com
2. Get your Collection API subscription key
3. In `backend/routes/payments.js`, replace the simulation block with:

```javascript
const momoResponse = await fetch(
  'https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${await getMomoToken()}`,
      'X-Reference-Id': transactionId,
      'X-Target-Environment': 'sandbox',
      'Ocp-Apim-Subscription-Key': process.env.MTN_SUBSCRIPTION_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: String(amount),
      currency: 'RWF',
      externalId: transactionId,
      payer: { partyIdType: 'MSISDN', partyId: phone_number },
      payerMessage: `Rent payment for ${tenancy.ptitle}`,
      payeeNote: `Rent - ${month_covered}`
    })
  }
);
```

4. Add `MTN_SUBSCRIPTION_KEY` to your Railway environment variables

---

## 🔧 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Railway build fails | Native addon compilation | `sql.js` (pure JS) is already used — no fix needed |
| `Cannot GET /` on Railway URL | Express has no root route | Visit `/api/health` instead — that's correct |
| Vercel shows "Infinite loop" | Old `vercel.json` catch-all | Use negative lookahead: `/((?!api|uploads).*)` |
| Login shows "Infinite loop" | Vercel rewrite misconfiguration | Update `vercel.json` with exact Railway URL |
| Blank white page after login | React error #31 — object in JSX | `AuthContext` validates user shape; `ErrorBoundary` catches crashes |
| `better-sqlite3` fails to install | Node-gyp can't compile | Project uses `sql.js` — no native compilation needed |

---

## 📚 References

- IEEE Standard 830-1998 — Recommended Practice for SRS
- MTN Mobile Money Developer API — https://momodeveloper.mtn.com
- Rwanda Data Protection Law No. 058/2021 (Law No. 058/2021 of 13/10/2021)
- React Router v6 Documentation — https://reactrouter.com
- Railway Deployment Docs — https://docs.railway.app
- Vercel Deployment Docs — https://vercel.com/docs

---

*© 2026 RentEase Rwanda · African Leadership University · Gashumba Rwema Christian*