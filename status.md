# Finexy — Status Log

## 2026-07-21 — Initial Cleanup & Type Fixes

**Scope**: Codebase cleanup, typing improvements, and future-proofing.

**Changes made:**
- Removed 6 AI Studio migration scripts (`fix_*.cjs`, `update_dashboard.cjs`)
- Removed `metadata.json` (AI Studio artifact)
- Removed `assets/.aistudio/` directory
- Added proper TypeScript interfaces to all 15 modal/view sub-components (eliminated `any` types)
- Added missing `type` field to Engagement interface + corrected enum values to match actual usage
- Added missing type imports to Projects.tsx (Client, Project) and Calendar.tsx (Client, Meeting)
- Updated `.env.example` from AI Studio vars to Supabase-ready vars
- Changed `generateId()` from `Math.random()` to `crypto.randomUUID()` for Supabase compatibility
- Created `context.md`, `status.md`, `plan.md` for project documentation

**Files affected:**
- `src/types.ts` — Engagement interface corrected (added `type`, fixed `paymentTerms`/`status` enums)
- `src/lib/utils.ts` — generateId implementation
- `src/pages/Personal.tsx` — typed 3 sub-components
- `src/pages/Business.tsx` — typed 10 sub-components
- `src/pages/Projects.tsx` — typed 1 sub-component, added imports
- `src/pages/Calendar.tsx` — typed 1 sub-component, added imports
- `.env.example` — replaced content

## 2026-07-21 — Supabase Integration + Authentication

**Scope**: Full backend migration from localStorage to Supabase PostgreSQL, plus auth system.

**Changes made:**
- Created SQL scripts in `sql/` directory (run these in Supabase SQL Editor):
  - `sql/cleanup.sql` — drops all conflicting pre-existing tables
  - `sql/schema.sql` — creates 12 data tables + profiles, RLS policies, auth trigger, seed user
- Installed `@supabase/supabase-js`
- Created `src/lib/supabase.ts` — Supabase client singleton
- Updated `src/lib/utils.ts` — added `toCamelCase()` / `toSnakeCase()` for Supabase row mapping
- Created `src/store/AuthContext.tsx` — auth provider wrapping Supabase Auth (email/password)
- Created `src/components/AuthGuard.tsx` — route protection, redirects to `/login`
- Created `src/pages/Login.tsx` — split-layout login page with image slideshow (picsum.photos, 2s crossfade)
- Rewrote `src/store/DataContext.tsx` — all CRUD operations now call Supabase; localStorage migration on first login
- Updated `src/types.ts` — added `userId` optional field to all entities
- Updated `src/main.tsx` — auth routing with public `/login` + protected routes
- Updated `src/components/Layout.tsx` — logout button, user avatar from auth session
- Created `src/vite-env.d.ts` — Vite client type declarations
- Updated `.env` with actual Supabase credentials

**New files created:**
- `sql/cleanup.sql`, `sql/schema.sql`
- `src/lib/supabase.ts`
- `src/store/AuthContext.tsx`
- `src/components/AuthGuard.tsx`
- `src/pages/Login.tsx`
- `src/vite-env.d.ts`

**Files modified:**
- `src/lib/utils.ts` — camelCase/snakeCase helpers
- `src/types.ts` — added userId to all entities
- `src/store/DataContext.tsx` — full rewrite for Supabase
- `src/main.tsx` — auth routing
- `src/components/Layout.tsx` — logout + user avatar
- `.env` — actual credentials
- `context.md`, `plan.md`, `status.md` — updated documentation
