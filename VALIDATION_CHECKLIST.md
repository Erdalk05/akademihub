# 🧪 SCORING RULES - COMPLETE VALIDATION CHECKLIST

## ✅ PRE-DEPLOYMENT CHECKLIST

### 1. Database Migrations
Run these in order:

```bash
# Navigate to project
cd "/Users/erdalkiziroglu/yeni akdemihubiai"

# Run validation migration (includes RLS fix + seed)
psql $DATABASE_URL -f supabase/migrations/20260111_validate_scoring_rules_complete.sql
```

**Expected Output:**
```
✅ scoring_rules table exists
✅ RLS is enabled on scoring_rules
✅ RLS policies updated for service_role compatibility
✅ Created scoring rules for X organizations (or skipped if exists)
✅ All active organizations have scoring rules
✅ Active Organizations: X
✅ Organizations with Rules: X
✅ Total Rules: Y
✅ Default Rules: Z
✅ RLS Policies: 4
🎉 ALL CHECKS PASSED - System is ready!
```

---

### 2. Verify Database State

```sql
-- Check table exists
SELECT COUNT(*) FROM scoring_rules;
-- Should return > 0

-- Check RLS is enabled
SELECT relrowsecurity FROM pg_class WHERE relname = 'scoring_rules';
-- Should return: t (true)

-- Check policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'scoring_rules';
-- Should return 4 policies: SELECT, INSERT, UPDATE, DELETE

-- Verify all orgs have rules
SELECT 
  o.name,
  COUNT(sr.id) as rule_count
FROM organizations o
LEFT JOIN scoring_rules sr ON sr.organization_id = o.id
WHERE o.is_active = true
GROUP BY o.id, o.name
ORDER BY rule_count ASC;
-- Every org should have at least 6 rules (LGS, TYT, 4xAYT)
```

---

### 3. Test API Directly

```bash
# Get your organization ID
ORG_ID=$(psql $DATABASE_URL -t -c "SELECT id FROM organizations WHERE is_active = true LIMIT 1;" | xargs)

# Test API endpoint
curl -s "http://localhost:3000/api/settings/scoring-rules?active=true&organization_id=$ORG_ID" | jq

# Expected response:
# {
#   "success": true,
#   "data": [ ... 6+ rules ... ],
#   "from_db": true,
#   "duration_ms": <number>
# }
```

**Failure Cases to Test:**

```bash
# No organization_id
curl -s "http://localhost:3000/api/settings/scoring-rules?active=true" | jq
# Expected: {"success": false, "error": "...", "code": "MISSING_ORG_ID"}

# Invalid organization_id
curl -s "http://localhost:3000/api/settings/scoring-rules?active=true&organization_id=invalid-uuid" | jq
# Expected: {"success": true, "data": [], ...}
```

---

### 4. Frontend Console Logs Verification

Open browser console and navigate to: `/admin/spectra/sihirbaz`

**✅ EXPECTED LOGS (Success):**
```
[SCORING_RULES] 📡 Fetching rules for org: <uuid>
[SCORING_RULES] ✅ Loaded 6 rules from DB (XXXms) [DB]
```

**❌ FAILURE LOGS (Should NOT appear):**
```
[SCORING_RULES] ❌ No organization_id found
[SCORING_RULES] ⚠️  No rules returned from DB
[SCORING_RULES] ❌ API error
```

---

### 5. Network Tab Verification

1. Open DevTools > Network tab
2. Navigate to `/admin/spectra/sihirbaz`
3. Find request: `GET /api/settings/scoring-rules?active=true&organization_id=...`

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "organization_id": "...",
      "sinav_turu": "LGS",
      "ad": "LGS Standart",
      "yanlis_katsayisi": 3,
      "taban_puan": 100,
      "tavan_puan": 500,
      "is_active": true,
      "is_default": true,
      "is_system": true
    },
    ... more rules ...
  ],
  "from_db": true,
  "duration_ms": 45
}
```

**Status Code:** 200 OK

---

### 6. UI Behavior Verification

When on Step 1 (`Step1SinavBilgisi`):

1. **Loading State** (brief):
   - Shows: "Puanlama kuralları yükleniyor..."
   - Spinner visible

2. **Success State**:
   - Form appears normally
   - LGS selected → yanlış katsayısı shows "1/3"
   - TYT selected → yanlış katsayısı shows "1/4"
   - Puan range shows: "100-500" (LGS) or "0-500" (TYT/AYT)

3. **Error State** (if DB fails):
   - Red error box appears
   - Shows: "Puanlama Kuralları Yüklenemedi"
   - Displays specific error message
   - Form does NOT render

---

## 🔍 VALIDATION TESTS

### Test 1: Fresh Organization
```sql
-- Create test org
INSERT INTO organizations (id, name, slug, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'Test Org', 'test', true);

-- Verify no rules exist
SELECT COUNT(*) FROM scoring_rules WHERE organization_id = '00000000-0000-0000-0000-000000000001';
-- Should return: 0

-- Hit API (should auto-create)
curl "http://localhost:3000/api/settings/scoring-rules?active=true&organization_id=00000000-0000-0000-0000-000000000001"

-- Verify rules created
SELECT COUNT(*) FROM scoring_rules WHERE organization_id = '00000000-0000-0000-0000-000000000001';
-- Should return: 6

-- Cleanup
DELETE FROM organizations WHERE id = '00000000-0000-0000-0000-000000000001';
```

### Test 2: Service Role Bypass
```sql
-- Service role should see all rules
SET request.jwt.claims TO '{"role": "service_role"}';
SELECT COUNT(*) FROM scoring_rules;
-- Should return: ALL rules across ALL orgs
```

### Test 3: Authenticated User Filtering
```sql
-- Regular user should only see their org's rules
SET request.jwt.claims TO '{"organization_id": "<some-org-uuid>"}';
SELECT COUNT(*) FROM scoring_rules;
-- Should return: Only that org's rules (6+)
```

---

## 📊 SUCCESS METRICS

After deployment, these should be TRUE:

- [ ] **Zero fallback usage**: No console logs mentioning "fallback"
- [ ] **DB-driven**: All logs show "[DB]" tag
- [ ] **Fast queries**: API response time < 100ms
- [ ] **Error handling**: Clear error messages if something fails
- [ ] **Auto-recovery**: If no rules, auto-creates on first request
- [ ] **RLS working**: Service role and authenticated users both work

---

## 🐛 TROUBLESHOOTING

### Issue: "No organization_id found"
**Cause:** localStorage empty or organization not selected  
**Fix:** 
1. Logout and login again
2. Select organization from TopBar dropdown
3. Verify: `localStorage.getItem('organization-storage')` contains `currentOrganization.id`

### Issue: "No rules returned from DB"
**Cause:** Seed data not created  
**Fix:** Run validation migration again

### Issue: "Database error: relation does not exist"
**Cause:** Table not created  
**Fix:** Run `054_scoring_rules.sql` first

### Issue: API returns 400 "organization_id required"
**Cause:** Frontend not passing org ID  
**Fix:** Check hook is reading from localStorage correctly

---

## 📝 FILES CHANGED

### SQL Migrations (New)
- `20260111_validate_scoring_rules_complete.sql` - Complete validation + setup

### Code Changes
1. **app/api/settings/scoring-rules/route.ts**
   - Enhanced logging
   - Strict validation
   - Duration tracking
   - Better error codes

2. **lib/hooks/useScoringRules.ts**
   - Removed all fallback logic
   - Added error state
   - Enhanced logging with timings
   - Auto-retry on auto-creation

3. **components/spectra-wizard/Step1SinavBilgisi.tsx**
   - Added error display
   - Shows DB loading state
   - Blocks form if DB fails

---

## ✅ FINAL VERIFICATION COMMAND

Run this to verify everything:

```bash
cd "/Users/erdalkiziroglu/yeni akdemihubiai"

echo "=== Checking Database ==="
psql $DATABASE_URL -c "
SELECT 
  (SELECT COUNT(*) FROM pg_tables WHERE tablename = 'scoring_rules') as table_exists,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'scoring_rules') as policies_count,
  (SELECT COUNT(*) FROM scoring_rules) as total_rules,
  (SELECT COUNT(DISTINCT organization_id) FROM scoring_rules) as orgs_with_rules,
  (SELECT COUNT(*) FROM organizations WHERE is_active = true) as active_orgs;
"

echo ""
echo "=== Testing API ==="
ORG_ID=$(psql $DATABASE_URL -t -c "SELECT id FROM organizations WHERE is_active = true LIMIT 1;" | xargs)
curl -s "http://localhost:3000/api/settings/scoring-rules?active=true&organization_id=$ORG_ID" | jq '.success, .data | length, .from_db'

echo ""
echo "✅ If all checks pass, system is ready!"
```

Expected output:
```
table_exists | policies_count | total_rules | orgs_with_rules | active_orgs
-------------+----------------+-------------+-----------------+-------------
          1 |              4 |          X  |              Y  |          Y

true
6
true

✅ If all checks pass, system is ready!
```
