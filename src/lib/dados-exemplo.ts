// Dados de demonstração: um mês de vida da banda, para o sistema não abrir
// vazio e dar para ver cada tela funcionando de verdade.
//
// Tudo que entra aqui leva a marca abaixo em notes/description, para que a
// limpeza saiba exatamente o que apagar e nunca encoste no que a equipe
// cadastrou de verdade.

import type { Prisma } from "@prisma/client";

export const MARCA_EXEMPLO = "[exemplo]";

const HOJE = () => new Date();

/** Uma data a N dias de hoje, com hora fixa para não variar por fuso. */
function dia(offset: number, hora = 19): Date {
  const d = HOJE();
  d.setUTCDate(d.getUTCDate() + offset);
  d.setUTCHours(hora, 0, 0, 0);
  return d;
}

const MUSICAS = [
  { title: "Deus é Deus", artist: "Delino Marçal", defaultKey: "G", bpm: 72, tags: "adoracao" },
  { title: "Nada Além do Sangue", artist: "Fernandinho", defaultKey: "D", bpm: 76, tags: "adoracao,comunhao" },
  { title: "Ousado Amor", artist: "Isaias Saad", defaultKey: "A", bpm: 68, tags: "adoracao" },
  { title: "Lugar Secreto", artist: "Gabriela Rocha", defaultKey: "C", bpm: 66, tags: "adoracao,intimidade" },
  { title: "A Bondade de Deus", artist: "Isaias Saad", defaultKey: "E", bpm: 70, tags: "adoracao" },
  { title: "Santo Espírito", artist: "Laura Souguellis", defaultKey: "D", bpm: 64, tags: "ministracao" },
  { title: "Tua Graça Me Basta", artist: "Toque no Altar", defaultKey: "G", bpm: 74, tags: "comunhao" },
  { title: "Oceanos", artist: "Hillsong em Português", defaultKey: "D", bpm: 60, tags: "ministracao,fe" },
];

const EVENTOS = [
  {
    chave: "culto-passado",
    title: "Culto de Domingo",
    type: "CULTO",
    status: "REALIZADO",
    offset: -5,
    callTime: "18:00",
    startTime: "19:00",
    location: "Templo sede",
  },
  {
    chave: "ensaio",
    title: "Ensaio geral",
    type: "ENSAIO",
    status: "CONFIRMADO",
    offset: 3,
    callTime: "19:30",
    startTime: "20:00",
    location: "Sala de música",
  },
  {
    chave: "culto-proximo",
    title: "Culto de Domingo",
    type: "CULTO",
    status: "CONFIRMADO",
    offset: 6,
    callTime: "18:00",
    startTime: "19:00",
    location: "Templo sede",
  },
  {
    chave: "gravacao",
    title: "Gravação do primeiro single",
    type: "GRAVACAO",
    status: "PLANEJADO",
    offset: 20,
    callTime: "09:00",
    startTime: "10:00",
    location: "Estúdio Alpha",
  },
];

/**
 * Cria os dados de demonstração. Só deve ser chamada com a agenda vazia —
 * quem decide isso é quem chama, para esta função não precisar adivinhar.
 */
export async function criarDadosExemplo(db: Prisma.TransactionClient) {
  const integrantes = await db.member.findMany({ select: { id: true, name: true, instrument: true } });
  const porNome = new Map(integrantes.map((m) => [m.name, m]));

  // ----- Repertório -------------------------------------------------------
  const musicas = [];
  for (const m of MUSICAS) {
    musicas.push(
      await db.song.create({
        data: { ...m, timeSig: "4/4", notes: MARCA_EXEMPLO },
      }),
    );
  }

  // ----- Agenda -----------------------------------------------------------
  const eventos = new Map<string, { id: string }>();
  for (const e of EVENTOS) {
    const { chave, offset, ...resto } = e;
    eventos.set(
      chave,
      await db.event.create({
        data: { ...resto, date: dia(offset), notes: MARCA_EXEMPLO },
      }),
    );
  }

  // ----- Escala -----------------------------------------------------------
  // O culto que já passou está todo confirmado; o próximo tem gente que ainda
  // não respondeu, para dar para ver o aviso de pendência na tela inicial.
  const escala = [
    ["culto-passado", "CONFIRMADO"],
    ["culto-proximo", "PENDENTE"],
    ["ensaio", "CONFIRMADO"],
  ] as const;

  for (const [chave, statusPadrao] of escala) {
    const evento = eventos.get(chave)!;
    for (const [i, integrante] of integrantes.entries()) {
      await db.lineup.create({
        data: {
          eventId: evento.id,
          memberId: integrante.id,
          instrument: integrante.instrument,
          // No próximo culto, parte da equipe já confirmou.
          status: statusPadrao === "PENDENTE" && i % 3 === 0 ? "CONFIRMADO" : statusPadrao,
          respondedAt: statusPadrao === "CONFIRMADO" ? dia(-6) : null,
        },
      });
    }
  }

  // ----- Ordem de culto ---------------------------------------------------
  const ordem = [
    { musica: 0, moment: "Abertura" },
    { musica: 2, moment: "Adoração" },
    { musica: 4, moment: "Adoração" },
    { musica: 5, moment: "Ministração" },
  ];

  for (const chave of ["culto-passado", "culto-proximo"] as const) {
    const evento = eventos.get(chave)!;
    for (const [posicao, item] of ordem.entries()) {
      const musica = musicas[item.musica];
      await db.setlistItem.create({
        data: {
          eventId: evento.id,
          songId: musica.id,
          position: posicao,
          keyUsed: musica.defaultKey,
          bpmUsed: musica.bpm,
          moment: item.moment,
        },
      });
    }
    await db.setlistItem.create({
      data: { eventId: evento.id, position: ordem.length, label: "Palavra", moment: "Palavra" },
    });
  }

  // ----- Checklist --------------------------------------------------------
  const proximoCulto = eventos.get("culto-proximo")!;
  const demandas = [
    { title: "Enviar a OC no grupo", category: "CULTO", priority: "ALTA", done: true, quem: "João Felix" },
    { title: "Confirmar escala de todos", category: "ADMIN", priority: "ALTA", done: true, quem: "João Felix" },
    { title: "Conferir cabos e pilhas do in-ear", category: "EQUIPAMENTO", priority: "MEDIA", done: false, quem: "Mateus Demark" },
    { title: "Passagem de som às 18h", category: "LOGISTICA", priority: "ALTA", done: false, quem: "Mateus Ferrari" },
    { title: "Enviar letras para a projeção", category: "CULTO", priority: "MEDIA", done: false, quem: "Julia Felix" },
  ];

  for (const [posicao, d] of demandas.entries()) {
    await db.task.create({
      data: {
        title: d.title,
        description: MARCA_EXEMPLO,
        category: d.category,
        priority: d.priority,
        done: d.done,
        doneAt: d.done ? dia(-1) : null,
        position: posicao,
        eventId: proximoCulto.id,
        assigneeId: porNome.get(d.quem)?.id ?? null,
      },
    });
  }

  // ----- Finanças ---------------------------------------------------------
  const projetos = await db.project.findMany({ orderBy: { position: "asc" } });

  const movimentacoes = [
    { offset: -28, type: "ENTRADA", category: "OFERTA", amountCents: 32000, description: "Oferta do culto", method: "PIX" },
    { offset: -21, type: "ENTRADA", category: "OFERTA", amountCents: 27500, description: "Oferta do culto", method: "DINHEIRO" },
    { offset: -18, type: "SAIDA", category: "EQUIPAMENTO", amountCents: 14900, description: "Jogo de cordas e palhetas", method: "CARTAO" },
    { offset: -14, type: "ENTRADA", category: "CACHE", amountCents: 120000, description: "Participação em congresso", method: "TRANSFERENCIA" },
    { offset: -12, type: "SAIDA", category: "TRANSPORTE", amountCents: 22000, description: "Combustível e pedágio", method: "PIX" },
    { offset: -12, type: "SAIDA", category: "ALIMENTACAO", amountCents: 18600, description: "Lanche da equipe na viagem", method: "PIX" },
    { offset: -7, type: "ENTRADA", category: "OFERTA", amountCents: 41000, description: "Oferta do culto", method: "PIX" },
    { offset: -5, type: "ENTRADA", category: "DOACAO", amountCents: 50000, description: "Doação para o in-ear", method: "PIX", projeto: 0 },
    { offset: -4, type: "SAIDA", category: "ESTUDIO", amountCents: 45000, description: "Sinal da diária de estúdio", method: "TRANSFERENCIA", projeto: 1 },
    { offset: -2, type: "ENTRADA", category: "STREAMING", amountCents: 8700, description: "Repasse de plataformas", method: "TRANSFERENCIA" },
    { offset: -1, type: "SAIDA", category: "ALIMENTACAO", amountCents: 6400, description: "Água e lanche do ensaio", method: "DINHEIRO" },
    { offset: 0, type: "ENTRADA", category: "OFERTA", amountCents: 38500, description: "Oferta do culto", method: "PIX" },
  ];

  for (const m of movimentacoes) {
    const { offset, projeto, description, ...resto } = m;
    await db.transaction.create({
      data: {
        ...resto,
        description: `${description} ${MARCA_EXEMPLO}`,
        date: dia(offset, 12),
        eventId: null,
        projectId: projeto !== undefined ? (projetos[projeto]?.id ?? null) : null,
      },
    });
  }

  // ----- Streaming --------------------------------------------------------
  const plataformas = [
    { platform: "SPOTIFY", amountCents: 5400, streams: 12480 },
    { platform: "APPLE_MUSIC", amountCents: 2100, streams: 3120 },
    { platform: "DEEZER", amountCents: 1200, streams: 2040 },
  ];

  const mesPassado = new Date();
  mesPassado.setUTCMonth(mesPassado.getUTCMonth() - 1);
  const periodo = `${mesPassado.getUTCFullYear()}-${String(mesPassado.getUTCMonth() + 1).padStart(2, "0")}`;

  for (const p of plataformas) {
    await db.royaltyEntry.create({
      data: { ...p, period: periodo, songId: musicas[0].id, notes: MARCA_EXEMPLO },
    });
  }

  return {
    musicas: musicas.length,
    eventos: eventos.size,
    demandas: demandas.length,
    movimentacoes: movimentacoes.length,
  };
}
