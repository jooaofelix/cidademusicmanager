// Apuração dos números do relatório.
//
// Separado da tela de propósito: aqui só se decide o que os dados dizem, e
// lá só como isso aparece. Toda contagem se limita ao período escolhido.

import { db } from "./db";

export const AREAS = [
  {
    id: "agenda",
    titulo: "Agenda e eventos",
    resumo: "Cultos, ensaios e eventos realizados no período",
  },
  {
    id: "equipe",
    titulo: "Equipe e participação",
    resumo: "Quem serviu, quantas vezes, e a resposta às escalas",
  },
  {
    id: "repertorio",
    titulo: "Repertório",
    resumo: "Músicas mais ministradas e tamanho do acervo",
  },
  {
    id: "organizacao",
    titulo: "Organização",
    resumo: "Demandas planejadas e concluídas antes de cada evento",
  },
  {
    id: "financas",
    titulo: "Finanças",
    resumo: "Entradas, saídas, saldo e para onde o recurso foi",
  },
  {
    id: "projetos",
    titulo: "Projetos",
    resumo: "Metas de arrecadação e quanto já foi alcançado",
  },
  {
    id: "streaming",
    titulo: "Streaming",
    resumo: "Alcance nas plataformas e repasses recebidos",
  },
] as const;

export type AreaId = (typeof AREAS)[number]["id"];

export const AREAS_PADRAO: AreaId[] = ["agenda", "equipe", "repertorio", "financas", "projetos"];

export function ehArea(valor: string): valor is AreaId {
  return AREAS.some((a) => a.id === valor);
}

export const PERIODOS = [
  { id: "30d", rotulo: "Últimos 30 dias", dias: 30 },
  { id: "90d", rotulo: "Últimos 3 meses", dias: 90 },
  { id: "180d", rotulo: "Últimos 6 meses", dias: 180 },
  { id: "365d", rotulo: "Últimos 12 meses", dias: 365 },
] as const;

export type PeriodoId = (typeof PERIODOS)[number]["id"];

export function ehPeriodo(valor: string): valor is PeriodoId {
  return PERIODOS.some((p) => p.id === valor);
}

export function intervaloDe(periodo: PeriodoId): { de: Date; ate: Date; rotulo: string } {
  const def = PERIODOS.find((p) => p.id === periodo) ?? PERIODOS[1];
  const ate = new Date();
  const de = new Date(ate);
  de.setDate(de.getDate() - def.dias);
  de.setHours(0, 0, 0, 0);
  return { de, ate, rotulo: def.rotulo };
}

// ---------------------------------------------------------------------------

export type DadosAgenda = {
  total: number;
  porTipo: { rotulo: string; quantidade: number }[];
  realizados: number;
  proximos: number;
  ultimos: { id: string; title: string; date: Date; type: string; musicas: number }[];
};

export async function apurarAgenda(de: Date, ate: Date): Promise<DadosAgenda> {
  const eventos = await db.event.findMany({
    where: { date: { gte: de, lte: ate }, status: { not: "CANCELADO" } },
    orderBy: { date: "desc" },
    include: { _count: { select: { setlist: true } } },
  });

  // O que vem pela frente não cabe no período apurado, que termina hoje — mas
  // numa apresentação interessa mostrar que a agenda segue cheia. Por isso os
  // próximos compromissos são contados fora da janela.
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
      type: e.type,
      musicas: e._count.setlist,
    })),
  };
}

// ---------------------------------------------------------------------------

export type DadosEquipe = {
  integrantesAtivos: number;
  participacoes: number;
  taxaConfirmacao: number;
  porIntegrante: { nome: string; instrumento: string; escalas: number; confirmadas: number }[];
};

export async function apurarEquipe(de: Date, ate: Date): Promise<DadosEquipe> {
  const escalas = await db.lineup.findMany({
    where: { event: { date: { gte: de, lte: ate }, status: { not: "CANCELADO" } } },
    include: { member: { select: { name: true, instrument: true, active: true } } },
  });

  const porNome = new Map<string, { instrumento: string; escalas: number; confirmadas: number }>();
  for (const e of escalas) {
    const atual = porNome.get(e.member.name) ?? {
      instrumento: e.member.instrument,
      escalas: 0,
      confirmadas: 0,
    };
    atual.escalas += 1;
    if (e.status === "CONFIRMADO") atual.confirmadas += 1;
    porNome.set(e.member.name, atual);
  }

  const confirmadas = escalas.filter((e) => e.status === "CONFIRMADO").length;

  return {
    integrantesAtivos: await db.member.count({ where: { active: true } }),
    participacoes: escalas.length,
    taxaConfirmacao: escalas.length > 0 ? (confirmadas / escalas.length) * 100 : 0,
    porIntegrante: [...porNome.entries()]
      .map(([nome, d]) => ({ nome, ...d }))
      .sort((a, b) => b.escalas - a.escalas),
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
      event: { date: { gte: de, lte: ate }, status: { not: "CANCELADO" } },
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
        { event: { date: { gte: de, lte: ate } } },
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
