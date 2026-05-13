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
- [x] GitHub Actions Ubuntu Pages build workflow added.
- [x] Cloudflare R2 development bucket configured and upload verified.
- [x] Basic generation rate limiting and prompt filtering implemented.
- [ ] Stripe test keys configured and checkout flow verified.
- [ ] Named Cloudflare Tunnel configured with a stable custom hostname.
- [ ] Cloudflare Pages build verified in Linux/Cloudflare build environment.
- [ ] Production environment variables configured in Cloudflare Pages.
- [ ] Full paid end-to-end test passed.

## External blockers

### Cloudflare R2

- [x] Add payment method to Cloudflare.
- [x] Create R2 bucket `comfyui-saas-images`.
- [x] Create R2 API token with object read/write access.
- [x] Configure Public Development URL.
- [x] Set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` locally.
- [x] Run a real generation and confirm `generation_tasks.imageUrl` is populated.
- [x] Confirm `/history` API returns a completed task with image URL.
- [ ] Replace Public Development URL with a custom production domain.

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
- [x] Add GitHub Actions workflow for Ubuntu Pages build verification.
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
- [ ] Confirm generation rate limit returns 429 after repeated requests.
- [ ] Confirm disallowed prompts return 400 before credits are deducted.
- [ ] Confirm failed generation refunds credits.
- [ ] Confirm unauthenticated API calls return 401.

## Known risks

- `@cloudflare/next-on-pages` is archived and has Windows build issues. Production deployment should be verified in Cloudflare Pages Linux build or reconsidered with OpenNext Cloudflare adapter.
- In-memory SSE progress and generation rate limiting only work reliably in a single running instance. Multi-instance/serverless production needs persistent progress storage and an external rate-limit store.
- R2 is configured for development and verified with a real upload. Stripe still needs test keys and webhook verification.
- The Neon connection string was exposed earlier in conversation screenshots and should be reset before production.
