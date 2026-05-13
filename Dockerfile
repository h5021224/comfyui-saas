FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV AUTH_SECRET=build-time-auth-secret-at-least-32-characters
ENV NEXTAUTH_SECRET=build-time-auth-secret-at-least-32-characters
ENV NEXTAUTH_URL=http://localhost:3000
ENV DATABASE_URL=postgresql://user:password@example.com:5432/db?sslmode=require
ENV COMFYUI_API_URL=http://localhost:8188
ENV R2_ACCOUNT_ID=build-account-id
ENV R2_ACCESS_KEY_ID=build-access-key-id
ENV R2_SECRET_ACCESS_KEY=build-secret-access-key
ENV R2_BUCKET_NAME=comfyui-saas-images
ENV R2_PUBLIC_URL=https://example.r2.dev
ENV STRIPE_SECRET_KEY=sk_test_build_placeholder
ENV STRIPE_WEBHOOK_SECRET=whsec_build_placeholder
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_build_placeholder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
