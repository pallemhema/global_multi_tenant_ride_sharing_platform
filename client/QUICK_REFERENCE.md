# 🚀 Quick Reference Guide

## Getting Started (60 seconds)

```bash
cd client
npm install
npm run dev
```

Visit: **http://localhost:3000**

---

## 🔐 Login with Demo Credentials

- **Email**: admin@rideshare.com
- **Password**: secure_password

*(Adjust based on your backend setup)*

---

## 📁 Key Files Reference

| File | Purpose |
|------|---------|
| `src/app/router.jsx` | Route definitions |
| `src/context/AdminContext.jsx` | Global auth state |
| `src/services/api.js` | API endpoints |
| `src/guards/ProtectedRoute.jsx` | Auth guard |
| `src/guards/AppAdminGuard.jsx` | Role guard |
| `src/pages/auth/Login.jsx` | Login page |
| `src/pages/dashboard/Home.jsx` | Dashboard |
| `src/pages/tenants/TenantsList.jsx` | Tenants table |
| `src/pages/tenants/TenantDetails.jsx` | Tenant view |
| `src/pages/profile/Profile.jsx` | Admin profile |

---

## 🧩 Common Component Usage

### Button
```jsx
<Button variant="primary" size="md" onClick={handler}>
  Click Me
</Button>
```
**Variants**: primary, secondary, danger, success, outline
**Sizes**: sm, md, lg

### Card
```jsx
<Card>
  <h3>Title</h3>
  <p>Content here</p>
</Card>
```

### StatusBadge
```jsx
<StatusBadge status="approved" type="approval" />
```
**Types**: approval, tenant
**Statuses**: pending, approved, rejected (approval) | active, inactive, suspended (tenant)

### Modal
```jsx
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Confirm Action"
  actions={[
    { label: 'Cancel', variant: 'secondary', onClick: handleClose },
    { label: 'Confirm', variant: 'primary', onClick: handleConfirm },
  ]}
>
  <p>Content here</p>
</Modal>
```

### Loader
```jsx
<Loader />
```

---

## 🔗 Routes Map

```
/ → /dashboard (redirect)
/login
/dashboard
/dashboard/tenants
/dashboard/tenants/:tenantId
/dashboard/profile
```

---

## 📡 API Calls Examples

### Get Tenants
```jsx
const response = await appAdminAPI.getTenants();
// response.data = [{ id, name, business_email, approval_status, ... }]
```

### Get Dashboard Summary
```jsx
const response = await appAdminAPI.getTenantsSummary();
// response.data = { total_tenants, approved_count, pending_count, active_count, inactive_count }
```

### Get Tenant Documents
```jsx
const response = await appAdminAPI.getTenantDocuments(tenantId);
// response.data = [{ id, document_type, verification_status, created_at_utc, ... }]
```

### Approve Tenant
```jsx
await appAdminAPI.approveTenant(tenantId);
```

### Verify Document
```jsx
await appAdminAPI.verifyDocument(tenantId, docId);
```

### Admin Login
```jsx
const response = await authAPI.login(email, password);
const token = response.data.access_token;
login(token); // Update context
```

---

## 🎣 Using useAdmin Hook

```jsx
import { useAdmin } from '../context/AdminContext';

export default function MyComponent() {
  const { token, user, role, isAuthenticated, login, logout } = useAdmin();
  
  return (
    <div>
      <p>Email: {user?.email}</p>
      <p>Role: {role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

## 🎨 Tailwind Class Reference

### Colors
```
Primary: bg-indigo-600 text-indigo-600 border-indigo-200
Success: bg-emerald-600 text-emerald-600 border-emerald-200
Warning: bg-amber-600 text-amber-600 border-amber-200
Error: bg-red-600 text-red-600 border-red-200
Neutral: bg-slate-100 text-slate-900 border-slate-200
```

### Common Utilities
```
bg-white              - White background
rounded-lg            - Border radius
shadow-sm             - Subtle shadow
border border-slate-200  - Border with color
p-6                   - Padding
gap-4                 - Gap between items
flex items-center      - Flex container
grid grid-cols-4      - 4-column grid
```

---

## 🐛 Common Issues & Solutions

### Port 3000 in Use
```bash
npm run dev -- --port 3001
```

### Backend Not Found
- Verify backend runs on `http://localhost:8000`
- Check Network tab in DevTools for API calls
- Look for CORS errors in console

### Token Issues
1. Check localStorage in DevTools
2. Verify token format: `Bearer <token>`
3. Check token expiry

### Styling Not Applied
1. Ensure `src/styles/index.css` is imported
2. Clear browser cache
3. Rebuild with `npm run build`

---

## 🔧 Environment Setup

### Install Node Modules
```bash
npm install
```

### Add New Dependency
```bash
npm install package-name
```

### Update Dependencies
```bash
npm update
```

### Check Node Version
```bash
node --version
npm --version
```

---

## 📊 Project Statistics

- **Components**: 13
- **Pages**: 5
- **Routes**: 5
- **Utility Files**: 3
- **Config Files**: 6
- **Total Files**: 34+

---

## 🚀 Build & Deploy

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```
Output: `dist/` folder

### Preview Build
```bash
npm run preview
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

---

## 🧪 Testing Workflows

### Test Login
1. Go to `/login`
2. Enter credentials
3. Should redirect to `/dashboard`

### Test Tenant Approval
1. Go to `/dashboard/tenants`
2. Click "Approve" on pending tenant
3. Confirm in modal
4. Status updates to "approved"

### Test Document Verification
1. Go to tenant details
2. Click "Verify" on pending document
3. Confirm in modal
4. Status updates to "verified"

### Test Logout
1. Click logout button
2. Should redirect to `/login`
3. Token cleared from localStorage

---

## 📝 File Naming Conventions

```
Components:      PascalCase.jsx       (Button.jsx)
Pages:          PascalCase.jsx       (Login.jsx)
Hooks:          useHookName.js       (useAdmin.js)
Utils:          camelCase.js         (helpers.js)
Services:       camelCase.js         (api.js)
Config:         camelCase.js         (config.js)
Styles:         index.css            (global styles)
```

---

## 🎯 Development Best Practices

✅ Use `useAdmin()` for auth context
✅ Wrap API calls in try-catch
✅ Show loading state for async operations
✅ Display error messages to users
✅ Use reusable components
✅ Keep components focused and small
✅ Use semantic HTML
✅ Follow Tailwind naming conventions

---

## 📚 Documentation

- 📖 [README.md](README.md) - Full documentation
- 🔧 [SETUP.md](SETUP.md) - Installation guide
- 📋 [BUILD_SUMMARY.md](BUILD_SUMMARY.md) - Build details
- 📌 This file - Quick reference

---

## 💡 Pro Tips

1. **Use DevTools** - Inspect Network, Console, and LocalStorage
2. **Check Components** - React DevTools extension helps debugging
3. **Test APIs** - Use Postman to test backend endpoints first
4. **Browser Cache** - Clear cache if styles don't update
5. **Hot Reload** - Save files to see changes instantly
6. **Error Messages** - Read console errors carefully
7. **Breakpoints** - Use debugger in VS Code

---

## 🆘 Getting Help

1. Check console for error messages
2. Review `README.md` for comprehensive docs
3. Check `SETUP.md` for configuration help
4. Review inline code comments
5. Test APIs with Postman before debugging frontend

---

## ✨ Next Steps

1. Install dependencies: `npm install`
2. Ensure backend is running
3. Start dev server: `npm run dev`
4. Login with admin credentials
5. Test all features
6. Build for production: `npm run build`

---

**Happy Coding! 🚀**

For detailed information, refer to README.md and SETUP.md
