# VPS deployment

The current app is best deployed as a long-running Node.js service because it
uses in-process generation tasks, SSE progress, ComfyUI WebSocket events, R2
uploads, Stripe webhooks, and database writes.

Cloudflare Pages with `next-on-pages` is not a direct fit unless the app is
refactored for Edge Runtime or split into separate frontend/API services.

## Recommended shape

- VPS or Docker-capable host for the Next.js app.
- Neon for Postgres.
- Cloudflare R2 for generated images.
- Cloudflare Tunnel or a stable HTTPS endpoint for ComfyUI.
- Nginx/Caddy/Traefik in front of the app for HTTPS and domain routing.

## Docker files

This repository includes:

- `Dockerfile` for Next.js standalone output.
- `docker-compose.example.yml` as a minimal service example.
- `.dockerignore` to keep local secrets and build artifacts out of Docker
  context.

## Build locally

```powershell
docker build -t comfyui-saas .
```

## Run with compose

1. Copy `.env.example` to `.env.production` on the server.
2. Fill production values. Do not commit `.env.production`.
3. Run:

```bash
docker compose -f docker-compose.example.yml up -d --build
```

The app listens on port `3000` inside the container.

## Required environment variables

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `COMFYUI_API_URL`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

Stripe can remain placeholder-only until a supported merchant entity or an
alternative payment provider is chosen.

## Production caveats

- The current rate limiter is in memory. It resets on restart and does not work
  across multiple app instances.
- SSE task progress is also in memory. Run one app instance until a persistent
  queue/event store is added.
- Reset the exposed Neon connection string before production.
- Replace the R2 Public Development URL with a production custom domain before
  public launch.
