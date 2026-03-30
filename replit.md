# ACES Managed Services Web Portal

## Overview

pnpm workspace monorepo using TypeScript. The primary artifact is the ACES Managed Services web portal — an admin operations management system for fuel/generator maintenance missions, plus a driver mobile web app.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Routing**: Wouter (not react-router-dom)
- **Data fetching**: TanStack React Query (generated hooks)

## Structure

```text
artifacts/
├── api-server/           # Express API server (port from PORT env)
│   └── src/routes/       # missions, drivers, sites, generators, 
│                         # notifications, settings, admins, technicians,
│                         # dashboard, health, drivers (driver routes)
└── web-portal/           # React + Vite frontend
    └── src/
        ├── pages/admin/  # Dashboard, Login, Missions, Sites, Drivers,
        │                 # Generators, Reports, Notifications, Settings,
        │                 # Admins, Technicians
        └── pages/driver/ # DriverLogin, DriverDashboard, DriverMissionDetail,
                          # DriverNotifications, DriverSettings
lib/
├── api-spec/             # OpenAPI spec + Orval codegen config
├── api-client-react/     # Generated React Query hooks
├── api-zod/              # Generated Zod schemas from OpenAPI
└── db/                   # Drizzle ORM schema + DB connection
```

## Authentication

- **Admin login**: `username=Bannaga`, `password=Aces@6343`, `role=superadmin`
- Auth stored in localStorage (`aces_auth` key) as JSON
- Admin type: `{ type: "admin", username, role }`
- Driver type: `{ type: "driver", driverId, username }`
- Login redirects explicitly via `setLocation("/")` after success

## ACES Branding

- Primary color (dark navy): `#002D62` → HSL `212 100% 19%`
- Accent (green): `#00C853` → HSL `149 100% 39%`
- Destructive (red): `#E30613` → HSL `355 90% 46%`
- Logo: `public/images/logo.png`
- Auth background: `public/images/auth-bg.png`
- Driver background: `public/images/driver-bg.png`

## Database Schema Tables

- `missions` — fuel missions with status tracking
- `drivers` — drivers with zones and password hashes
- `driverTasks` — tasks assigned to drivers
- `driverNotifications` — push notifications for drivers
- `sites` — telecom tower sites
- `generators` — generator assets at sites
- `notifications` — admin-sent notifications
- `settings` — global app settings (fuel price, VAT, invoice prefix)
- `admins` — system administrators
- `technicians` — technical staff

## Mission Statuses

- **Creation** (orange) — newly created
- **Finished by Driver** (sky) — driver marked done
- **Task approved** (emerald) — admin approved
- **Task returned to driver** (indigo) — sent back for correction
- **Reported by driver** (rose) — driver reported issue
- **Canceled** (gray) — canceled mission

## Driver Zones

- Mobily East Region
- COW East Region
- Mobily Central Region
- COW Central Region

## API Routes

All routes under `/api` prefix:
- `GET/POST /api/missions` — list/create missions
- `GET/PUT/DELETE /api/missions/:id`
- `GET/POST /api/drivers` — list/create drivers
- `GET/PUT/DELETE /api/drivers/:id`
- `GET/POST /api/sites`
- `GET/PUT/DELETE /api/sites/:id`
- `GET/POST /api/generators`
- `GET/PUT/DELETE /api/generators/:id`
- `GET/POST /api/notifications`
- `GET/PUT /api/settings`
- `GET/POST /api/admins`
- `GET/PUT/DELETE /api/admins/:id`
- `GET/POST /api/technicians`
- `GET/PUT/DELETE /api/technicians/:id`
- `GET /api/dashboard/kpis`
- `POST /api/auth/login` — admin login (SHA-256 password)
- `POST /api/driver/login` — driver login
- `GET /api/driver/tasks?driverId=`
- `GET/PUT /api/driver/tasks/:id`
- `GET /api/driver/notifications?driverId=`

## Password Hashing

Uses Node.js `crypto.createHash('sha256')`, NOT bcrypt.

## Rebuilding API Client

After modifying OpenAPI spec:
```bash
cd lib/api-client-react && pnpm run generate
cd lib/api-client-react && pnpm tsc --build
```

## Seed Data

Admin: `Bannaga / Aces@6343` (superadmin)
Drivers: Gul Muhammad, Irfan, Pradeep Singh, MURALI.MUSAFMY, ZAFAR ABDUL SATTAR, Reaza
Sites: SGD66662, COWM38, COW531, COW591, A-25462C
Generators: 3172, 2371, 2370, 2368, 2367
Missions: MSN-001 through MSN-005
