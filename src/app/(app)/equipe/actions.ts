"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireMember } from "@/lib/session";
import { ehTema, salvarTema } from "@/lib/tema";
import { MARCA_EXEMPLO } from "@/lib/dados-exemplo";

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

/**
 * Troca a aparência do sistema. Não passa pelo banco nem exige permissão:
 * é preferência de quem está olhando, e vale só neste aparelho.
 */
export async function mudarTema(formData: FormData) {
  await requireMember();

  const escolhido = formData.get("tema");
  if (!ehTema(escolhido)) return;

  await salvarTema(escolhido);
  revalidatePath("/", "layout");
}

/**
 * Remove os dados de demonstração. Apaga só o que foi criado com a marca de
 * exemplo — o que a equipe cadastrou de verdade fica intacto, mesmo que esteja
 * misturado no meio.
 */
export async function limparExemplos() {
  const me = await requireMember();
  if (!me.isAdmin) return;

  const contem = { contains: MARCA_EXEMPLO };

  // Escalas, ordens de culto e demandas presas a um evento somem junto com
  // ele, por causa do onDelete: Cascade. Aqui ficam só as que não dependem
  // de evento nenhum.
  await Promise.all([
    db.transaction.deleteMany({ where: { description: contem } }),
    db.royaltyEntry.deleteMany({ where: { notes: contem } }),
    db.event.deleteMany({ where: { notes: contem } }),
    db.song.deleteMany({ where: { notes: contem } }),
    db.task.deleteMany({ where: { description: contem } }),
  ]);

  revalidatePath("/", "layout");
}
