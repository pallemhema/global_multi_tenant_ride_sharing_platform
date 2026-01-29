# Fleet Owner Documents Fetching - Fix Summary

## Problem Identified

Fleet owner documents were not appearing in the UI despite existing in the database.

### Root Causes Found

1. **Authentication Dependency Issue** (Fixed ✅)
   - GET endpoint was using `require_fleet_owner` which checks JWT `fleet_owner_id` field
   - This field may not be properly set in all tokens
   - **Solution**: Changed to `get_or_create_fleet_owner` which retrieves fleet by `user_id`

2. **Undefined Variable Reference** (Fixed ✅)
   - POST endpoint referenced `fleet_owner.fleet_owner_id` which was undefined
   - Function parameter was `fleet`, not `fleet_owner`
   - **Solution**: Fixed variable name to use correct parameter

3. **Query Filtering by Fleet Owner ID Only** (Fixed ✅)
   - GET endpoint now filters documents by `fleet_owner_id` alone
   - This ensures all documents belonging to a fleet owner are returned regardless of tenant status
   - Previously was also filtering by `tenant_id`, which could hide documents

4. **Tenant Selection Validation** (Improved ✅)
   - Added validation to prevent document uploads before tenant selection
   - Returns clear error message: "Tenant must be selected before uploading documents"

## Changes Made

### Backend: `/app/api/v1/fleet_owner/fleet_documents.py`

#### POST Endpoint (Upload Documents)

```python
# Added check to ensure tenant is selected
if not fleet.tenant_id:
    raise HTTPException(400, "Tenant must be selected before uploading documents")
```

#### GET Endpoint (List Documents)

```python
# Filters by fleet_owner_id only (not tenant_id)
docs = db.query(FleetOwnerDocument).filter(
    FleetOwnerDocument.fleet_owner_id == fleet.fleet_owner_id,
).all()

# Added debugging logs to track the issue
print(f"Fleet ID: {fleet.fleet_owner_id}")
print(f"Found {len(docs)} documents")
```

### Frontend: `/client/src/context/FleetOwnerContext.jsx`

#### Improved Error Handling

```javascript
// Changed from silent .catch(() => []) to explicit error logging
try {
  const docs = await fleetOwnerApi.getFleetDocuments();
  console.log("docs:", docs);
  setDocuments(docs || []);
} catch (docErr) {
  console.error("Failed to fetch documents:", docErr);
  setDocuments([]);
}
```

## Database Analysis

Existing fleet owners and their documents:

- **Fleet ID 18** (User 14): 3 documents (PAN, GST, INC_CERT), Tenant = 1, Status = completed ✅
- **Fleet ID 21** (User 16): 0 documents, Tenant = None, Status = draft (can't upload without tenant)

## How to Test

1. **For Completed Registrations (with tenant)**
   - Fleet owner who completed onboarding should see their documents
   - Try logging in as the user who uploaded documents
   - Documents should appear in Fleet Registration page

2. **For Draft Registrations (without tenant)**
   - Attempting to upload documents without selecting a tenant first
   - Should see error: "Tenant must be selected before uploading documents"
   - Only after selecting a tenant can documents be uploaded

3. **Debug Information**
   - Check browser console for "docs:" log showing fetched documents
   - Check server logs for fleet ID and document count
   - If documents don't appear, check:
     - Is the logged-in user the same user who uploaded documents?
     - Has the tenant been selected?
     - Are there error messages in the console?

## Expected Behavior After Fix

✅ Documents uploaded by a fleet owner will be visible in the UI
✅ GET endpoint returns documents for current fleet owner
✅ Clear error messages if tenant selection is missing
✅ No silent failures - all errors logged to console
✅ Frontend shows error details when API calls fail
