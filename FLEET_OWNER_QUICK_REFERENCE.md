# Fleet Owner Feature - Quick Reference Guide

## 📂 File Structure

```
client/src/
├── context/
│   └── FleetOwnerContext.jsx          ✅ Central state management
├── layouts/
│   └── FleetLayout.jsx                 ✅ Fleet sidebar + navigation
├── pages/fleet/
│   ├── FleetDashboard.jsx              ✅ Main dashboard with stats
│   ├── FleetOwnerRegistration.jsx      ✅ 4-step registration flow
│   ├── FleetDocuments.jsx              ✅ Document management
│   ├── FleetVehicles.jsx               ✅ Vehicle management
│   └── FleetInvites.jsx                ✅ Driver invite management
├── services/
│   ├── fleetOwnerApi.js                ✅ API wrapper (all endpoints)
│   └── lookups.js                      ✅ Lookup data + getFleetOwnerDocumentTypes()
├── guards/
│   └── user/UserProtectedRoute.jsx     ✅ <FleetOwnerRoute> guard
├── app/
│   ├── App.jsx                         ✅ Added FleetOwnerProvider
│   └── router.jsx                      ✅ Added /fleet routes + imports
```

## 🔗 Routes

| Route                   | Component              | Purpose                    |
| ----------------------- | ---------------------- | -------------------------- |
| `/register/fleet-owner` | FleetOwnerRegistration | 4-step registration        |
| `/fleet/dashboard`      | FleetDashboard         | Main dashboard             |
| `/fleet/documents`      | FleetDocuments         | Document upload/management |
| `/fleet/vehicles`       | FleetVehicles          | Vehicle management         |
| `/fleet/invites`        | FleetInvites           | Driver invite management   |

## 📡 API Endpoints Used

### Lookups

- `GET /lookups/active-tenants`
- `GET /lookups/fleet-owner-document-types`

### Fleet Owner

- `POST /fleet-owner/register`
- `POST /fleet-owner/select-tenant`
- `POST /fleet-owner/upload-fleet-details`
- `GET /fleet-owner/status`
- `GET /fleet-owner/documents`
- `POST /fleet-owner/documents`
- `PUT /fleet-owner/documents/{id}`
- `DELETE /fleet-owner/documents/{id}`
- `GET /fleet-owner/vehicles`
- `POST /fleet-owner/vehicles`
- `PUT /fleet-owner/vehicles/{id}`
- `DELETE /fleet-owner/vehicles/{id}`
- `GET /fleet-owner/invites`
- `POST /fleet-owner/invites`
- `DELETE /fleet-owner/invites/{id}`
- `POST /fleet-owner/assignments`
- `PUT /fleet-owner/assignments/{id}/end`
- `GET /fleet-owner/dashboard/stats`

## 🎯 Context Actions

```javascript
const {
  // Data
  fleetOwner,
  documents,
  vehicles,
  invites,
  dashboardStats,
  loading,
  error,

  // Registration & Setup
  registerFleetOwner(),
  selectTenant(tenantId),
  fillFleetDetails(data),

  // Documents
  uploadDocument(formData),
  updateDocument(docId, formData),
  deleteDocument(docId),

  // Vehicles
  addVehicle(data),
  updateVehicle(vehicleId, data),
  deleteVehicle(vehicleId),

  // Invites
  inviteDriver(driverId),

  // Assignments
  assignVehicleToDriver(inviteId, vehicleId),
  unassignVehicle(assignmentId),

  // Refresh
  loadFleetOwnerData(),
} = useFleetOwner();
```

## 🔐 Approval Gates

```javascript
// Feature locks until approval
if (!fleetOwner?.is_active) {
  return <AlertMessage>Awaiting admin approval</AlertMessage>;
}

// Document locks after approval
if (doc.verification_status === "approved") {
  // Read-only
}
```

## 🎨 Status Badges

| Status   | Color  | Meaning            |
| -------- | ------ | ------------------ |
| pending  | Yellow | Awaiting review    |
| approved | Green  | Approved, active   |
| rejected | Red    | Needs resubmission |
| sent     | Yellow | Invite sent        |
| accepted | Green  | Invite accepted    |

## 📋 Registration Flow

### Step 1: Register

- User navigates to `/register/fleet-owner`
- `registerFleetOwner()` called automatically
- Creates fleet record with `onboarding_status="draft"`

### Step 2: Select Tenant

- Fetches tenants from `/lookups/active-tenants`
- User selects one tenant
- Backend locks tenant permanently

### Step 3: Fill Details

- Business name (required)
- Contact email (optional)
- Saved via `fillFleetDetails()`

### Step 4: Upload Documents

- Fetches required docs from `/lookups/fleet-owner-document-types`
- User uploads each mandatory document
- After all uploaded → Can proceed to dashboard

## 🛠️ Common Tasks

### Add a Vehicle

```javascript
const { addVehicle } = useFleetOwner();

await addVehicle({
  license_plate: "MH-01-AB-1234",
  category_code: "sedan",
  model: "Maruti Swift",
  manufacture_year: 2023,
});
```

### Upload Document

```javascript
const { uploadDocument } = useFleetOwner();

const formData = new FormData();
formData.append("document_type", "business_registration");
formData.append("file", file);

await uploadDocument(formData);
```

### Invite Driver

```javascript
const { inviteDriver } = useFleetOwner();

await inviteDriver(driverId);
```

### Assign Vehicle

```javascript
const { assignVehicleToDriver } = useFleetOwner();

await assignVehicleToDriver(inviteId, vehicleId);
```

## 🎯 Key Features

✅ **Clean Registration Flow** - 4 clear steps
✅ **Document Management** - Upload, edit, track status
✅ **Vehicle Management** - Add, edit, delete vehicles
✅ **Driver Management** - Invite, track responses
✅ **Dashboard** - Key metrics at a glance
✅ **Approval Workflow** - Clear pending/approved states
✅ **Responsive Design** - Mobile to desktop
✅ **Error Handling** - User-friendly messages
✅ **Loading States** - Visual feedback

## 🚀 Next Steps

If backend endpoints are missing, add them to:

- `/backend/app/api/v1/fleet_owner/` (split into logical files)
- `/backend/app/api/v1/lookups.py` (for lookup endpoints)

Frontend is ready for all standard CRUD operations on:

- Documents
- Vehicles
- Invites
- Assignments

---

**Ready to Deploy!** ✅

All frontend features are implemented and working with proper error handling, loading states, and user feedback.
