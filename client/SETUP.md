# App-Admin Dashboard - Installation & Setup Guide

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd client
npm install
```

### Step 2: Start Development Server

```bash
npm run dev
```

The dashboard will be available at: **http://localhost:3000**

### Step 3: Ensure Backend is Running

Make sure the backend is running on:
```
http://localhost:8000
```

## 📋 Project Overview

This is a complete **App-Admin Dashboard** frontend for a multi-tenant ride-sharing platform.

### ✅ What's Included

✓ **Authentication System**
  - Login page with email/password
  - JWT token management
  - Protected routes
  - Automatic logout

✓ **Dashboard**
  - Summary metrics (total tenants, approved, pending, active)
  - Quick statistics overview
  - Professional card-based layout

✓ **Tenant Management**
  - View all registered tenants
  - Filter and search functionality
  - Detailed tenant view
  - One-click approve pending tenants
  - Tenant information display

✓ **Document Management**
  - Review uploaded tenant documents
  - Verify documents
  - Track verification status
  - Display pending documents warning

✓ **Admin Profile**
  - View admin account details
  - Logout functionality

✓ **UI Components**
  - Responsive layout with sidebar navigation
  - Professional Tailwind CSS styling
  - Reusable component library
  - Status badges and indicators
  - Loading spinners
  - Modal dialogs
  - Error handling

## 🎨 Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 18 | UI Framework |
| Vite | Build & Dev Server |
| Tailwind CSS | Styling |
| React Router v6 | Navigation & Routing |
| Axios | HTTP Requests |
| Lucide React | Icons |

## 📁 Project Structure

```
client/
├── src/
│   ├── app/                      # Application root
│   │   ├── App.jsx              # Main app wrapper
│   │   └── router.jsx           # Route configuration
│   │
│   ├── context/                  # Global state
│   │   └── AdminContext.jsx     # Admin auth & user data
│   │
│   ├── services/                 # API integration
│   │   └── api.js               # Axios client & endpoints
│   │
│   ├── guards/                   # Route protection
│   │   ├── ProtectedRoute.jsx   # Auth requirement
│   │   └── AppAdminGuard.jsx    # Role requirement
│   │
│   ├── components/               # Reusable UI
│   │   ├── layout/
│   │   │   ├── DashboardLayout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Topbar.jsx
│   │   └── common/
│   │       ├── Button.jsx
│   │       ├── Card.jsx
│   │       ├── StatusBadge.jsx
│   │       ├── Modal.jsx
│   │       └── Loader.jsx
│   │
│   ├── pages/                    # Page components
│   │   ├── auth/
│   │   │   └── Login.jsx
│   │   ├── dashboard/
│   │   │   └── Home.jsx
│   │   ├── tenants/
│   │   │   ├── TenantsList.jsx
│   │   │   └── TenantDetails.jsx
│   │   └── profile/
│   │       └── Profile.jsx
│   │
│   ├── styles/
│   │   └── index.css            # Global styles
│   │
│   └── main.jsx                  # Entry point
│
├── public/                        # Static assets
├── index.html                     # HTML template
├── vite.config.js                # Vite configuration
├── tailwind.config.js            # Tailwind setup
├── postcss.config.js             # PostCSS setup
├── package.json                  # Dependencies
└── README.md                      # Documentation
```

## 🔐 Authentication Flow

1. **Login Page** (`/login`)
   - User enters email and password
   - Credentials sent to `POST /api/v1/auth/admin/login`
   - Backend returns JWT token

2. **Token Processing**
   - JWT is decoded to extract user data
   - Token stored in localStorage as `access_token`
   - AdminContext updated with user info

3. **Protected Routes**
   - Dashboard routes require valid token
   - ProtectedRoute guard checks authentication
   - AppAdminGuard ensures app-admin role
   - Invalid tokens redirect to /login

4. **API Requests**
   - Axios interceptor automatically adds Authorization header
   - Format: `Authorization: Bearer <token>`

5. **Logout**
   - Clear token from localStorage
   - Reset AdminContext state
   - Redirect to login page

## 🛣 Available Routes

| Route | Page | Protection |
|-------|------|-----------|
| `/login` | Admin Login | ❌ Public |
| `/dashboard` | Dashboard Home | ✅ Auth + Admin |
| `/dashboard/tenants` | Tenants List | ✅ Auth + Admin |
| `/dashboard/tenants/:id` | Tenant Details | ✅ Auth + Admin |
| `/dashboard/profile` | Admin Profile | ✅ Auth + Admin |

## 📡 Backend API Integration

### Endpoint Summary

```
Auth:
POST   /api/v1/auth/admin/login

Tenants:
GET    /api/v1/app-admin/tenants
GET    /api/v1/app-admin/tenants/summary
GET    /api/v1/app-admin/tenants/{tenant_id}
POST   /api/v1/app-admin/tenants/{tenant_id}/approve

Documents:
GET    /api/v1/app-admin/tenants/{tenant_id}/documents
POST   /api/v1/app-admin/tenants/{tenant_id}/documents/{doc_id}/verify
```

All endpoints are configured in `src/services/api.js`

## 🎯 Key Features Explained

### Dashboard Home (`/dashboard`)
- Displays 4 summary cards:
  - Total Tenants
  - Approved Tenants
  - Pending Approvals
  - Active Tenants
- Shows quick statistics
- Calculates approval rate percentage

### Tenants List (`/dashboard/tenants`)
- Table view of all tenants
- Shows: Name, Email, Approval Status, Tenant Status, Created Date
- Actions:
  - **View**: Navigate to tenant details
  - **Approve**: Quick approve pending tenants
- Confirmation modal before approval

### Tenant Details (`/dashboard/tenants/:id`)
- Complete tenant information
- Documents section with:
  - Document type
  - Verification status
  - Upload date
  - Verify button (for pending docs)
- Approval button (only if all docs verified)
- Documents summary stats

### Document Verification
- Click "Verify" on any pending document
- Confirmation modal with document details
- Status updates to "verified" on success
- Cannot approve tenant until all docs verified

### Profile Page (`/dashboard/profile`)
- Display admin email and role
- Account status indicator
- Quick logout button
- Help & support section

## 🎨 Design Features

### Color System
- **Primary**: Indigo (main actions)
- **Success**: Emerald (positive actions, verified)
- **Warning**: Amber (pending, alerts)
- **Danger**: Red (rejections, destructive)
- **Neutral**: Slate (backgrounds, text)

### Responsive Design
- Mobile-friendly sidebar collapse ready
- Flexible grid layouts
- Responsive tables
- Touch-friendly buttons

### User Experience
- Loading spinners for async operations
- Error messages inline with forms
- Empty state messages
- Confirmation modals for critical actions
- Professional hover effects
- Smooth transitions

## 🚀 Development Commands

```bash
# Install dependencies
npm install

# Start development server (hot reload)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Lint code (if configured)
npm run lint
```

## ⚙️ Configuration

### API Base URL
Edit `src/services/api.js`:
```javascript
const API_BASE = 'http://localhost:8000/api/v1';
```

### Tailwind Customization
Edit `tailwind.config.js` to customize:
- Colors
- Spacing
- Typography
- Breakpoints

### Vite Dev Server
Edit `vite.config.js` to change:
- Port (default: 3000)
- Proxy settings
- Build options

## 🧪 Testing the Dashboard

### Login Credentials
Use the backend's admin credentials:
```
Email: admin@rideshare.com
Password: secure_password
```

(Adjust based on your backend setup)

### Test Workflows

1. **Login Flow**
   - Go to /login
   - Enter credentials
   - Should redirect to /dashboard

2. **Tenant Approval**
   - Go to /dashboard/tenants
   - Click "Approve" on pending tenant
   - Confirm in modal
   - Status should update

3. **Document Verification**
   - Click tenant name to view details
   - Click "Verify" on pending documents
   - Confirm verification
   - Status should update to verified

4. **Logout**
   - Click logout in sidebar or profile
   - Should redirect to /login
   - Token cleared from localStorage

## 🐛 Troubleshooting

### Port 3000 Already in Use
```bash
# Use different port
npm run dev -- --port 3001
```

### Backend Connection Issues
- Verify backend runs on `http://localhost:8000`
- Check CORS is enabled on backend
- Inspect network tab in DevTools

### Authentication Issues
- Clear localStorage and try logging in again
- Check token in DevTools > Application > LocalStorage
- Verify JWT format in browser console

### Styling Issues
- Clear browser cache
- Verify Tailwind CSS is imported in `src/styles/index.css`
- Check `tailwind.config.js` content paths

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [React Router Documentation](https://reactrouter.com)
- [Axios Documentation](https://axios-http.com)

## ✅ Checklist for Deployment

- [ ] Backend is configured and running
- [ ] Environment variables are set
- [ ] All API endpoints are tested
- [ ] Tailwind CSS builds correctly
- [ ] No console errors
- [ ] Authentication flow works
- [ ] All routes are accessible
- [ ] Responsive design tested on mobile
- [ ] Build command runs successfully
- [ ] Production build tested with preview command

## 🎉 You're All Set!

The App-Admin Dashboard is ready to use. Start the dev server and begin managing your platform!

```bash
npm run dev
```

Visit http://localhost:3000 and log in with your admin credentials.

---

For questions or issues, check the main README.md or backend documentation.
