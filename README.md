<div align="center">

<img src="./client/public/icon-512.png" alt="Ledger logo" width="88" height="88" />

# Ledger

**A full-stack expense tracker built around Spaces — separate, self-contained contexts for personal and business finances under a single account.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma_6-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8?logo=pwa&logoColor=white)](#progressive-web-app)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](#license)

</div>

---

## Overview

Ledger is a mobile-first expense tracker built as a Final Year Project — and put to real use tracking expenses for Lahori Athleisure, a clothing brand.

Most expense trackers assume one undifferentiated pool of spending. Ledger doesn't: every user gets **Spaces** — named, independently-scoped contexts (e.g. *Personal*, *Business*) — each with its own categories, budget, and dashboard, all under one login. Switching Spaces re-themes the entire app (a distinct accent color per Space), so which context you're in is never ambiguous.

**Live demo:** https://ledger-eight-dun.vercel.app/
**Design reference:** [`expense-manager-mockups.html`](./expense-manager-mockups.html) — interactive, light/dark toggle

---

## Table of contents

- [Why this project](#why-this-project)
- [Core features](#core-features)
- [The Spaces model](#the-spaces-model)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Security](#security)
- [Progressive Web App](#progressive-web-app)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Screens](#screens)
- [Deliberate scope decisions](#deliberate-scope-decisions)
- [Roadmap](#roadmap)
- [License](#license)

---

## Why this project

Most student "expense tracker" projects are single-user, single-context CRUD demos. Ledger is deliberately more than that:

- **Genuinely dogfooded** — actively used to track real expenses for a real small business, not a toy dataset
- **A real architectural decision, not a feature list** — the Spaces model shapes the database schema, the authorization model, and the UI, rather than being bolted on afterward
- **Security treated as a first-class requirement**, not an afterthought — see [Security](#security)
- **Shipped as a PWA** — installable to a home screen, works offline for the app shell, no App Store review needed

---

## Core features

**Authentication**
- Email/password signup with real-time password strength feedback
- Email verification via one-time code (OTP), sent through Gmail SMTP
- Forgot / reset password, also OTP-based
- Account lockout after 5 failed login attempts (15-minute cooldown)
- Rate limiting on all auth endpoints

**Spaces**
- Create, rename, delete, and switch between unlimited Spaces
- Each Space auto-assigned a distinct color from a 10-color palette
- Switching Spaces re-themes the whole app (accent color, category tint) — an intentional, animated visual cue for which context you're in
- Duplicate Space names rejected server-side (case-insensitive)

**Categories**
- Created inline, scoped to a Space (never global)
- Automatic icon assignment via keyword matching (e.g. "rent" → home icon, "fuel" → gas pump) — no manual icon picking required
- Edit, delete (with cascade warning — deleting a category deletes its expenses)

**Expenses**
- Add via a fast bottom-sheet (amount-first, numeric entry)
- Edit, delete, full transaction history with date range / category / amount filters and free-text search (matches category name or note)

**Dashboard**
- Month-to-date total, trend vs. last month (with correct handling of "no prior month to compare" — never shows a misleading 0%)
- Budget remaining, transaction count
- Top categories by spend, recent transactions
- 80%-of-budget alert banner

**Budgets**
- Overall monthly limit and optional per-category limits
- Drives the dashboard's "Budget left" metric and alert banner

**Reports**
- Weekly/monthly interactive trend chart (tap any bar to see its exact figure)
- Category breakdown with percentage-of-total
- Month-over-month comparison
- CSV and PDF export

**Settings**
- Light / dark / system appearance, persisted
- Currency preference (7 currencies), propagates to every money display across the app
- Space management, privacy & security summary, logout

---

## The Spaces model

```
User
 └── has many → Space            (e.g. "Personal", "Business — Lahori Athleisure")
       └── has many → Category   (scoped to one Space)
             └── has many → Expense
       └── has one → Budget      (overall, or per-category)
```

A Category created in the *Business* Space is invisible from *Personal*, and vice versa. There's no cross-Space "All" aggregate view by design — Spaces are meant to stay genuinely separate, not just color-coded.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS v4, Framer Motion |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL, Prisma ORM v6 |
| Auth | bcrypt, JWT (HTTP-only cookies) |
| Email | Nodemailer + Gmail SMTP (OTP delivery) |
| PDF/CSV export | pdfkit |
| PWA | vite-plugin-pwa (Workbox service worker) |
| Icons | Custom inline SVG set — no external font/CDN dependency |

**Why these choices:**
- **Prisma v6, not v7** — v7 introduced breaking config changes not worth adopting mid-project
- **Tailwind v4's Vite plugin**, not the deprecated CLI init flow
- **Inline SVG icons over an icon font** — an external Tabler webfont CDN proved unreliable in testing (intermittent load failures caused blank icon tiles); a self-contained SVG set removes that failure mode entirely
- **HTTP-only cookies for JWTs, not localStorage** — localStorage is readable by any injected script, making token theft via XSS trivial; HTTP-only cookies are not

---

## Security

Security requirements were written down *before* implementation (`05-security-requirements.md`) and treated as acceptance criteria, not best-effort extras.

- Passwords hashed with **bcrypt**, never stored or logged in plaintext
- Sessions via **HTTP-only, secure cookies** — inaccessible to JavaScript, immune to token-stealing XSS
- **Rate limiting** on login/signup/OTP endpoints, separate per-IP and per-account lockout tiers
- **Account lockout** after 5 failed login attempts (15 min)
- **Single-use, time-limited OTP tokens** (10 min expiry) for email verification and password reset
- **Every database query scoped to the authenticated user server-side** — Space, Category, and Expense ownership is verified on every read/write, not just checked in the UI. A user cannot access another user's data by guessing an ID (IDOR prevention)
- Password-reset endpoint returns an identical response whether or not the email is registered, to prevent account enumeration
- Input validation server-side on every write (amount is numeric, date is valid, category belongs to the requesting user's Space)
- Secrets (DB connection string, JWT secret, Gmail credentials) in environment variables, `.env` gitignored from the first commit

---

## Progressive Web App

Ledger is installable — Add to Home Screen on iOS, automatic install prompt on Android/Chrome — and caches its app shell for offline load. Backend API calls are intentionally **not** cached, since expense data must always be current, never served stale.

No app store review process, no listing fees. If native distribution is ever needed, the PWA can be wrapped with Capacitor without touching the underlying React codebase.

---

## Getting started

### Prerequisites
- Node.js 18+
- PostgreSQL running locally (or a connection string to a hosted instance)
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords) generated (for OTP email delivery)

### 1. Clone and install

```bash
git clone https://github.com/faheemakhtar7824/ledger.git
cd ledger
```

```bash
cd server
npm install
```

```bash
cd ../client
npm install
```

### 2. Configure environment variables

Copy the example files and fill in real values (see Environment variables below):

```bash
cd server
cp .env.example .env
```

```bash
cd ../client
cp .env.example .env
```

### 3. Set up the database

```bash
cd server
npx prisma migrate dev
```

### 4. Run both servers

```bash
# Terminal 1 — backend
cd server
npm run dev
```

```bash
# Terminal 2 — frontend
cd client
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:5000`

---

## Environment variables

**`server/.env`**

```env
DATABASE_URL="postgresql://user:password@localhost:5432/ledger?schema=public"
JWT_SECRET=a_long_random_string_at_least_32_characters
GMAIL_USER=youraddress@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**`client/.env`**

```env
VITE_API_URL=http://localhost:5000/api
```

> `JWT_SECRET` can be generated with:
> `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## Project structure

```
ledger/
├── client/                  React frontend (Vite)
│   ├── public/               Static assets, PWA icons
│   └── src/
│       ├── components/       Reusable UI (sheets, pickers, icon tiles)
│       ├── context/           Auth, Space, and Theme providers
│       ├── lib/                API client, currency/icon helpers
│       └── screens/           One file per route
├── server/                  Express backend
│   └── src/
│       ├── routes/            auth, spaces, categories, expense, budget, reports
│       ├── middleware/         requireAuth (JWT verification)
│       ├── lib/                 Prisma client, Nodemailer/Gmail wrapper
│       └── db.js               Shared Prisma client instance
└── *.md                     Product brief, schema, security requirements, screens & flows
```

---

## Screens

| Auth | Dashboard | Add expense |
|---|---|---|
| Signup / login / OTP verify / forgot & reset password | Space-tinted totals, trend, budget, categories, recent activity | Amount-first bottom sheet, inline category creation |

| Categories | Reports | Settings |
|---|---|---|
| List, inline add, edit/delete, drill-down detail | Interactive weekly/monthly trend, breakdown, CSV/PDF export | Appearance, currency, Space management, security summary |

---

## Deliberate scope decisions

Documented explicitly so they read as intentional, not oversights:

- **No AI query agent** — considered for phase 2, descoped to keep the project free of any paid API dependency
- **No loans/lending tracking** — dropped early; out of scope for what an expense tracker should own
- **No cross-Space aggregate view** — Spaces are meant to stay genuinely separate
- **PWA over native app** — no store fees or review process; Capacitor wrap remains an option later
- **No full penetration testing / SOC 2** — appropriately out of scope for FYP scale; explicitly noted in the security requirements doc rather than silently skipped

---

## Roadmap

- [ ] AI query agent (phase 2, pending a cost-free inference option)
- [ ] Push notifications for budget alerts
- [ ] Multi-currency Spaces (currently one currency preference per user, not per Space)

---

## License

MIT — see `LICENSE` for details.

---

<div align="center">

Built by **Faheem Akhtar** — BS Computer Science
[GitHub](https://github.com/faheemakhtar7824)

</div>
