"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";

export async function login(_prev: unknown, formData: FormData) {
  const memberId = String(formData.get("memberId") || "");
  const pin = String(formData.get("pin") || "").trim();

  if (!memberId) return { error: "Escolha o seu nome." };
  if (!pin) return { error: "Digite o seu PIN." };

  const member = await db.member.findUnique({ where: { id: memberId } });
  if (!member || !member.active) return { error: "Integrante não encontrado." };
  if (member.pin !== pin) return { error: "PIN incorreto. Tente de novo." };

  await createSession(member.id);
  redirect("/");
}
