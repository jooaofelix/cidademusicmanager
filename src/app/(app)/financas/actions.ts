"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireTreasurer } from "@/lib/session";
import { fromInputDate, parseMoneyToCents } from "@/lib/format";

function str(fd: FormData, key: string) {
  const v = fd.get(key);
  const s = v === null ? "" : String(v).trim();
  return s || null;
}

function revalidateFinance() {
  revalidatePath("/financas");
  revalidatePath("/financas/lancamentos");
  revalidatePath("/financas/projetos");
  revalidatePath("/financas/streaming");
  revalidatePath("/");
}

// ------------------------------------------------------------ lançamentos

export async function createTransaction(formData: FormData) {
  await requireTreasurer();

  const amountCents = parseMoneyToCents(String(formData.get("amount") || ""));
  if (amountCents <= 0) return;

  const dateRaw = str(formData, "date");

  await db.transaction.create({
    data: {
      date: dateRaw ? fromInputDate(dateRaw) : new Date(),
      type: str(formData, "type") ?? "ENTRADA",
      category: str(formData, "category") ?? "OUTRO",
      amountCents,
      description: str(formData, "description"),
      method: str(formData, "method"),
      eventId: str(formData, "eventId"),
      projectId: str(formData, "projectId"),
    },
  });

  revalidateFinance();
}

export async function deleteTransaction(formData: FormData) {
  await requireTreasurer();
  await db.transaction.delete({ where: { id: String(formData.get("id")) } });
  revalidateFinance();
}

// ------------------------------------------------------------ projetos / sonhos

export async function createProject(formData: FormData) {
  await requireTreasurer();

  const name = str(formData, "name");
  const target = parseMoneyToCents(String(formData.get("targetAmount") || ""));
  if (!name || target <= 0) return;

  const deadline = str(formData, "deadline");

  await db.project.create({
    data: {
      name,
      description: str(formData, "description"),
      targetCents: target,
      deadline: deadline ? fromInputDate(deadline) : null,
    },
  });

  revalidateFinance();
}

export async function updateProject(formData: FormData) {
  await requireTreasurer();

  const id = String(formData.get("id"));
  const target = parseMoneyToCents(String(formData.get("targetAmount") || ""));
  const deadline = str(formData, "deadline");

  await db.project.update({
    where: { id },
    data: {
      name: str(formData, "name") ?? undefined,
      description: str(formData, "description"),
      targetCents: target > 0 ? target : undefined,
      deadline: deadline ? fromInputDate(deadline) : null,
      status: str(formData, "status") ?? "ATIVO",
    },
  });

  revalidateFinance();
}

export async function deleteProject(formData: FormData) {
  await requireTreasurer();
  await db.project.delete({ where: { id: String(formData.get("id")) } });
  revalidateFinance();
}

/** Guarda um valor do caixa para um projeto (registra como entrada vinculada). */
export async function contributeToProject(formData: FormData) {
  await requireTreasurer();

  const projectId = String(formData.get("projectId"));
  const amountCents = parseMoneyToCents(String(formData.get("amount") || ""));
  if (!projectId || amountCents <= 0) return;

  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) return;

  await db.transaction.create({
    data: {
      date: new Date(),
      type: "ENTRADA",
      category: "DOACAO",
      amountCents,
      description: `Reserva para: ${project.name}`,
      projectId,
    },
  });

  revalidateFinance();
}

// ------------------------------------------------------------ streaming

export async function saveRoyalty(formData: FormData) {
  await requireTreasurer();

  const platform = str(formData, "platform");
  const period = str(formData, "period");
  const amountCents = parseMoneyToCents(String(formData.get("amount") || ""));
  if (!platform || !period) return;

  const streamsRaw = formData.get("streams");
  const streams = streamsRaw && String(streamsRaw).trim() ? Number(streamsRaw) : null;

  await db.royaltyEntry.create({
    data: {
      platform,
      period,
      amountCents,
      streams: streams && Number.isFinite(streams) ? Math.round(streams) : null,
      songId: str(formData, "songId"),
      notes: str(formData, "notes"),
    },
  });

  // Espelha no caixa se pedido — o dinheiro só entra quando a plataforma paga
  if (formData.get("addToCash") === "on" && amountCents > 0) {
    const [y, m] = period.split("-").map(Number);
    await db.transaction.create({
      data: {
        date: new Date(Date.UTC(y, (m || 1) - 1, 1)),
        type: "ENTRADA",
        category: "STREAMING",
        amountCents,
        description: `Streaming ${platform} · ${period}`,
      },
    });
  }

  revalidateFinance();
}

export async function deleteRoyalty(formData: FormData) {
  await requireTreasurer();
  await db.royaltyEntry.delete({ where: { id: String(formData.get("id")) } });
  revalidateFinance();
}
