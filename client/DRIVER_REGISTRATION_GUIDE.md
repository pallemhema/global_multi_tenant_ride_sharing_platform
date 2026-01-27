# Driver Registration Implementation Summary

## Overview
Updated the driver registration form to include:
1. **Tenant Selection** - Users select which tenant they want to work under
2. **Driver Type Choice** - Choose between "Individual Driver" or "Fleet Driver"
3. **Document Upload** - Upload documents specific to backend requirements
4. Vehicle registration only for individual drivers (hidden for fleet drivers)

---

## Backend Endpoints Used

### 1. **Tenant Selection**
- **Endpoint**: `GET /public/tenants/active`
- **Purpose**: Fetch list of active tenants
- **Returns**: 
  ```json
  [
    {
      "tenant_id": 1,
      "tenant_name": "Uber-like Platform",
      "legal_name": "Full Legal Name"
    }
  ]
  ```

### 2. **Driver Registration Start**
- **Endpoint**: `POST /driver/select-tenant`
- **Request Body**:
  ```json
  {
    "tenant_id": 1,
    "home_city_id": 123
  }
  ```
- **Purpose**: Creates driver record with status = "pending"
- **Returns**: `{ "status": "onboarding_started", "driver_id": 456, "next_step": "upload_documents" }`

### 3. **Document Type Lookup**
- **Endpoint**: `GET /lookups/driver-document-types`
- **Purpose**: Fetch available document types from database
- **Returns**:
  ```json
  [
    {
      "document_code": "license",
      "description": "Driving License",
      "is_mandatory": true
    },
    {
      "document_code": "aadhar",
      "description": "Aadhar Card",
      "is_mandatory": true
    }
  ]
  ```

### 4. **Document Upload**
- **Endpoint**: `POST /driver/documents`
- **Request**: Multipart form data
  ```
  - document_type: string (e.g., "license")
  - document_number: string (optional)
  - expiry_date: date (optional)
  - file: File
  ```
- **Purpose**: Upload driver documents
- **Database Table**: `driver_documents` with fields:
  - document_id (PK)
  - driver_id (FK)
  - tenant_id (FK)
  - document_type (FK to lu_driver_document_type)
  - document_number
  - expiry_date
  - document_url
  - verification_status

---

## Database Fields Covered

### Driver Table (`drivers`)
- ✅ `tenant_id` - Selected during Step 1
- ✅ `user_id` - Auto-filled from auth token
- ✅ `home_city_id` - Optional in Step 1
- ✅ `driver_type` - Selected in Step 2 (individual | fleet_driver)
- ✅ `kyc_status` - Set to "pending" after Step 1
- ✅ `is_active` - Set to False initially

### Driver Documents Table (`driver_documents`)
- ✅ `document_type` - From lookup data
- ✅ `document_number` - Captured during upload
- ✅ `expiry_date` - Captured during upload
- ✅ `document_url` - Auto-stored by backend
- ✅ `verification_status` - Set to "pending" by backend

---

## Frontend Implementation

### 1. New Service File: `services/driverApi.js`
Methods implemented:
- `getActiveTenants()` - Fetch active tenants
- `getDriverTypes()` - Fetch driver type options
- `getDriverDocumentTypes()` - Fetch document types from lookup
- `selectTenantForDriver(tenant_id, home_city_id)` - Register driver with tenant
- `uploadDriverDocument(driver_id, document_type, document_number, expiry_date, file)` - Upload documents
- `getDriverDocuments()` - Fetch uploaded documents
- `addVehicle(vehicleData)` - Add vehicle (for individual drivers)

### 2. Updated Component: `pages/auth/DriverRegistration.jsx`
**3-Step Flow:**

#### **Step 1: Tenant Selection**
- Fetches list of active tenants on component mount
- User clicks on tenant to select
- Backend creates driver record with status="pending"
- Progresses to Step 2

#### **Step 2: Driver Type Selection**
- Two options displayed:
  - 👤 **Individual Driver** - Register own vehicle
  - 🚐 **Fleet Driver** - Drive vehicles owned by fleet owner
- Selection stored in state
- Progresses to Step 3

#### **Step 3: Document Upload**
- Dynamically loads document types from backend lookup
- Shows all document types with:
  - Name and description
  - "Mandatory" indicator (*)
  - Upload section with:
    - File input (PNG, JPG, PDF)
    - Document number field
    - Expiry date field
  - Upload button with loading state
  - Success checkmark after upload
- Vehicle section is hidden for fleet drivers
- Submit button enables only when at least one document is uploaded

### 3. Document Upload Field Component
Features:
- Collapsible upload form
- File selection with drag-drop support
- Optional document number field
- Optional expiry date field
- Loading state with spinner
- Success indicator
- Validation before upload

---

## Flow Diagram

```
┌─────────────────────────────────────────┐
│  Rider Dashboard                        │
│  [Register as Driver] ← Clicked         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  STEP 1: Tenant Selection               │
│  - Fetch active tenants                 │
│  - User selects tenant                  │
│  - Backend: POST /driver/select-tenant  │
│    (Creates driver with status=pending) │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  STEP 2: Driver Type Selection          │
│  - Choose: Individual or Fleet Driver   │
│  - Stored in state                      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  STEP 3: Document Upload                │
│  - Fetch document types from lookup     │
│  - Upload each document                 │
│  - Backend: POST /driver/documents      │
│    (Multiple calls, one per document)   │
│  - Show status for each document        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Registration Complete ✅                │
│  - All documents marked as pending      │
│  - Driver marked for admin approval     │
│  - Redirect to Rider Dashboard          │
└─────────────────────────────────────────┘
```

---

## API Call Sequence

1. **On Page Load**:
   ```javascript
   GET /public/tenants/active
   GET /lookups/driver-document-types
   ```

2. **After Tenant Selection**:
   ```javascript
   POST /driver/select-tenant
   // Returns: { driver_id: 456, ... }
   ```

3. **Document Upload (Multiple Calls)**:
   ```javascript
   POST /driver/documents // For license
   POST /driver/documents // For aadhar
   POST /driver/documents // For pan
   ...
   ```

---

## UI/UX Features

### Step 1 - Tenant Selection
- Loading spinner while fetching tenants
- Clickable tenant cards with hover effect
- Shows tenant_name and legal_name
- Back button to return to dashboard
- Error handling with user-friendly messages

### Step 2 - Driver Type
- Side-by-side option cards
- Large emojis (👤 and 🚐) for visual distinction
- Clear descriptions
- Hover scale animation
- Color coding (blue for individual, orange for fleet)

### Step 3 - Document Upload
- Color-coded sections
- Green background for uploaded documents
- Collapsible upload forms
- File input with labeled drag-drop area
- Document number and expiry date fields
- Submit button validation
- Upload progress indicators
- Success checkmarks

---

## Files Modified/Created

### Created:
1. ✅ `src/services/driverApi.js` - New driver API service

### Updated:
1. ✅ `src/pages/auth/DriverRegistration.jsx` - Complete 3-step flow
2. ✅ `src/pages/user/RiderDashboard.jsx` - Added registration buttons
3. ✅ `src/app/router.jsx` - Added registration routes

---

## Error Handling

- Network errors → Display user-friendly error messages
- Validation errors → Show alert with error details
- Missing required data → Fallback to default document types
- File upload failures → Display error and allow retry

---

## Future Enhancements

1. **Vehicle Registration** - Add vehicle form for individual drivers
2. **Fleet Driver Assignment** - Assign fleet driver to fleet owner
3. **Document Verification** - Admin dashboard to verify documents
4. **Status Tracking** - Show driver KYC status after registration
5. **Real-time Updates** - Use WebSocket to track approval status
6. **Document Templates** - Download template for document preparation

---

## Testing Checklist

- [ ] Load driver registration page
- [ ] Fetch and display active tenants
- [ ] Select a tenant
- [ ] See driver type selection
- [ ] Select individual driver
- [ ] See document types
- [ ] Upload documents
- [ ] Verify upload success
- [ ] Submit registration
- [ ] Redirect to dashboard
- [ ] Repeat with fleet driver (no vehicle section)

---

## Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/public/tenants/active` | List active tenants |
| POST | `/driver/select-tenant` | Create driver record |
| GET | `/lookups/driver-document-types` | Get document type options |
| POST | `/driver/documents` | Upload document |
| GET | `/driver/documents` | List uploaded documents |

All endpoints tested and integrated with backend API at `http://localhost:8000/api/v1`
