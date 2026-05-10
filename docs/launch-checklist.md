# Launch checklist

This checklist tracks what is ready and what is blocked before production.

## Current status

- [x] Next.js app scaffolded.
- [x] Neon schema and migrations created.
- [x] Email/password auth implemented.
- [x] Credits balance and transaction APIs implemented.
- [x] Stripe checkout and webhook code implemented.
- [x] ComfyUI client and workflow integration implemented.
- [x] Generate API, task polling, and SSE implemented.
- [x] Generate, history, and billing dashboard pages implemented.
- [x] Cloudflare Tunnel quick tunnel smoke test passed.
- [x] Cloudflare Pages configuration files and scripts added.
- [ ] Cloudflare R2 production bucket configured.
- [ ] Stripe test keys configured and checkout flow verified.
- [ ] Named Cloudflare Tunnel configured with a stable custom hostname.
- [ ] Cloudflare Pages build verified in Linux/Cloudflare build environment.
- [ ] Production environment variables configured in Cloudflare Pages.
- [ ] Full end-to-end test passed.

## External blockers

### Cloudflare R2

- [ ] Add payment method to Cloudflare.
- [ ] Create R2 bucket, for example `comfyui-saas-images`.
- [ ] Create R2 API token with object read/write access.
- [ ] Configure public URL or custom domain.
- [ ] Set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`.
- [ ] Run a real generation and confirm `generation_tasks.imageUrl` is populated.
- [ ] Confirm `/history` displays completed images.

### Stripe

- [ ] Create or open Stripe test mode project.
- [ ] Set `STRIPE_SECRET_KEY`.
- [ ] Set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- [ ] Configure webhook endpoint for `/api/stripe/webhook`.
- [ ] Set `STRIPE_WEBHOOK_SECRET`.
- [ ] Complete checkout in test mode.
- [ ] Confirm `payments.status = completed`.
- [ ] Confirm purchase credits are added once.
- [ ] Confirm duplicate webhook delivery is idempotent.

### Cloudflare Tunnel

- [ ] Create named tunnel `comfyui` in Cloudflare Dashboard.
- [ ] Bind public hostname, for example `comfyui-api.yourdomain.com`.
- [ ] Point service to `http://localhost:8188`.
- [ ] Install Windows service with the Cloudflare connector token.
- [ ] Set `COMFYUI_API_URL` to the tunnel hostname.
- [ ] Confirm `/system_stats` is reachable through the hostname.

### Cloudflare Pages

- [ ] Push project to GitHub.
- [ ] Create Cloudflare Pages project from the repository.
- [ ] Use build command `npm run pages:build`.
- [ ] Use output directory `.vercel/output/static`.
- [ ] Enable `nodejs_compat`.
- [ ] Configure all environment variables from `.env.cloudflare.example`.
- [ ] Set `NEXTAUTH_URL` to the production domain.
- [ ] Verify Pages build in Linux/Cloudflare environment.

## Pre-launch smoke tests

- [ ] Register a new user.
- [ ] Login with email/password.
- [ ] Check initial gift credits.
- [ ] Purchase credits through Stripe test mode.
- [ ] Generate a 512 x 512 image.
- [ ] Confirm credits are deducted.
- [ ] Confirm ComfyUI receives and completes the prompt.
- [ ] Confirm generated image uploads to R2.
- [ ] Confirm `/history` displays the image and details.
- [ ] Confirm download link works.
- [ ] Confirm failed generation refunds credits.
- [ ] Confirm unauthenticated API calls return 401.

## Known risks

- `@cloudflare/next-on-pages` is archived and has Windows build issues. Production deployment should be verified in Cloudflare Pages Linux build or reconsidered with OpenNext Cloudflare adapter.
- In-memory SSE progress only works reliably in a single running instance. Multi-instance/serverless production needs persistent progress storage or an external event channel.
- R2 and Stripe are currently not configured because Cloudflare payment setup is blocked by lack of a physical card.
- The Neon connection string was exposed earlier in conversation screenshots and should be reset before production.
