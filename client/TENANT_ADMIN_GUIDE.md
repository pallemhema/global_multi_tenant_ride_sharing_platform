# Tenant Admin Dashboard - Complete Setup Guide

## 🎯 Project Overview

The Tenant Admin Dashboard is a comprehensive React + Tailwind CSS UI for managing tenant operations in the RideShare platform. It's built with the same design patterns as the App Admin Dashboard but tailored specifically for tenant administrators.

## 📁 Folder Structure

```
client/
├── src/
│   ├── api/
│   │   └── tenantAdminApi.js ..................... Tenant Admin API endpoints
│   ├── auth/
│   │   └── Login.jsx ............................ Shared login for App & Tenant Admin
│   ├── context/
│   │   └── AdminContext.jsx ..................... Extended with role & tenant_id support
│   ├── guards/
│   │   ├── ProtectedRoute.jsx .................. Base authentication guard
│   │   ├── AppAdminGuard.jsx ................... App Admin role protection
│   │   └── TenantAdminGuard.jsx ................ Tenant Admin role protection
│   ├── layouts/
│   │   ├── DashboardLayout.jsx ................. App Admin layout (shared with /dashboard)
│   │   └── TenantAdminLayout.jsx ............... Tenant Admin layout (for /tenant-admin)
│   ├── pages/
│   │   ├── app-admin/ .......................... App Admin specific pages
│   │   ├── appAdmin/ ........................... App Admin pages (existing)
│   │   ├── auth/ ............................... Login page (shared)
│   │   ├── dashboard/ .......................... App Admin dashboard
│   │   ├── profile/ ............................ App Admin profile
│   │   ├── tenants/ ............................ App Admin tenants management
│   │   └── tenant-admin/ ....................... Tenant Admin pages
│   │       ├── Dashboard.jsx
│   │       ├── Documents.jsx
│   │       ├── Regions.jsx
│   │       ├── Vehicles.jsx
│   │       ├── FleetOwners.jsx
│   │       ├── Drivers.jsx
│   │       └── Profile.jsx
│   ├── components/
│   │   ├── common/ ............................. Shared components
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Loader.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── StatusBadge.jsx
│   │   ├── layout/ ............................ Layout components
│   │   │   ├── DashboardLayout.jsx
│   │   │   ├── Sidebar.jsx (App Admin)
│   │   │   └── Topbar.jsx (App Admin)
│   │   └── tenant-admin/ ...................... Tenant Admin specific components
│   │       ├── StatCard.jsx
│   │       ├── DataTable.jsx
│   │       ├── EmptyState.jsx
│   │       └── ConfirmModal.jsx
│   ├── services/
│   │   ├── api.js ............................. App Admin API endpoints
│   │   └── tenantAdminApi.js .................. Tenant Admin API endpoints
│   ├── app/
│   │   ├── App.jsx ............................ Root app component
│   │   └── router.jsx ......................... Routes for both admin types
│   └── main.jsx
```

## 🔐 Authentication Flow

### Login (Unified)
```
User → /login → POST /api/v1/auth/admin/login
```

**Response:**
```json
{
  "access_token": "Bearer token",
  "role": "app-admin" | "tenant-admin",
  "tenant_id": "uuid (only for tenant-admin)"
}
```

### Role-Based Routing
- **app-admin** → `/dashboard` (App Admin Dashboard)
- **tenant-admin** → `/tenant-admin/dashboard` (Tenant Admin Dashboard)

## 🗺️ Routes Structure

### App Admin Routes (`/dashboard/...`)
```
/dashboard
├── /dashboard (Dashboard Home)
├── /dashboard/tenants (Tenants List)
├── /dashboard/tenants/create (Create Tenant)
├── /dashboard/tenants/:tenantId (Tenant Details)
├── /dashboard/tenants/:tenantId/admin/create (Create Tenant Admin)
├── /dashboard/tenants/:tenantId/documents (Tenant Documents)
├── /dashboard/tenants/:tenantId/approve (Approve Tenant)
└── /dashboard/profile (App Admin Profile)
```

### Tenant Admin Routes (`/tenant-admin/...`)
```
/tenant-admin
├── /tenant-admin/dashboard (Dashboard)
├── /tenant-admin/documents (Documents Management)
├── /tenant-admin/regions (Regions Management)
├── /tenant-admin/vehicles (Vehicles Approval)
├── /tenant-admin/fleet-owners (Fleet Owners Approval)
├── /tenant-admin/drivers (Drivers Approval)
└── /tenant-admin/profile (Tenant Admin Profile)
```

## 🧩 Component Architecture

### Shared Components (both admin types use)
- **Button.jsx** - Reusable button with variants
- **Card.jsx** - Card container component
- **Loader.jsx** - Loading spinner
- **Modal.jsx** - Base modal component
- **StatusBadge.jsx** - Status display badges

### Tenant Admin Specific Components
- **StatCard.jsx** - Dashboard stat cards with clickable navigation
- **DataTable.jsx** - Sortable, responsive data table
- **EmptyState.jsx** - Empty state display with action
- **ConfirmModal.jsx** - Confirmation modal with variant support

## 🔌 API Integration

### Base URL
```
http://localhost:8000/api/v1
```

### Key Endpoints (in tenantAdminApi.js)

#### Dashboard
```
GET /tenant-admin/{tenant_id}/dashboard
```

#### Documents
```
POST /tenant-admin/{tenant_id}/documents
GET /tenant-admin/{tenant_id}/documents
DELETE /tenant-admin/{tenant_id}/documents/{doc_id}
```

#### Regions
```
GET /tenant-admin/{tenant_id}/regions
POST /tenant-admin/{tenant_id}/regions
PATCH /tenant-admin/{tenant_id}/regions/{region_id}/cities/{city_id}
```

#### Vehicles
```
GET /tenant-admin/{tenant_id}/vehicles?status=pending
GET /tenant-admin/{tenant_id}/vehicles/{vehicle_id}/documents
POST /tenant-admin/{tenant_id}/vehicles/{vehicle_id}/documents/{doc_id}/approve
POST /tenant-admin/{tenant_id}/vehicles/{vehicle_id}/documents/{doc_id}/reject
POST /tenant-admin/{tenant_id}/vehicles/{vehicle_id}/approve
```

#### Fleet Owners
```
GET /tenant-admin/{tenant_id}/fleet-owners?status=pending
GET /tenant-admin/{tenant_id}/fleet-owners/{fleet_owner_id}/documents
POST /tenant-admin/{tenant_id}/fleet-owners/{fleet_owner_id}/documents/{doc_id}/approve
POST /tenant-admin/{tenant_id}/fleet-owners/{fleet_owner_id}/documents/{doc_id}/reject
POST /tenant-admin/{tenant_id}/fleet-owners/{fleet_owner_id}/approve
```

#### Drivers
```
GET /tenant-admin/{tenant_id}/drivers?status=pending
GET /tenant-admin/{tenant_id}/drivers/{driver_id}/documents
POST /tenant-admin/{tenant_id}/drivers/{driver_id}/documents/{doc_id}/approve
POST /tenant-admin/{tenant_id}/drivers/{driver_id}/documents/{doc_id}/reject
POST /tenant-admin/{tenant_id}/drivers/{driver_id}/approve
```

## 📊 Page Features

### Dashboard
- 4 stat cards (pending documents, vehicles, fleet owners, drivers)
- Quick action buttons
- System status panel
- Click cards to navigate to detail pages

### Documents
- Upload form with document metadata
- Sortable data table
- Document deletion
- Status tracking (pending/approved/rejected)

### Regions
- Add new regions with multiple cities
- Expandable region cards
- Toggle city enabled/disabled status
- Country and city management

### Vehicles
- Pending vehicles list
- View vehicle documents in modal
- Approve/Reject individual documents
- Approve vehicle only when all docs approved

### Fleet Owners
- Pending fleet owners list
- View fleet owner documents
- Approve/Reject documents
- Approve fleet owner after doc review

### Drivers
- Pending drivers list
- View driver documents
- Approve/Reject documents
- Approve driver after doc review

### Profile
- Display admin email and role
- Show tenant ID (copyable)
- Token information (issued/expires)
- Tenant details
- Logout functionality

## 🎨 Design System

### Colors
- **Primary**: Indigo (`indigo-600`)
- **Success**: Emerald (`emerald-600`)
- **Warning**: Amber (`amber-600`)
- **Error**: Red (`red-600`)
- **Background**: Slate-50
- **Card**: White with subtle shadow

### Components Styling
- Cards: `bg-white rounded-xl shadow-sm border border-slate-200`
- Buttons: Indigo primary, slate secondary, red danger, emerald success
- Status Badges: Color-coded by status type
- Tables: Sticky headers, hover states, sortable columns

## 🔄 State Management

### AdminContext
```javascript
{
  token,           // JWT token
  user,            // Decoded JWT payload
  role,            // 'app-admin' | 'tenant-admin'
  tenantId,        // Tenant UUID (for tenant-admin)
  isAuthenticated, // Boolean
  loading,         // Initial load state
  login(),         // (token, role, tenantId) => void
  logout(),        // () => void
}
```

### Local Storage
- `access_token` - JWT token
- `role` - User role
- `tenant_id` - Tenant UUID (only for tenant-admin)

## 🛡️ Error Handling

### Global Interceptor
- 401 Unauthorized → Auto logout, redirect to login
- 403 Forbidden → Access denied screen
- 400 Bad Request → Show inline error message

### Component Level
- Try-catch blocks for API calls
- Error state management
- User-friendly error messages
- Retry capabilities where applicable

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- Backend API running (FastAPI on localhost:8000)

### Installation
```bash
cd client
npm install
```

### Development
```bash
npm run dev
```

Vite will start on `http://localhost:5173`

### Build
```bash
npm run build
```

## 📝 API Response Format

### Success Response
```json
{
  "data": {},
  "message": "Success"
}
```

### Error Response
```json
{
  "detail": "Error message",
  "error_code": "ERROR_CODE"
}
```

## 🧪 Testing the UI

### Test Credentials (Example)
```
Email: tenant@example.com
Password: secure_password
Role: tenant-admin
Tenant ID: (returned in login response)
```

### Test Workflows
1. **Login** → Redirects based on role
2. **Dashboard** → View summary stats
3. **Documents** → Upload, list, delete documents
4. **Regions** → Add regions and manage cities
5. **Vehicles** → Review and approve vehicles
6. **Fleet Owners** → Review and approve fleet owners
7. **Drivers** → Review and approve drivers
8. **Profile** → View account details
9. **Logout** → Clear session, redirect to login

## 🔍 Key Features

✅ Role-based access control
✅ Multi-tenant support with tenant_id
✅ Document management with upload
✅ Document approval workflow
✅ Region and city management
✅ Vehicle approval process
✅ Fleet owner approval process
✅ Driver approval process
✅ Responsive design
✅ Error handling
✅ Token persistence
✅ Auto-logout on 401
✅ Sortable data tables
✅ Empty states
✅ Confirmation modals
✅ Loading states

## 📌 Important Notes

1. **Tenant ID Required**: All tenant-admin API calls require `tenant_id` from context
2. **Role Protection**: Only users with `tenant-admin` role can access tenant-admin routes
3. **Token Persistence**: Token is stored in localStorage and restored on page refresh
4. **Concurrent Logins**: Only one user per browser (localStorage based)
5. **API Base URL**: Update in `tenantAdminApi.js` if backend URL changes

## 🐛 Troubleshooting

### Cannot access /tenant-admin/dashboard
- Verify role is `tenant-admin`
- Check if token is expired
- Clear localStorage and login again

### Documents not loading
- Check network tab in browser DevTools
- Verify tenant_id in context
- Ensure backend API is running

### Sidebar not collapsing
- Check if collapsible state is being managed
- Verify TenantAdminLayout component

## 📚 Related Files

- [Backend API Endpoints](../../backend/app/api/v1/tenant_admin/)
- [App Admin Dashboard](./pages/dashboard/)
- [Authentication Flow](./services/api.js)

---

**Last Updated**: January 2026
**Version**: 1.0.0
**Status**: Production Ready
