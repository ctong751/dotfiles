---
name: unplugged
description: Working in the Unplugged TCG inventory management monorepo (~/repos/unplugged or worktrees).
allowed-tools: Bash
---

# Unplugged Project

Monorepo using **Bun** + **Turbo**. Worktrees are placed as siblings to the main repo (e.g. `~/repos/UG-432-fix-foo`).

## Key Commands

### Type checking
`turbo` is NOT globally installed. Use `bunx` to invoke it:

```bash
# ❌ Wrong - will fail with "turbo: command not found"
bun run check

# ✅ Correct - use bunx turbo directly
bunx turbo run check-types
# Or filter to a specific package:
bunx turbo run check-types --filter=web
bunx turbo run check-types --filter=@unplugged/shopify-inventory-sync
```

### Linting & formatting

```bash
bunx turbo run lint
bunx prettier --check .
```

### Tests

```bash
bunx turbo run test
# Single package:
bunx turbo run test --filter=@unplugged/core
# Single file (faster for targeted testing):
bunx vitest run packages/unplugged/src/shopify/myFile.spec.ts
```

### Build

```bash
bunx turbo run build
```

## Package structure

```
packages/
  core/        # @unplugged/core — shared DB, utils, types
  shopify-client/ # @unplugged/shopify-client — Shopify API wrapper
workers/
  shopify-inventory-sync/  # Cloudflare Worker — queue consumer
apps/
  web/         # Next.js frontend (OpenNext + Cloudflare)
```

## Worktrees

Worktrees are siblings to `~/repos/unplugged`. When in a worktree, `node_modules` and `turbo` are not in PATH — always use `bunx turbo`.

Branch naming: `<ticket-id>-<short-description>` (e.g. `UG-432-fix-enchanted-double-title`)
Commit prefix: `UG-NNN: description`

## Git workflow

- Feature branches only; never commit to `main` directly
- Open PRs against `main`
- CI runs lint, build, test, type-check via turbo

## Shopify API Notes

- **`productVariantUpdate` is removed** in newer Shopify API versions. Use `productVariantsBulkUpdate` instead — it takes `productId` + array of `{ id, sku, ... }` and batches all variant updates for a product in one call.
- One-off scripts go in `scripts/` at the repo root. Run with `bun scripts/my-script.ts`.

## Jira tickets

Ticket IDs use the `UG-` prefix. Use the `jira` skill to look them up.

## Shopify Variant Option Values

When creating/updating variants, `optionValues` entries **must include either `id` or `name`**; omitting both causes:
```
[INVALID_INPUT] id or name must be specified (field: variants.0.optionValues.0)
```
Prefer `id` when the option value already exists in Shopify.

## D1 Database (Cloudflare)

Database ID: `cdefb879-c38e-44e3-a723-5e60601fb740`

**Always query the schema first before writing SQL** — never guess table or column names:
```sql
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
```

Known tables (as of 2026-03): `account`, `authenticator`, `buylist`, `card`, `config`, `finish`, `inventory`, `list`, `list_item`, `list_user`, `pricing_action`, `pricing_condition`, `pricing_minimum`, `pricing_rule`, `revalidations`, `session`, `set`, `shopify_connection`, `shopify_inventory`, `store`

⚠️ Tables use **singular names**: `list_item` (not `list_items`), `card` (not `card_variant`).

## Cloudflare MCP / Observability

- `workers_get_worker` takes `scriptName` as a top-level string, not inside a `query` object.
- `workers_get_worker_code` often exceeds MCP token limits. When it errors with "result exceeds maximum allowed tokens", the output is saved to a file under `~/.claude/projects/`. Use `grep` or `python3` on that file — do not retry the MCP call.
