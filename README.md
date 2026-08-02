# Cidade Music — Sistema de Organização

Sistema web (feito para usar no celular) para organizar os roteiros da banda:
agenda de eventos com escala e confirmação de cada músico, repertório com tom/BPM/VS,
checklists de logística e administrativo, finanças com dashboard, projetos/sonhos e
controle do que as músicas rendem em streaming.

---

## O que tem em cada aba

### 🏠 Início

O que interessa para **você** hoje: eventos que estão esperando o seu OK (com os botões
de confirmar/recusar ali mesmo), próximos eventos, suas demandas em aberto e o saldo do
caixa.

### 📅 Agenda

Cada evento (culto, ensaio, evento externo, gravação) tem cinco abas:

| Aba | O que faz |
|---|---|
| **Escala** | Quem toca o quê. Cada músico dá o próprio **OK** (confirmo / não posso), com espaço para justificar. Admins podem responder pelos outros. |
| **Ordem de Culto** | A OC do dia, em ordem, com tom e BPM **daquele evento** (que podem diferir do padrão da música) e links de versão/VS/cifra. Blocos livres como "Palavra" e "Avisos" também entram. |
| **Checklist** | Demandas do evento, com categoria, prioridade, responsável e prazo. Dá para aplicar um **modelo** e criar 9 tarefas de uma vez. |
| **Financeiro** | Ofertas, cachês e gastos do evento. Cai direto no caixa geral. |
| **Feedback** | Depois do evento, cada integrante avalia 8 setores de 1 a 5 com comentário. A média da equipe aparece por setor. |

### 🎵 Repertório

Cadastro de cada música com tom padrão, BPM, compasso, link da versão que vocês tocam,
link do **VS/multitrack**, cifra, letra, tags e observações da banda. Cada música mostra
o histórico de quando foi tocada e em que tom.

Em **Repertório → Ver OCs anteriores** ficam todas as Ordens de Culto já montadas.

### ✅ Checklist

Visão geral de todas as demandas (as do evento e as soltas), filtráveis por
**Abertas / Minhas / Concluídas** e por categoria (Logística, Organização do culto,
Administrativo, Equipamento, Financeiro, Geral).

Em **Modelos** vocês montam listas padrão. Já vêm três prontas: *Culto padrão*,
*Evento fora / Viagem* e *Gravação*.

### 💰 Finanças

- **Dashboard** — saldo em caixa, entradas e saídas do mês, total de ofertas, gráfico dos
  últimos 6 meses e a composição de onde vem o dinheiro e para onde ele vai.
- **Lançamentos** — cada entrada/saída, com categoria, forma de pagamento e vínculo
  opcional a um evento ou projeto.
- **Projetos** — as metas ("sonhos") da banda: quanto custa, quanto já foi guardado,
  quanto falta e o prazo.
- **Streaming** — quanto as músicas renderam por plataforma e por mês.

---

## Sobre os ganhos de streaming — leia antes

Vocês perguntaram se dá para puxar automaticamente o que as músicas rendem nas
plataformas. A resposta honesta:

- **Spotify e Apple Music não pagam vocês diretamente.** Quem paga é a distribuidora
  (ONErpm, DistroKid, CD Baby, Believe…). O *Spotify for Artists* e o *Apple Music for
  Artists* mostram audiência, não dinheiro, e **não têm API pública de royalties**.
- **O número verdadeiro está no relatório mensal da distribuidora**, que já vem com todas
  as plataformas somadas.

Por isso a aba **Streaming** funciona por lançamento manual: uma vez por mês vocês abrem
o relatório da distribuidora e registram o valor de cada plataforma. Leva ~2 minutos e o
histórico fica todo no dashboard.

A caixinha **"já caiu na conta"** existe para separar *o que foi apurado* de *o que já foi
recebido* — marque só quando o dinheiro entrou de fato, para o caixa não inflar.

## Sobre os arquivos de VS — por que link do Drive

O sistema guarda **links**, não os arquivos. Foi decisão de projeto:

- Um VS/multitrack tem centenas de MB. Hospedar isso custa caro e deixa o app lento no 4G.
- Vocês provavelmente já mantêm os VS no Google Drive — duplicar cria duas versões da
  verdade.
- Link do Drive abre direto no celular, no app nativo, com download offline.

Recomendação: uma pasta no Drive por música (ou uma por evento, no campo *Pasta no Google
Drive* do evento), compartilhada como **"qualquer pessoa com o link"**, e o link colado no
cadastro.

---

## Como rodar

Requisitos: Node.js 20 ou superior.

```bash
npm install
cp .env.example .env   # ajuste SESSION_SECRET
npm run setup          # cria o banco + a equipe e os modelos de checklist
npm run dev            # http://localhost:3000
```

### Primeiro acesso

O seed já cadastra a equipe com os PINs abaixo:

| Integrante | Função | PIN |
|---|---|---|
| João Felix | Vocal | `1000` (admin) |
| Mateus Demark | Baixo | `1001` |
| Davi Belizário | Guitarra | `1002` |
| Dado | Guitarra | `1003` |
| Mateus Ferrari | Bateria | `1004` |
| Ximbinha | Teclado | `1005` |
| Lari Sampaio | Vocal | `1006` |
| Julia Felix | Vocal | `1007` |
| David Gorito | Vocal | `1008` |

**Troquem os PINs na aba Equipe logo no primeiro acesso.** O PIN é um acesso simples,
pensado para uso interno de uma equipe pequena — não é para dado sensível e ninguém deve
reusar a senha do banco ou do e-mail.

Quem é **admin** pode adicionar/remover integrantes, excluir eventos e músicas, e
responder a escala pelos outros.

### Instalar no celular

O app é uma PWA. No celular, abra a URL no navegador e use
**"Adicionar à tela de início"** (Safari) ou **"Instalar app"** (Chrome). Ele abre em tela
cheia, sem barra de navegador, igual a um app nativo.

---

## Como publicar

> 📖 **Se você não é a pessoa técnica da equipe, use o
> [guia passo a passo em linguagem simples](docs/COMECAR.md).**

O app roda em container. O `Dockerfile` já faz tudo: build, migrações do banco no boot e,
se o banco estiver vazio, cadastro automático da equipe — o primeiro deploy sobe pronto
para usar.

**O único requisito não-negociável:** um **volume persistente montado em `/data`**, onde
mora o `cidade.db`. Sem ele o banco é recriado a cada deploy e vocês perdem tudo.

Configurações prontas no repositório:

| Arquivo | Host | Custo aproximado |
|---|---|---|
| `fly.toml` | Fly.io — **recomendado** | ~US$ 2–4/mês (suspende quando ocioso) |
| `railway.json` | Railway | ~US$ 5/mês |
| `render.yaml` | Render | ~US$ 7/mês (disco exige plano pago) |

Fly.io, do zero:

```bash
fly launch --no-deploy                            # aceite o fly.toml existente
fly volumes create cidade_data --size 1 --region gru
fly secrets set SESSION_SECRET="$(openssl rand -base64 32)"
fly deploy
```

Variáveis de ambiente:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | `file:/data/cidade.db` (já é o padrão da imagem) |
| `SESSION_SECRET` | uma chave aleatória longa — **obrigatória em produção** |

**Se preferir Postgres** (Neon, Supabase, Railway Postgres), troque em `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Apague `prisma/migrations/`, rode `npx prisma migrate dev --name init` e aponte a
`DATABASE_URL` para o Postgres. Nenhuma linha do código da aplicação muda.

### Backup

Com SQLite o backup é copiar um arquivo:

```bash
fly ssh console -C "cat /data/cidade.db" > backup-cidade-$(date +%F).db
```

Vale fazer uma vez por mês.

## Stack

- **Next.js 15** (App Router, Server Actions) + **React 19** + **TypeScript**
- **Prisma** + **SQLite** (troca para Postgres sem mexer no código)
- **Tailwind CSS** — interface mobile-first, tema escuro
- Sessão por cookie assinado com HMAC — sem dependência de serviço externo de auth

### Estrutura

```
prisma/
  schema.prisma      modelo de dados
  seed.mjs           equipe + modelos de checklist + projetos de exemplo
scripts/
  start.sh           boot de produção: migra, semeia se vazio, sobe o servidor
  seed-if-empty.mjs  só semeia no primeiro deploy; reiniciar não duplica nada
src/
  app/(auth)/entrar  login por PIN
  app/(app)/         área logada
    agenda/          eventos, escala, OC, checklist, financeiro, feedback
    repertorio/      músicas e histórico de OCs
    checklist/       demandas e modelos
    financas/        dashboard, lançamentos, projetos, streaming
    equipe/          integrantes e PINs
  components/        UI compartilhada
  lib/               db, sessão, formatação, constantes
```
