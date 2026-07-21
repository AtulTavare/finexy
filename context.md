# Finexy — Project Context

## Overview
Finexy is a mobile-first, PWA-ready financial and business operations dashboard. Originally a single-user SPA with localStorage, now integrated with **Supabase** for persistent storage and authentication.

## Brand
- **Infinity Innovations** — the only brand (hardcoded string literal type).

## Tech Stack
| Layer | Technology |
|---|---|
| Framework | React 19, TypeScript 5.8 |
| Bundler | Vite 6 |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`), Inter + JetBrains Mono fonts |
| Routing | React Router 7 |
| Charts | Recharts (Bar, Pie, Line) |
| Icons | lucide-react |
| Animations | motion (framer-motion v12) |
| Date Utils | date-fns v4 |
| Utilities | clsx, tailwind-merge |
| **Backend** | **Supabase** (PostgreSQL, Auth, RLS) |
| **Client** | **@supabase/supabase-js** |

## Architecture
- **State Management**: React Context (`DataContext`) wrapping all 11 entity arrays
- **Persistence**: Supabase PostgreSQL (all 12 tables), with localStorage migration path on first login
- **Auth**: Supabase Auth (`AuthContext`) — email/password login, session persistence
- **Routing**: `/login` (public) + 6 protected routes wrapped in `<AuthGuard>` + `<Layout>`
- **Auth Guard**: `<AuthGuard>` component checks session, redirects to `/login` if unauthenticated
- **Login Page**: Split-layout design — image slideshow (picsum.photos, 2s interval, crossfade) on left, login form on right
- **Cross-page communication**: Custom `window` events + React Router location state for opening modals from the Dashboard FAB
- **Generated IDs**: `crypto.randomUUID()` for all entity primary keys

## Data Model (12 Tables in Supabase)

| Table | Key Fields | Relationships |
|---|---|---|
| `profiles` | id (UUID FK→auth.users), email, full_name, avatar_url | Auto-created on signup via trigger |
| `personal_income` | source, amount, date, category, is_recurring | — |
| `personal_expenses` | amount, category, reason, date, day_of_week, payment_method | — |
| `personal_debts` | type (I Owe/Owed), party_name, amount, due_date, status, interest_rate | — |
| `leads` | name, brand, source, stage, estimated_value, next_action, next_action_date | → clients (auto-convert on Won) |
| `clients` | name, brand, contact, services TEXT[], status | ← from leads (lead_id), → engagements/projects/meetings |
| `engagements` | client_id, brand, type (Project/Retainer), value, payment_terms, start_date, status | → business_payments |
| `business_payments` | client_id, engagement_id, amount, date, invoice_reference | ← engagements, reduces receivables |
| `business_expenses` | brand, category (Tools/Ads/Contractor/Subscription/Other), amount, date | — |
| `tasks` | title, type, brand, priority, due_date, recurrence, is_completed | Auto-regenerates on completion if recurring |
| `projects` | client_id, title, services TEXT[], start_date, deadline, status | → Calendar display |
| `meetings` | title, client_id, date, time | → Calendar display |
| `owner_draws` | amount, date | Moves business cash → personal income |

All tables have: `id TEXT PK`, `created_at TIMESTAMPTZ`, `user_id UUID FK→auth.users`.
RLS enabled on every table with `USING (user_id = auth.uid())`.

## Business Logic
- **Lead → Client**: Updating a lead to `stage: 'Won'` auto-creates a new Client with Active status
- **Recurring Tasks**: Completing a Daily/Weekly/Monthly task spawns a new instance with the next due date
- **Owner Draw**: One action records an OwnerDraw + creates a PersonalIncome entry (category: "Business Draw")
- **Receivables**: Active engagement value minus payments received against that engagement
- **Pipeline**: Kanban-style view with stages Lead → Qualified → Proposal Sent → Negotiation → Won → Lost
- **Data Migration**: localStorage `pulse_data` → Supabase on first login (one-time, automatic)

## Pages & Navigation
| Route | Label | Purpose |
|---|---|---|
| `/login` | — | Login page (public, split layout with slideshow) |
| `/` | Overview | Dashboard — KPIs, charts, needs-attention panel |
| `/personal` | Activity | Personal Income, Expenses, Debts (tabbed) |
| `/business` | Manage | Pipeline (Kanban), Clients, Engagements, Payments, Expenses |
| `/projects` | Program | Client project cards with timeline & status |
| `/calendar` | Account | Monthly calendar with meetings + project bars |
| `/tasks` | Reports | Tasks filtered by Today / This Week / Overdue / By Brand |

## UI Components (`src/components/ui.tsx`)
- `Card`, `Button` (4 variants), `Input`, `Select`, `Label`, `Badge` (4 variants), `Modal` — all Tailwind-styled

## Auth Components
- `src/store/AuthContext.tsx` — Auth provider wrapping Supabase auth session
- `src/components/AuthGuard.tsx` — Route protection, redirects to `/login`
- `src/pages/Login.tsx` — Split-layout login with image slideshow (picsum.photos, 2s crossfade)

## Current State
- Supabase PostgreSQL for all data (12 tables)
- Email/password authentication via Supabase Auth
- RLS policies on all tables scoped to `user_id = auth.uid()`
- localStorage migration: old data auto-imports on first Supabase login
- Single-user (one auth user seeded), expandable to multi-user
- Working features: CRUD for all entities, Dashboard analytics, Kanban pipeline, calendar view, recurring tasks
- PWA-configured: manifest.json, icon.svg, standalone display mode
- Deployable to Vercel (SPA rewrites in vercel.json)

## Future Direction
1. **Client Portal** — separate app with Supabase Auth where clients log in and view their projects/engagements read-only, linked to this dashboard via shared database
2. **Multi-user roles** — admin (current dashboard) + client (read-only)
