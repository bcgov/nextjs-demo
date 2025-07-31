# ====== Build Stage ======
FROM node:18-alpine AS builder

# Create app directory
WORKDIR /app

# Copy package manifests and install deps
COPY package*.json ./
RUN npm install --frozen-lockfile

# Copy the rest of the source
COPY . .

# Build the Next.js app
RUN npm run build

# ====== Production Runtime ======
FROM node:18-alpine AS runner

WORKDIR /app

# Don't run as root
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup
USER appuser

# Copy only necessary runtime files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.ts ./

# Use Next.js built-in server
EXPOSE 3000

ENV NODE_ENV production

CMD ["node", "node_modules/next/dist/bin/next", "start", "--port", "3000", "--hostname", "0.0.0.0"]

