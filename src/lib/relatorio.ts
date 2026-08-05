// Apuração dos números do relatório.
//
// Separado da tela de propósito: aqui só se decide o que os dados dizem, e
// lá só como isso aparece. Toda contagem se limita ao período escolhido.

import { db } from "./db";

export const AREAS = [
  { id: "agenda", titulo: "Onde servimos", resumo: "Cultos, eventos e ações, e a preparação de cada um" },
  { id: "repertorio", titulo: "Músicas", resumo: "O que foi ministrado e o repertório disponível" },
  { id: "financas", titulo: "Dinheiro", resumo: "Entradas, saídas e os projetos da banda" },
  { id: "streaming", titulo: "Streaming", resumo: "Quanto as músicas foram ouvidas" },
] as const;

export type AreaId = (typeof AREAS)[number]["id"];

export const AREAS_PADRAO: AreaId[] = ["agenda", "repertorio", "financas"];

export function ehArea(valor: string): valor is AreaId {
  return AREAS.some((a) => a.id === valor);
}

export const PERIODOS = [
  { id: "30d", rotulo: "Últimos 30 dias", dias: -30 },
  { id: "90d", rotulo: "Últimos 3 meses", dias: -90 },
  { id: "180d", rotulo: "Últimos 6 meses", dias: -180 },
  { id: "365d", rotulo: "Últimos 12 meses", dias: -365 },
  { id: "p90d", rotulo: "Próximos 3 meses", dias: 90 },
  { id: "p180d", rotulo: "Próximos 6 meses", dias: 180 },
  { id: "p365d", rotulo: "Próximos 12 meses", dias: 365 },
  { id: "tudo", rotulo: "Tudo — passado e futuro", dias: 0 },
] as const;

export type PeriodoId = (typeof PERIODOS)[number]["id"];

export function ehPeriodo(valor: string): valor is PeriodoId {
  return PERIODOS.some((p) => p.id === valor);
}

export function intervaloDe(periodo: PeriodoId): {
  de: Date;
  ate: Date;
  rotulo: string;
  /** O recorte olha para frente: muda o tempo verbal do relatório inteiro. */
  futuro: boolean;
} {
  const def = PERIODOS.find((p) => p.id === periodo) ?? PERIODOS[1];
  const hoje = new Date();

  // "Tudo" precisa alcançar o que já foi cadastrado e o que ainda vai ser:
  // dez anos para cada lado cobrem a vida do ministério com folga.
  if (def.dias === 0) {
    const de = new Date(hoje);
    de.setFullYear(de.getFullYear() - 10);
    const ate = new Date(hoje);
    ate.setFullYear(ate.getFullYear() + 10);
    return { de, ate, rotulo: def.rotulo, futuro: false };
  }

  const outro = new Date(hoje);
  outro.setDate(outro.getDate() + def.dias);

  const [de, ate] = def.dias < 0 ? [outro, hoje] : [hoje, outro];
  de.setHours(0, 0, 0, 0);
  ate.setHours(23, 59, 59, 999);

  return { de, ate, rotulo: def.rotulo, futuro: def.dias > 0 };
}

/**
 * Um compromisso pertence ao período se encostar nele em algum momento — uma
 * viagem que sai dia 30 e volta dia 2 conta no mês que começa, e não só no
 * que termina. Sem data de término, vale o dia de início.
 */
function naJanela(de: Date, ate: Date) {
  return {
    OR: [
      { date: { gte: de, lte: ate } },
      { endDate: { gte: de, lte: ate } },
      { AND: [{ date: { lte: de } }, { endDate: { gte: ate } }] },
    ],
  };
}

// ---------------------------------------------------------------------------

export type DadosAgenda = {
  total: number;
  porTipo: { rotulo: string; quantidade: number }[];
  realizados: number;
  proximos: number;
  ultimos: { id: string; title: string; date: Date; endDate: Date | null; type: string; musicas: number }[];
};

export async function apurarAgenda(de: Date, ate: Date, futuro = false): Promise<DadosAgenda> {
  // Olhando para trás, interessa o que acabou de acontecer; olhando para
  // frente, o que acontece primeiro. Nos dois casos é o mais próximo de hoje.
  const eventos = await db.event.findMany({
    where: { ...naJanela(de, ate), status: { not: "CANCELADO" } },
    orderBy: { date: futuro ? "asc" : "desc" },
    include: { _count: { select: { setlist: true } } },
  });

  // Contados fora da janela: mesmo num relatório do passado interessa mostrar
  // que a agenda segue cheia.
  const agendados = await db.event.count({
    where: { date: { gt: new Date() }, status: { not: "CANCELADO" } },
  });

  const contagem = new Map<string, number>();
  for (const e of eventos) contagem.set(e.type, (contagem.get(e.type) ?? 0) + 1);

  const agora = new Date();

  return {
    total: eventos.length,
    porTipo: [...contagem.entries()]
      .map(([rotulo, quantidade]) => ({ rotulo, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade),
    realizados: eventos.filter((e) => e.date <= agora).length,
    proximos: agendados,
    ultimos: eventos.slice(0, 8).map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      endDate: e.endDate,
      type: e.type,
      musicas: e._count.setlist,
    })),
  };
}

// ---------------------------------------------------------------------------

export type DadosRepertorio = {
  acervo: number;
  distintasNoPeriodo: number;
  execucoes: number;
  maisTocadas: { titulo: string; artista: string | null; vezes: number; tom: string | null }[];
};

export async function apurarRepertorio(de: Date, ate: Date): Promise<DadosRepertorio> {
  const itens = await db.setlistItem.findMany({
    where: {
      songId: { not: null },
      event: { ...naJanela(de, ate), status: { not: "CANCELADO" } },
    },
    include: { song: { select: { title: true, artist: true, defaultKey: true } } },
  });

  const contagem = new Map<string, { artista: string | null; tom: string | null; vezes: number }>();
  for (const i of itens) {
    if (!i.song) continue;
    const atual = contagem.get(i.song.title) ?? {
      artista: i.song.artist,
      tom: i.keyUsed ?? i.song.defaultKey,
      vezes: 0,
    };
    atual.vezes += 1;
    contagem.set(i.song.title, atual);
  }

  return {
    acervo: await db.song.count({ where: { active: true } }),
    distintasNoPeriodo: contagem.size,
    execucoes: itens.length,
    maisTocadas: [...contagem.entries()]
      .map(([titulo, d]) => ({ titulo, artista: d.artista, tom: d.tom, vezes: d.vezes }))
      .sort((a, b) => b.vezes - a.vezes)
      .slice(0, 10),
  };
}

// ---------------------------------------------------------------------------

export type DadosOrganizacao = {
  total: number;
  concluidas: number;
  taxa: number;
  porCategoria: { rotulo: string; total: number; concluidas: number }[];
};

export async function apurarOrganizacao(de: Date, ate: Date): Promise<DadosOrganizacao> {
  const demandas = await db.task.findMany({
    where: {
      OR: [
        { event: naJanela(de, ate) },
        { eventId: null, createdAt: { gte: de, lte: ate } },
      ],
    },
    select: { category: true, done: true },
  });

  const porCategoria = new Map<string, { total: number; concluidas: number }>();
  for (const d of demandas) {
    const atual = porCategoria.get(d.category) ?? { total: 0, concluidas: 0 };
    atual.total += 1;
    if (d.done) atual.concluidas += 1;
    porCategoria.set(d.category, atual);
  }

  const concluidas = demandas.filter((d) => d.done).length;

  return {
    total: demandas.length,
    concluidas,
    taxa: demandas.length > 0 ? (concluidas / demandas.length) * 100 : 0,
    porCategoria: [...porCategoria.entries()]
      .map(([rotulo, d]) => ({ rotulo, ...d }))
      .sort((a, b) => b.total - a.total),
  };
}

// ---------------------------------------------------------------------------

export type DadosFinancas = {
  entradas: number;
  saidas: number;
  saldo: number;
  lancamentos: number;
  entradasPorCategoria: { rotulo: string; valor: number }[];
  saidasPorCategoria: { rotulo: string; valor: number }[];
  porMes: { label: string; income: number; expense: number }[];
};

export async function apurarFinancas(de: Date, ate: Date): Promise<DadosFinancas> {
  const lancamentos = await db.transaction.findMany({
    where: { date: { gte: de, lte: ate } },
    orderBy: { date: "asc" },
  });

  const soma = (tipo: string) =>
    lancamentos.filter((l) => l.type === tipo).reduce((a, l) => a + l.amountCents, 0);

  const agrupar = (tipo: string) => {
    const m = new Map<string, number>();
    for (const l of lancamentos.filter((x) => x.type === tipo)) {
      m.set(l.category, (m.get(l.category) ?? 0) + l.amountCents);
    }
    return [...m.entries()]
      .map(([rotulo, valor]) => ({ rotulo, valor }))
      .sort((a, b) => b.valor - a.valor);
  };

  // Um ponto por mês do intervalo, mesmo nos meses sem movimento — um buraco
  // no gráfico é informação, e some se só os meses com lançamento aparecerem.
  const meses = new Map<string, { income: number; expense: number }>();
  const cursor = new Date(de.getFullYear(), de.getMonth(), 1);
  while (cursor <= ate) {
    meses.set(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`, {
      income: 0,
      expense: 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  for (const l of lancamentos) {
    const chave = `${l.date.getFullYear()}-${String(l.date.getMonth() + 1).padStart(2, "0")}`;
    const ponto = meses.get(chave);
    if (!ponto) continue;
    if (l.type === "ENTRADA") ponto.income += l.amountCents;
    else ponto.expense += l.amountCents;
  }

  const entradas = soma("ENTRADA");
  const saidas = soma("SAIDA");

  return {
    entradas,
    saidas,
    saldo: entradas - saidas,
    lancamentos: lancamentos.length,
    entradasPorCategoria: agrupar("ENTRADA"),
    saidasPorCategoria: agrupar("SAIDA"),
    porMes: [...meses.entries()].map(([chave, v]) => ({
      label: chave.slice(5) + "/" + chave.slice(2, 4),
      ...v,
    })),
  };
}

// ---------------------------------------------------------------------------

export type DadosProjetos = {
  projetos: { nome: string; descricao: string | null; meta: number; arrecadado: number; status: string }[];
};

export async function apurarProjetos(): Promise<DadosProjetos> {
  const projetos = await db.project.findMany({
    orderBy: [{ status: "asc" }, { position: "asc" }],
    include: { transactions: { select: { amountCents: true, type: true } } },
  });

  return {
    projetos: projetos.map((p) => ({
      nome: p.name,
      descricao: p.description,
      meta: p.targetCents,
      arrecadado: p.transactions
        .filter((t) => t.type === "ENTRADA")
        .reduce((a, t) => a + t.amountCents, 0),
      status: p.status,
    })),
  };
}

// ---------------------------------------------------------------------------

export type DadosStreaming = {
  total: number;
  streams: number;
  porPlataforma: { rotulo: string; valor: number; streams: number }[];
};

export async function apurarStreaming(de: Date, ate: Date): Promise<DadosStreaming> {
  // O lançamento de streaming guarda o mês de referência como texto
  // ("2026-07"), então o recorte compara períodos, não datas.
  const chave = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  const entradas = await db.royaltyEntry.findMany({
    where: { period: { gte: chave(de), lte: chave(ate) } },
  });

  const porPlataforma = new Map<string, { valor: number; streams: number }>();
  for (const e of entradas) {
    const atual = porPlataforma.get(e.platform) ?? { valor: 0, streams: 0 };
    atual.valor += e.amountCents;
    atual.streams += e.streams ?? 0;
    porPlataforma.set(e.platform, atual);
  }

  return {
    total: entradas.reduce((a, e) => a + e.amountCents, 0),
    streams: entradas.reduce((a, e) => a + (e.streams ?? 0), 0),
    porPlataforma: [...porPlataforma.entries()]
      .map(([rotulo, d]) => ({ rotulo, ...d }))
      .sort((a, b) => b.valor - a.valor),
  };
}
