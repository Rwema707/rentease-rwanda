# 🏠 RentEase Rwanda

**A Digital Property Management and Rental Platform**

> Prepared by: Gashumba Rwema Christian  
> Organization: African Leadership University (ALU), Rwanda  
> Assignment 2 | Date: 02/23/2026

---

## 📋 Overview

RentEase Rwanda is a full-stack web application that modernises property management and rent collection in Rwanda. It connects landlords and tenants through a secure digital platform supporting mobile money payments, automated rent reminders, and maintenance tracking.

---

## ✅ Implemented Features (All SRS Requirements)

| Req ID | Feature | Status |
|--------|---------|--------|
| FR 1.1 | User Registration | ✅ |
| FR 1.2 | Account Verification | ✅ |
| FR 1.3 | User Login (JWT) | ✅ |
| FR 2.1 | Create Property Listing | ✅ |
| FR 2.2 | Upload Property Images | ✅ |
| FR 2.3 | Edit Property Listing | ✅ |
| FR 2.4 | Deactivate Property Listing | ✅ |
| FR 3.1 | Search Properties | ✅ |
| FR 3.2 | Filter Properties | ✅ |
| FR 3.3 | View Property Details | ✅ |
| FR 4.1 | Submit Rental Request | ✅ |
| FR 4.2 | Approve/Reject Requests | ✅ |
| FR 5.1 | Pay Rent (MoMo simulated) | ✅ |
| FR 5.2 | Generate Digital Receipt | ✅ |
| FR 5.3 | View Payment History | ✅ |
| FR 6.1 | Schedule Rent Reminders | ✅ |
| FR 6.2 | Send Notifications | ✅ |
| FR 7.1 | Submit Maintenance Request | ✅ |
| FR 7.2 | View Maintenance Requests | ✅ |
| FR 7.3 | Update Maintenance Status | ✅ |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| Backend | Node.js, Express.js |
| Database | SQLite via sql.js (zero native deps) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| File Upload | Multer |
| Scheduling | node-cron |
| Payments | MTN MoMo / Airtel Money (simulated) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ → https://nodejs.org
- Git → https://git-scm.com

### 1. Clone / Setup
```bash
git clone https://github.com/YOUR_USERNAME/rentease-rwanda.git
cd rentease-rwanda
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env          # Edit if needed
node server.js
# → Running on http://localhost:5000
```

### 3. Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
# → Running on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## 🔑 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@rentease.rw | admin123 |
| Landlord | landlord@rentease.rw | landlord123 |
| Tenant | tenant@rentease.rw | tenant123 |

---

## 📁 Project Structure

```
rentease-rwanda/
├── backend/
│   ├── database/
│   │   └── db.js              # SQLite setup + seeding
│   ├── middleware/
│   │   └── auth.js            # JWT authentication
│   ├── routes/
│   │   ├── auth.js            # Register, login, profile
│   │   ├── properties.js      # CRUD property listings
│   │   ├── rentals.js         # Rental requests
│   │   ├── payments.js        # Rent payments + receipts
│   │   ├── maintenance.js     # Maintenance requests
│   │   ├── notifications.js   # Alerts + reminders
│   │   └── admin.js           # Admin reporting
│   ├── uploads/               # Property & maintenance images
│   ├── .env                   # Environment variables
│   ├── package.json
│   └── server.js              # Express app entry point
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── PropertyCard.jsx
    │   │   └── Modal.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Properties.jsx
    │   │   ├── PropertyDetail.jsx
    │   │   ├── TenantDashboard.jsx
    │   │   ├── LandlordDashboard.jsx
    │   │   └── AdminDashboard.jsx
    │   ├── api.js             # Axios client
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |
| GET | /api/properties | Browse/search properties |
| POST | /api/properties | Create listing (landlord) |
| PUT | /api/properties/:id | Edit listing |
| DELETE | /api/properties/:id | Deactivate listing |
| POST | /api/rentals | Submit rental request |
| PUT | /api/rentals/:id | Approve/reject request |
| POST | /api/payments | Pay rent |
| GET | /api/payments/history | Payment history |
| GET | /api/payments/receipt/:id | Get receipt |
| POST | /api/maintenance | Submit issue |
| PUT | /api/maintenance/:id | Update status |
| GET | /api/notifications | Get notifications |
| GET | /api/admin/stats | Platform stats (admin) |

---

## ☁️ Deployment

### Backend → Railway (free tier)
1. Push code to GitHub
2. Go to https://railway.app → New Project → Deploy from GitHub
3. Select repo → Root Directory: `backend`
4. Add env var: `JWT_SECRET=your_secret_here`
5. Copy the live URL

### Frontend → Vercel (free tier)
1. Go to https://vercel.com → New Project → Import from GitHub
2. Root Directory: `frontend`
3. Add env var: `VITE_API_URL=https://your-railway-url.railway.app`
4. Update `vite.config.js` proxy target to the Railway URL

### Environment Variables
```bash
# backend/.env
PORT=5000
JWT_SECRET=your_very_secret_key_here
FRONTEND_URL=http://localhost:5173
```

---

## 📝 Notes on Payment Integration

Currently payments are **simulated** (95% success rate). To integrate real MTN MoMo:

1. Register at https://momodeveloper.mtn.com
2. Get API credentials (Collection API)
3. In `backend/routes/payments.js`, replace the simulation block with:
```javascript
// MTN MoMo API call
const momoResponse = await fetch('https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay', {
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
});
```

---

## 📚 References
- IEEE Standard 830-1998 – SRS Best Practices
- MTN Mobile Money Developer API – https://momodeveloper.mtn.com
- Rwanda Data Protection Law No. 058/2021

---

*© 2026 RentEase Rwanda · African Leadership University*
