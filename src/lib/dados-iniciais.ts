// Os dados que o sistema cria sozinho na primeira vez que roda:
// a equipe, os modelos de checklist e dois projetos de exemplo.
//
// Fonte única — usada tanto pelo preparo automático do banco quanto por
// qualquer execução manual do seed.

import type { Prisma } from "@prisma/client";

export const INTEGRANTES = [
  { name: "João Felix", instrument: "Vocal", pin: "1000", isAdmin: true },
  { name: "Mateus Demark", instrument: "Baixo", pin: "1001" },
  { name: "Davi Belizário", instrument: "Guitarra", pin: "1002" },
  { name: "Dado", instrument: "Guitarra", pin: "1003" },
  { name: "Mateus Ferrari", instrument: "Bateria", pin: "1004" },
  { name: "Ximbinha", instrument: "Teclado", pin: "1005" },
  { name: "Lari Sampaio", instrument: "Vocal", pin: "1006" },
  { name: "Julia Felix", instrument: "Vocal", pin: "1007" },
  { name: "David Gorito", instrument: "Vocal", pin: "1008" },
];

export const MODELOS_CHECKLIST = [
  {
    name: "Culto padrão",
    items: [
      { title: "Definir a Ordem de Culto com o pastor", category: "CULTO", priority: "ALTA" },
      { title: "Enviar OC e VS no grupo com 3 dias de antecedência", category: "CULTO", priority: "ALTA" },
      { title: "Confirmar escala de todos os músicos", category: "ADMIN", priority: "ALTA" },
      { title: "Marcar e confirmar o ensaio", category: "ADMIN", priority: "ALTA" },
      { title: "Conferir cabos, pilhas e in-ear", category: "EQUIPAMENTO", priority: "MEDIA" },
      { title: "Passagem de som", category: "LOGISTICA", priority: "ALTA" },
      { title: "Confirmar operador de som e projeção", category: "LOGISTICA", priority: "MEDIA" },
      { title: "Enviar letras para a projeção", category: "CULTO", priority: "MEDIA" },
      { title: "Levar água para o palco", category: "LOGISTICA", priority: "BAIXA" },
    ],
  },
  {
    name: "Evento fora / Viagem",
    items: [
      { title: "Confirmar contrato e cachê por escrito", category: "ADMIN", priority: "ALTA" },
      { title: "Definir transporte e horário de saída", category: "LOGISTICA", priority: "ALTA" },
      { title: "Levantar o rider técnico do local", category: "EQUIPAMENTO", priority: "ALTA" },
      { title: "Confirmar hospedagem", category: "LOGISTICA", priority: "MEDIA" },
      { title: "Combinar alimentação da equipe", category: "LOGISTICA", priority: "MEDIA" },
      { title: "Conferir backline que o local oferece", category: "EQUIPAMENTO", priority: "ALTA" },
      { title: "Definir figurino do dia", category: "GERAL", priority: "BAIXA" },
      { title: "Fechar orçamento de combustível e pedágio", category: "FINANCEIRO", priority: "MEDIA" },
      { title: "Levar réguas, cabos e adaptadores extras", category: "EQUIPAMENTO", priority: "MEDIA" },
    ],
  },
  {
    name: "Gravação",
    items: [
      { title: "Reservar o estúdio e confirmar valor", category: "FINANCEIRO", priority: "ALTA" },
      { title: "Fechar arranjo e tom final", category: "CULTO", priority: "ALTA" },
      { title: "Ensaio geral com clique", category: "ADMIN", priority: "ALTA" },
      { title: "Definir equipe de captação de vídeo", category: "LOGISTICA", priority: "MEDIA" },
      { title: "Preparar figurino e cenário", category: "GERAL", priority: "MEDIA" },
      { title: "Registrar a obra e definir distribuidora", category: "ADMIN", priority: "ALTA" },
      { title: "Planejar divulgação do lançamento", category: "GERAL", priority: "MEDIA" },
    ],
  },
];

/** Quem cuida do dinheiro quando o sistema é instalado pela primeira vez. */
export const TESOUREIROS_INICIAIS = ["Davi Belizário", "David Gorito"] as const;

const idDoNome = (nome: string) => nome.toLowerCase().replace(/\s+/g, "-");

/** Cria os dados iniciais. Seguro rodar de novo: nada é duplicado. */
export async function semear(db: Prisma.TransactionClient) {
  for (const m of INTEGRANTES) {
    const id = idDoNome(m.name);
    await db.member.upsert({
      where: { id },
      create: { id, ...m },
      update: { instrument: m.instrument },
    });
  }

  for (const t of MODELOS_CHECKLIST) {
    const existe = await db.checklistTemplate.findFirst({ where: { name: t.name } });
    if (existe) continue;

    await db.checklistTemplate.create({
      data: {
        name: t.name,
        items: { create: t.items.map((i, position) => ({ ...i, position })) },
      },
    });
  }

  if ((await db.project.count()) === 0) {
    await db.project.createMany({
      data: [
        {
          name: "Sistema de in-ear para a banda",
          description: "Monitoramento pessoal para todo mundo, acabando com o retorno de chão.",
          targetCents: 1200000,
          position: 0,
        },
        {
          name: "Gravar o primeiro single",
          description: "Estúdio, mixagem, masterização e videoclipe.",
          targetCents: 800000,
          position: 1,
        },
      ],
    });
  }

  return { integrantes: INTEGRANTES.length, modelos: MODELOS_CHECKLIST.length };
}
