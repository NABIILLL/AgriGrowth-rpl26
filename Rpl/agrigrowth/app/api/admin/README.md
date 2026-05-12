Admin API routes

These routes are server-side only and require an Authorization header with a valid Supabase access token.
All routes enforce admin role checks via user_roles and use the Supabase service role key.

Required env vars (.env.local):
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

Endpoints:
- GET/POST/PATCH/DELETE /api/admin/users
- GET/POST/PATCH/DELETE /api/admin/trackers
- GET/POST/PATCH/DELETE /api/admin/observations
- GET/POST/PATCH/DELETE /api/admin/profiles
