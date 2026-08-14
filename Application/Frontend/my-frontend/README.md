# GovConnect — AI-Powered Citizen Call Intelligence Frontend

A government-grade, production-ready frontend for the GovConnect platform — built with **React 19 + Vite + Tailwind CSS v4**.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file and fill in values
cp .env.example .env.local

# 3. Start dev server
npm run dev        # http://localhost:5173

# 4. Build for production
npm run build

# 5. Preview production build
npm run preview
```

---

## Demo Accounts

| Role        | Email                    | Password  |
|-------------|--------------------------|-----------|
| Citizen     | citizen@demo.gov.in      | demo123   |
| Call Center | agent@demo.gov.in        | demo123   |
| Officer     | officer@demo.gov.in      | demo123   |
| Admin       | admin@demo.gov.in        | demo123   |

Login at `http://localhost:5173/login` — demo credentials are prefilled via the quick-pick panel.

---

## Tech Stack

| Concern          | Library / Tool                          |
|------------------|-----------------------------------------|
| Framework        | React 19 + Vite 8                       |
| Styling          | Tailwind CSS v4 (`@tailwindcss/vite`)   |
| Component System | Radix UI primitives + custom components |
| Routing          | React Router DOM v7                     |
| Forms            | React Hook Form                         |
| HTTP Client      | Axios (with JWT interceptors)           |
| Charts           | Recharts                                |
| Toasts           | Sonner                                  |
| Icons            | Lucide React                            |
| State            | React Context (auth, notifications, app)|
| TypeScript       | v6 (strict)                             |
| Linter           | oxlint                                  |

---

## Folder Structure

```
src/
├── api/                    # Axios API stubs (BACKEND_HOOK)
│   ├── client.ts           # Base Axios instance + JWT interceptors
│   ├── auth.api.ts
│   ├── complaints.api.ts
│   ├── calls.api.ts
│   ├── analytics.api.ts
│   ├── ai.api.ts           # AI microservice hooks (AI_HOOK)
│   └── users.api.ts
│
├── components/
│   ├── layout/             # Sidebar, Navbar, Layout wrappers
│   ├── shared/             # Reusable business components
│   │   ├── StatCard
│   │   ├── StatusBadge / PriorityBadge / SentimentBadge
│   │   ├── ComplaintCard
│   │   ├── TranscriptPanel  # WEBSOCKET_HOOK
│   │   ├── AIInsightCard    # AI_HOOK
│   │   ├── DataTable
│   │   ├── SearchFilterBar
│   │   ├── Pagination
│   │   ├── EmptyState
│   │   ├── LoadingState
│   │   └── ConfirmDialog
│   └── ui/                 # Low-level primitives (Button, Card, Input…)
│
├── contexts/               # React Context providers
│   ├── AuthContext.tsx      # JWT auth, login/logout, token rehydration
│   ├── NotificationContext.tsx  # In-app notifications + WS stub
│   └── AppContext.tsx       # Theme, sidebar, density, language
│
├── lib/
│   └── utils.ts            # cn(), formatDate, timeAgo, color maps
│
├── mock/                   # MVP mock data (replace with real API)
│   ├── authMock.ts
│   └── data.ts
│
├── pages/
│   ├── public/             # /, /login, /track-complaint, /help
│   ├── citizen/            # /citizen, /citizen/new, /history, /profile
│   ├── call-center/        # /call-center
│   ├── officer/            # /officer, /officer/cases/:id
│   └── admin/              # /admin, /analytics, /users, /settings
│
├── router/
│   └── index.tsx           # Route tree, GuestGuard, AuthGuard, RoleGuard
│
├── types/
│   └── index.ts            # All TypeScript entity types
│
├── App.tsx                 # Provider tree root
├── main.tsx
└── index.css               # Global styles, CSS variables
```

---

## Routes Reference

### Public (no auth)
| Path               | Page                |
|--------------------|---------------------|
| `/`                | Landing page        |
| `/login`           | Login               |
| `/track-complaint` | Track by ref no.    |
| `/help`            | FAQ & contacts      |

### Citizen (role: `citizen`)
| Path               | Page                 |
|--------------------|----------------------|
| `/citizen`         | Dashboard            |
| `/citizen/new`     | File new complaint   |
| `/citizen/history` | My complaints list   |
| `/citizen/profile` | Profile & settings   |

### Call Center (role: `call_center`)
| Path           | Page                        |
|----------------|-----------------------------|
| `/call-center` | 3-column live call dashboard |

### Officer (roles: `officer`, `admin`)
| Path                  | Page                |
|-----------------------|---------------------|
| `/officer`            | Dashboard + cases   |
| `/officer/cases/:id`  | Case detail         |

### Admin (role: `admin`)
| Path               | Page              |
|--------------------|-------------------|
| `/admin`           | Overview dashboard |
| `/admin/analytics` | Charts & KPIs     |
| `/admin/users`     | User management   |
| `/admin/settings`  | System settings   |

---

## Integration Labels in Code

Search the codebase for these comment markers to find every integration point:

```
// BACKEND_HOOK   — replace with real Spring Boot API call
// AI_HOOK        — replace with AI microservice call
// WEBSOCKET_HOOK — replace with live WebSocket connection
```

```bash
# Find all integration points at once:
grep -r "BACKEND_HOOK\|AI_HOOK\|WEBSOCKET_HOOK" src/ --include="*.ts" --include="*.tsx"
```

---

## Replacing Mocks with Real APIs

See `FRONTEND_INTEGRATION_GUIDE.md` for the step-by-step migration guide.

**Quick summary:**
1. Set `VITE_API_BASE_URL=http://your-backend/api` in `.env.local`
2. In each page component, find `// BACKEND_HOOK` and swap the mock call for the corresponding function from `src/api/`
3. Enable feature flags in `.env.local` (e.g. `VITE_ENABLE_LIVE_TRANSCRIPT=true`)

---

## Accessibility

- Skip-to-main link on every page
- All interactive elements keyboard-navigable with visible focus rings
- ARIA roles: `role="status"`, `aria-live`, `aria-current`, `aria-label`, `aria-expanded`
- High-contrast CSS class (`html.high-contrast`) toggled from Admin Settings
- `prefers-reduced-motion` media query suppresses all animations
- WCAG 2.1 AA target — full validation requires manual assistive technology testing

---

## Environment Variables

| Variable                              | Default                       | Purpose                            |
|---------------------------------------|-------------------------------|------------------------------------|
| `VITE_API_BASE_URL`                   | `/api`                        | Spring Boot API base URL           |
| `VITE_WS_URL`                         | `ws://localhost:8080`         | WebSocket base URL                 |
| `VITE_AI_SERVICE_URL`                 | `http://localhost:8081`       | AI microservice URL                |
| `VITE_ENABLE_LIVE_TRANSCRIPT`         | `false`                       | Enable WebSocket transcript        |
| `VITE_ENABLE_AI_CATEGORIZE`           | `false`                       | Enable AI auto-categorization      |
| `VITE_ENABLE_WEBSOCKET_NOTIFICATIONS` | `false`                       | Enable push notifications via WS   |

---

## Scripts

| Command           | Description                        |
|-------------------|------------------------------------|
| `npm run dev`     | Start dev server (port 5173)       |
| `npm run build`   | TypeScript check + Vite production build |
| `npm run preview` | Serve the production build locally |
| `npm run lint`    | Run oxlint                         |
