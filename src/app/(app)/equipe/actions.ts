"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireMember } from "@/lib/session";

function str(fd: FormData, key: string) {
  const v = fd.get(key);
  const s = v === null ? "" : String(v).trim();
  return s || null;
}

export async function createMember(formData: FormData) {
  const me = await requireMember();
  if (!me.isAdmin) return;

  const name = str(formData, "name");
  const instrument = str(formData, "instrument");
  const pin = str(formData, "pin");
  if (!name || !instrument || !pin) return;

  await db.member.create({
    data: {
      name,
      instrument,
      pin,
      phone: str(formData, "phone"),
      isAdmin: formData.get("isAdmin") === "on",
    },
  });

  revalidatePath("/equipe");
}

export async function updateMember(formData: FormData) {
  const me = await requireMember();

  const id = String(formData.get("id"));
  if (id !== me.id && !me.isAdmin) return;

  await db.member.update({
    where: { id },
    data: {
      name: str(formData, "name") ?? undefined,
      instrument: str(formData, "instrument") ?? undefined,
      phone: str(formData, "phone"),
      // só admin mexe em permissão e status
      ...(me.isAdmin
        ? {
            isAdmin: formData.get("isAdmin") === "on",
            active: formData.get("active") === "on",
          }
        : {}),
    },
  });

  revalidatePath("/equipe");
}

/**
 * Dá ou tira o acesso às finanças. Só quem já tem pode passar adiante — nem
 * o administrador entra no caixa por conta própria.
 *
 * Nunca deixa a banda sem nenhum tesoureiro: se fosse possível, ninguém mais
 * conseguiria devolver o acesso a alguém, porque a própria tela ficaria
 * inacessível. O administrador ainda pode trocar o PIN de um tesoureiro pela
 * tela de Equipe, então não há como o acesso se perder de vez.
 */
export async function updateTreasurer(formData: FormData) {
  const me = await requireMember();
  if (!me.isTreasurer) return;

  const id = String(formData.get("id"));
  const querTornar = formData.get("isTreasurer") === "on";

  if (!querTornar) {
    const quantos = await db.member.count({ where: { isTreasurer: true, active: true } });
    const alvoEhTesoureiro = await db.member.findUnique({
      where: { id },
      select: { isTreasurer: true },
    });
    if (quantos <= 1 && alvoEhTesoureiro?.isTreasurer) return;
  }

  await db.member.update({ where: { id }, data: { isTreasurer: querTornar } });
  revalidatePath("/equipe");
}

export async function changePin(formData: FormData) {
  const me = await requireMember();

  const id = String(formData.get("id"));
  if (id !== me.id && !me.isAdmin) return;

  const pin = String(formData.get("pin") || "").trim();
  if (pin.length < 4) return;

  await db.member.update({ where: { id }, data: { pin } });
  revalidatePath("/equipe");
}
