# Finexy — Development Plan

## Overarching Goal
Build a complete business management platform with:
- Personal & business financial tracking
- Client management with CRM pipeline
- Project & task management
- Calendar & meeting scheduling
- Supabase-backed persistence with authentication
- **Future**: Client portal (read-only access for clients)

## Completed Phases

### Phase 1 — Cleanup & Type Safety ✓
- Removed AI Studio artifacts (fix scripts, metadata)
- Replaced all `any` types with proper interfaces (15 sub-components)
- Fixed Engagement type to match actual form usage
- Future-proofed `generateId()` for Supabase
- Created project documentation (`context.md`, `status.md`, `plan.md`)

### Phase 2 — Supabase Integration ✓
- PostgreSQL schema for all 12 tables (11 entities + profiles)
- RLS policies on every table scoped to `user_id = auth.uid()`
- Email/password authentication via Supabase Auth
- Split-layout login page with image slideshow
- Auth Guard for route protection
- localStorage data migration on first login
- Full CRUD operations migrated from state-only to Supabase-backed

## Future Phases

### Phase 3 — Feature Enhancements
- [ ] TBD based on user requirements

### Phase 4 — Client Portal
- [ ] Separate client-facing app
- [ ] Supabase Auth for client login
- [ ] Read-only views of projects, engagements, tasks
- [ ] Linked to dashboard via shared database + RLS
