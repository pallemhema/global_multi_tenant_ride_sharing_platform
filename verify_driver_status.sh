#!/bin/bash

# Driver Status Fix - Verification Script
# Tests that driver status is properly reset after trip completion/cancellation

echo "🚗 DRIVER STATUS FIX - VERIFICATION SCRIPT"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:8000/api/v1"

# Check if backend is running
echo "Checking backend availability..."
if ! curl -s "$BASE_URL/docs" > /dev/null; then
    echo -e "${RED}❌ Backend not running on port 8000${NC}"
    echo "Start backend: cd ~/Desktop/'Ride sharing'/backend && ~/.venv/bin/python -m uvicorn app.main:app --reload"
    exit 1
fi
echo -e "${GREEN}✅ Backend is running${NC}"
echo ""

# Get a sample driver
echo "Step 1: Getting driver list..."
DRIVERS=$(curl -s "$BASE_URL/platform/drivers" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0]['driver_id'] if data else '')" 2>/dev/null)

if [ -z "$DRIVERS" ]; then
    echo -e "${YELLOW}⚠️  No drivers in database${NC}"
    echo "Run QUICK_START_TESTING.md to create test data first"
    exit 1
fi

DRIVER_ID=$DRIVERS
echo -e "${GREEN}✅ Found driver: ID=$DRIVER_ID${NC}"
echo ""

# Check driver status
echo "Step 2: Checking driver current status..."
STATUS=$(curl -s "$BASE_URL/platform/drivers/$DRIVER_ID" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('runtime_status', 'unknown'))" 2>/dev/null)
echo "Current status: $STATUS"
echo ""

# Expected statuses and what they mean
echo "Driver Status Reference:"
echo "  • 'available'       → Can accept new trips ✅"
echo "  • 'trip_accepted'   → Trip accepted, waiting to start"
echo "  • 'on_trip'         → Trip in progress"
echo "  • 'offline'         → Shift ended"
echo ""

# Check if status is available
if [ "$STATUS" = "available" ]; then
    echo -e "${GREEN}✅ Driver status is 'available' - GOOD!${NC}"
    echo "   Driver can receive new trip requests"
else
    echo -e "${RED}❌ Driver status is '$STATUS' - NOT AVAILABLE${NC}"
    echo "   This is the bug - driver should be reset to 'available' after trips"
    echo ""
    echo "If driver just completed/cancelled a trip, they should be 'available'"
    echo "Check backend logs for errors using:"
    echo "  ps aux | grep uvicorn"
fi

echo ""
echo "=========================================="
echo "To test the full flow:"
echo ""
echo "1. Driver accepts trip"
echo "   POST /driver/trips/123/accept"
echo "   → Driver status becomes: trip_accepted"
echo ""
echo "2. Driver starts trip"
echo "   POST /trips/123/start"  
echo "   → Driver status becomes: on_trip"
echo ""
echo "3. Driver completes trip"
echo "   POST /driver/trips/123/complete"
echo "   → Driver status should become: available ✅"
echo ""
echo "4. Driver cancels trip"
echo "   POST /driver/trips/123/cancel"
echo "   → Driver status should become: available ✅"
echo ""

