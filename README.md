# ComfyUI SaaS — 积分制文生图平台

基于本地 ComfyUI 的文生图 Web 平台，用户通过 Stripe 充值积分，按次付费生成图片。

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + shadcn/ui + Tailwind CSS
- **Database**: Neon (Serverless PostgreSQL) + Drizzle ORM
- **Auth**: Auth.js v5 (NextAuth)
- **Payment**: Stripe Checkout
- **Image Storage**: Cloudflare R2
- **Hosting**: Cloudflare Pages
- **AI Backend**: ComfyUI (local, via Cloudflare Tunnel)

## Architecture

```
User Browser → Cloudflare Pages (Next.js)
                  ├→ Neon PostgreSQL (users, credits, tasks)
                  ├→ Stripe (payments)
                  ├→ Cloudflare R2 (generated images)
                  └→ Cloudflare Tunnel → Local PC → ComfyUI :8188
```

## Getting Started

```bash
# Install dependencies
npm install

# Copy env file and fill in values
cp .env.example .env

# Run database migrations
npm run db:migrate

# Start dev server
npm run dev
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Login / Register
│   ├── (dashboard)/        # Generate / History / Billing
│   └── api/                # API Routes
├── components/             # UI Components
├── lib/                    # Core logic
│   ├── db/                 # Drizzle schema & client
│   ├── auth/               # Auth configuration
│   ├── stripe/             # Stripe utilities
│   ├── comfyui/            # ComfyUI API wrapper
│   ├── credits/            # Credits calculation
│   └── r2/                 # R2 upload utilities
└── types/                  # TypeScript types
```

## Design Docs

See Obsidian vault: `4-作品/02-项目/comfyui-saas/`

- PRD.md — Product requirements
- 架构设计.md — Architecture design
- 数据库设计.md — Database schema
- API设计.md — API specification
- 任务拆分.md — Task breakdown for implementation
