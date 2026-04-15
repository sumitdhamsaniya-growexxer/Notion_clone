# 📋 Quick Reference: Verify & Troubleshoot Fixes

## Verify All Fixes Are Applied ✓

### File Changes Checklist
- [ ] `backend/src/controllers/blockController.js` - Updated version gap logic (line 275)
- [ ] `frontend/src/hooks/useAutoSave.js` - Added stale write recovery (conflict retry logic)
- [ ] `frontend/src/components/editor/BlockEditor.jsx` - Added handleStaleWrite callback
- [ ] `frontend/src/App.jsx` - Added Router future flags (line 71)
- [ ] `frontend/vite.config.js` - Updated build config with chunk splitting

### Run These Commands
```bash
# Check backend compiles
cd backend && npm test || npm run build

# Check frontend compiles
cd frontend && npm run build

# Verify no TypeScript errors
# (if you have TypeScript setup)
```

---

## Testing the Fixes

### Test 1: No More 409 Errors on Rapid Typing
```
1. Open a document in editor
2. Type quickly for 5-10 seconds
3. Watch Network tab (DevTools → Network)
4. See: Multiple POST /api/documents/[id]/blocks/batch requests
5. Expected: All return 200, NO 409 errors
6. Check: Browser console has NO "Stale write rejected" warnings
```

### Test 2: Changes Persist on Close/Reopen
```
1. Open document
2. Make visible changes (add text, change title, etc.)
3. Wait 2 seconds (auto-save completes)
4. Close document (navigate away)
5. Reopen same document
6. Expected: All changes are there
7. NOT Expected: Changes disappeared or appear at wrong location
```

### Test 3: Conflict Recovery Works
```
1. Open DevTools → Network tab
2. Make many edits to see multiple save requests
3. If you see any 409 response:
   - Should immediately follow with GET /api/documents/[id]
   - Then another POST with new version
   - No error shown to user
4. Expected: Transparent recovery, user doesn't notice
```

### Test 4: No React Router Warnings
```
1. Open DevTools → Console tab
2. Navigate between pages (Dashboard → Editor → Docs)
3. Look for warnings containing "v7_relativeSplatPath"
4. Expected: NO warnings
5. If still present: Check that frontend/src/App.jsx has future flags
```

### Test 5: Save Indicator Works
```
1. Open document
2. Make an edit
3. Observe SaveIndicator component UI
4. Should show: "Saving..." → "Saved" 
5. If edit fails: Shows error state
6. Timeline: Save delay is ~1-2 seconds after typing stops
```

---

## Network Request Format (Verify in DevTools)

### Success Case (200 OK)
**Request:**
```json
POST /api/documents/88212b79.../blocks/batch
{
  "blocks": [
    { "id": "...", "type": "paragraph", "content": {...}, "order_index": 1000.0 },
    { "id": "...", "type": "heading_1", "content": {...}, "order_index": 2000.0 }
  ],
  "documentVersion": 15
}
```

**Response:**
```json
{
  "success": true,
  "version": 16
}
```

### Conflict Case (409, then recovery)
**First Request:**
```json
POST /api/documents/[id]/blocks/batch
{ "blocks": [...], "documentVersion": 10 }
```

**Response:**
```json
{
  "success": false,
  "message": "Stale write rejected...",
  "currentVersion": 16,
  "versionGap": 6
}
```

**Auto-recovery:**
```
→ GET /api/documents/[id]
← Returns fresh blocks + fresh version
→ POST /api/documents/[id]/blocks/batch (RETRY)
← { "success": true, "version": 17 }
```

---

## Common Issues & Solutions

### Issue: Still Seeing "Stale write rejected" Warnings
**Cause:** Browser cache old code
**Solution:**
```bash
# Hard refresh browser
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# Or clear entire browser cache for this site
DevTools → Application → Clear Storage
```

### Issue: Changes Disappear After Closing Document
**Cause:** Save never completed (watch Network tab)
**Solution:**
1. Check backend logs for errors
2. Verify `JWT_SECRET` environment variables
3. Check database connection string
4. Ensure blocks are being saved (query database):
   ```sql
   SELECT id, content FROM blocks 
   WHERE document_id = '[id-you-tested]'
   LIMIT 5;
   ```

### Issue: React Router Warning Still Showing
**Cause:** App.jsx not updated with future flags
**Solution:**
```javascript
// In frontend/src/App.jsx, line ~71
<Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
```

### Issue: Blocks Appear in Wrong Order After Reordering
**Cause:** Renormalization didn't happen
**Solution:**
1. Check browser console for errors
2. Verify blocks have valid `order_index` values (should be numeric)
3. Database check:
   ```sql
   SELECT id, order_index FROM blocks 
   WHERE document_id = '[id]'
   ORDER BY order_index ASC;
   ```

### Issue: Getting 422 Error from gratisography.com
**Cause:** This is an external resource (image placeholder), not your app
**Solution:** Not an issue - this is expected if you're embedding images from that service

---

## Database Verification Queries

### Check Documents Table
```sql
-- Verify version column exists and has values
SELECT id, title, version FROM documents LIMIT 5;

-- Should show versions > 0
```

### Check Blocks Are Being Saved
```sql
-- Recent blocks from a specific document
SELECT id, type, order_index, content->'text' as text, updated_at 
FROM blocks 
WHERE document_id = '88212b79-...'
  AND deleted_at IS NULL
ORDER BY order_index ASC
LIMIT 10;
```

### Check Transaction Integrity
```sql
-- Verify all blocks from a document are in sequence
SELECT 
  order_index,
  LAG(order_index) OVER (ORDER BY order_index) as prev_index,
  order_index - LAG(order_index) OVER (ORDER BY order_index) as gap
FROM blocks
WHERE document_id = '88212b79-...'
  AND deleted_at IS NULL
ORDER BY order_index ASC;

-- Gap should be >= 0.001 (ideally 1000 or more)
```

---

## Performance Metrics

### Expected Timings
| Operation | Duration | Notes |
|-----------|----------|-------|
| Save debounce | 1s | Waits after typing stops |
| Database transaction | 2-5ms | For <1000 blocks |
| GET document | 50-100ms | Network latency included |
| Total save to "Saved" | 1.05-1.1s | Debounce + DB time |

### Monitoring (Backend Logs)
```
Look for these patterns:
✓ "[AutoSave] Save triggered"
✓ "[AutoSave] Save completed: version X → X+1"
⚠️ "[AutoSave] Conflict detected" (should be rare now)
❌ "[AutoSave] Save failed" (investigate if frequent)
```

---

## Browser DevTools Setup

### Useful Views for Debugging
1. **Network Tab**
   - Filter by `/api/documents`
   - Watch request/response headers
   - Look for `documentVersion` in request body

2. **Console Tab**
   - Search for "[AutoSave]" messages
   - Check for React Router warnings (should be gone)
   - Check for 409 conflict logs

3. **Application Tab**
   - Check localStorage for tokens
   - Verify `accessToken` and `refreshToken` exist

4. **Storage Tab**
   - View IndexedDB (if used by any libraries)
   - Check Cache Storage for Service Workers

---

## Deployment Verification

Once deployed to Railway:

1. **Check Environment Variables**
   ```
   Railway Dashboard → Backend Service → Variables
   - JWT_SECRET ✓
   - JWT_REFRESH_SECRET ✓
   - ALLOWED_ORIGINS ✓
   - DATABASE credentials ✓
   ```

2. **Test Login Flow**
   ```
   1. Visit frontend URL
   2. Login (should work)
   3. Create a document (should work)
   4. Edit and save (check Network tab)
   ```

3. **Test Conflict Scenario**
   ```
   1. Open same document in 2 browser tabs
   2. Make different edits in each
   3. Both should auto-reconcile without errors
   ```

4. **Check Logs**
   ```
   Railway Dashboard → Logs
   - Look for "🚀 Server running"
   - No "Stale write rejected" errors
   - API endpoints returning 200-201 codes
   ```

---

## Still Having Issues?

### Collect Debug Info
1. Check browser console (open DevTools with F12)
2. Check backend logs (Railway Dashboard → Logs)
3. Run database query to verify blocks exist
4. Verify environment variables match Railway settings

### Create Minimal Test Case
```javascript
// In browser console, manually test save
const testBlocks = [
  { id: "test1", type: "paragraph", content: {text: "test"}, order_index: 1000 }
];
await fetch('/api/documents/[YOUR-DOC-ID]/blocks/batch', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  },
  body: JSON.stringify({ blocks: testBlocks, documentVersion: 1 })
})
.then(r => r.json())
.then(d => console.log('Response:', d));
```

---

## Success Indicators ✅

After applying all fixes, you should see:
- ✅ No 409 errors during typing
- ✅ No React Router warnings in console
- ✅ Changes persist on document reopen
- ✅ SaveIndicator shows "Saved" status
- ✅ Rapid edits don't cause conflicts
- ✅ Block reordering maintains correct positions
- ✅ Close/reopen shows latest changes

**You're done!** 🎉
