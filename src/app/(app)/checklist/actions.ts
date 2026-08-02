"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireMember } from "@/lib/session";
import { fromInputDate } from "@/lib/format";

function str(fd: FormData, key: string) {
  const v = fd.get(key);
  const s = v === null ? "" : String(v).trim();
  return s || null;
}

function revalidateTask(eventId?: string | null) {
  revalidatePath("/checklist");
  revalidatePath("/");
  if (eventId) revalidatePath(`/agenda/${eventId}`);
}

export async function createTask(formData: FormData) {
  await requireMember();

  const title = str(formData, "title");
  if (!title) return;

  const eventId = str(formData, "eventId");
  const due = str(formData, "dueDate");

  const last = await db.task.findFirst({
    where: { eventId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await db.task.create({
    data: {
      title,
      description: str(formData, "description"),
      category: str(formData, "category") ?? "GERAL",
      priority: str(formData, "priority") ?? "MEDIA",
      assigneeId: str(formData, "assigneeId"),
      dueDate: due ? fromInputDate(due) : null,
      eventId,
      position: (last?.position ?? -1) + 1,
    },
  });

  revalidateTask(eventId);
}

export async function toggleTask(formData: FormData) {
  await requireMember();

  const id = String(formData.get("id"));
  const task = await db.task.findUnique({ where: { id } });
  if (!task) return;

  await db.task.update({
    where: { id },
    data: { done: !task.done, doneAt: task.done ? null : new Date() },
  });

  revalidateTask(task.eventId);
}

export async function updateTask(formData: FormData) {
  await requireMember();

  const id = String(formData.get("id"));
  const due = str(formData, "dueDate");

  const task = await db.task.update({
    where: { id },
    data: {
      title: str(formData, "title") ?? undefined,
      description: str(formData, "description"),
      category: str(formData, "category") ?? "GERAL",
      priority: str(formData, "priority") ?? "MEDIA",
      assigneeId: str(formData, "assigneeId"),
      dueDate: due ? fromInputDate(due) : null,
    },
  });

  revalidateTask(task.eventId);
}

export async function deleteTask(formData: FormData) {
  await requireMember();

  const id = String(formData.get("id"));
  const task = await db.task.findUnique({ where: { id } });
  if (!task) return;

  await db.task.delete({ where: { id } });
  revalidateTask(task.eventId);
}

// ------------------------------------------------------------ modelos

export async function createTemplate(formData: FormData) {
  await requireMember();

  const name = str(formData, "name");
  if (!name) return;

  await db.checklistTemplate.create({ data: { name } });
  revalidatePath("/checklist/modelos");
}

export async function addTemplateItem(formData: FormData) {
  await requireMember();

  const templateId = String(formData.get("templateId"));
  const title = str(formData, "title");
  if (!templateId || !title) return;

  const last = await db.checklistTemplateItem.findFirst({
    where: { templateId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await db.checklistTemplateItem.create({
    data: {
      templateId,
      title,
      category: str(formData, "category") ?? "GERAL",
      priority: str(formData, "priority") ?? "MEDIA",
      position: (last?.position ?? -1) + 1,
    },
  });

  revalidatePath("/checklist/modelos");
}

export async function deleteTemplateItem(formData: FormData) {
  await requireMember();
  await db.checklistTemplateItem.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/checklist/modelos");
}

export async function deleteTemplate(formData: FormData) {
  await requireMember();
  await db.checklistTemplate.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/checklist/modelos");
}
