# RideShare App-Admin Dashboard

A professional, fully-functional App-Admin dashboard frontend for a ride-sharing platform.

## 🎯 Features

✅ **Authentication**
- Admin login with email + password
- JWT token management
- Token persistence in localStorage
- Automatic logout on token expiration

✅ **Role-Based Access Control**
- Protected routes requiring authentication
- App-Admin role verification
- Access denied error handling

✅ **Dashboard**
- Summary metrics (total tenants, approved, pending, active)
- Quick stats overview
- Responsive card-based layout

✅ **Tenant Management**
- View all tenants with pagination
- Filter by approval status and tenant status
- Approve pending tenants
- Detailed tenant information pages
- Document verification workflow

✅ **Document Management**
- Review tenant documents
- Verify documents with one-click action
- Track verification status
- Display pending documents count

✅ **Admin Profile**
- View account information
- Logout functionality

## 🛠 Tech Stack

- **Framework**: React 18 (JavaScript)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **State Management**: React Context API

## 📁 Project Structure

```
client/
├── src/
│   ├── app/
│   │   ├── App.jsx              # Main app component
│   │   └── router.jsx           # Route definitions
│   ├── context/
│   │   └── AdminContext.jsx     # Global admin state
│   ├── services/
│   │   └── api.js               # API client & endpoints
│   ├── guards/
│   │   ├── ProtectedRoute.jsx   # Auth guard
│   │   └── AppAdminGuard.jsx    # Role guard
│   ├── components/
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
│   ├── pages/
│   │   ├── auth/
│   │   │   └── Login.jsx
│   │   ├── dashboard/
│   │   │   └── Home.jsx
│   │   ├── tenants/
│   │   │   ├── TenantsList.jsx
│   │   │   └── TenantDetails.jsx
│   │   └── profile/
│   │       └── Profile.jsx
│   ├── styles/
│   │   └── index.css
│   └── main.jsx
├── public/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn
- Backend running on `http://localhost:8000`

### Installation

```bash
cd client
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run preview
```

## 🔐 Authentication

### Login Flow

1. User submits email and password
2. Backend validates and returns JWT token
3. Token is decoded and stored in localStorage
4. AdminContext is updated with user data
5. User is redirected to dashboard

### Token Management

- Stored as `access_token` in localStorage
- Automatically attached to all API requests via axios interceptor
- Automatically cleared on logout

## 📡 API Integration

All API endpoints are configured in `src/services/api.js`

### Auth Endpoints
- `POST /api/v1/auth/admin/login` - Admin login

### App-Admin Endpoints
- `GET /api/v1/app-admin/tenants` - List all tenants
- `GET /api/v1/app-admin/tenants/summary` - Get dashboard summary
- `GET /api/v1/app-admin/tenants/{tenant_id}` - Get tenant details
- `POST /api/v1/app-admin/tenants/{tenant_id}/approve` - Approve tenant
- `GET /api/v1/app-admin/tenants/{tenant_id}/documents` - Get tenant documents
- `POST /api/v1/app-admin/tenants/{tenant_id}/documents/{doc_id}/verify` - Verify document

## 🎨 Design System

### Colors
- **Primary**: Indigo (`indigo-600`)
- **Success**: Emerald (`emerald-600`)
- **Warning**: Amber (`amber-600`)
- **Error**: Red (`red-600`)
- **Background**: Slate 50 (`slate-50`)

### Components

All reusable components are in `src/components/`

- **Button**: Multiple variants (primary, secondary, danger, success, outline)
- **Card**: White card container with shadow
- **StatusBadge**: Status indicators for approval/tenant status
- **Modal**: Confirmation dialogs
- **Loader**: Loading spinner

## 🔄 Workflows

### Tenant Approval Workflow

1. View tenants in `/dashboard/tenants`
2. Click "Approve" on pending tenants
3. Navigate to `/dashboard/tenants/{id}` for detailed review
4. Verify all required documents
5. Click "Approve Tenant" after all documents are verified
6. Tenant approval status updates to "approved"

### Document Verification Workflow

1. View documents in tenant details page
2. Click "Verify" on pending documents
3. Confirm verification in modal
4. Document status updates to "verified"
5. Once all documents are verified, approve tenant

## 📊 Dashboard Features

### Summary Cards
- Total Tenants
- Approved count
- Pending count
- Active count

### Quick Stats
- Total tenants
- Inactive tenants count
- Approval rate percentage

## 🛣 Routes

```
/                           → /dashboard (redirect)
/login                      → Admin login page
/dashboard                  → Dashboard home
/dashboard/tenants          → Tenants list
/dashboard/tenants/:id      → Tenant details & documents
/dashboard/profile          → Admin profile
```

## 🔒 Route Protection

All dashboard routes are protected by:
1. **ProtectedRoute** - Requires authentication
2. **AppAdminGuard** - Requires app-admin role

Unauthenticated users are redirected to `/login`

## 🐛 Error Handling

- Inline error messages on forms
- Graceful error displays for API failures
- Loading states for async operations
- Empty state messages

## 📝 Notes

- No TypeScript - pure JavaScript as specified
- No tenant-admin UI in this phase
- All styling uses Tailwind CSS utility classes
- Responsive design for desktop and tablet
- Production-ready code with proper error handling

## 🔧 Environment Variables

Optional configuration can be added to `.env`:

```
VITE_API_BASE=http://localhost:8000/api/v1
```

Currently uses hardcoded API base URL in `src/services/api.js`

## 📦 Dependencies

- `react` - UI framework
- `react-dom` - DOM rendering
- `react-router-dom` - Routing
- `axios` - HTTP client
- `lucide-react` - Icons
- `tailwindcss` - Styling
- `vite` - Build tool

## 🚀 Deployment

The built app in `dist/` can be deployed to any static hosting:

- Vercel
- Netlify
- GitHub Pages
- S3 + CloudFront
- Any web server

## 📞 Support

For issues or questions:
1. Check backend API is running on port 8000
2. Verify JWT token format
3. Check browser console for errors
4. Validate API responses match expected schema

---

Built with ❤️ for the RideShare Platform
