# Começando — guia sem termos técnicos

Este guia é para colocar o sistema no ar e a banda usando. Não precisa saber programar.

---

## Parte 1 — Colocar no ar

O sistema precisa morar em algum lugar da internet para todo mundo acessar pelo celular.
Ele já vem pronto — só falta escolher onde. **Escolha uma das três opções abaixo.**

---

### Opção A — Vercel + Neon · **de graça, só pelo navegador** ⭐

Não precisa instalar nada, não precisa de terminal e não pede cartão de crédito.
É a opção recomendada se o objetivo é gastar zero.

**1. Crie o banco de dados (Neon)**

1. Entre em [neon.com](https://neon.com) e crie a conta (dá para entrar com o Google).
2. Clique em *Create project*. Dê o nome `cidade-music` e escolha a região mais
   próxima (*AWS São Paulo*, se aparecer).
3. Na tela seguinte ele mostra uma **connection string**, algo como
   `postgresql://usuario:senha@ep-alguma-coisa.neon.tech/neondb?sslmode=require`.
   **Copie e guarde** — vamos usar no passo 3.

**2. Publique (Vercel)**

> ✅ O projeto **já está configurado para PostgreSQL** — não precisa rodar nada
> no terminal. Só seguir os passos abaixo.

1. Entre em [vercel.com](https://vercel.com) e crie a conta **com o GitHub**.
2. Clique em *Add New → Project* e escolha o repositório `cidademusicmanager`.
3. Antes de clicar em Deploy, abra **Environment Variables** e cadastre as duas:

   | Nome | Valor |
   |---|---|
   | `DATABASE_URL` | a connection string que você copiou do Neon |
   | `SESSION_SECRET` | qualquer texto longo e aleatório que você inventar (30+ caracteres, sem espaços) |

4. Clique em **Deploy** e espere uns 2 minutos.

Pronto. A Vercel mostra o link (algo como `https://cidademusicmanager.vercel.app`).
**Esse é o link do sistema de vocês** — as tabelas e a equipe são criadas sozinhas
no primeiro deploy.

> 💡 No Neon, se aparecerem duas connection strings (*pooled* e *direct*), use a
> **direct**. Para uma equipe do tamanho de vocês funciona melhor e evita erro no deploy.

---

### Opção B — Railway · ~US$ 5/mês, também só pelo navegador

Publica direto do GitHub, sem terminal:

1. Entre em [railway.app](https://railway.app) com o GitHub.
2. *New Project → Deploy from GitHub repo* → escolha o repositório.
3. Em **Variables**, adicione `SESSION_SECRET` com um texto longo e aleatório.
4. Em **Variables**, adicione também `DATABASE_URL` com a connection string de um
   Postgres (o próprio Railway oferece um em *New → Database → PostgreSQL*).

---

### Opção C — Fly.io · ~US$ 2 a 4/mês, precisa de terminal

A mais barata das pagas, porque o app "dorme" quando ninguém está usando.

1. Crie conta em [fly.io](https://fly.io) e instale o
   [flyctl](https://fly.io/docs/flyctl/install/).
2. Na pasta do projeto:

   ```bash
   fly auth login
   fly launch --no-deploy     # aceite o fly.toml existente; recuse Postgres/Redis
   fly volumes create cidade_data --size 1 --region gru
   fly secrets set SESSION_SECRET="$(openssl rand -base64 32)"
   fly deploy
   ```

---

### Comparando

| | Vercel + Neon | Railway | Fly.io |
|---|---|---|---|
| Custo | **grátis** | ~US$ 5/mês | ~US$ 2–4/mês |
| Precisa de terminal? | **não** | não | sim |
| Pede cartão? | não | sim | sim |
| Banco | Postgres (na nuvem) | Postgres | Postgres |
| Backup | painel do Neon | painel do provedor | painel do provedor |

O projeto vem pronto para a **Opção A**. As opções B e C usam o `Dockerfile` e também
precisam de um banco Postgres (ou de voltar o projeto para SQLite) — se quiser uma delas,
me chame que eu ajusto.

---

## Parte 2 — Primeiro acesso

Assim que o sistema sobe, ele **já cria a equipe sozinho**. Não precisa cadastrar ninguém.

1. Abra o link no celular.
2. Toque no seu nome.
3. Digite o PIN da tabela abaixo.

| Integrante | Função | PIN |
|---|---|---|
| João Felix | Vocal | `1000` — **administrador** |
| Mateus Demark | Baixo | `1001` |
| Davi Belizário | Guitarra | `1002` |
| Dado | Guitarra | `1003` |
| Mateus Ferrari | Bateria | `1004` |
| Ximbinha | Teclado | `1005` |
| Lari Sampaio | Vocal | `1006` |
| Julia Felix | Vocal | `1007` |
| David Gorito | Vocal | `1008` |

### ⚠️ Primeira coisa a fazer: trocar os PINs

Peça para cada um entrar e trocar o próprio PIN em **Equipe → seu nome → Trocar PIN**.

O PIN é um acesso simples, feito para uma equipe pequena e de confiança. **Ninguém deve
usar o mesmo PIN do banco, do cartão ou do celular.**

### Instalar como app no celular

Depois de entrar, vale instalar na tela de início — fica igual a um app de verdade,
sem a barra do navegador:

- **iPhone (Safari):** botão de compartilhar → *Adicionar à Tela de Início*
- **Android (Chrome):** menu ⋮ → *Instalar app* ou *Adicionar à tela inicial*

---

## Parte 3 — Primeira semana de uso

Sugestão de ordem para não tentar fazer tudo de uma vez:

**Dia 1 — cadastrar o repertório.**
Em **Músicas → + Música**, coloque as que vocês mais tocam. O essencial é *nome, tom e
BPM*. Os links (versão, VS, cifra) podem entrar depois, aos poucos.

**Dia 2 — marcar o próximo culto.**
Em **Agenda → + Novo**. Escolha o modelo de checklist *"Culto padrão"* — ele já cria as
9 tarefas que sempre se repetem.

**Dia 3 — escalar e pedir os OKs.**
Dentro do evento, aba **Escala**, adicione cada músico na função dele. Mande o link no
grupo: cada um entra e toca em **✓ Confirmo**. Você vê na hora quem confirmou e quem falta.

**Dia 4 — montar a Ordem de Culto.**
Aba **Ordem de Culto**: escolha as músicas na ordem, marque o momento (Abertura, Ministração,
Oferta…) e ajuste o tom se naquele dia for diferente do padrão.

**Depois do culto — registrar.**
1. Mude o status do evento para **Realizado**.
2. Na aba **Financeiro**, lance a oferta que entrou e os gastos.
3. Peça para a equipe preencher a aba **Feedback** — cada um dá nota de 1 a 5 nos 8
   setores. A média aparece para todo mundo e é aí que vocês descobrem o que melhorar.

**Quando sobrar tempo — as finanças.**
Em **Finanças → Projetos**, cadastre os sonhos da banda com o valor que cada um custa.
Conforme vocês guardam dinheiro, a barrinha enche.

---

## Perguntas comuns

**Onde ficam os arquivos de VS?**
No Google Drive de vocês. O sistema guarda o *link*, não o arquivo — um multitrack tem
centenas de MB, hospedar isso sairia caro e travaria no 4G. Crie uma pasta por música,
compartilhe como *"qualquer pessoa com o link"* e cole o link no cadastro da música.

**Dá para ver automaticamente quanto ganhamos no Spotify e Apple Music?**
Não. Quem paga vocês é a distribuidora (ONErpm, DistroKid, CD Baby…), não as plataformas —
e nenhuma delas oferece isso de forma automática para terceiros. Por isso a aba
**Streaming** funciona por lançamento manual: uma vez por mês vocês abrem o relatório da
distribuidora e registram o valor. Leva 2 minutos e o histórico fica todo no dashboard.

**Como faço backup?**
O Neon já faz por vocês: o painel guarda o histórico e permite voltar o banco para um
momento anterior (*Restore*). Não precisa fazer nada manualmente. Se quiser uma cópia
própria, o Neon também exporta um arquivo pelo painel.

**Alguém errou e apagou algo. E agora?**
No painel do Neon dá para restaurar o banco para como ele estava antes. Só quem é
**administrador** consegue excluir eventos e músicas — vale deixar poucas pessoas como admin.

**Quero adicionar um músico novo.**
Entre como administrador → **Equipe** → formulário no fim da página. Defina um PIN inicial
e peça para a pessoa trocar.

---

## Se precisar mexer no código

```bash
npm install
cp .env.example .env    # aponte DATABASE_URL para um Postgres e ajuste SESSION_SECRET
npm run setup           # cria as tabelas e a equipe
npm run dev             # abre em http://localhost:3000
```
