# ================================
# Stage 1: Dependencies
# ================================
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --omit=dev --legacy-peer-deps
RUN npx prisma generate

# ================================
# Stage 2: Builder (needs devDependencies for build)
# ================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

# Install ALL dependencies for building (TypeScript, etc)
RUN npm ci --legacy-peer-deps

COPY . .

# Build-time env vars (Next.js inlines NEXT_PUBLIC_* at build time)
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_APP_NAME=TokenByU
ARG NEXT_PUBLIC_COMPANY_NAME=BuildingTok
ARG NEXT_PUBLIC_CHAIN_ID=137
ARG NEXT_PUBLIC_RPC_URL=""
ARG NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS=""
ARG NEXT_PUBLIC_PROPERTY_MARKETPLACE_ADDRESS=""
ARG NEXT_PUBLIC_ROYALTY_DISTRIBUTOR_ADDRESS=""
ARG NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS=""
ARG NEXT_PUBLIC_USDT_ADDRESS=0xc2132D05D31c914a87C6611C10748AEb04B58e8F
ARG NEXT_PUBLIC_USDC_ADDRESS=0x3c499c542cef5e3811e1192ce70d8cc03d5c3359
ARG NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=""
ARG NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
ARG NEXT_PUBLIC_ADMIN_WALLET_ADDRESSES=""

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_COMPANY_NAME=$NEXT_PUBLIC_COMPANY_NAME
ENV NEXT_PUBLIC_CHAIN_ID=$NEXT_PUBLIC_CHAIN_ID
ENV NEXT_PUBLIC_RPC_URL=$NEXT_PUBLIC_RPC_URL
ENV NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS=$NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS
ENV NEXT_PUBLIC_PROPERTY_MARKETPLACE_ADDRESS=$NEXT_PUBLIC_PROPERTY_MARKETPLACE_ADDRESS
ENV NEXT_PUBLIC_ROYALTY_DISTRIBUTOR_ADDRESS=$NEXT_PUBLIC_ROYALTY_DISTRIBUTOR_ADDRESS
ENV NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS=$NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS
ENV NEXT_PUBLIC_USDT_ADDRESS=$NEXT_PUBLIC_USDT_ADDRESS
ENV NEXT_PUBLIC_USDC_ADDRESS=$NEXT_PUBLIC_USDC_ADDRESS
ENV NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=$NEXT_PUBLIC_WEB3AUTH_CLIENT_ID
ENV NEXT_PUBLIC_IPFS_GATEWAY=$NEXT_PUBLIC_IPFS_GATEWAY
ENV NEXT_PUBLIC_ADMIN_WALLET_ADDRESSES=$NEXT_PUBLIC_ADMIN_WALLET_ADDRESSES

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npx prisma generate
RUN npm run build

# ================================
# Stage 3: Runner (production only)
# ================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# Copy only production node_modules from deps stage
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
