#!/bin/sh
# Sobe o app em produção.
# Roda as migrações antes de tudo e, se o banco estiver vazio, cria a equipe
# e os modelos de checklist — assim o primeiro deploy já abre pronto pra usar.
set -e

echo "→ Aplicando migrações do banco…"
./node_modules/.bin/prisma migrate deploy

echo "→ Verificando dados iniciais…"
node scripts/seed-if-empty.mjs

echo "→ Iniciando o servidor na porta ${PORT:-3000}…"
exec ./node_modules/.bin/next start --port "${PORT:-3000}" --hostname "${HOSTNAME:-0.0.0.0}"
