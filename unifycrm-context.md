# UnifyCRM — Full Codebase Context

Use this file to restore full context of the UnifyCRM project without re-uploading the zip.

---

## Project Overview

**UnifyCRM** is a nonprofit CRM prototyped in Google AI Studio. It is a React + TypeScript + Vite app styled with Tailwind CSS. All data is mock/in-memory (no live backend). Firebase is scaffolded but unused. Login credentials: username `Admin`, password `Admin`.

**Stack:** React, TypeScript, Vite, Tailwind CSS, React Router, Recharts, date-fns, lucide-react  
**Local dev:** `npm run dev` → `localhost:3000`  
**GitHub:** https://github.com/labrarf-rgb/unifycrm  
**Default currency:** USD (configurable per org in Settings)

---

## File Structure

```
unifycrm/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── types.ts
│   ├── lib/firebase.ts (scaffolded, unused)
│   ├── services/db.ts
│   ├── components/AdminLockModal.tsx
│   └── pages/
│       ├── Dashboard.tsx
│       ├── Login.tsx
│       ├── Kiosk.tsx
│       ├── Reports.tsx
│       ├── StaffManagement.tsx
│       └── ConstituentProfile.tsx
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

---

## Types (`src/types.ts`)

```typescript
export interface Constituent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive';
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Donation {
  id: string;
  constituentId: string;
  amount: number;
  currency: string;
  method: 'cash' | 'check' | 'e-transfer' | 'stripe' | 'paypal';
  timestamp: number;
  note?: string;
}

export interface VolunteerLog {
  id: string;
  constituentId: string;
  checkIn: number;
  checkOut?: number;
  hours?: number;
  note?: string;
  status: 'active' | 'completed';
}

export interface KioskSession {
  id: string;
  constituentId: string;
  name: string;
  startTime: number;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'coordinator';
  status: 'active' | 'inactive';
  password?: string;
  createdAt: number;
}

export interface Report {
  id: string;
  name: string;
  type: 'donations' | 'volunteers';
  fields: string[];
  visualization: 'table' | 'bar' | 'line' | 'pie';
  createdAt: number;
}
```

---

## Data Layer (`src/services/db.ts`)

All data is in-memory arrays seeded on load. Seed generates 44 constituents, 400+ donations, 800+ volunteer logs. Services: `staffService`, `constituentService`, `donationService`, `volunteerService`, `settingsService`, `reportService`. Reports persist to localStorage. Currency persists to localStorage.

Key mock data:
- Default admin: `{ email: 'Admin', password: 'Admin', role: 'admin' }`
- 3 base constituents: John Doe (Donor/Volunteer), Jane Smith (Donor), Bob Wilson (Board Member)
- 3 base donations seeded, plus 400 randomized
- 2 base volunteer logs (one active), plus 800 randomized

---

## App Shell (`src/App.tsx`)

- `BrowserRouter` with routes: `/login`, `/kiosk`, `/`, `/constituent/:id`, `/settings`, `/reports`
- Protected routes redirect to `/login` if no user in localStorage
- `Sidebar` (desktop, hidden on kiosk/login): Dashboard, Reporting, Kiosk Mode (admin-locked)
- `MobileNav` (fixed bottom bar, hidden on kiosk/login)
- Kiosk Mode entry requires admin password via `AdminLockModal`

---

## Pages

### Login (`src/pages/Login.tsx`)
- Form with Staff ID / Email + password fields
- Calls `staffService.login()`, stores user in localStorage
- Redirects to `/` on success
- Default credentials: `Admin` / `Admin`

### Dashboard (`src/pages/Dashboard.tsx`)
- 3 stat cards: Total Donated, Active Volunteers, Service Hours (refreshes every 10s)
- Search bar (debounced 300ms, min 2 chars) searches constituents by name or email
- Results list navigates to `/constituent/:id`
- If no results found, shows inline registration form (name + email → creates constituent)

### ConstituentProfile (`src/pages/ConstituentProfile.tsx`)
- URL: `/constituent/:id`
- Left sidebar: avatar initials, name, status badge, tags, email, phone, total donated, email CTA
- Hover pencil icon on name area opens Edit Profile modal (name, email, phone)
- Two tabs: Donation History (Financial Ledger) and Volunteer Logs (Service Logs)
- Both tabs support add, edit, delete records via modals
- Donations: amount, date, method (cash/check/e-transfer/stripe)
- Volunteer logs: hours + date (manual log); displays check-in/check-out times

### Kiosk (`src/pages/Kiosk.tsx`)
- Fullscreen self-service volunteer check-in/check-out
- Branded as "CommonGround" kiosk
- Step 1: search by name/email → Step 2: confirm identity → Check In or Check Out button
- Success message auto-resets after 5s
- Exit requires admin password via `AdminLockModal`

### Reports (`src/pages/Reports.tsx`)
- Left panel: list of saved reports (2 default: Recent Donations table, Volunteer Overview table)
- Custom reports: choose name, data source (donations/volunteers), fields, visualization (table/bar/line/pie)
- Charts use Recharts; bar/line group by date (last 7 days); pie groups by method/status
- CSV export available on any report
- Custom reports persist to localStorage; default reports (id starts with 'r') are not deletable

### StaffManagement (`src/pages/StaffManagement.tsx`)
- URL: `/settings`
- Left: current user profile edit form + logout button
- Admin only: currency selector (USD, PHP, EUR, GBP, CAD, AUD, JPY, INR)
- Right: full staff list with add/edit/delete (admin only)
- Cannot delete yourself

---

## Components

### AdminLockModal (`src/components/AdminLockModal.tsx`)
- Reusable modal requiring admin password
- Props: `isOpen`, `onClose`, `onSuccess`, `title`, `description`
- Calls `staffService.verifyAdminPassword(password)`
- Used for: entering Kiosk Mode, exiting Kiosk Mode

---

## Design System

- **Brand color:** `#5A5A40` (olive/khaki)
- **Background:** `#f5f5f0` (off-white)
- **Text:** `#2d2d2a`
- **Accent light:** `#e8e8df`
- **Rounded corners:** heavy use of `rounded-full`, `rounded-[2rem]`, `rounded-[3rem]`
- **Brand font:** italic serif used via `brand-font` class (defined in index.css)
- **Typography style:** ALL CAPS tracking-widest labels, italic serif headings
- **Shadows:** subtle `shadow-sm` with brand color tint (`shadow-[#5A5A40]/10`)

---

## Known Gaps / Future Work

- Firebase config is placeholder — not wired to real backend
- No real authentication (mock only)
- No email sending (mailto links only)
- No pagination on large data sets
- Kiosk branded as "CommonGround" (different from UnifyCRM — may want to unify)
- Settings route (`/settings`) uses `StaffManagement` component
- No constituent tagging UI beyond initial registration
