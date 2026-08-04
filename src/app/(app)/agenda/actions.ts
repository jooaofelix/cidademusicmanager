"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireMember } from "@/lib/session";
import { fromInputDate, parseMoneyToCents } from "@/lib/format";

/**
 * A data de término de um compromisso de mais de um dia.
 *
 * Vazia quando começa e acaba no mesmo dia. Um término anterior ao início é
 * descartado em vez de gravado: seria um período impossível, e todo cálculo
 * de duração passaria a mentir.
 */
function dataFinal(fd: FormData, inicio: Date): Date | null {
  const bruto = str(fd, "endDate");
  if (!bruto) return null;

  const fim = fromInputDate(bruto);
  return fim >= inicio ? fim : null;
}

function str(fd: FormData, key: string) {
  const v = fd.get(key);
  const s = v === null ? "" : String(v).trim();
  return s || null;
}

// ---------------------------------------------------------------- eventos

export async function createEvent(formData: FormData) {
  await requireMember();

  const title = str(formData, "title");
  const dateRaw = str(formData, "date");
  if (!title || !dateRaw) return;

  const inicio = fromInputDate(dateRaw);

  const event = await db.event.create({
    data: {
      title,
      type: str(formData, "type") ?? "CULTO",
      date: inicio,
      endDate: dataFinal(formData, inicio),
      callTime: str(formData, "callTime"),
      startTime: str(formData, "startTime"),
      location: str(formData, "location"),
      address: str(formData, "address"),
      notes: str(formData, "notes"),
      driveUrl: str(formData, "driveUrl"),
    },
  });

  // Aplica um modelo de checklist, se escolhido
  const templateId = str(formData, "templateId");
  if (templateId) await applyTemplateToEvent(event.id, templateId);

  revalidatePath("/agenda");
  redirect(`/agenda/${event.id}`);
}

export async function updateEvent(formData: FormData) {
  await requireMember();

  const id = str(formData, "id");
  const title = str(formData, "title");
  const dateRaw = str(formData, "date");
  if (!id || !title || !dateRaw) return;

  const inicioEditado = fromInputDate(dateRaw);

  await db.event.update({
    where: { id },
    data: {
      title,
      type: str(formData, "type") ?? "CULTO",
      status: str(formData, "status") ?? "PLANEJADO",
      date: inicioEditado,
      endDate: dataFinal(formData, inicioEditado),
      callTime: str(formData, "callTime"),
      startTime: str(formData, "startTime"),
      location: str(formData, "location"),
      address: str(formData, "address"),
      notes: str(formData, "notes"),
      driveUrl: str(formData, "driveUrl"),
    },
  });

  revalidatePath("/agenda");
  revalidatePath(`/agenda/${id}`);
  redirect(`/agenda/${id}`);
}

export async function setEventStatus(formData: FormData) {
  await requireMember();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));

  await db.event.update({ where: { id }, data: { status } });
  revalidatePath("/agenda");
  revalidatePath(`/agenda/${id}`);
}

export async function deleteEvent(formData: FormData) {
  const me = await requireMember();
  if (!me.isAdmin) return;

  await db.event.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/agenda");
  redirect("/agenda");
}

// ---------------------------------------------------------------- escala

/** Cada músico dá o próprio OK — ninguém confirma pelo outro (exceto admin). */
// ---------------------------------------------------------------- ordem de culto

export async function addSetlistItem(formData: FormData) {
  await requireMember();

  const eventId = String(formData.get("eventId"));
  const songId = str(formData, "songId");
  const label = str(formData, "label");
  if (!eventId || (!songId && !label)) return;

  const last = await db.setlistItem.findFirst({
    where: { eventId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  // Puxa tom/BPM padrão da música como ponto de partida
  let keyUsed = str(formData, "keyUsed");
  let bpmUsed = formData.get("bpmUsed") ? Number(formData.get("bpmUsed")) : null;

  if (songId) {
    const song = await db.song.findUnique({ where: { id: songId } });
    keyUsed = keyUsed ?? song?.defaultKey ?? null;
    bpmUsed = bpmUsed ?? song?.bpm ?? null;
  }

  await db.setlistItem.create({
    data: {
      eventId,
      songId,
      label: songId ? null : label,
      keyUsed,
      bpmUsed: Number.isFinite(bpmUsed) ? bpmUsed : null,
      moment: str(formData, "moment"),
      notes: str(formData, "notes"),
      position: (last?.position ?? -1) + 1,
    },
  });

  revalidatePath(`/agenda/${eventId}`);
}

export async function updateSetlistItem(formData: FormData) {
  await requireMember();

  const id = String(formData.get("id"));
  const eventId = String(formData.get("eventId"));
  const bpm = formData.get("bpmUsed") ? Number(formData.get("bpmUsed")) : null;

  await db.setlistItem.update({
    where: { id },
    data: {
      keyUsed: str(formData, "keyUsed"),
      bpmUsed: bpm && Number.isFinite(bpm) ? bpm : null,
      moment: str(formData, "moment"),
      notes: str(formData, "notes"),
    },
  });

  revalidatePath(`/agenda/${eventId}`);
}

export async function moveSetlistItem(formData: FormData) {
  await requireMember();

  const id = String(formData.get("id"));
  const eventId = String(formData.get("eventId"));
  const dir = String(formData.get("dir")); // "up" | "down"

  const items = await db.setlistItem.findMany({
    where: { eventId },
    orderBy: { position: "asc" },
  });
  const idx = items.findIndex((i) => i.id === id);
  const target = dir === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || target < 0 || target >= items.length) return;

  await db.$transaction([
    db.setlistItem.update({ where: { id: items[idx].id }, data: { position: target } }),
    db.setlistItem.update({ where: { id: items[target].id }, data: { position: idx } }),
  ]);

  revalidatePath(`/agenda/${eventId}`);
}

export async function removeSetlistItem(formData: FormData) {
  await requireMember();
  const eventId = String(formData.get("eventId"));

  await db.setlistItem.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath(`/agenda/${eventId}`);
}

// ---------------------------------------------------------------- checklist do evento

export async function applyTemplateToEvent(eventId: string, templateId: string) {
  const items = await db.checklistTemplateItem.findMany({
    where: { templateId },
    orderBy: { position: "asc" },
  });
  if (items.length === 0) return;

  await db.task.createMany({
    data: items.map((i) => ({
      eventId,
      title: i.title,
      category: i.category,
      priority: i.priority,
      position: i.position,
    })),
  });
}

export async function applyTemplateAction(formData: FormData) {
  await requireMember();
  const eventId = String(formData.get("eventId"));
  const templateId = String(formData.get("templateId"));
  if (!eventId || !templateId) return;

  await applyTemplateToEvent(eventId, templateId);
  revalidatePath(`/agenda/${eventId}`);
}

// ---------------------------------------------------------------- feedback

export async function saveFeedback(formData: FormData) {
  const me = await requireMember();
  const eventId = String(formData.get("eventId"));
  if (!eventId) return;

  const sectors = formData.getAll("sector").map(String);

  for (const sector of sectors) {
    const ratingRaw = formData.get(`rating_${sector}`);
    const comment = String(formData.get(`comment_${sector}`) || "").trim() || null;
    const rating = Number(ratingRaw);

    // Sem nota e sem comentário = o integrante pulou esse setor
    if (!rating && !comment) continue;

    await db.feedback.upsert({
      where: { eventId_memberId_sector: { eventId, memberId: me.id, sector } },
      create: { eventId, memberId: me.id, sector, rating: rating || 0, comment },
      update: { rating: rating || 0, comment },
    });
  }

  revalidatePath(`/agenda/${eventId}`);
  redirect(`/agenda/${eventId}?tab=feedback`);
}

// ---------------------------------------------------------------- financeiro rápido do evento

export async function addEventTransaction(formData: FormData) {
  await requireMember();

  const eventId = String(formData.get("eventId"));
  const amountCents = parseMoneyToCents(String(formData.get("amount") || ""));
  if (!eventId || amountCents <= 0) return;

  const event = await db.event.findUnique({ where: { id: eventId } });

  await db.transaction.create({
    data: {
      eventId,
      date: event?.date ?? new Date(),
      type: String(formData.get("type") || "ENTRADA"),
      category: String(formData.get("category") || "OFERTA"),
      amountCents,
      description: str(formData, "description"),
      method: str(formData, "method"),
    },
  });

  revalidatePath(`/agenda/${eventId}`);
  revalidatePath("/financas");
}
