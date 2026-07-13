# Fair Nigeria (Fair27)

A citizen-led electoral transparency platform for Nigeria's 2027 General Election. Fair Nigeria is a
parallel, citizen-verifiable record - **not** a replacement for INEC - built around three pillars:

1. **Civic education** - plain-English articles on voter rights, accreditation, malpractice, and reporting.
2. **Citizen ratings** - registered citizens rate election-day conditions, aggregated to a public dashboard.
3. **Independent result collation** - field officials upload EC8A sheets; a human consensus engine
   (2-of-3 independent transcribers) verifies figures before publishing. No AI, no single point of control.

## Repository layout

This is a **monorepo** with one deployable backend and a separate frontend, kept as sibling folders:

```
fair-nigeria/
├── fn-backend/        Modular monolith API (Node.js + Express 5 + TypeScript)
│   └── src/
│       ├── modules/   One folder per domain (auth, content, ratings, upload, consensus, ...)
│       └── shared/    Cross-cutting: env, logger, response envelope, errors, middleware
├── fn-frontend/       PWA (React) - scaffolded in a later sprint
├── tsconfig.base.json Shared TypeScript compiler options (each package extends this)
├── eslint.config.mjs  Shared lint rules
└── .prettierrc.json   Shared formatting rules
```

The backend is a modular monolith: domains live in `src/modules/*` and communicate via direct function
calls, not network requests. It is structured so individual modules can be extracted into services later.

## Getting started

Requires Node.js 22 LTS (see `.nvmrc`).

```bash
# Install all workspace dependencies from the repo root
npm install

# Run the backend in watch mode
npm run dev:backend

# Lint / format the whole repo
npm run lint
npm run format
```

The backend starts on `http://localhost:3000` by default. Check `GET /health` to confirm it is up.

Copy `fn-backend/.env.example` to `fn-backend/.env` and fill values as modules are implemented.
