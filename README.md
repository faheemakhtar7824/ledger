# Expense Manager

A mobile-first expense tracker with a **Spaces** model — separate Personal and Business (or custom) contexts under one login, each with its own categories, budget, and dashboard. Built as a Final Year Project; also used in production for Lahori Athleisure's business expense tracking.

## Why Spaces?

Most expense trackers force one flat list or require separate accounts to separate life from business spending. This app lets one user maintain multiple isolated "Spaces" — each with its own categories, budgets, and reports — without juggling logins.

## Features

- **Auth** — email/password signup & login, OTP email verification, OTP-based password reset, account lockout after failed attempts
- **Spaces** — create/switch/rename/delete, each fully isolated (categories, budgets, expenses scoped per space)
- **Categories** — user-defined per space, created inline, smart icon auto-assignment via keyword matching, 10–15 pre-built categories on first signup
- **Expenses** — add/edit/delete via a fast bottom-sheet form (amount, category, date, note)
- **Dashboard** — monthly total, trend vs last month, budget left, transaction count, category breakdown with progress bars, recent transactions
- **Expense history** — full list with filters (date range, category, amount) and search
- **Reports** — monthly/weekly trend, category breakdown, month-over-month comparison, CSV/PDF export
- **Budgets** — monthly limit per space (overall or per-category), alerts near limit
- **Settings** — profile, manage spaces, currency, appearance (light/dark/system), notifications, logout
- **AI query agent** (Phase 2) — natural-language queries over your own expense data via scoped, pre-defined tool calls (no raw SQL access, no cross-user data exposure)
- **PWA** — installable to home screen, works offline via caching

## Tech stack

| Layer      | Tech |
|------------|------|
| Frontend   | React (Vite), Tailwind CSS v4, Framer Motion |
| Backend    | Node.js, Express |
| Database   | PostgreSQL, Prisma ORM v6 |
| Auth       | bcrypt, jsonwebtoken, HTTP-only secure cookies |
| Security   | helmet, express-rate-limit |
| Email      | nodemailer / resend (OTP delivery) |
| Uploads    | multer, Cloudinary |
| Scheduled jobs | node-cron |
| Integrations | Shopify (orders) |
| Hosting    | Railway (backend), Vercel (frontend) |

## Project structure

```
expense-manager/
├── client/          # React (Vite) frontend
├── server/          # Express backend
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── prisma/
│   └── schema.prisma
└── docs/            # product brief, schema, security requirements, design system
```

## Data model

```
User
 └── Space (e.g. "Personal", "Business")
      ├── Category (scoped to one space)
      │    └── Expense
      └── Budget (monthly limit, optional per-category)
```

Full schema: `server/schema.prisma`.

## Security highlights

- Passwords hashed with bcrypt; never stored or logged in plaintext
- Signup enforces password strength (8+ chars, uppercase, number, special char) with a live strength indicator
- Email verified via single-use, short-expiry OTP before account activation
- Sessions via HTTP-only secure cookies — never localStorage
- Rate limiting + account lockout (5 failed attempts → 15 min lock) on auth endpoints
- **All data access is server-side scoped to `user_id`**, with explicit Space-level ownership checks on every request — not just "is logged in"
- Prisma parameterized queries (no raw SQL, no injection surface)
- CSP headers, CORS config, secrets in environment variables only (`.env` gitignored from first commit)
- AI agent calls only pre-defined, user-scoped functions — never arbitrary SQL, never cross-user data

Full details: `docs/05-security-requirements.md`.

## Getting started

```bash
# clone
git clone https://github.com/<your-username>/expense-manager.git
cd expense-manager

# backend
cd server
cp .env.example .env   # fill in DATABASE_URL, JWT secrets, email/Cloudinary keys
npm install
npx prisma migrate dev
npm run dev

# frontend
cd ../client
npm install
npm run dev
```

## Environment variables

See `server/.env.example` for the full list (database URL, JWT secret, OTP email provider keys, Cloudinary keys, Shopify keys, LLM API key for the AI agent).

## Status

Core tracker (auth, spaces, categories, expenses, dashboard, budget, reports, expense history, settings) is feature-complete.

## License

MIT
