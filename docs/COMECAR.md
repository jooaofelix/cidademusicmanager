# Começando — guia sem termos técnicos

Este guia é para colocar o sistema no ar e a banda usando. Não precisa saber programar.

---

## Parte 1 — Colocar no ar

O sistema precisa morar em algum lugar da internet para todo mundo acessar pelo celular.
Ele já vem pronto para isso — só falta escolher onde.

### A opção mais barata: Fly.io

Custa em torno de **R$ 10 a R$ 20 por mês** (o app "dorme" quando ninguém está usando e
acorda sozinho, então vocês pagam pouco).

1. Crie uma conta em [fly.io](https://fly.io) e instale o programa deles seguindo
   [estas instruções](https://fly.io/docs/flyctl/install/).
2. Abra o terminal na pasta do projeto e rode, um comando de cada vez:

   ```bash
   fly auth login
   fly launch --no-deploy
   ```

   Quando ele perguntar se quer usar as configurações existentes (`fly.toml`), responda
   **sim**. Quando perguntar sobre banco de dados (Postgres/Redis), responda **não** —
   o banco já está incluído.

3. Crie o disco onde os dados ficam guardados e a chave de segurança:

   ```bash
   fly volumes create cidade_data --size 1 --region gru
   fly secrets set SESSION_SECRET="$(openssl rand -base64 32)"
   ```

4. Publique:

   ```bash
   fly deploy
   ```

   No fim ele mostra o endereço, algo como `https://cidade-music.fly.dev`. **Esse é o
   link do sistema de vocês.**

### Outras opções

| Onde | Custo | Observação |
|---|---|---|
| **Railway** | ~US$ 5/mês | Conecta no GitHub e publica sozinho. Precisa adicionar um *volume* em `/data`. |
| **Render** | ~US$ 7/mês | Simples, mas o disco persistente só existe no plano pago. O `render.yaml` já está configurado. |
| **Um computador na igreja** | grátis | Funciona, mas precisa ficar ligado e ter internet fixa. |

> ⚠️ **O ponto que não pode falhar:** onde quer que vocês publiquem, precisa existir um
> **disco/volume persistente montado em `/data`**. É lá que fica o banco de dados. Sem
> isso, tudo que vocês cadastrarem some no próximo deploy.

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
O banco inteiro é um arquivo só. No Fly.io:

```bash
fly ssh console -C "cat /data/cidade.db" > backup-cidade.db
```

Vale fazer uma vez por mês e guardar no Drive.

**Alguém errou e apagou algo. E agora?**
Se tiver backup, é só restaurar o arquivo. Por isso o backup mensal importa. Só quem é
**administrador** consegue excluir eventos e músicas — vale deixar poucas pessoas como admin.

**Quero adicionar um músico novo.**
Entre como administrador → **Equipe** → formulário no fim da página. Defina um PIN inicial
e peça para a pessoa trocar.

---

## Se precisar mexer no código

```bash
npm install
cp .env.example .env    # ajuste SESSION_SECRET
npm run setup           # cria o banco e a equipe
npm run dev             # abre em http://localhost:3000
```
