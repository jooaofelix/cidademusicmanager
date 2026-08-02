#!/bin/sh
# Sobe o app em produção.
# Sincroniza o banco antes de tudo e, se ele estiver vazio, cria a equipe e os
# modelos de checklist — assim o primeiro deploy já abre pronto pra usar.
set -e

if [ -d prisma/migrations ]; then
  echo "→ Aplicando migrações do banco…"
  ./node_modules/.bin/prisma migrate deploy
else
  # Projeto configurado para PostgreSQL: o schema é sincronizado direto,
  # sem arquivos de migração (veja scripts/usar-postgres.mjs).
  echo "→ Sincronizando o schema do banco…"
  ./node_modules/.bin/prisma db push
fi

echo "→ Verificando dados iniciais…"
node scripts/seed-if-empty.mjs

echo "→ Iniciando o servidor na porta ${PORT:-3000}…"
exec ./node_modules/.bin/next start --port "${PORT:-3000}" --hostname "${HOSTNAME:-0.0.0.0}"
