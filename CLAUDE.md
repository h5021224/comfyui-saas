# ComfyUI SaaS — Codex Instructions

## Project Overview

A credit-based text-to-image SaaS platform. Users pay credits (via Stripe) to generate images using a local ComfyUI instance exposed through Cloudflare Tunnel.

## Tech Stack

- Next.js 15 (App Router) + TypeScript
- shadcn/ui + Tailwind CSS
- Drizzle ORM + Neon (PostgreSQL)
- Auth.js v5 (email/password credentials)
- Stripe Checkout + Webhooks
- Cloudflare R2 (image storage)
- ComfyUI API (WebSocket + HTTP)
- SSE for real-time progress

## Key Design Decisions

- **All-in-one Next.js**: No separate backend. API Routes handle everything.
- **SSE over WebSocket**: For generation progress. Simpler, Cloudflare-compatible.
- **Drizzle ORM**: Lightweight, type-safe, edge-runtime compatible.
- **Credits with row-level locking**: Deduct credits in a DB transaction with `FOR UPDATE` to prevent race conditions.
- **Idempotent webhooks**: Stripe webhook handler deduplicates by `stripe_session_id`.

## Design Docs Location

All design documents are in the Obsidian vault at `E:\software\obsidian\obsidian_vault\4-作品\02-项目\comfyui-saas\`:
- PRD.md — Product requirements & feature list
- 架构设计.md — Architecture, deployment diagram, directory structure
- 数据库设计.md — Full DB schema with Drizzle code
- API设计.md — All API endpoints with request/response examples
- 任务拆分.md — Step-by-step implementation tasks

**Read these files before implementing any task.**

## Code Style

- TypeScript strict mode
- Prefer `async/await` over `.then()`
- Use zod for all input validation
- Use server components by default; `"use client"` only when needed
- No comments unless explaining a non-obvious "why"
- Immutable patterns — no object mutation

## File Naming

- Components: PascalCase (`GenerateForm.tsx`)
- Utilities/lib: camelCase (`creditCalculator.ts`)
- API routes: `route.ts` inside folder structure
- DB schema: `schema.ts`

## Testing

- Test credit operations (deduct, refund, concurrent access)
- Test Stripe webhook signature verification
- Test ComfyUI workflow JSON generation
- Test API input validation (zod schemas)

## Environment

- Windows 11
- Node.js (latest LTS)
- ComfyUI runs locally on port 8188
- Neon PostgreSQL (serverless)
- Deploy target: Cloudflare Pages
