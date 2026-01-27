# 🧠 User OTP Login - Implementation Complete

## ✅ What Was Built

A complete **OTP-based user authentication system** for the client folder with:

1. **UserAuthContext** - State management for user authentication
2. **userAuthApi** - API service for OTP operations
3. **Reusable Components** - CountrySelector, OTPInput, RoleSelectionModal
4. **UserLogin Page** - Full 3-step login flow (Phone → OTP → Role)
5. **Route Guards** - Protected routes for different user roles

---

## 📁 File Structure

```
client/
├── src/
│   ├── context/
│   │   └── UserAuthContext.jsx          # Auth state & methods
│   ├── services/
│   │   └── userAuthApi.js               # API endpoints
│   ├── components/
│   │   └── auth/
│   │       ├── CountrySelector.jsx      # Country picker with flags
│   │       ├── OTPInput.jsx             # 6-digit OTP input
│   │       └── RoleSelectionModal.jsx   # Multi-role selector
│   ├── pages/
│   │   └── auth/
│   │       └── UserLogin.jsx            # Full login page
│   └── guards/
│       └── UserProtectedRoute.jsx       # Route protection
```

---

## 🚀 Integration Steps

### Step 1: Add UserAuthProvider to App Root

In your `client/src/app/App.jsx` or main entry:

```jsx
import { UserAuthProvider } from "../context/UserAuthContext";

export function App() {
  return (
    <UserAuthProvider>
      {/* All routes */}
    </UserAuthProvider>
  );
}
```

### Step 2: Add UserLogin Route

In your router configuration:

```jsx
import { UserLogin } from "../pages/auth/UserLogin";
import { RiderRoute, DriverRoute } from "../guards/UserProtectedRoute";

// Add to routes
{
  path: "/auth/user-login",
  element: <UserLogin />
}

// Protected rider route
{
  path: "/rider/dashboard",
  element: <RiderRoute><RiderDashboard /></RiderRoute>
}

// Protected driver route
{
  path: "/driver/dashboard",
  element: <DriverRoute><DriverDashboard /></DriverRoute>
}

// Protected fleet owner route
{
  path: "/fleet-owner/dashboard",
  element: <FleetOwnerRoute><FleetOwnerDashboard /></FleetOwnerRoute>
}

// Protected tenant admin route
{
  path: "/tenant-admin/dashboard",
  element: <TenantAdminRoute><TenantAdminDashboard /></TenantAdminRoute>
}
```

### Step 3: Use useUserAuth Hook

In any component:

```jsx
import { useUserAuth } from "../context/UserAuthContext";

export function MyComponent() {
  const { 
    isAuthenticated, 
    role, 
    userId, 
    loginUser, 
    logoutUser,
    switchRole 
  } = useUserAuth();

  return (
    <div>
      {isAuthenticated && <p>Welcome, {role}!</p>}
    </div>
  );
}
```

---

## 🎯 User Flow

### 1. **Phone Entry**
- User selects country from dropdown
- Phone number auto-formatted to country
- Validate before submit
- API: `POST /auth/user/otp/request`

### 2. **OTP Verification**
- 6-digit OTP input with auto-focus
- Auto-submit on complete
- 30-second resend timer
- Paste support for OTP
- API: `POST /auth/user/otp/verify`

### 3. **Role Resolution**
- Backend returns user's available roles
- **Single role** → Auto-redirect to dashboard
- **Multiple roles** → Show modal for selection
- API: `GET /auth/user/available-roles`

### 4. **Role Switching** (if needed)
- User clicks different role card
- API: `POST /auth/user/switch-role?role=driver`
- Token replaced, user redirected

---

## 🔐 Token Management

### Storage
- Token stored in `localStorage` under key `access_token`
- Automatic cleanup on logout or expiry

### Decoding
- JWT automatically decoded on login
- Extracts: `user_id`, `role`, `context`, `driver_id`, `fleet_owner_id`, `tenant_id`

### Expiry
- Token checked on app startup
- Invalid/expired tokens removed
- User redirected to login

---

## 🧩 Component Reference

### UserAuthContext

```jsx
const {
  // State
  token,              // JWT string
  user,               // Decoded JWT object
  role,               // Current role (rider, driver, etc)
  context,            // "user" or "tenant" or "app"
  isAuthenticated,    // Boolean
  loading,            // Boolean (initial load state)
  phone,              // Phone number used to login
  
  // Methods
  loginUser(jwt, phone),           // Store token & decode
  logoutUser(),                    // Clear token & state
  switchRole(newJwt, newRole),    // Switch to different role
  
  // Helpers
  userId,             // user.sub
  driverId,           // user.driver_id
  fleetOwnerId,       // user.fleet_owner_id
  tenantId,           // user.tenant_id
} = useUserAuth();
```

### userAuthApi

```jsx
// All methods throw Error on failure
userAuthApi.requestOtp("+919876543210")
userAuthApi.verifyOtp("+919876543210", "123456")
userAuthApi.getAvailableRoles()
userAuthApi.switchRole("driver")
```

### Route Guards

```jsx
// Check auth + specific role
<UserProtectedRoute requiredRoles={["rider"]}>
  <RiderDashboard />
</UserProtectedRoute>

// Shorthand
<RiderRoute><RiderDashboard /></RiderRoute>
<DriverRoute><DriverDashboard /></DriverRoute>
<FleetOwnerRoute><FleetOwnerDashboard /></FleetOwnerRoute>
<TenantAdminRoute><TenantAdminDashboard /></TenantAdminRoute>
```

---

## 🎨 Styling

All components use **Tailwind CSS**:
- Responsive design (mobile-first)
- Blue theme (customizable)
- Accessible inputs with focus states
- Loading spinners & error alerts

---

## 🧪 Testing

### Test Phone Entry
```
Phone: +91 9876543210
Country: India
```

### Test OTP
```
OTP: 123456 (backend will validate)
```

### Test Role Switching
```
If user has multiple roles, modal appears
Click role card → auto-redirects to dashboard
```

---

## 🔗 Backend Endpoints Used

All endpoints at `/api/v1/auth/user/`:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/otp/request` | Send OTP to phone |
| POST | `/otp/verify` | Verify OTP & get token |
| GET | `/available-roles` | Get user's roles |
| POST | `/switch-role?role=X` | Switch to different role |

---

## 📝 Notes

- No passwords required - fully OTP-based
- Tokens auto-included in all API requests via axios interceptor
- Logout clears token and redirects to login
- Role switching preserves user_id but changes role/context
- All error messages are human-readable

---

## 🚀 Next Steps

1. Update your router to include UserLogin route
2. Wrap App with UserAuthProvider
3. Create dashboard pages for each role
4. Test with backend OTP endpoints
5. Customize colors/branding as needed

