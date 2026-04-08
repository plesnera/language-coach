# Troubleshooting

## Common Issues

### Firestore Emulator Not Running

**Symptom:** `ConnectionRefusedError` or tests skipped with "FIRESTORE_EMULATOR_HOST not set"

**Fix:**
```bash
firebase emulators:start --only auth,firestore --project demo-test
```

Ensure `FIRESTORE_EMULATOR_HOST=localhost:8080` is set in your environment.

### CORS Errors in Browser

**Symptom:** `Access-Control-Allow-Origin` errors in the browser console

**Fix (dev):** The backend defaults to `ALLOWED_ORIGINS=*`. Ensure the backend is running and the frontend is pointed at the correct API URL (`VITE_API_BASE_URL`).

**Fix (prod):** Set `ALLOWED_ORIGINS` to the actual frontend domain (e.g. `https://your-app.web.app`).

### Token Expired / 401 Unauthorized

**Symptom:** API calls return 401 after some time

**Cause:** Firebase ID tokens expire after 1 hour. The frontend should refresh them automatically via `onIdTokenChanged`.

**Fix:** Check that `AuthContext` is properly wrapping the app and calling `getIdToken(true)` for refresh.

### "Frontend not built" Error on Root Path

**Symptom:** Visiting `http://localhost:8000/` returns "Frontend not built"

**Fix:** The backend expects a built frontend at `frontend/build/`. Either:
1. Run `cd frontend && npm run build` to create the build, or
2. Use the Vite dev server on port 8501 instead (recommended for dev)

### Agent Session Errors

**Symptom:** WebSocket connection drops or agent doesn't respond

**Fix:**
1. Check emulator logs for errors
2. Ensure system prompts exist: visit `/admin/prompts` and verify active prompts for router, beginner, topic, and freestyle types
3. Check backend logs for setup warnings

### Cloud Build Failures

**Symptom:** CI/CD pipeline fails

**Fix:**
1. Check Cloud Build logs in the GCP console
2. Verify service account permissions (see `deployment/terraform/iam.tf`)
3. Ensure all required APIs are enabled (see `deployment/terraform/locals.tf`)
