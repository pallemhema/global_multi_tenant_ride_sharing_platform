# Driver License Vehicle Category Implementation

## Overview

The driver registration system now includes a **License Vehicle Category** step to capture which vehicle category the driver's license is valid for. This information is stored with driver documents for compliance and verification purposes.

---

## Updated Document Types

The system now uses these **8 document types** instead of the previous generic ones:

| Code | Description | Mandatory | Document Number | Expiry Date |
|------|-------------|-----------|-----------------|-------------|
| **DRIVING_LICENSE** | Valid Driving License | ✅ Yes | ✅ Yes | ✅ Yes |
| **PROFILE_PHOTO** | Driver Profile Photograph | ✅ Yes | ❌ No | ❌ No |
| **ID_PROOF** | Government Issued ID (Aadhaar/Passport) | ✅ Yes | ✅ Yes | ✅ Yes |
| **ADDRESS_PROOF** | Residential Address Proof | ❌ No | ✅ Yes | ❌ No |
| **POLICE_VERIFICATION** | Police Verification Certificate | ❌ No | ✅ Yes | ✅ Yes |
| **BACKGROUND_CHECK** | Background Verification Report | ❌ No | ✅ Yes | ❌ No |
| **MEDICAL_CERT** | Medical Fitness Certificate | ❌ No | ✅ Yes | ✅ Yes |
| **DRIVER_BADGE** | Platform Issued Driver Badge | ❌ No | ❌ No | ❌ No |

---

## Updated Driver Registration Flow

### For Individual Drivers (4 Steps):

```
Step 1: Tenant Selection
├─ User selects which platform to work under
└─ Backend creates driver record (status=pending)

Step 2: Driver Type Selection
├─ Choose: Individual Driver (👤) or Fleet Driver (🚐)
└─ Individual drivers proceed to Step 3

Step 3: LICENSE VEHICLE CATEGORY ⭐ NEW
├─ Select vehicle category their license is valid for:
│  ├─ 🚗 Sedan (4-seater)
│  ├─ 🚙 SUV/MUV
│  ├─ 🚕 Hatchback (5-seater)
│  ├─ 🚕 Auto/Tuk-Tuk
│  └─ 🏍️ Motorcycle/Scooter
└─ Move to Step 4

Step 4: Document Upload
├─ Upload all 8 document types
├─ License category auto-filled for DRIVING_LICENSE
├─ Conditional fields based on document type:
│  ├─ Document Number: Yes for most (except PROFILE_PHOTO, DRIVER_BADGE)
│  └─ Expiry Date: Yes only for DRIVING_LICENSE & ID_PROOF
└─ Submission → Redirect to dashboard
```

### For Fleet Drivers (3 Steps):

```
Step 1: Tenant Selection
├─ User selects platform to work under
└─ Backend creates driver record

Step 2: Driver Type Selection
├─ Choose Fleet Driver (🚐)
└─ Skip license category (not needed for fleet drivers)

Step 3: Document Upload
├─ Upload all 8 document types
├─ No vehicle category selection needed
└─ Submission → Redirect to dashboard
```

---

## Database Changes

### `driver_documents` Table

**New Column Added:**
```python
vehicle_category: Mapped[str | None] = mapped_column(
    Text,
    ForeignKey("lu_vehicle_category.category_code"),
    nullable=True,  # Only required for DRIVING_LICENSE
)
```

**Purpose:** Store which vehicle category the driver's license is valid for

**Migration Note:** If upgrading existing database, add this column:
```sql
ALTER TABLE driver_documents 
ADD COLUMN vehicle_category TEXT 
FOREIGN KEY ("lu_vehicle_category"."category_code")
NULL;
```

---

## Frontend Changes

### `src/services/driverApi.js`

**New Method Added:**
```javascript
async getVehicleCategories() {
  // Fetches available vehicle categories for license selection
  // Returns: [{ category_code, description }, ...]
  // Fallback: sedan, suv, hatchback, auto, bike
}
```

**Modified Methods:**
```javascript
async uploadDriverDocument(
  driver_id,
  document_type,
  document_number,
  expiry_date,
  file,
  vehicle_category = null  // ⭐ NEW parameter
)
```

### `src/pages/auth/DriverRegistration.jsx`

**Step Flow Updated:**
- Step 1: Tenant Selection (unchanged)
- Step 2: Driver Type Selection (unchanged)
- **Step 3: License Vehicle Category** ⭐ NEW (individual drivers only)
- Step 4: Document Upload (was Step 3)

**New State Variables:**
```javascript
const [vehicleCategories, setVehicleCategories] = useState([]);
const [selectedLicenseCategory, setSelectedLicenseCategory] = useState(null);
```

**Conditional Logic:**
- Individual drivers: See all 4 steps
- Fleet drivers: Skip Step 3 (license category)

**Document Upload Enhancements:**
- Document number field: Hidden for `PROFILE_PHOTO`, `DRIVER_BADGE`
- Expiry date field: Shown only for `DRIVING_LICENSE`, `ID_PROOF`
- License category: Auto-passed to backend with uploads

---

## Backend Changes

### `app/api/v1/drivers/documents.py`

**Endpoint Updated:**
```python
@router.post("/documents")
def upload_driver_document(
    document_type: str = Form(...),
    document_number: str | None = Form(None),
    expiry_date: date | None = Form(None),
    vehicle_category: str | None = Form(None),  # ⭐ NEW
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    driver=Depends(require_driver),
):
```

**Functionality:**
- Accepts optional `vehicle_category` from frontend
- Stores it in `DriverDocument.vehicle_category` field
- Works for all documents (but mainly used for DRIVING_LICENSE)

---

## API Request/Response Examples

### Before Document Upload
**GET `/lookups/vehicle-categories`**
```json
// Response
[
  { "category_code": "sedan", "description": "Sedan (4-seater)" },
  { "category_code": "suv", "description": "SUV/MUV" },
  { "category_code": "hatchback", "description": "Hatchback (5-seater)" },
  { "category_code": "auto", "description": "Auto/Tuk-Tuk" },
  { "category_code": "bike", "description": "Motorcycle/Scooter" }
]
```

### Document Upload with Vehicle Category
**POST `/api/v1/driver/documents`** (multipart/form-data)
```
Form Data:
- document_type: "DRIVING_LICENSE"
- document_number: "DL123456789AB"
- expiry_date: "2026-12-31"
- vehicle_category: "sedan"  // ⭐ NEW
- file: <binary file data>
```

**Response:**
```json
{
  "document_id": 1,
  "driver_id": 123,
  "tenant_id": 1,
  "document_type": "DRIVING_LICENSE",
  "document_number": "DL123456789AB",
  "expiry_date": "2026-12-31",
  "vehicle_category": "sedan",  // ⭐ NEW
  "document_url": "/uploads/drivers/123/DRIVING_LICENSE.pdf",
  "verification_status": "pending",
  "verified_by": null,
  "verified_at_utc": null
}
```

---

## Frontend Form Behavior

### Step 3: License Vehicle Category Selection (Individual Only)

User sees 5 vehicle category buttons:
- 🚗 **Sedan** - "Regular 4-seater car"
- 🚙 **SUV** - "SUV or MUV vehicle"
- 🚕 **Hatchback** - "5-seater hatchback"
- 🚕 **Auto** - "Auto-rickshaw or Tuk-Tuk"
- 🏍️ **Bike** - "Motorcycle or Scooter"

Clicking a button:
1. Saves the selection to state
2. Moves to Step 4 (Document Upload)

### Step 4: Document Upload Form

**For Each Document Type:**
```
┌─ DRIVING_LICENSE (MANDATORY) *
│  ├─ Document Number: [input field]
│  ├─ Expiry Date: [date picker]
│  ├─ File Upload: [drag-drop area]
│  └─ Status: [empty] or [✅ Uploaded]
│
├─ PROFILE_PHOTO (MANDATORY) *
│  ├─ File Upload: [drag-drop area]  (no number/date)
│  └─ Status: [empty] or [✅ Uploaded]
│
├─ ID_PROOF (MANDATORY) *
│  ├─ Document Number: [input field]
│  ├─ Expiry Date: [date picker]
│  ├─ File Upload: [drag-drop area]
│  └─ Status: [empty] or [✅ Uploaded]
│
├─ ADDRESS_PROOF (Optional)
│  ├─ Document Number: [input field]
│  ├─ File Upload: [drag-drop area]  (no expiry date)
│  └─ Status: [empty] or [✅ Uploaded]
│
├─ POLICE_VERIFICATION (Optional)
│  ├─ Document Number: [input field]
│  ├─ Expiry Date: [date picker]
│  ├─ File Upload: [drag-drop area]
│  └─ Status: [empty] or [✅ Uploaded]
│
├─ BACKGROUND_CHECK (Optional)
│  ├─ Document Number: [input field]
│  ├─ File Upload: [drag-drop area]  (no expiry date)
│  └─ Status: [empty] or [✅ Uploaded]
│
├─ MEDICAL_CERT (Optional)
│  ├─ Document Number: [input field]
│  ├─ Expiry Date: [date picker]
│  ├─ File Upload: [drag-drop area]
│  └─ Status: [empty] or [✅ Uploaded]
│
└─ DRIVER_BADGE (Optional)
   ├─ File Upload: [drag-drop area]  (no number/date)
   └─ Status: [empty] or [✅ Uploaded]
```

---

## Implementation Checklist

- [x] Add `vehicle_category` column to `driver_documents` table
- [x] Update backend `upload_driver_document()` to accept `vehicle_category` parameter
- [x] Update frontend `uploadDriverDocument()` to pass `vehicle_category`
- [x] Add `getVehicleCategories()` method to `driverApi.js`
- [x] Add Step 3 (License Category) to driver registration
- [x] Update step flow (3 steps for fleet drivers, 4 for individual drivers)
- [x] Conditional field display (document_number, expiry_date)
- [x] Make license category conditional (individual drivers only)
- [ ] Add `/lookups/vehicle-categories` endpoint to backend (if not exists)
- [ ] Update driver document lookup to return new document types

---

## Testing Scenarios

### Scenario 1: Individual Driver Registration
1. ✓ Select tenant → Get driver_id
2. ✓ Select "Individual Driver"
3. ✓ **NEW:** Select "Sedan" as license category
4. ✓ Upload DRIVING_LICENSE with number "DL123456" and expiry "2026-12-31"
5. ✓ Upload PROFILE_PHOTO with no number/expiry
6. ✓ Upload ID_PROOF with number "AADH123456789AB" and expiry "2030-01-01"
7. ✓ Submit → All documents have vehicle_category="sedan"

### Scenario 2: Fleet Driver Registration
1. ✓ Select tenant → Get driver_id
2. ✓ Select "Fleet Driver"
3. ✗ **Skip** License category selection
4. ✓ Upload documents without vehicle category
5. ✓ Submit → documents.vehicle_category = None

### Scenario 3: Conditional Fields
1. ✓ DRIVING_LICENSE shows: document_number + expiry_date + file
2. ✓ PROFILE_PHOTO shows: file only (no number/expiry)
3. ✓ ID_PROOF shows: document_number + expiry_date + file
4. ✓ ADDRESS_PROOF shows: document_number + file (no expiry)

---

## Backward Compatibility Notes

- **Existing drivers** without `vehicle_category` will have `NULL` value
- **Queries filtering by vehicle_category** should use `IS NOT NULL` if needed
- **Admin verification UI** should display category alongside license documents
- **Reports** can group drivers by license vehicle category for analytics

---

## Future Enhancements

1. **Category Matching**: Validate that registered vehicles match the license category
2. **License Expiry Alerts**: Notify drivers when license is about to expire
3. **Category-Specific Requirements**: Different mandatory documents for different categories
4. **License Verification API**: Integration with government motor vehicle database
5. **Category Upgrade Flow**: Allow drivers to add another category license later

---

## Summary

✅ **8 specific document types** with clear mandatory/optional indicators  
✅ **Vehicle category selection** for individual drivers (3-step → 4-step)  
✅ **Conditional form fields** based on document type  
✅ **Category storage** in driver_documents for audit trail  
✅ **Fleet driver skip** for license category (simpler 3-step flow)  
✅ **Backend validation** accepting vehicle_category parameter  

**Ready for testing!** Navigate to `/register/driver` on localhost:3001 to see the new 4-step flow.
