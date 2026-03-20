---
name: stanley
description: Working in the Stanley personal dashboard monorepo (~/repos/stanley). Bun + Turborepo with apps/api (Hono) and apps/web (React/Vite).
allowed-tools: Bash
---

# Stanley Project

Turborepo monorepo using **Bun** workspaces. Two apps: `apps/api` (Hono + Bun + SQLite) and `apps/web` (React + Vite). Shared packages in `packages/`.

## ⚠️ TypeScript / Typechecking — Critical Notes

**NEVER use `npx tsc`** — this repo uses Bun. `npx` will fail with "This is not the tsc command you are looking for."

```bash
# ✅ Correct
bunx tsc --noEmit

# ❌ Wrong — will fail
npx tsc --noEmit
```

**Pre-existing bun-types error:** `bunx tsc` may emit `error TS2688: Cannot find type definition file for 'bun-types'`. This is a **pre-existing environment issue**, not caused by your changes. Use `bun build` to verify your code compiles cleanly:

```bash
cd apps/api && bun build server/index.ts --target bun --outdir /tmp/stanley-check
```

**No `typecheck` turbo task defined** — `bun run --filter @stanley/api typecheck` will fail with "No packages matched the filter". Use direct `bunx tsc --noEmit` instead.

## ⚠️ Adding Dependencies

**NEVER use `bun add --filter`** — it will try to fetch the package from npm registry as a workspace name and fail with 404.

```bash
# ✅ Correct — cd into the app first
cd ~/repos/stanley/apps/api && bun add zod
cd ~/repos/stanley/apps/web && bun add some-package

# ❌ Wrong — will 404
bun add zod --filter @stanley/api
```

## Key Commands

```bash
# From ~/repos/stanley root:
bun run dev          # start both api (:5000) and web (:5001)
bun run build        # build all packages
bun run lint         # lint all
bun run test         # test all

# API only:
cd apps/api && bun run dev          # watch mode
cd apps/api && bun test             # all tests (in-memory SQLite)
cd apps/api && bun test tests/foo.test.ts   # single test file

# Web only:
cd apps/web && bun run dev          # vite dev server
cd apps/web && bunx vitest run src/foo.test.ts   # single test file
```

## Package Structure

```
apps/
  api/       # @stanley/api — Hono REST API, SQLite via Drizzle, server/index.ts
  web/       # @stanley/web — React 19 SPA, Vite, TanStack Query, React Router
packages/
  db/        # @stanley/db — shared Drizzle schema (packages/db/src/schema.ts)
  ui/        # @stanley/ui — shared shadcn/ui components
```

## Architecture Notes

- All API endpoints in `apps/api/server/index.ts`; DB operations in `*-db.ts` files
- Frontend hooks in `apps/web/src/hooks/` wrap TanStack Query per domain (tasks, workouts, health, nutrition)
- Path alias: `@/*` → `apps/web/src/*`
- Vite proxies `/api/*` → `localhost:5000` in dev
- Drizzle types inferred from schema (`$inferSelect`, `$inferInsert`)
- External integrations (Home Assistant, Google Calendar, GitHub) called from API server

## Database

SQLite at `apps/api/data/stanley.db`. Migrations via `drizzle-kit push`.

## Git Rules

- Direct commits to `main` are **allowed** for Stanley (`ctong751/stanley`)
- No PR required — commit and push directly
