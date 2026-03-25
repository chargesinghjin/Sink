# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sink is a link shortener with analytics, 100% deployed on Cloudflare (Workers + KV + Analytics Engine + AI). It uses Nuxt 3 with NuxtHub for the Cloudflare bindings layer.

## Commands

```bash
# Development (requires NuxtHub local proxy or Cloudflare bindings)
pnpm dev

# Build for production
pnpm build

# Preview locally with Wrangler
pnpm preview

# Deploy to Cloudflare Pages
pnpm deploy

# Lint
pnpm lint
pnpm lint:fix

# Type check
pnpm typecheck
```

> **Note**: This project uses `pnpm` (not `bun` or `npm`). The `postinstall` script runs `build:map` and `nuxt prepare` automatically.

## Architecture

### Request Flow

1. **`server/middleware/1.redirect.ts`** — First middleware, handles slug lookup and redirect. Reads from Cloudflare KV (`KV.get('link:<slug>')`), logs access, then redirects.
2. **`server/middleware/2.auth.ts`** — Protects `/api/**` routes by validating `NUXT_SITE_TOKEN` from the request header.
3. **`server/middleware/access-log.ts`** — Writes analytics events to Cloudflare Analytics Engine.

### Cloudflare Bindings (via NuxtHub)

Accessed at runtime via `event.context.cloudflare.env`:
- **`KV`** — Cloudflare Workers KV, stores links as `link:<slug>` → JSON
- **`ANALYTICS`** — Cloudflare Analytics Engine dataset (`sink`), used for click tracking
- **`AI`** — Cloudflare Workers AI, used to generate slugs from URLs

Bindings are configured in `wrangler.jsonc` and enabled in `nuxt.config.ts` under `hub: { ai, analytics, kv }`.

### Data Model

Links are defined in `schemas/link.ts` using Zod (`LinkSchema`). Key fields:
- `slug` — validated by `slugRegex` from `app.config.ts`, stored lowercase by default
- `url` — redirect target
- `expiration` — Unix timestamp (optional)
- `id` — nanoid(10) generated identifier

The `nanoid` alphabet intentionally excludes visually ambiguous characters (`0`, `1`, `l`, `o`, `i`).

### Routing

- `/` — prerendered landing page
- `/<slug>` — handled by `1.redirect.ts` middleware (not a page)
- `/dashboard/**` — SPA (SSR disabled, prerendered shell), protected by auth
- `/api/link/*` — CRUD for links, protected by `2.auth.ts`
- `/_docs/scalar` and `/_docs/swagger` — auto-generated OpenAPI UI (Nitro OpenAPI)

### i18n

Locales in `i18n/locales/`. Add new locales by:
1. Adding a JSON file in `i18n/locales/`
2. Adding the locale object to `i18n/i18n.ts`

Default locale is `en-US`. Strategy is `no_prefix` (no URL prefix for language).

### UI Components

- `app/components/ui/` — shadcn-vue components (do not edit directly, regenerate with `shadcn-nuxt`)
- `app/components/dashboard/` — dashboard feature components
- `app/components/home/` — landing page sections
- `app/components/spark-ui/` — animated UI utilities

### Runtime Configuration

All server-side config lives in `nuxt.config.ts` → `runtimeConfig`. Override via environment variables:
- `NUXT_SITE_TOKEN` — auth token for the dashboard/API
- `NUXT_REDIRECT_STATUS_CODE` — 301 or 302
- `NUXT_LINK_CACHE_TTL` — KV cache TTL in seconds
- `NUXT_CASE_SENSITIVE` — slug case sensitivity
- `NUXT_AI_MODEL` — Cloudflare AI model for slug generation

`app.config.ts` holds public, non-secret app identity config (title, email, slugRegex, reserveSlug).

## Key Conventions

- **Slug validation**: Always use `slugRegex` from `useAppConfig()` — do not hardcode slug patterns.
- **KV keys**: Links are stored as `link:<slug>`. Access logs query Analytics Engine via SQL-like syntax in `server/utils/sql-bricks.ts`.
- **Analytics queries**: Use `server/utils/query-filter.ts` and `server/api/stats/` for aggregated data. The Analytics Engine uses `mysql-bricks` for query construction.
- **Reserved slugs**: `dashboard` is reserved; add others to `reserveSlug` in `app.config.ts`.
- **Nuxt compat version 4**: Uses the `app/` directory layout (Nuxt v4 future compat). Pages are in `app/pages/`, server code stays in `server/`.
