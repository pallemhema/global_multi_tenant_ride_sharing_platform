# Race Condition Fix: Duplicate Fleet Owner/Driver Records

## Problem

When fleet owner or driver registers, sometimes **two records are created** in the database:

- One with `tenant_id = null` (draft status)
- One with `tenant_id` set (if tenant was selected)

This happens because of a **race condition** between concurrent database transactions.

## Root Cause

### The Issue Flow:

1. User clicks "Register Fleet Owner"
2. Frontend calls `registerFleetOwner()` which:
   - Calls `/fleet-owner/register` endpoint → uses `get_or_create_fleet_owner`
   - Creates Fleet Owner #1 (tenant_id = null)
3. Then calls `loadFleetOwnerData()` → calls `getFleetOnboardingStatus()`
   - Which calls `/fleet-owner/status` endpoint → uses `get_or_create_fleet_owner` again
   - The first transaction hasn't fully committed yet
   - Function doesn't find Fleet Owner #1, so creates Fleet Owner #2

### Why This Happens:

The old implementation used a "double-check" pattern:

```python
# First check
fleet_owner = db.query(FleetOwner).filter(...).first()
if not fleet_owner:
    # Second check (but same session!)
    fleet_owner = db.query(FleetOwner).filter(...).first()
    if not fleet_owner:
        # Create new
```

This **doesn't prevent race conditions** because:

- Multiple requests can pass the first check simultaneously
- Both requests see no record and both try to create one
- Second check in same session won't help - the other request's commit isn't visible yet

## Solution

Use **database-level row locking** with `with_for_update()`:

```python
def get_or_create_fleet_owner(db: Session, user: dict):
    user_id = int(user.get("sub"))

    # Lock the row at database level
    fleet_owner = (
        db.query(FleetOwner)
        .filter(FleetOwner.user_id == user_id)
        .with_for_update()  # ← Database lock
        .first()
    )

    # If not found, create it (now it's safe)
    if not fleet_owner:
        fleet_owner = FleetOwner(
            user_id=user_id,
            business_name="",
            onboarding_status="draft",
        )
        db.add(fleet_owner)
        db.commit()
        db.refresh(fleet_owner)

    return fleet_owner
```

### How `with_for_update()` Works:

1. **Database Lock**: Acquires an exclusive lock on the matching row(s)
2. **Serialization**: Only one request can hold the lock at a time
3. **Atomicity**: Either CREATE or FIND happens atomically - no race condition
4. **Automatic Release**: Lock released when transaction commits

## Changes Made

### File: `/app/core/security/roles.py`

#### Function: `get_or_create_driver()`

- ✅ Removed double-check pattern
- ✅ Added `.with_for_update()` lock
- ✅ Simplified to single create-if-not-found logic

#### Function: `get_or_create_fleet_owner()`

- ✅ Removed double-check pattern
- ✅ Added `.with_for_update()` lock
- ✅ Simplified to single create-if-not-found logic

## Impact

### Before Fix:

```
User A registers
  → Fleet#1 created (tenant_id=null)
  → Fleet#2 created (same user!)
Result: 2 records per user
```

### After Fix:

```
User A registers
  → Database locks user_a's row
  → Checks if exists (no)
  → Creates Fleet#1
  → Lock released
  → Any subsequent calls find Fleet#1
Result: 1 record per user
```

## Testing

### How to Verify Fix:

1. **Register a new fleet owner**

   ```bash
   # Check database after registration
   SELECT fleet_owner_id, user_id, business_name, tenant_id, onboarding_status
   FROM fleet_owners
   WHERE user_id = <your_user_id>
   ```

   Expected: **ONE record** (not two)

2. **Rapidly refresh during registration**
   - Go to Fleet Registration page
   - Keep refreshing page quickly
   - Check database - still should see only ONE record

3. **Parallel registration (stress test)**
   - Use multiple tabs/browsers registering same user
   - Database should still have ONE record per user

### Database Query to Check:

```python
from app.core.database import SessionLocal
from app.models.core.fleet_owners.fleet_owners import FleetOwner

db = SessionLocal()
fleet_owners = db.query(FleetOwner).group_by(
    FleetOwner.user_id
).having(func.count(FleetOwner.fleet_owner_id) > 1).all()

if fleet_owners:
    print("⚠️ DUPLICATE RECORDS FOUND!")
    for fo in fleet_owners:
        duplicates = db.query(FleetOwner).filter(
            FleetOwner.user_id == fo.user_id
        ).all()
        print(f"User {fo.user_id}: {len(duplicates)} records")
else:
    print("✅ No duplicates found")

db.close()
```

## Technical Details

### Why `with_for_update()` is Safe:

1. **SELECT...FOR UPDATE**: Database blocks other transactions
2. **Isolation Level**: Uses transaction isolation (typically READ COMMITTED)
3. **Deadlock Prevention**: SQLAlchemy handles deadlock retries
4. **Performance**: Lock held for milliseconds (just during transaction)

### PostgreSQL Implementation:

```sql
-- What happens internally:
BEGIN TRANSACTION;
SELECT * FROM fleet_owners
WHERE user_id = 14
FOR UPDATE;  -- ← Lock acquired here

-- If no row found, insert:
INSERT INTO fleet_owners (user_id, business_name, onboarding_status)
VALUES (14, '', 'draft');

COMMIT;  -- Lock released
```

## Related Issues

Same race condition could affect:

- Driver registration (FIXED)
- Fleet owner registration (FIXED)
- Any other `get_or_create_*` patterns (consider similar fixes)

## Deployment Notes

- ✅ No database migration needed
- ✅ Works with PostgreSQL, MySQL, SQLite
- ✅ No schema changes required
- ✅ Backward compatible with existing data
- ✅ Apply to both driver and fleet owner registrations
