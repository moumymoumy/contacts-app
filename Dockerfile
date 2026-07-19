# --- Étape 1 : installation des dépendances ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

# --- Étape 2 : construction de l'application ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- Étape 3 : image finale, allégée ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# curl est nécessaire pour le "healthcheck" que Coolify utilise
# pour vérifier que l'application répond bien
RUN apk add --no-cache curl

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
