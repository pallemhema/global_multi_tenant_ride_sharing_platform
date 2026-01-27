# 🏗️ Architecture & Flow Diagrams

## 📊 Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                        │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    App.jsx (Root)                        │ │
│  │  ┌──────────────────────────────────────────────────┐   │ │
│  │  │  AdminProvider (Context)                          │   │ │
│  │  │  ├─ token                                         │   │ │
│  │  │  ├─ user (decoded JWT)                           │   │ │
│  │  │  ├─ role (app-admin)                             │   │ │
│  │  │  ├─ isAuthenticated                              │   │ │
│  │  │  ├─ login()                                       │   │ │
│  │  │  └─ logout()                                      │   │ │
│  │  │                                                    │   │ │
│  │  │  ┌──────────────────────────────────────────┐    │   │ │
│  │  │  │  Router / Routes                          │    │   │ │
│  │  │  │  ├─ /login (Login.jsx)                   │    │   │ │
│  │  │  │  ├─ /dashboard (ProtectedRoute)          │    │   │ │
│  │  │  │  │  ├─ DashboardLayout                   │    │   │ │
│  │  │  │  │  ├─ Sidebar                           │    │   │ │
│  │  │  │  │  ├─ Topbar                            │    │   │ │
│  │  │  │  │  └─ Outlet (nested routes)            │    │   │ │
│  │  │  │  │     ├─ / (Home.jsx)                   │    │   │ │
│  │  │  │  │     ├─ /tenants (TenantsList.jsx)     │    │   │ │
│  │  │  │  │     ├─ /tenants/:id (Details.jsx)     │    │   │ │
│  │  │  │  │     └─ /profile (Profile.jsx)         │    │   │ │
│  │  │  │  └─ AppAdminGuard (role check)           │    │   │ │
│  │  │  └──────────────────────────────────────────┘    │   │ │
│  │  └──────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  Styling: Tailwind CSS                                       │
│  HTTP: Axios (with JWT interceptor)                          │
│  State: React Context (AdminContext)                         │
│  Routing: React Router v6                                    │
└─────────────────────────────────────────────────────────────┘

                            ↓↓↓

         ┌────────────────────────────────┐
         │    Backend API Server          │
         │  (http://localhost:8000)       │
         │                                │
         │  POST   /auth/admin/login      │
         │  GET    /app-admin/tenants     │
         │  GET    /app-admin/summary     │
         │  POST   /app-admin/approve     │
         │  GET    /documents             │
         │  POST   /documents/verify      │
         └────────────────────────────────┘
```

---

## 🔐 Authentication Flow

```
User
  │
  ├─ Visit /login
  │
  ├─ Enter credentials (email, password)
  │
  ├─ Click "Sign In"
  │
  ├─ POST /api/v1/auth/admin/login
  │   ↓
  │   Backend validates
  │   Backend returns: { "access_token": "jwt..." }
  │
  ├─ Frontend decodes JWT
  │   ├─ Extract: email, sub (user ID), exp (expiry), role
  │
  ├─ Store in localStorage as "access_token"
  │
  ├─ Update AdminContext
  │   ├─ token = jwt
  │   ├─ user = { email, sub, ... }
  │   ├─ role = "app-admin"
  │   ├─ isAuthenticated = true
  │
  ├─ Redirect to /dashboard
  │
  └─ All API requests include:
      Authorization: Bearer <token>
```

---

## 🛡️ Route Protection Flow

```
User navigates to /dashboard
  │
  ├─ Hits <Route path="/dashboard" element={<ProtectedRoute>...}>
  │
  ├─ ProtectedRoute Component Checks:
  │   ├─ Is isAuthenticated = true?
  │   │   ├─ YES → Continue to next guard
  │   │   └─ NO → Redirect to /login
  │   │
  │   └─ Is loading = false?
  │       ├─ YES → Render children
  │       └─ NO → Show <Loader />
  │
  ├─ AppAdminGuard Component Checks:
  │   ├─ Is role = "app-admin"?
  │   │   ├─ YES → Render component
  │   │   └─ NO → Show "Access Denied"
  │
  └─ Dashboard renders with layout
```

---

## 📊 Component Hierarchy

```
App.jsx
├── AdminProvider (Context)
│   └── Router
│       ├── <Route path="/login">
│       │   └── Login.jsx
│       │
│       └── <Route path="/dashboard">
│           ├── ProtectedRoute
│           │   └── AppAdminGuard
│           │       └── DashboardLayout.jsx
│           │           ├── Sidebar.jsx
│           │           │   ├── Button
│           │           │   └── Links
│           │           │
│           │           ├── Topbar.jsx
│           │           │   └── Button
│           │           │
│           │           └── <Outlet>
│           │               ├── Home.jsx
│           │               │   └── Card, StatusBadge, Loader
│           │               │
│           │               ├── TenantsList.jsx
│           │               │   ├── Card
│           │               │   ├── StatusBadge
│           │               │   └── Modal
│           │               │
│           │               ├── TenantDetails.jsx
│           │               │   ├── Card
│           │               │   ├── StatusBadge
│           │               │   ├── Button
│           │               │   └── Modal
│           │               │
│           │               └── Profile.jsx
│           │                   ├── Card
│           │                   └── Button
```

---

## 🔄 Tenant Approval Workflow

```
Admin User
  │
  ├─ Navigate to /dashboard/tenants
  │   ├─ Fetch all tenants (GET /app-admin/tenants)
  │   ├─ Display in table
  │   └─ Show "Approve" button for pending tenants
  │
  ├─ Click "Approve" on tenant
  │   ├─ Modal opens: "Approve {tenant.name}?"
  │   └─ Show tenant details for confirmation
  │
  ├─ Confirm in modal
  │   ├─ POST /app-admin/tenants/{tenant_id}/approve
  │   ├─ Update UI state
  │   └─ approval_status: "pending" → "approved"
  │
  └─ Success message shown
      └─ Table updates automatically
```

---

## 📄 Document Verification Workflow

```
Admin User
  │
  ├─ Navigate to /dashboard/tenants/{tenantId}
  │   ├─ Fetch tenant details
  │   ├─ Fetch documents (GET /app-admin/tenants/{id}/documents)
  │   └─ Display documents table
  │
  ├─ See pending documents
  │   ├─ Show count in summary
  │   ├─ Show warning: "Documents pending"
  │   └─ Disable "Approve Tenant" button
  │
  ├─ Click "Verify" on document
  │   ├─ Modal opens: "Verify {document_type}?"
  │   └─ Show document details
  │
  ├─ Confirm verification
  │   ├─ POST /app-admin/tenants/{id}/documents/{doc_id}/verify
  │   ├─ Update status: "pending" → "verified"
  │   ├─ Update table
  │   └─ Close modal
  │
  ├─ After all documents verified
  │   ├─ Enable "Approve Tenant" button
  │   └─ Show success message
  │
  └─ Click "Approve Tenant"
      └─ Tenant approval workflow starts
```

---

## 📡 API Call Sequence

```
User Login Flow:
┌─────────┐                      ┌──────────┐
│ Frontend│                      │ Backend  │
└────┬────┘                      └────┬─────┘
     │                                │
     │─ POST /auth/admin/login ───────>│
     │ {email, password}               │
     │                                │
     │<─ {access_token: "jwt..."}─────│
     │                                │
     ├─ Decode JWT                     │
     ├─ Store in localStorage          │
     ├─ Update context                 │
     │                                │
     └─ Redirect /dashboard           │

Subsequent API Calls:
┌─────────┐                      ┌──────────┐
│ Frontend│                      │ Backend  │
└────┬────┘                      └────┬─────┘
     │                                │
     │─ GET /app-admin/tenants ───────>│
     │ Header: Authorization: Bearer JWT
     │                                │
     │<─ {tenants: [...]} ────────────│
     │                                │
     ├─ Render data                    │
     │                                │

Logout Flow:
     │─ POST /auth/logout (optional)──>│
     │                                │
     ├─ Clear token from localStorage  │
     ├─ Reset AdminContext             │
     │                                │
     └─ Redirect /login               │
```

---

## 🎨 Component Communication

```
AdminContext
  ↑      ↑      ↑      ↑      ↑
  │      │      │      │      │
  │      │      │      │      │
Login   Dashboard Sidebar Topbar Profile
  │         │        │      │      │
  ├─────────┴────────┴──────┴──────┘
  │
  └─ useAdmin() hook (custom hook)
      returns: { token, user, role, isAuthenticated, login, logout }
```

---

## 📊 Data Flow (Tenants Page)

```
TenantsList Component Mounts
  │
  ├─ useEffect hook runs
  │   └─ Call appAdminAPI.getTenants()
  │       └─ Axios GET /app-admin/tenants
  │           └─ Interceptor adds Authorization header
  │
  ├─ Loading state: true → Show <Loader />
  │
  ├─ API Response arrives
  │   └─ setState(response.data)
  │
  ├─ Loading state: false
  │
  ├─ Render table with tenants
  │   ├─ Map through tenants array
  │   ├─ Show each row with data
  │   ├─ Show StatusBadge components
  │   └─ Show action buttons
  │
  ├─ User clicks "Approve"
  │   ├─ Open Modal component
  │   └─ Show confirmation
  │
  ├─ User confirms
  │   ├─ Call appAdminAPI.approveTenant(id)
  │   ├─ Approving state: true → Disable button
  │   ├─ API updates tenant status
  │   ├─ Approving state: false
  │   ├─ Close modal
  │   ├─ Update state (change approval_status)
  │   └─ Table re-renders
  │
  └─ Status badge updates to "approved"
```

---

## 🔀 State Management Flow

```
App Component
  │
  └─ <AdminProvider>
      │
      ├─ Reads localStorage.access_token
      ├─ Decodes JWT if exists
      ├─ Sets initial state
      │  ├─ token
      │  ├─ user
      │  ├─ role
      │  ├─ isAuthenticated
      │  └─ loading
      │
      ├─ Exports useAdmin() hook
      │
      └─ All children can access context
         ├─ Login.jsx
         ├─ ProtectedRoute.jsx
         ├─ AppAdminGuard.jsx
         ├─ Sidebar.jsx
         ├─ Topbar.jsx
         ├─ Dashboard pages
         └─ Any component calling useAdmin()
```

---

## 🎯 Error Handling Flow

```
API Call Made
  │
  ├─ Try Block
  │   ├─ Call API
  │   ├─ Get response
  │   └─ Update state with data
  │
  ├─ Catch Block
  │   ├─ Error received
  │   ├─ Extract message from err.response?.data?.detail
  │   ├─ Set error state
  │   ├─ Render error message in UI
  │   │
  │   └─ User sees:
  │       ├─ Error box (red background)
  │       ├─ Error message
  │       └─ Can retry action
  │
  └─ Finally Block
      └─ Set loading: false
```

---

## 📈 Deployment Architecture (Production)

```
┌────────────────────────────────┐
│     CDN / Static Hosting        │
│  (Vercel / Netlify / S3)        │
│                                 │
│  ├─ index.html                  │
│  ├─ /js (React + App code)      │
│  ├─ /css (Tailwind compiled)    │
│  └─ /assets (images, fonts)     │
└────────────────────────────────┘
         ↓ HTTPS
┌────────────────────────────────┐
│   Browser / Client Device       │
│                                 │
│  ├─ Render React App            │
│  ├─ Manage local state          │
│  └─ Handle user interactions    │
└────────────────────────────────┘
         ↓ API Requests
┌────────────────────────────────┐
│   Backend API Server            │
│  (Python FastAPI)               │
│                                 │
│  ├─ Auth endpoints              │
│  ├─ Tenant management           │
│  ├─ Document verification       │
│  └─ Database access             │
└────────────────────────────────┘
         ↓
┌────────────────────────────────┐
│     Database (PostgreSQL)       │
│                                 │
│  ├─ Tenants                     │
│  ├─ Documents                   │
│  ├─ Users                       │
│  └─ Admin logs                  │
└────────────────────────────────┘
```

---

## 🔄 Build Process

```
Source Code (src/)
  │
  ├─ JavaScript files (.jsx)
  ├─ CSS files (.css)
  ├─ Config files
  │
  └─ Vite Build Process
      │
      ├─ Parse & Analyze
      │   ├─ Import statements
      │   ├─ Dependencies
      │   └─ Assets
      │
      ├─ Transform
      │   ├─ JSX → JavaScript
      │   ├─ CSS → Tailwind compiled
      │   └─ Assets → Optimized
      │
      ├─ Bundle
      │   ├─ Code splitting
      │   ├─ Tree shaking
      │   └─ Minification
      │
      └─ Output (dist/)
          │
          ├─ index.html
          ├─ js/
          │   ├─ main.xxxxx.js
          │   └─ vendor.xxxxx.js
          └─ css/
              └─ style.xxxxx.css
```

---

## 📱 Responsive Breakpoints

```
Mobile         Tablet         Desktop
320px-640px    641px-1024px   1025px+

┌──────────────┐┌─────────────┐┌──────────────┐
│              ││             ││              │
│  • No sidebar││ • Sidebar   ││ • Fixed      │
│  • Full width││   visible   ││   sidebar    │
│  • Stack     ││ • Multi-    ││ • Grid       │
│    layout    ││   column    ││   layouts    │
│              ││   grid      ││              │
└──────────────┘└─────────────┘└──────────────┘
```

---

## 🎨 CSS Cascade

```
Tailwind Base Classes (from tailwindcss/base)
  ↓ (Reset styles)
Tailwind Components (from tailwindcss/components)
  ↓ (Reusable classes)
Tailwind Utilities (from tailwindcss/utilities)
  ↓ (Individual utilities)
Custom CSS (index.css)
  ↓ (Global overrides)
Inline Styles (style props)
  ↓
Computed Styles (Final styling)
```

---

This architecture ensures:
- ✅ Clean separation of concerns
- ✅ Reusable components
- ✅ Centralized state management
- ✅ Secure authentication
- ✅ Scalable structure
- ✅ Maintainable codebase
