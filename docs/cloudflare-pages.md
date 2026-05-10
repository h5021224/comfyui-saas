# Cloudflare Pages deployment

This project uses `@cloudflare/next-on-pages` for the Cloudflare Pages build target.

Note: the upstream `cloudflare/next-on-pages` repository is archived and now
recommends the OpenNext Cloudflare adapter for new full-stack Next.js apps. This
file keeps the Pages setup because the current project task targets Cloudflare
Pages. Revisit this before production deployment.

## Local commands

```powershell
npm.cmd run pages:build
npm.cmd run pages:preview
```

The Pages output directory is:

```text
.vercel/output/static
```

Manual deploy:

```powershell
npm.cmd run pages:deploy
```

## Cloudflare Dashboard setup

1. Open Cloudflare Dashboard.
2. Go to `Workers & Pages`.
3. Create a Pages project from the GitHub repository.
4. Use these build settings:
   - Framework preset: `Next.js`
   - Build command: `npm.cmd run pages:build` locally, or `npm run pages:build` in Cloudflare Linux build
   - Build output directory: `.vercel/output/static`
5. Enable the `nodejs_compat` compatibility flag.
6. Copy values from `.env.cloudflare.example` into Pages environment variables.
7. Add the production domain to `NEXTAUTH_URL`.

## Windows local build caveat

`npm.cmd run pages:build` currently fails on this Windows machine inside
`@cloudflare/next-on-pages`:

```text
Error: spawn npx ENOENT
```

Before that, without Git Bash in `PATH`, it fails with:

```text
Error: spawn bash ENOENT
```

This matches the tool's own warning that its Vercel-based build path is not
reliable on Windows. Run the Pages build in one of these environments instead:

- Cloudflare Pages Linux build environment through Git integration.
- WSL with Node.js and npm installed.
- GitHub Actions on Ubuntu.

The normal Next.js build still passes locally:

```powershell
npm.cmd run build
```

## Required production integrations

- Neon `DATABASE_URL`
- Auth secrets
- Stripe keys and webhook secret
- Cloudflare R2 bucket and public URL
- Cloudflare Tunnel URL for ComfyUI

## Current blockers

R2 and Stripe are not configured yet. Pages can be prepared, but full production
verification needs those credentials plus a stable named Cloudflare Tunnel.
