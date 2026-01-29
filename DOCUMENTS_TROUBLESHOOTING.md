# Fleet Documents Not Showing - Troubleshooting Guide

## Summary of Changes

I've identified and fixed **4 issues** preventing fleet owner documents from appearing:

### ✅ Issues Fixed

1. **Authentication Dependency**
   - Changed GET endpoint from `require_fleet_owner` → `get_or_create_fleet_owner`
   - Now properly identifies the fleet owner via user_id

2. **Query Filtering**
   - GET endpoint now filters by `fleet_owner_id` only
   - Removed the `tenant_id` filter that was restricting results

3. **Validation for Uploads**
   - Added check to ensure tenant is selected before uploading documents
   - Prevents documents with NULL tenant_id

4. **Error Handling**
   - Frontend now logs specific errors instead of silently catching them
   - Makes debugging easier when documents don't load

## Quick Diagnosis

### If documents still don't appear:

**Check 1: Browser Console**

- Open DevTools (F12) → Console tab
- Look for "docs:" message - this shows what the API returned
- Look for "Failed to fetch documents:" error if there's an error

**Check 2: Server Logs**

- Look at the uvicorn terminal output
- Should see logs like:
  ```
  Fleet ID: 18
  Found 3 documents
  Document: PAN, Status: pending, Tenant: 1
  ```

**Check 3: Database State**

- Run this command to see what's in the database:

  ```bash
  cd /home/hemalatha.pallem/Desktop/'Ride sharing'/backend
  source venv/bin/activate
  python3 -c "
  from app.core.database import SessionLocal
  from app.models.core.fleet_owners.fleet_owner_documents import FleetOwnerDocument
  from app.models.core.fleet_owners.fleet_owners import FleetOwner

  db = SessionLocal()

  fleet_owners = db.query(FleetOwner).all()
  print(f'Total fleet owners: {len(fleet_owners)}')

  for fo in fleet_owners:
      docs = db.query(FleetOwnerDocument).filter(
          FleetOwnerDocument.fleet_owner_id == fo.fleet_owner_id
      ).all()
      print(f'Fleet ID {fo.fleet_owner_id}: {len(docs)} documents (Tenant: {fo.tenant_id})')
      for doc in docs:
          print(f'  - {doc.document_type}')

  db.close()
  "
  ```

## Expected Database States

### ✅ Documents Should Show (Has documents AND tenant selected)

```
Fleet ID 18: 3 documents (Tenant: 1)
  - PAN
  - GST
  - INC_CERT
```

### ❌ Documents Won't Show (No tenant selected yet)

```
Fleet ID 21: 0 documents (Tenant: None)
```

- Solution: Select a tenant first, then upload documents

### ❌ Documents Won't Show (Wrong user logged in)

- Solution: Make sure you're logged in with the user who uploaded the documents

## Workflow After Fix

1. **Fleet Owner Registration**
   - Register fleet owner account
   - Select tenant
   - Upload documents (now with proper tenant association)
   - Documents appear in Fleet Dashboard

2. **Document Upload Constraints**
   - Cannot upload documents before selecting a tenant
   - Will see error: "Tenant must be selected before uploading documents"
   - This prevents documents with NULL tenant_id

3. **Document Retrieval**
   - GET endpoint returns all documents for the current fleet owner
   - Works regardless of tenant status (but upload requires tenant)
   - Shows documents with their verification status and tenant info

## Next Steps

1. **Test with Fleet ID 18** (the one with documents)
   - Login as User 14
   - Navigate to Fleet Dashboard
   - You should see 3 documents: PAN, GST, INC_CERT

2. **Test with Fleet ID 21** (currently has no documents)
   - Login as User 16
   - Select a tenant
   - Try uploading a document
   - Verify it appears in the dashboard

3. **Check Console Logs**
   - All actions are now logged to console
   - Error messages are explicit and helpful
   - Makes debugging future issues easier

## Code Changes Made

**Backend**: `/app/api/v1/fleet_owner/fleet_documents.py`

- ✅ POST: Added tenant selection check
- ✅ GET: Simplified filtering to fleet_owner_id only
- ✅ Added comprehensive debug logging

**Frontend**: `/client/src/context/FleetOwnerContext.jsx`

- ✅ Replaced Promise.all().catch() with explicit try-catch per endpoint
- ✅ Added console error logging for troubleshooting
- ✅ Maintains graceful degradation with fallback to empty arrays
