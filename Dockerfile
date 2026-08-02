# ---------------------------------------------------------------------- build
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# o build só gera o Prisma Client e compila o Next; as migrações rodam no start
RUN npm run build

# tira as dependências de desenvolvimento, mantendo o CLI do Prisma
# (ele é dependência de produção porque o start.sh roda `migrate deploy`)
RUN npm prune --omit=dev

# --------------------------------------------------------------------- runtime
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# por padrão o banco fica no volume persistente montado em /data
ENV DATABASE_URL="file:/data/cidade.db"

RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.mjs ./next.config.mjs

RUN mkdir -p /data && chown nextjs:nodejs /data && chmod +x scripts/start.sh

USER nextjs
VOLUME ["/data"]
EXPOSE 3000

CMD ["sh", "scripts/start.sh"]
